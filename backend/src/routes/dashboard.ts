import { Router } from 'express';
import { aggregateStats } from '../services/dashboard';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const stats = await aggregateStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
