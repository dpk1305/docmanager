import { Router } from 'express';
import { pool } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const user = (req as any).user;
  const q = (req.query.q as string) || '';
  const tagIds = Array.isArray(req.query.tagIds) ? (req.query.tagIds as string[]) : [];

  let where = 'd.owner_id = $1 AND d.is_deleted = FALSE';
  const params: any[] = [user.sub];
  if (q) {
    params.push(`%${q}%`);
    where += ` AND (d.name ILIKE $${params.length})`;
  }

  let join = '';
  if (tagIds.length) {
    join = 'JOIN document_tags dt ON dt.document_id = d.id';
    const placeholders = tagIds.map((_t, i) => `$${params.length + i + 1}`).join(',');
    params.push(...tagIds);
    where += ` AND dt.tag_id IN (${placeholders})`;
  }

  const sql = `
    SELECT d.id, d.name, d.mime_type, d.size, d.folder_id, d.created_at, d.updated_at
    FROM documents d
    ${join}
    WHERE ${where}
    ORDER BY d.updated_at DESC
    LIMIT 100
  `;
  const result = await pool.query(sql, params);
  res.json(result.rows);
});

export default router;

