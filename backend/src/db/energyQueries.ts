import type { EnergyCheckin, EnergyLevel } from '../types/task';
import type { UserSupabaseClient } from './supabase';

export async function insertCheckin(date: string, level: EnergyLevel, userSupabase: UserSupabaseClient): Promise<EnergyCheckin> {
  const { data, error } = await userSupabase
    .from('energy_checkins')
    .upsert({ date, level }, { onConflict: 'user_id,date' })
    .select()
    .single();

  if (error) throw new Error(`insertCheckin failed: ${error.message}`);
  return data as EnergyCheckin;
}

export async function getTodayCheckin(userSupabase: UserSupabaseClient): Promise<EnergyCheckin | null> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await userSupabase
    .from('energy_checkins')
    .select('*')
    .eq('date', today)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`getTodayCheckin failed: ${error.message}`);
  }
  return (data as EnergyCheckin | null) ?? null;
}
