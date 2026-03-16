import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { aggregateStats } from '../services/dashboard';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const stats = await aggregateStats(req.userId, req.userSupabase);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
