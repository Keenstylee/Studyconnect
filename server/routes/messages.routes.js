import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { getAppState } from '../services/appState.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError, validateRequired } from '../utils/validation.js';

const router = Router();

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.auth.userId;
  const groupId = Number(req.body.groupId);
  if (!Number.isInteger(groupId)) throw httpError(400, 'Grupo no valido.');
  const content = validateRequired(req.body.content, 'El mensaje no puede estar vacio.');

  const membershipResult = await pool.query(
    `SELECT 1
     FROM study_groups g
     LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $2
     WHERE g.id = $1 AND (g.owner_id = $2 OR gm.user_id IS NOT NULL)`,
    [groupId, userId]
  );
  if (!membershipResult.rowCount) {
    throw httpError(403, 'Solo los miembros del grupo pueden enviar mensajes.');
  }

  const messageResult = await pool.query(
    `INSERT INTO messages (group_id, sender_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, sent_at`,
    [groupId, userId, content]
  );
  req.app.get('io')?.to(`group:${groupId}`).emit('message:new', {
    id: messageResult.rows[0].id,
    groupId,
    senderId: userId,
    sentAt: messageResult.rows[0].sent_at,
  });
  res.status(201).json(await getAppState(userId));
}));

export default router;
