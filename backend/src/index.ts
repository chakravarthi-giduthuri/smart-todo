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
import subtasksRouter from './routes/subtasks';
import focusRouter from './routes/focus';
import conversationRouter from './routes/conversation';
import energyRouter from './routes/energy';
import dependenciesRouter from './routes/dependencies';
import calendarRouter from './routes/calendar';
import sharesRouter from './routes/shares';
import { startReminderCron } from './cron/reminderJob';
import { startMorningPlanCron } from './cron/morningPlanJob';
import { startWeeklyReviewCron } from './cron/weeklyReviewJob';
import { loadSubscriptionFromDb } from './services/reminders';

// Prevent unhandled rejections from crashing the process (Node 15+)
process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught exception:', err);
});

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(corsMiddleware);
app.use(express.json());

app.use('/api/tasks', tasksRouter);
app.use('/api/tasks', overridesRouter);
app.use('/api/tasks/:taskId/subtasks', subtasksRouter);
app.use('/api/tasks/:taskId/dependencies', dependenciesRouter);
app.use('/api/push', pushRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/preferences', preferencesRouter);
app.use('/api/focus', focusRouter);
app.use('/api/conversation', conversationRouter);
app.use('/api/energy', energyRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/shares', sharesRouter);

app.get('/health', (req, res) => res.json({ ok: true }));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
  loadSubscriptionFromDb();
  startReminderCron();
  startMorningPlanCron();
  startWeeklyReviewCron();
});

export default app;
