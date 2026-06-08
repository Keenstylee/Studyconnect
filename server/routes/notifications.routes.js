import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { getAppState } from '../services/appState.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.put('/read', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.auth.userId;
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [userId]);
  res.json(await getAppState(userId));
}));

export default router;
