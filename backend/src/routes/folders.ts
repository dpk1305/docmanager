import { Router } from 'express';
import { pool } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const user = (req as any).user;
  const result = await pool.query('SELECT * FROM folders WHERE owner_id=$1 ORDER BY name', [user.sub]);
  res.json(result.rows);
});

router.post('/', requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { name, parent_id } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Missing name' });
    return;
  }
  const result = await pool.query(
    'INSERT INTO folders (owner_id, name, parent_id) VALUES ($1, $2, $3) RETURNING *',
    [user.sub, name, parent_id || null]
  );
  res.status(201).json(result.rows[0]);
  return;
});

router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { name, parent_id } = req.body;
  const result = await pool.query(
    'UPDATE folders SET name=COALESCE($1, name), parent_id=$2 WHERE id=$3 RETURNING *',
    [name || null, parent_id || null, id]
  );
  if (!result.rowCount) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(result.rows[0]);
  return;
});

router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM folders WHERE id=$1', [id]);
  res.json({ status: 'ok' });
  return;
});

router.post('/:id/move-document', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { document_id } = req.body;
  await pool.query('UPDATE documents SET folder_id=$1 WHERE id=$2', [id, document_id]);
  res.json({ status: 'ok' });
  return;
});

export default router;
