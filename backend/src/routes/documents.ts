import { Router } from 'express';
import { pool } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { getPresignedUploadUrl, getPresignedDownloadUrl, deleteObjectByKey, getObjectByKey } from '../services/storage';
import { randomUUID } from 'crypto';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { limit, sort } = req.query as { limit?: string; sort?: string };
  const lim = Math.min(Math.max(parseInt(limit || '50', 10), 1), 200);
  const orderBy = sort === 'recent' ? 'updated_at DESC' : 'created_at DESC';
  try {
    const result = await pool.query(
      `SELECT id, name, mime_type, size, storage_key, folder_id, owner_id, created_at, updated_at
       FROM documents
       WHERE owner_id = $1 AND (is_deleted IS NULL OR is_deleted = FALSE)
       ORDER BY ${orderBy}
       LIMIT $2`,
      [user.sub, lim]
    );
    res.json(result.rows);
    return;
  } catch (_err) {
    res.status(500).json({ error: 'Failed to list documents' });
    return;
  }
});

router.post('/', requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { name, mime_type, size, folder_id } = req.body;
  if (!name || !mime_type || !size) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }
  const storageKey = `users/${user.sub}/${randomUUID()}`;
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO documents (owner_id, folder_id, name, mime_type, size, storage_key)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, owner_id, folder_id, name, mime_type, size, storage_key, created_at, updated_at`,
      [user.sub, folder_id || null, name, mime_type, size, storageKey]
    );
    const doc = result.rows[0];
    const uploadUrl = await getPresignedUploadUrl(storageKey, mime_type, size);
    res.status(201).json({ document: doc, uploadUrl });
    return;
  } catch (_err) {
    res.status(500).json({ error: 'Failed to create document' });
    return;
  } finally {
    client.release();
  }
});

router.put('/:id/complete', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { checksum, comment } = req.body;
  const client = await pool.connect();
  try {
    const docRes = await client.query('SELECT id, storage_key FROM documents WHERE id=$1', [id]);
    if (!docRes.rowCount) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const doc = docRes.rows[0];
    const verNumRes = await client.query('SELECT COALESCE(MAX(version_number), 0) AS max FROM document_versions WHERE document_id=$1', [id]);
    const nextVersion = Number(verNumRes.rows[0].max) + 1;
    const verRes = await client.query(
      `INSERT INTO document_versions (document_id, version_number, storage_key, size, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [id, nextVersion, doc.storage_key, null, comment || null]
    );
    const versionId = verRes.rows[0].id;
    await client.query('UPDATE documents SET checksum=$1, current_version_id=$2 WHERE id=$3', [checksum || null, versionId, id]);
    res.json({ status: 'ok', versionId });
    return;
  } catch (_err) {
    res.status(500).json({ error: 'Failed to complete upload' });
    return;
  } finally {
    client.release();
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM documents WHERE id=$1', [id]);
  if (!result.rowCount) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(result.rows[0]);
  return;
});

router.get('/:id/download', requireAuth, async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT storage_key FROM documents WHERE id=$1', [id]);
  if (!result.rowCount) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const url = await getPresignedDownloadUrl(result.rows[0].storage_key);
  res.json({ url });
  return;
});

router.get('/:id/preview', requireAuth, async (req, res) => {
  const { id } = req.params;
  const proxy = String((req.query.proxy as string) || '').toLowerCase() === 'true';
  const result = await pool.query('SELECT storage_key, mime_type FROM documents WHERE id=$1', [id]);
  if (!result.rowCount) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const { storage_key, mime_type } = result.rows[0] as { storage_key: string; mime_type: string };
  if (proxy) {
    try {
      const obj = await getObjectByKey(storage_key);
      const ct = obj.ContentType || mime_type || 'application/octet-stream';
      if (ct) res.setHeader('Content-Type', ct);
      if (obj.ContentLength) res.setHeader('Content-Length', String(obj.ContentLength));
      const body: any = obj.Body;
      if (body && typeof body.pipe === 'function') {
        body.pipe(res);
      } else {
        res.status(500).json({ error: 'Preview unavailable' });
      }
      return;
    } catch (_err) {
      res.status(500).json({ error: 'Failed to proxy preview' });
      return;
    }
  }
  const url = await getPresignedDownloadUrl(storage_key);
  res.json({ url });
  return;
});

router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const docRes = await client.query('SELECT id, storage_key FROM documents WHERE id=$1', [id]);
    if (!docRes.rowCount) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const doc = docRes.rows[0];
    await client.query('DELETE FROM document_versions WHERE document_id=$1', [id]);
    await client.query('DELETE FROM shares WHERE document_id=$1', [id]);
    await client.query('DELETE FROM documents WHERE id=$1', [id]);
    try {
      await deleteObjectByKey(doc.storage_key);
    } catch (_err) {
      // ignore storage delete errors to avoid blocking DB deletion
    }
    res.json({ status: 'ok' });
    return;
  } catch (_err) {
    res.status(500).json({ error: 'Failed to delete document' });
    return;
  } finally {
    client.release();
  }
});

router.post('/:id/restore', requireAuth, async (req, res) => {
  const { id } = req.params;
  await pool.query('UPDATE documents SET is_deleted=FALSE WHERE id=$1', [id]);
  res.json({ status: 'ok' });
  return;
});

router.get('/:id/versions', requireAuth, async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM document_versions WHERE document_id=$1 ORDER BY version_number DESC', [id]);
  res.json(result.rows);
  return;
});

router.post('/:id/share', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { expires_at, permissions } = req.body;
  const token = randomUUID();
  const result = await pool.query(
    `INSERT INTO shares (document_id, public_link_token, expires_at, permissions)
     VALUES ($1, $2, $3, $4) RETURNING id, public_link_token, expires_at, permissions`,
    [id, token, expires_at || null, permissions || 'view']
  );
  res.json(result.rows[0]);
  return;
});

export default router;
