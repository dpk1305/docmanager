import { Router } from 'express';
import { pool } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  const result = await pool.query('SELECT * FROM tags ORDER BY name');
  res.json(result.rows);
});

router.post('/', requireAuth, async (req, res) => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Missing name' });
    return;
  }
  const result = await pool.query('INSERT INTO tags (name) VALUES ($1) RETURNING *', [name]);
  res.status(201).json(result.rows[0]);
  return;
});

router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM tags WHERE id=$1', [id]);
  res.json({ status: 'ok' });
  return;
});

router.post('/assign', requireAuth, async (req, res) => {
  const { document_id, tag_id } = req.body;
  await pool.query('INSERT INTO document_tags (document_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [document_id, tag_id]);
  res.json({ status: 'ok' });
  return;
});

router.post('/remove', requireAuth, async (req, res) => {
  const { document_id, tag_id } = req.body;
  await pool.query('DELETE FROM document_tags WHERE document_id=$1 AND tag_id=$2', [document_id, tag_id]);
  res.json({ status: 'ok' });
  return;
});

export default router;
