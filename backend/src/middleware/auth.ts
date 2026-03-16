import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../db/supabase';

// Extend Express Request to carry userId
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string;
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

  // auth.getUser(jwt) validates the token against Supabase auth server
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    console.error('[auth] getUser failed:', error?.message, '| SUPABASE_URL set:', !!process.env.SUPABASE_URL, '| ANON_KEY set:', !!process.env.SUPABASE_ANON_KEY, '| token prefix:', token.slice(0, 20));
    res.status(401).json({ error: 'Invalid or expired token', detail: error?.message });
    return;
  }

  req.userId = data.user.id;
  next();
}
