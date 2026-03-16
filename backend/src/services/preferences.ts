import { getRecentOverrides, getOverrideCount, getAllOverrides, getOverridesWithTitles } from '../db/overrideQueries';
import { supabase } from '../db/supabase';
import type { OverrideLog } from '../types/task';

// ─── Config ────────────────────────────────────────────────────────────────────

const MIN_OVERRIDES_FOR_LEARNING = 3;  // start learning faster
const RULE_THRESHOLD = 2;              // overrides needed to emit a rule
const CONFIDENT_THRESHOLD = 5;        // strong confidence
const MAX_RULES_PER_SECTION = 4;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LearningContext {
  priorityRules: string[];
  categoryRules: string[];
  timeRules: string[];
  durationRules: string[];
  behaviorProfile: string[];
  reasonInsights: string[];
}

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

interface WeightedOverride {
  log: OverrideLog;
  weight: number;
}

// ─── Recency weighting ────────────────────────────────────────────────────────

function assignWeight(createdAt: string): number {
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / 86400000;
  if (ageDays < 3)  return 4.0;  // last 3 days: very strong signal
  if (ageDays < 7)  return 3.0;  // last week
  if (ageDays < 30) return 2.0;  // last month
  if (ageDays < 60) return 1.5;  // last 2 months
  return 1.0;
}

// ─── Priority rules ───────────────────────────────────────────────────────────

function extractPriorityRules(weighted: WeightedOverride[]): string[] {
  const rules: string[] = [];
  const priorityOverrides = weighted.filter(w => w.log.field_changed === 'priority');
  if (priorityOverrides.length === 0) return rules;

  // Group by (ai_value → user_value) with associated keywords and category context
  const buckets = new Map<string, { count: number; weightedCount: number; keywords: Set<string>; categories: Set<string> }>();

  for (const { log, weight } of priorityOverrides) {
    const key = `${log.ai_value}→${log.user_value}`;
    if (!buckets.has(key)) buckets.set(key, { count: 0, weightedCount: 0, keywords: new Set(), categories: new Set() });
    const b = buckets.get(key)!;
    b.count++;
    b.weightedCount += weight;
    for (const kw of log.task_keywords ?? []) b.keywords.add(kw.toLowerCase());
  }

  for (const [direction, b] of buckets) {
    if (b.weightedCount < RULE_THRESHOLD) continue;
    const [from, to] = direction.split('→');
    const dir = Number(to) < Number(from) ? 'higher' : 'lower';
    const confidence = b.weightedCount >= CONFIDENT_THRESHOLD ? 'always' : 'usually';
    const kwList = Array.from(b.keywords).slice(0, 4).join('", "');
    const kwNote = kwList ? ` (especially for "${kwList}" tasks)` : '';
    rules.push(`${confidence} set priority to ${to} (${dir}) instead of AI default ${from}${kwNote}. [${b.count} overrides]`);
  }

  return rules.slice(0, MAX_RULES_PER_SECTION);
}

// ─── Category rules ───────────────────────────────────────────────────────────

function extractCategoryRules(weighted: WeightedOverride[]): string[] {
  const rules: string[] = [];
  const catOverrides = weighted.filter(w => w.log.field_changed === 'category');
  if (catOverrides.length === 0) return rules;

  // Group by direction with keyword signals
  const buckets = new Map<string, { count: number; weightedCount: number; keywords: Set<string> }>();

  for (const { log, weight } of catOverrides) {
    const key = `${log.ai_value}→${log.user_value}`;
    if (!buckets.has(key)) buckets.set(key, { count: 0, weightedCount: 0, keywords: new Set() });
    const b = buckets.get(key)!;
    b.count++;
    b.weightedCount += weight;
    for (const kw of log.task_keywords ?? []) b.keywords.add(kw.toLowerCase());
  }

  for (const [direction, b] of buckets) {
    if (b.weightedCount < RULE_THRESHOLD) continue;
    const [from, to] = direction.split('→');
    const confidence = b.weightedCount >= CONFIDENT_THRESHOLD ? 'always' : 'usually';
    const kwList = Array.from(b.keywords).slice(0, 5);
    if (kwList.length > 0) {
      rules.push(`${confidence} categorize as "${to}" (not "${from}") when task involves: ${kwList.map(k => `"${k}"`).join(', ')}. [${b.count} corrections]`);
    } else {
      rules.push(`${confidence} prefer "${to}" over "${from}" category. [${b.count} corrections]`);
    }
  }

  return rules.slice(0, MAX_RULES_PER_SECTION);
}

// ─── Time preference rules ────────────────────────────────────────────────────

function parseTimeToMinutes(t: string): number | null {
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return parseInt(m[1]) * 60 + parseInt(m[2]);
}

function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function extractTimeRules(weighted: WeightedOverride[]): string[] {
  const rules: string[] = [];
  const timeOverrides = weighted.filter(w => w.log.field_changed === 'scheduled_time');
  if (timeOverrides.length === 0) return rules;

  // Group preferred times by task keywords / category context
  // Build a general "user prefers these time slots" map
  const timeByKeyword = new Map<string, number[]>(); // keyword → list of preferred minutes

  for (const { log } of timeOverrides) {
    const preferredMin = parseTimeToMinutes(log.user_value ?? '');
    if (preferredMin === null) continue;

    const keywords = log.task_keywords ?? [];
    if (keywords.length === 0) {
      // No keyword context — add to general bucket
      if (!timeByKeyword.has('__general__')) timeByKeyword.set('__general__', []);
      timeByKeyword.get('__general__')!.push(preferredMin);
    } else {
      for (const kw of keywords.slice(0, 3)) {
        const k = kw.toLowerCase();
        if (!timeByKeyword.has(k)) timeByKeyword.set(k, []);
        timeByKeyword.get(k)!.push(preferredMin);
      }
    }
  }

  // For buckets with 2+ datapoints, compute average preferred time
  for (const [keyword, times] of timeByKeyword) {
    if (times.length < RULE_THRESHOLD) continue;
    const avg = Math.round(times.reduce((s, t) => s + t, 0) / times.length);
    const timeStr = minutesToHHMM(avg);
    // Check spread — only emit rule if times are clustered (stddev < 90 min)
    const mean = avg;
    const variance = times.reduce((s, t) => s + Math.pow(t - mean, 2), 0) / times.length;
    const stddev = Math.sqrt(variance);
    if (stddev > 90) continue; // times are too scattered, not a real preference

    if (keyword === '__general__') {
      rules.push(`prefers scheduling tasks around ${timeStr}. [${times.length} time adjustments]`);
    } else {
      rules.push(`for "${keyword}" tasks, prefer time ${timeStr}. [${times.length} adjustments]`);
    }
  }

  return rules.slice(0, MAX_RULES_PER_SECTION);
}

// ─── Duration preference rules ────────────────────────────────────────────────

function extractDurationRules(weighted: WeightedOverride[]): string[] {
  const rules: string[] = [];
  const durOverrides = weighted.filter(w => w.log.field_changed === 'duration_minutes');
  if (durOverrides.length === 0) return rules;

  // Group by keyword context
  const durByKeyword = new Map<string, number[]>();

  for (const { log } of durOverrides) {
    const preferred = parseInt(log.user_value ?? '');
    if (isNaN(preferred) || preferred <= 0) continue;

    const keywords = log.task_keywords ?? [];
    if (keywords.length === 0) {
      if (!durByKeyword.has('__general__')) durByKeyword.set('__general__', []);
      durByKeyword.get('__general__')!.push(preferred);
    } else {
      for (const kw of keywords.slice(0, 3)) {
        const k = kw.toLowerCase();
        if (!durByKeyword.has(k)) durByKeyword.set(k, []);
        durByKeyword.get(k)!.push(preferred);
      }
    }
  }

  for (const [keyword, durations] of durByKeyword) {
    if (durations.length < RULE_THRESHOLD) continue;
    const avg = Math.round(durations.reduce((s, d) => s + d, 0) / durations.length);
    if (keyword === '__general__') {
      rules.push(`typically prefers task duration of ~${avg} minutes. [${durations.length} adjustments]`);
    } else {
      rules.push(`"${keyword}" tasks typically take ~${avg} minutes for this user. [${durations.length} adjustments]`);
    }
  }

  return rules.slice(0, MAX_RULES_PER_SECTION);
}

// ─── Reason-based insights ────────────────────────────────────────────────────

function extractReasonInsights(weighted: WeightedOverride[]): string[] {
  const insights: string[] = [];
  const withReasons = weighted.filter(w => w.log.reason && w.log.reason.trim().length > 5);
  if (withReasons.length === 0) return insights;

  // Cluster reasons by similarity (simple keyword overlap)
  const reasonGroups = new Map<string, { reasons: string[]; keywords: Set<string>; weightedCount: number }>();

  for (const { log, weight } of withReasons) {
    const reason = log.reason.trim().toLowerCase();
    const field = log.field_changed;
    const groupKey = `${field}:${reason.slice(0, 30)}`; // coarse grouping by first 30 chars

    if (!reasonGroups.has(groupKey)) {
      reasonGroups.set(groupKey, { reasons: [], keywords: new Set(), weightedCount: 0 });
    }
    const g = reasonGroups.get(groupKey)!;
    g.reasons.push(log.reason.trim());
    g.weightedCount += weight;
    for (const kw of log.task_keywords ?? []) g.keywords.add(kw.toLowerCase());
  }

  // Emit insights for strongly repeated reasons
  for (const [, g] of reasonGroups) {
    if (g.weightedCount < RULE_THRESHOLD) continue;
    // Use the most recent/representative reason text
    const exampleReason = g.reasons[g.reasons.length - 1];
    insights.push(`user explicitly noted: "${exampleReason}"`);
  }

  return insights.slice(0, 3); // max 3 reason insights
}

// ─── Behavior profile (from tasks table) ─────────────────────────────────────

async function extractBehaviorProfile(userId?: string): Promise<string[]> {
  const profile: string[] = [];
  try {
    // Completion rates by category
    let query = supabase.from('tasks').select('category, is_completed, is_archived').eq('is_archived', false);
    if (userId) query = query.eq('user_id', userId);
    const { data: tasks } = await query;

    if (tasks && tasks.length >= 5) {
      const catStats = new Map<string, { total: number; done: number }>();
      for (const t of tasks) {
        const cat = t.category as string;
        if (!catStats.has(cat)) catStats.set(cat, { total: 0, done: 0 });
        catStats.get(cat)!.total++;
        if (t.is_completed) catStats.get(cat)!.done++;
      }

      // Most productive category
      let bestCat = '';
      let bestRate = 0;
      let worstCat = '';
      let worstRate = 1;
      for (const [cat, s] of catStats) {
        if (s.total < 3) continue;
        const rate = s.done / s.total;
        if (rate > bestRate) { bestRate = rate; bestCat = cat; }
        if (rate < worstRate) { worstRate = rate; worstCat = cat; }
      }

      if (bestCat) profile.push(`completes ${Math.round(bestRate * 100)}% of ${bestCat} tasks — prioritize this category's scheduling.`);
      if (worstCat && worstCat !== bestCat) profile.push(`tends to procrastinate ${worstCat} tasks (${Math.round(worstRate * 100)}% completion) — set realistic deadlines.`);

      // Most-created category
      let topCat = '';
      let topCount = 0;
      for (const [cat, s] of catStats) {
        if (s.total > topCount) { topCount = s.total; topCat = cat; }
      }
      if (topCat) profile.push(`most tasks are "${topCat}" (${topCount} total) — user's primary focus area.`);
    }

    // Typical creation hour (from created_at)
    let taskQuery = supabase.from('tasks').select('created_at').eq('is_archived', false).order('created_at', { ascending: false }).limit(50);
    if (userId) taskQuery = taskQuery.eq('user_id', userId);
    const { data: recentTasks } = await taskQuery;

    if (recentTasks && recentTasks.length >= 5) {
      const hourCounts = new Array(24).fill(0);
      for (const t of recentTasks) {
        const h = new Date(t.created_at).getHours();
        hourCounts[h]++;
      }
      const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
      profile.push(`typically creates tasks around ${peakHour}:00 — likely active during this period.`);
    }

  } catch (err) {
    console.error('[preferences] extractBehaviorProfile error:', err);
  }
  return profile;
}

// ─── Public: buildLearningContext ─────────────────────────────────────────────

export async function buildLearningContext(userId?: string): Promise<LearningContext> {
  const empty: LearningContext = {
    priorityRules: [],
    categoryRules: [],
    timeRules: [],
    durationRules: [],
    behaviorProfile: [],
    reasonInsights: [],
  };

  try {
    const count = await getOverrideCount(userId);
    if (count < MIN_OVERRIDES_FOR_LEARNING) return empty;

    const logs = await getRecentOverrides(100, userId);
    const weighted: WeightedOverride[] = logs.map(log => ({ log, weight: assignWeight(log.created_at) }));

    const [priorityRules, categoryRules, timeRules, durationRules, behaviorProfile, reasonInsights] = await Promise.all([
      Promise.resolve(extractPriorityRules(weighted)),
      Promise.resolve(extractCategoryRules(weighted)),
      Promise.resolve(extractTimeRules(weighted)),
      Promise.resolve(extractDurationRules(weighted)),
      extractBehaviorProfile(userId),
      Promise.resolve(extractReasonInsights(weighted)),
    ]);

    return { priorityRules, categoryRules, timeRules, durationRules, behaviorProfile, reasonInsights };
  } catch (err) {
    console.error('[preferences] buildLearningContext error:', err);
    return empty;
  }
}

// ─── Backward-compat: buildRules (flat string[]) ─────────────────────────────

export async function buildRules(userId?: string): Promise<string[]> {
  try {
    const ctx = await buildLearningContext(userId);
    return [
      ...ctx.priorityRules,
      ...ctx.categoryRules,
      ...ctx.timeRules,
      ...ctx.durationRules,
      ...ctx.reasonInsights,
      ...ctx.behaviorProfile,
    ].slice(0, 15);
  } catch (err) {
    console.error('[preferences] buildRules error:', err);
    return [];
  }
}

// ─── Legacy pattern helpers (used by buildInsights) ──────────────────────────

function detectPatterns(logs: OverrideLog[]): PatternBucket[] {
  const buckets = new Map<string, PatternBucket>();
  for (const log of logs) {
    const direction = `${log.ai_value}→${log.user_value}`;
    const key = `${log.field_changed}|${direction}`;
    if (buckets.has(key)) {
      const b = buckets.get(key)!;
      b.count++;
      for (const kw of log.task_keywords ?? []) {
        if (!b.keywords.includes(kw)) b.keywords.push(kw);
      }
    } else {
      buckets.set(key, { field: log.field_changed, direction, keywords: log.task_keywords ?? [], count: 1 });
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
  if (pattern.field === 'scheduled_date') return `Be conservative with date assumptions${kw}.`;
  if (pattern.field === 'title') return `User regularly rewrites titles${kw} — keep them shorter/clearer.`;
  return `Reconsider "${pattern.field}" suggestions${kw}.`;
}

function strengthOf(count: number): RuleInsight['strength'] {
  if (count >= CONFIDENT_THRESHOLD) return 'confident';
  if (count >= RULE_THRESHOLD) return 'learning';
  return 'observing';
}

// ─── buildInsights (used by preferences route / AI Journal) ──────────────────

export async function buildInsights(userId?: string): Promise<LearningInsights> {
  let allLogs: OverrideLog[] = [];
  let recentWithTitles: Array<OverrideLog & { task_title: string | null }> = [];
  try {
    [allLogs, recentWithTitles] = await Promise.all([
      getAllOverrides(userId),
      getOverridesWithTitles(15, userId),
    ]);
  } catch (err) {
    console.error('[preferences] buildInsights error:', err);
  }

  const total = allLogs.length;
  const patterns = detectPatterns(allLogs);
  const activeRules = patterns.filter(b => b.count >= RULE_THRESHOLD).slice(0, 12);

  const bestObserving = patterns.filter(b => b.count < RULE_THRESHOLD).reduce((max, b) => Math.max(max, b.count), 0);
  const overridesUntilNext = bestObserving > 0 ? RULE_THRESHOLD - bestObserving : RULE_THRESHOLD;

  const fieldMap = new Map<string, number>();
  for (const log of allLogs) fieldMap.set(log.field_changed, (fieldMap.get(log.field_changed) ?? 0) + 1);
  const top_fields: FieldStat[] = Array.from(fieldMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([field, count]) => ({ field, count }));

  const rules: RuleInsight[] = activeRules.map(p => ({
    field: p.field,
    direction: p.direction,
    keywords: p.keywords.slice(0, 4),
    count: p.count,
    rule_text: patternToRule(p),
    strength: strengthOf(p.count),
  }));

  const recent_overrides: OverrideEntry[] = recentWithTitles.map(r => ({
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
