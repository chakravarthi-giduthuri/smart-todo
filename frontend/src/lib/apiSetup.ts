import { configureApiClient } from '@smart-todo/shared';
import { supabase } from './supabase';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

configureApiClient(BASE_URL, async () => {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
});
