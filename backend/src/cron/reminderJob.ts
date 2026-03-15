import cron from 'node-cron';
import { runReminderJob } from '../services/reminders';

export function startReminderCron() {
  cron.schedule('*/5 * * * *', () => {
    runReminderJob().catch((err) => console.error('[Cron] Unhandled error:', err));
  });
  console.log('[Cron] Reminder job scheduled every 5 minutes');
}
