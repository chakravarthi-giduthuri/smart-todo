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

router.get('/weekly-reviews', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '4')), 1), 20);
    const { data, error } = await req.userSupabase
      .from('weekly_reviews')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    res.json({ reviews: data ?? [] });
  } catch (err) {
    next(err);
  }
});

export default router;
