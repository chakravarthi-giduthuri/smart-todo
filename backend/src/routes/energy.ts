import { Router } from 'express';
import { insertCheckin, getTodayCheckin } from '../db/energyQueries';
import type { EnergyLevel } from '../types/task';

const router = Router();

router.get('/today', async (req, res, next) => {
  try {
    const checkin = await getTodayCheckin();
    if (!checkin) return res.json({ checkin: null });
    res.json({ checkin });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { level } = req.body as { level: EnergyLevel };
    const validLevels: EnergyLevel[] = ['high', 'medium', 'low'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({ error: 'level must be high, medium, or low' });
    }
    const today = new Date().toISOString().split('T')[0];
    const checkin = await insertCheckin(today, level);
    res.status(201).json({ checkin });
  } catch (err) {
    next(err);
  }
});

export default router;
