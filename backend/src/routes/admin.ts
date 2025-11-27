import { Router } from 'express';
import { pool } from '../config/database';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/stats', requireAuth, requireRole(['admin']), async (_req, res) => {
  const usersRes = await pool.query('SELECT COUNT(*)::int AS users FROM users');
  const docsRes = await pool.query('SELECT COUNT(*)::int AS documents, COALESCE(SUM(size),0)::bigint AS total_size FROM documents WHERE is_deleted=FALSE');
  res.json({ users: usersRes.rows[0].users, documents: docsRes.rows[0].documents, totalSize: docsRes.rows[0].total_size });
});

router.get('/logs', requireAuth, requireRole(['admin']), async (_req, res) => {
  res.json({ logs: [] });
});

export default router;

