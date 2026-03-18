import { configureApiClient } from '@smart-todo/shared';
import { supabase } from './supabase';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

configureApiClient(BASE_URL, async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
});
