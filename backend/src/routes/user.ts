import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { supabase } from '../db/supabase';
import { createClient } from '@supabase/supabase-js';

const router = Router();
router.use(requireAuth);

/**
 * DELETE /api/user/account
 * Deletes ALL user data from every table, then removes the auth user.
 * Requires SUPABASE_SERVICE_ROLE_KEY (already set on the backend client).
 */
router.delete('/account', async (req, res, next) => {
  try {
    const userId = req.userId;

    // Delete user data from all tables (order matters for any FK constraints)
    await Promise.all([
      supabase.from('override_log').delete().eq('user_id', userId),
      supabase.from('energy_checkins').delete().eq('user_id', userId),
      supabase.from('push_subscriptions').delete().eq('user_id', userId),
    ]);

    // Tasks must be deleted after override_log (in case of FK)
    await supabase.from('tasks').delete().eq('user_id', userId);

    // Delete the auth user — requires service role key (admin API)
    const adminClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) throw new Error(`Failed to delete auth user: ${error.message}`);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
