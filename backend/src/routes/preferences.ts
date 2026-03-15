import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { buildRules, buildInsights } from '../services/preferences';
import { truncateOverrideLogs } from '../db/overrideQueries';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const rules = await buildRules(req.userId);
    res.json({ rules });
  } catch (err) {
    next(err);
  }
});

router.get('/insights', async (req, res, next) => {
  try {
    const insights = await buildInsights(req.userId);
    res.json(insights);
  } catch (err) {
    next(err);
  }
});

router.delete('/reset', async (req, res, next) => {
  try {
    await truncateOverrideLogs(req.userId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
