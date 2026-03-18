import { apiFetch } from './client';

export async function getPreferences(): Promise<{ rules: string[] }> {
  return apiFetch<{ rules: string[] }>('/api/preferences');
}

export interface FieldStat { field: string; count: number; }
export interface RuleInsight {
  field: string;
  direction: string;
  keywords: string[];
  count: number;
  rule_text: string;
  strength: 'observing' | 'learning' | 'confident';
}
export interface OverrideEntry {
  id: string;
  field_changed: string;
  ai_value: string;
  user_value: string;
  reason: string;
  task_keywords: string[];
  task_title: string | null;
  created_at: string;
}
export interface LearningInsights {
  stats: {
    total_overrides: number;
    rules_active: number;
    overrides_until_next_rule: number;
    learning_since: string | null;
    top_fields: FieldStat[];
  };
  rules: RuleInsight[];
  recent_overrides: OverrideEntry[];
}

export async function getInsights(): Promise<LearningInsights> {
  return apiFetch<LearningInsights>('/api/preferences/insights');
}

export async function resetPreferences(): Promise<void> {
  await apiFetch('/api/preferences/reset', { method: 'DELETE' });
}
