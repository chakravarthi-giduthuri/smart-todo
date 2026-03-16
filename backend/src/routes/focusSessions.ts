import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { startFocusSession, endFocusSession, listFocusSessions } from '../db/focusSessionQueries';

const router = Router();
router.use(requireAuth);

router.post('/start', async (req, res, next) => {
  try {
    const { task_id, planned_minutes = 25 } = req.body;
    const session = await startFocusSession(
      { user_id: req.userId, task_id, planned_minutes },
      req.userSupabase
    );
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/end', async (req, res, next) => {
  try {
    const { actual_minutes, completed = true } = req.body;
    const session = await endFocusSession(
      req.params.id,
      actual_minutes,
      completed,
      req.userSupabase
    );
    res.json(session);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const sessions = await listFocusSessions(req.userId, limit, req.userSupabase);
    res.json(sessions);
  } catch (err) {
    next(err);
  }
});

export default router;
