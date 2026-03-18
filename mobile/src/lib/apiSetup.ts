import { configureApiClient } from '@smart-todo/shared';
import { supabase } from './supabase';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://smart-todo-production-24df.up.railway.app';

configureApiClient(BASE_URL, async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
});
