import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import { corsMiddleware } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';
import tasksRouter from './routes/tasks';
import overridesRouter from './routes/overrides';
import pushRouter from './routes/push';
import dashboardRouter from './routes/dashboard';
import preferencesRouter from './routes/preferences';
import { startReminderCron } from './cron/reminderJob';
import { loadSubscriptionFromDb } from './services/reminders';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(corsMiddleware);
app.use(express.json());

app.use('/api/tasks', tasksRouter);
app.use('/api/tasks', overridesRouter);
app.use('/api/push', pushRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/preferences', preferencesRouter);

app.get('/health', (req, res) => res.json({ ok: true }));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
  loadSubscriptionFromDb();
  startReminderCron();
});

export default app;
