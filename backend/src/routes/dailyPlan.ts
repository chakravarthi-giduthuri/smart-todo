import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getDailyPlan, upsertDailyPlan } from '../db/dailyPlanQueries';

const router = Router();
router.use(requireAuth);

// GET /api/daily-plan?date=YYYY-MM-DD
router.get('/', async (req, res, next) => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const plan = await getDailyPlan(date, req.userId, req.userSupabase);
    res.json(plan ?? { task_ids: [], plan_order: [], goal: null });
  } catch (err) {
    next(err);
  }
});

// PUT /api/daily-plan
router.put('/', async (req, res, next) => {
  try {
    const { plan_date, task_ids, plan_order, goal } = req.body;
    const plan = await upsertDailyPlan(
      { user_id: req.userId, plan_date, task_ids, plan_order, goal },
      req.userSupabase
    );
    res.json(plan);
  } catch (err) {
    next(err);
  }
});

export default router;
