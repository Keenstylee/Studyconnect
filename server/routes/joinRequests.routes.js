import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { getAppState } from '../services/appState.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/validation.js';

const router = Router();

router.put('/:id/:action', requireAuth, asyncHandler(async (req, res) => {
  const ownerId = req.auth.userId;
  const requestId = Number(req.params.id);
  const action = String(req.params.action || '').toLowerCase();
  if (!['accept', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Accion no valida.' });
  }

  const requestResult = await pool.query(
    `SELECT jr.*, g.owner_id, g.name AS group_name
     FROM join_requests jr
     JOIN study_groups g ON g.id = jr.group_id
     WHERE jr.id = $1`,
    [requestId]
  );
  const joinRequest = requestResult.rows[0];
  if (!joinRequest) return res.status(404).json({ message: 'Solicitud no encontrada.' });
  if (joinRequest.owner_id !== ownerId) return res.status(403).json({ message: 'Solo el dueno del grupo puede responder esta solicitud.' });
  if (joinRequest.status !== 'pending') return res.status(400).json({ message: 'La solicitud ya fue respondida.' });

  const nextStatus = action === 'accept' ? 'accepted' : 'rejected';

  if (action === 'accept') {
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total, MAX(g.max_members)::int AS max_members
       FROM study_groups g
       LEFT JOIN group_members gm ON gm.group_id = g.id
       WHERE g.id = $1
       GROUP BY g.id`,
      [joinRequest.group_id]
    );
    const capacity = countResult.rows[0];
    if (!capacity || capacity.total >= capacity.max_members) {
      throw httpError(400, 'No se puede aceptar: el grupo ya esta lleno.');
    }

    await pool.query(
      'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [joinRequest.group_id, joinRequest.user_id, 'member']
    );
  }

  await pool.query('UPDATE join_requests SET status = $1, updated_at = NOW() WHERE id = $2', [nextStatus, requestId]);

  await pool.query(
    `INSERT INTO notifications (user_id, type, title, message, data)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      joinRequest.user_id,
      nextStatus,
      action === 'accept' ? 'Solicitud aceptada' : 'Solicitud rechazada',
      action === 'accept'
        ? `Fuiste aceptado en el grupo ${joinRequest.group_name}.`
        : `Tu solicitud para ${joinRequest.group_name} fue rechazada.`,
      { requestId, groupId: joinRequest.group_id, status: nextStatus },
    ]
  );

  await pool.query(
    `UPDATE notifications
     SET is_read = TRUE, data = COALESCE(data, '{}'::jsonb) || $1::jsonb
     WHERE user_id = $2 AND type = 'join_request' AND data->>'requestId' = $3`,
    [JSON.stringify({ status: nextStatus }), ownerId, String(requestId)]
  );

  res.json(await getAppState(ownerId));
}));

export default router;
