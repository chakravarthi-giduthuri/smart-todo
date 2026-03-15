import { supabase } from './supabase';
import type { EnergyCheckin, EnergyLevel } from '../types/task';

export async function insertCheckin(date: string, level: EnergyLevel): Promise<EnergyCheckin> {
  const { data, error } = await supabase
    .from('energy_checkins')
    .upsert({ date, level }, { onConflict: 'date' })
    .select()
    .single();

  if (error) throw new Error(`insertCheckin failed: ${error.message}`);
  return data as EnergyCheckin;
}

export async function getTodayCheckin(): Promise<EnergyCheckin | null> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('energy_checkins')
    .select('*')
    .eq('date', today)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`getTodayCheckin failed: ${error.message}`);
  }
  return (data as EnergyCheckin | null) ?? null;
}
