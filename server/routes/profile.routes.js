import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { getAppState } from '../services/appState.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { toCycle } from '../utils/formatters.js';
import { cleanText, validateCycle, validateRequired } from '../utils/validation.js';

const router = Router();

router.put('/', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.auth.userId;
  const profile = req.body.profile || {};
  const name = validateRequired(profile.name, 'El nombre es obligatorio.');
  const cycle = cleanText(profile.cycle || 'I');
  validateCycle(cycle);
  const courses = Array.isArray(profile.courses)
    ? profile.courses.map((course) => cleanText(course)).filter(Boolean)
    : [];

  await pool.query(
    `UPDATE users SET name = $1, career = $2, university = $3, cycle = $4, availability = $5, bio = $6, updated_at = NOW()
     WHERE id = $7`,
    [name, cleanText(profile.career), cleanText(profile.university), toCycle(cycle), cleanText(profile.availability), cleanText(profile.bio), userId]
  );
  await pool.query('DELETE FROM user_courses WHERE user_id = $1', [userId]);
  for (const course of courses) {
    await pool.query('INSERT INTO user_courses (user_id, course) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, course]);
  }
  res.json(await getAppState(userId));
}));

export default router;
