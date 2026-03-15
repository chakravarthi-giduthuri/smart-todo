import cron from 'node-cron';
import { runReminderJob } from '../services/reminders';

export function startReminderCron() {
  cron.schedule('*/5 * * * *', async () => {
    await runReminderJob();
  });
  console.log('[Cron] Reminder job scheduled every 5 minutes');
}
