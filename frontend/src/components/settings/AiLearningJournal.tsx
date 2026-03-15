import { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Zap, TrendingUp, Clock, Tag, AlignLeft } from 'lucide-react';
import { useAiInsights } from '@/hooks/useAiPrefs';
import type { RuleInsight, OverrideEntry } from '@/api/preferences';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIELD_META: Record<string, { label: string; color: string; bg: string; Icon: typeof Tag }> = {
  priority:       { label: 'Priority',  color: '#f97316', bg: 'rgba(249,115,22,0.12)', Icon: TrendingUp },
  category:       { label: 'Category',  color: '#6366f1', bg: 'rgba(99,102,241,0.12)', Icon: Tag },
  scheduled_time: { label: 'Time',      color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',  Icon: Clock },
  scheduled_date: { label: 'Date',      color: '#10b981', bg: 'rgba(16,185,129,0.12)', Icon: Clock },
  title:          { label: 'Title',     color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', Icon: AlignLeft },
};

const STRENGTH_META = {
  observing: { label: 'Observing', dots: 1, color: 'rgba(255,255,255,0.2)' },
  learning:  { label: 'Learning',  dots: 2, color: '#eab308' },
  confident: { label: 'Confident', dots: 3, color: '#10b981' },
};

function fieldMeta(field: string) {
  return FIELD_META[field] ?? { label: field, color: '#6b7280', bg: 'rgba(107,114,128,0.12)', Icon: Tag };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatField(field: string): string {
  return fieldMeta(field).label;
}

function formatValue(field: string, val: string): string {
  if (!val || val === 'null') return '—';
  if (field === 'priority') {
    const labels: Record<string, string> = { '1': 'Critical', '2': 'High', '3': 'Medium', '4': 'Low', '5': 'Minimal' };
    return labels[val] ?? val;
  }
  return val;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StrengthDots({ strength }: { strength: RuleInsight['strength'] }) {
  const meta = STRENGTH_META[strength];
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full transition-colors"
          style={{ backgroundColor: i <= meta.dots ? meta.color : 'rgba(255,255,255,0.1)' }}
        />
      ))}
      <span className="text-[9px] font-semibold ml-1" style={{ color: meta.color }}>{meta.label}</span>
    </div>
  );
}

function RuleCard({ rule }: { rule: RuleInsight }) {
  const meta = fieldMeta(rule.field);
  const Icon = meta.Icon;
  const [from, to] = rule.direction.split('→');
  return (
    <div className="glass rounded-2xl p-3.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
            <Icon size={13} style={{ color: meta.color }} />
          </div>
          <span className="text-xs font-bold" style={{ color: meta.color }}>{meta.label}</span>
        </div>
        <StrengthDots strength={rule.strength} />
      </div>

      {/* Direction arrow */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs font-semibold text-white/40 line-through">{formatValue(rule.field, from)}</span>
        <span className="text-[10px] text-white/25">→</span>
        <span className="text-xs font-semibold text-white">{formatValue(rule.field, to)}</span>
        <span className="ml-auto text-[10px] text-white/30">{rule.count}× overridden</span>
      </div>

      {/* Rule text */}
      <p className="text-[11px] text-white/50 leading-relaxed">{rule.rule_text}</p>

      {/* Keywords */}
      {rule.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {rule.keywords.map((kw) => (
            <span key={kw} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/35 font-medium">
              {kw}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function OverrideRow({ entry }: { entry: OverrideEntry }) {
  const meta = fieldMeta(entry.field_changed);
  const Icon = meta.Icon;
  const [from, to] = [entry.ai_value, entry.user_value];
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: meta.bg }}>
        <Icon size={12} style={{ color: meta.color }} />
      </div>
      <div className="flex-1 min-w-0">
        {entry.task_title && (
          <p className="text-xs font-semibold text-white truncate mb-0.5">{entry.task_title}</p>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold" style={{ color: meta.color }}>{formatField(entry.field_changed)}</span>
          <span className="text-[10px] text-white/30 line-through">{formatValue(entry.field_changed, from)}</span>
          <span className="text-[9px] text-white/20">→</span>
          <span className="text-[10px] text-white font-semibold">{formatValue(entry.field_changed, to)}</span>
        </div>
        {entry.reason && (
          <p className="text-[10px] text-white/35 mt-0.5 italic">"{entry.reason}"</p>
        )}
      </div>
      <span className="text-[9px] text-white/25 shrink-0 mt-1">{timeAgo(entry.created_at)}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AiLearningJournal() {
  const { data, isLoading } = useAiInsights();
  const [showHistory, setShowHistory] = useState(false);

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={16} className="text-violet-400" />
          <span className="text-sm font-bold text-white">AI Learning Journal</span>
        </div>
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-4 rounded-xl shimmer-bg" />)}
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const rules = data?.rules ?? [];
  const overrides = data?.recent_overrides ?? [];
  const total = stats?.total_overrides ?? 0;
  const hasStarted = total > 0;

  // Progress toward first learning threshold
  const progressTarget = 5; // MIN_OVERRIDES_FOR_LEARNING
  const progressPct = Math.min(100, (total / progressTarget) * 100);

  return (
    <div className="space-y-3">
      {/* Stats card */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <Brain size={16} className="text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">AI Learning Journal</p>
            <p className="text-[10px] text-white/30 mt-0.5">How Claude evolves with your edits</p>
          </div>
          {rules.length > 0 && (
            <div className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-500/15">
              <Zap size={10} className="text-violet-400" />
              <span className="text-[10px] font-bold text-violet-400">{rules.length} active</span>
            </div>
          )}
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Total edits', value: String(total) },
            { label: 'Rules learned', value: String(stats?.rules_active ?? 0) },
            { label: 'Until next rule', value: hasStarted && rules.length > 0 ? `${stats?.overrides_until_next_rule ?? '—'}` : total < progressTarget ? `${progressTarget - total}` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/4 rounded-xl px-3 py-2.5 text-center">
              <p className="text-base font-extrabold text-white">{value}</p>
              <p className="text-[9px] text-white/35 mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* Top fields */}
        {(stats?.top_fields ?? []).length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-2">Most edited</p>
            <div className="flex flex-wrap gap-2">
              {stats!.top_fields.map(({ field, count }) => {
                const m = fieldMeta(field);
                return (
                  <div key={field} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: m.bg }}>
                    <span className="text-[10px] font-bold" style={{ color: m.color }}>{m.label}</span>
                    <span className="text-[9px] text-white/30">{count}×</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Progress bar (before first rules unlock) */}
        {rules.length === 0 && (
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-[10px] text-white/30">Learning progress</span>
              <span className="text-[10px] text-white/30">{total}/{progressTarget} edits</span>
            </div>
            <div className="h-[3px] rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
                }}
              />
            </div>
            <p className="text-[10px] text-white/25 mt-2">
              {total === 0
                ? 'Edit any task field to start teaching Claude your preferences.'
                : `${progressTarget - total} more edit${progressTarget - total !== 1 ? 's' : ''} until Claude starts adapting.`}
            </p>
          </div>
        )}
      </div>

      {/* Active rules */}
      {rules.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-3">Active Rules</p>
          <div className="space-y-2.5">
            {rules.map((rule, i) => <RuleCard key={i} rule={rule} />)}
          </div>
        </div>
      )}

      {/* Edit history */}
      {overrides.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Edit History</p>
              <span className="text-[10px] text-white/20">{overrides.length} recent</span>
            </div>
            {showHistory ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
          </button>

          {showHistory && (
            <div className="px-4 pb-3 animate-fade-in">
              {overrides.map((entry) => <OverrideRow key={entry.id} entry={entry} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
