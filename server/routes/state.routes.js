import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getAppState } from '../services/appState.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  res.json(await getAppState(req.auth.userId));
}));

export default router;
