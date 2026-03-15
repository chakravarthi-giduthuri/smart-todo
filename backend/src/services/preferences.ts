import { getRecentOverrides, getOverrideCount, getAllOverrides, getOverridesWithTitles } from '../db/overrideQueries';
import type { OverrideLog } from '../types/task';

const MIN_OVERRIDES_FOR_LEARNING = 5;
const RULE_THRESHOLD = 3;
const MAX_RULES = 10;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PatternBucket {
  field: string;
  direction: string;
  keywords: string[];
  count: number;
}

export interface RuleInsight {
  field: string;
  direction: string;
  keywords: string[];
  count: number;
  rule_text: string;
  /** 'observing' < threshold, 'learning' ≥ threshold, 'confident' ≥ 2×threshold */
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

export interface FieldStat {
  field: string;
  count: number;
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

// ─── Pattern detection ────────────────────────────────────────────────────────

function detectPatterns(logs: OverrideLog[]): PatternBucket[] {
  const buckets = new Map<string, PatternBucket>();

  for (const log of logs) {
    // Group by field + direction only (not keyword signature) for broader matching
    const direction = `${log.ai_value}→${log.user_value}`;
    const key = `${log.field_changed}|${direction}`;

    if (buckets.has(key)) {
      const b = buckets.get(key)!;
      b.count++;
      // Merge keywords (unique)
      for (const kw of log.task_keywords ?? []) {
        if (!b.keywords.includes(kw)) b.keywords.push(kw);
      }
    } else {
      buckets.set(key, {
        field: log.field_changed,
        direction,
        keywords: log.task_keywords ?? [],
        count: 1,
      });
    }
  }

  return Array.from(buckets.values()).sort((a, b) => b.count - a.count);
}

function patternToRule(pattern: PatternBucket): string {
  const kw = pattern.keywords.length > 0 ? ` for "${pattern.keywords.slice(0, 3).join(', ')}" tasks` : '';

  if (pattern.field === 'priority') {
    const [from, to] = pattern.direction.split('→');
    const dir = Number(to) < Number(from) ? 'higher' : 'lower';
    return `Set priority ${dir} (${to}) than default (${from})${kw}.`;
  }
  if (pattern.field === 'category') {
    const [from, to] = pattern.direction.split('→');
    return `Categorize as "${to}" instead of "${from}"${kw}.`;
  }
  if (pattern.field === 'scheduled_time') {
    const [, to] = pattern.direction.split('→');
    return `Prefer scheduling at ${to}${kw}.`;
  }
  if (pattern.field === 'scheduled_date') {
    return `Be conservative with date assumptions${kw}.`;
  }
  if (pattern.field === 'title') {
    return `User regularly rewrites titles${kw} — keep them shorter/clearer.`;
  }
  return `Reconsider "${pattern.field}" suggestions${kw}.`;
}

function strengthOf(count: number): RuleInsight['strength'] {
  if (count >= RULE_THRESHOLD * 2) return 'confident';
  if (count >= RULE_THRESHOLD) return 'learning';
  return 'observing';
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function buildRules(userId?: string): Promise<string[]> {
  const count = await getOverrideCount(userId);
  if (count < MIN_OVERRIDES_FOR_LEARNING) return [];

  const logs = await getRecentOverrides(50, userId);
  const patterns = detectPatterns(logs).filter((b) => b.count >= RULE_THRESHOLD);
  return patterns.slice(0, MAX_RULES).map(patternToRule);
}

export async function buildInsights(userId?: string): Promise<LearningInsights> {
  const [allLogs, recentWithTitles] = await Promise.all([
    getAllOverrides(userId),
    getOverridesWithTitles(15, userId),
  ]);

  const total = allLogs.length;
  const patterns = detectPatterns(allLogs);
  const activePatternsAll = patterns; // include even sub-threshold for display
  const activeRules = activePatternsAll.filter((b) => b.count >= RULE_THRESHOLD).slice(0, MAX_RULES);

  // How many more overrides to unlock the next rule
  const bestObserving = activePatternsAll
    .filter((b) => b.count < RULE_THRESHOLD)
    .reduce((max, b) => Math.max(max, b.count), 0);
  const overridesUntilNext = bestObserving > 0 ? RULE_THRESHOLD - bestObserving : RULE_THRESHOLD;

  // Top fields
  const fieldMap = new Map<string, number>();
  for (const log of allLogs) {
    fieldMap.set(log.field_changed, (fieldMap.get(log.field_changed) ?? 0) + 1);
  }
  const top_fields: FieldStat[] = Array.from(fieldMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([field, count]) => ({ field, count }));

  const rules: RuleInsight[] = activeRules.map((p) => ({
    field: p.field,
    direction: p.direction,
    keywords: p.keywords.slice(0, 4),
    count: p.count,
    rule_text: patternToRule(p),
    strength: strengthOf(p.count),
  }));

  const recent_overrides: OverrideEntry[] = recentWithTitles.map((r) => ({
    id: r.id,
    field_changed: r.field_changed,
    ai_value: r.ai_value,
    user_value: r.user_value,
    reason: r.reason,
    task_keywords: r.task_keywords ?? [],
    task_title: r.task_title,
    created_at: r.created_at,
  }));

  return {
    stats: {
      total_overrides: total,
      rules_active: activeRules.length,
      overrides_until_next_rule: total < MIN_OVERRIDES_FOR_LEARNING
        ? MIN_OVERRIDES_FOR_LEARNING - total
        : overridesUntilNext,
      learning_since: allLogs.length > 0 ? allLogs[0].created_at : null,
      top_fields,
    },
    rules,
    recent_overrides,
  };
}
