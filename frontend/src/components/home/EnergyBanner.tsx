import { useTodayEnergy, useSubmitEnergy } from '../../hooks/useEnergy';
import type { EnergyLevel } from '../../types/task';

const LEVELS: { level: EnergyLevel; label: string; emoji: string; color: string; bg: string }[] = [
  { level: 'high',   label: 'High',   emoji: '⚡', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  { level: 'medium', label: 'Medium', emoji: '☀️', color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/30' },
  { level: 'low',    label: 'Low',    emoji: '🌙', color: 'text-slate-400',   bg: 'bg-slate-500/15 border-slate-500/30' },
];

const LEVEL_MAP: Record<EnergyLevel, { color: string; label: string; emoji: string }> = {
  high:   { color: 'text-emerald-400', label: 'High energy day',   emoji: '⚡' },
  medium: { color: 'text-amber-400',   label: 'Steady energy day', emoji: '☀️' },
  low:    { color: 'text-slate-400',   label: 'Low energy day',    emoji: '🌙' },
};

export function EnergyBanner() {
  const { data, isLoading } = useTodayEnergy();
  const { mutate: submit, isPending } = useSubmitEnergy();

  if (isLoading) return null;

  // Already checked in today
  if (data?.level) {
    const info = LEVEL_MAP[data.level];
    return (
      <div className={`mx-4 mb-3 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 glass border ${info.color === 'text-emerald-400' ? 'border-emerald-500/20' : info.color === 'text-amber-400' ? 'border-amber-500/20' : 'border-slate-500/20'}`}>
        <span className="text-base">{info.emoji}</span>
        <span className={`text-xs font-semibold ${info.color}`}>{info.label}</span>
        <span className="text-[10px] text-white/25 ml-auto">AI is using this to schedule tasks</span>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-3 px-4 py-3 rounded-2xl glass border border-white/8 animate-fade-in">
      <p className="text-xs font-bold text-white mb-2">How's your energy today?</p>
      <div className="flex gap-2">
        {LEVELS.map(({ level, label, emoji, bg }) => (
          <button
            key={level}
            onClick={() => submit(level)}
            disabled={isPending}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-semibold transition-all active:scale-95 cursor-pointer disabled:opacity-50 ${bg}`}
          >
            <span>{emoji}</span>
            <span className="text-white/60">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
