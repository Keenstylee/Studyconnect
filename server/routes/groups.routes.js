import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { getAppState } from '../services/appState.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { cleanText, httpError, validateMaxMembers, validateModality, validateRequired } from '../utils/validation.js';

const router = Router();

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.auth.userId;
  const group = req.body.group || {};
  const name = validateRequired(group.name, 'El nombre del grupo es obligatorio.');
  const course = validateRequired(group.course, 'El curso es obligatorio.');
  const maxMembers = validateMaxMembers(group.max || 8);
  const modality = cleanText(group.mode || 'Virtual');
  validateModality(modality);

  const duplicateResult = await pool.query(
    'SELECT id FROM study_groups WHERE owner_id = $1 AND lower(name) = lower($2) AND lower(course) = lower($3) LIMIT 1',
    [userId, name, course]
  );
  if (duplicateResult.rowCount) {
    throw httpError(409, 'Ya creaste un grupo con ese nombre y curso.');
  }

  const result = await pool.query(
    `INSERT INTO study_groups (name, description, course, owner_id, max_members, schedule, modality, university, image_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      name,
      cleanText(group.desc) || 'Sin descripcion.',
      course,
      userId,
      maxMembers,
      cleanText(group.schedule) || 'Por coordinar',
      modality,
      cleanText(group.uni) || null,
      cleanText(group.image) || null,
    ]
  );
  await pool.query('INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [result.rows[0].id, userId, 'owner']);
  res.status(201).json(await getAppState(userId));
}));

router.post('/:id/join', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.auth.userId;
  const groupId = Number(req.params.id);
  const groupResult = await pool.query('SELECT * FROM study_groups WHERE id = $1', [groupId]);
  const group = groupResult.rows[0];
  if (!group) return res.status(404).json({ message: 'Grupo no encontrado.' });
  if (group.owner_id === userId) return res.status(400).json({ message: 'Ya eres dueno de este grupo.' });

  const memberResult = await pool.query('SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
  if (memberResult.rowCount) return res.status(400).json({ message: 'Ya perteneces a este grupo.' });

  const pendingResult = await pool.query("SELECT 1 FROM join_requests WHERE group_id = $1 AND user_id = $2 AND status = 'pending'", [groupId, userId]);
  if (pendingResult.rowCount) throw httpError(400, 'Ya tienes una solicitud pendiente para este grupo.');

  const countResult = await pool.query('SELECT COUNT(*)::int AS total FROM group_members WHERE group_id = $1', [groupId]);
  if (countResult.rows[0].total >= group.max_members) return res.status(400).json({ message: 'El grupo ya esta lleno.' });

  const requestResult = await pool.query(
    `INSERT INTO join_requests (group_id, user_id, status, message)
     VALUES ($1, $2, 'pending', $3)
     ON CONFLICT (group_id, user_id)
     DO UPDATE SET status = 'pending', message = EXCLUDED.message, updated_at = NOW()
     RETURNING id`,
    [groupId, userId, cleanText(req.body.message) || null]
  );

  const requesterResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
  const requesterName = requesterResult.rows[0]?.name || 'Un estudiante';
  await pool.query(
    `INSERT INTO notifications (user_id, type, title, message, data)
     VALUES ($1, 'join_request', 'Nueva solicitud', $2, $3)`,
    [
      group.owner_id,
      `${requesterName} quiere unirse a ${group.name}.`,
      { requestId: requestResult.rows[0].id, groupId, requesterId: userId, status: 'pending' },
    ]
  );
  res.json(await getAppState(userId));
}));

router.delete('/:id/leave', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.auth.userId;
  const groupId = Number(req.params.id);
  await pool.query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2 AND role <> $3', [groupId, userId, 'owner']);
  res.json(await getAppState(userId));
}));

export default router;
