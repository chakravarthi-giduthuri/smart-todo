import { Router } from 'express';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

/**
 * DELETE /api/user/account
 * Deletes ALL user data from every table using the user's own JWT client.
 * Note: deleting the Supabase auth user requires a service role key —
 * if not configured, data is deleted but the auth account remains.
 */
router.delete('/account', async (req, res, next) => {
  try {
    const userId = req.userId;
    const db = req.userSupabase;

    // Delete in dependency order (override_log → tasks → others in parallel)
    await db.from('override_log').delete().eq('user_id', userId);
    await db.from('tasks').delete().eq('user_id', userId);
    await Promise.all([
      db.from('energy_checkins').delete().eq('user_id', userId),
      db.from('push_subscriptions').delete().eq('user_id', userId),
    ]);

    // Delete the auth user only if service role key is available
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey) {
      const { createClient } = await import('@supabase/supabase-js');
      const adminClient = createClient(process.env.SUPABASE_URL!, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error } = await adminClient.auth.admin.deleteUser(userId);
      if (error) console.error('[user] deleteUser error:', error.message);
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
