import type { Request, Response, NextFunction } from 'express';
import { supabase, createUserClient, type UserSupabaseClient } from '../db/supabase';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string;
      userSupabase: UserSupabaseClient;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    console.error('[auth] getUser failed:', error?.message);
    res.status(401).json({ error: 'Invalid or expired token', detail: error?.message });
    return;
  }

  req.userId = data.user.id;
  req.userSupabase = createUserClient(token);
  next();
}
