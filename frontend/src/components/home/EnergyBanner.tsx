import { useTodayEnergy, useSubmitEnergy } from '../../hooks/useEnergy';
import type { EnergyLevel } from '../../types/task';

const LEVELS: {
  level: EnergyLevel;
  label: string;
  sublabel: string;
  emoji: string;
  bg: string;
  border: string;
  activeBg: string;
  activeBorder: string;
  textColor: string;
}[] = [
  {
    level: 'high',
    label: 'High',
    sublabel: 'Deep focus',
    emoji: '⚡',
    bg: 'rgba(5,46,22,0.7)',
    border: 'rgba(22,163,74,0.35)',
    activeBg: 'rgba(5,46,22,0.85)',
    activeBorder: 'rgba(22,163,74,0.5)',
    textColor: '#86efac',
  },
  {
    level: 'medium',
    label: 'Medium',
    sublabel: 'Routine tasks',
    emoji: '☀️',
    bg: 'rgba(45,26,3,0.8)',
    border: 'rgba(161,98,7,0.4)',
    activeBg: 'rgba(55,32,3,0.9)',
    activeBorder: 'rgba(161,98,7,0.6)',
    textColor: '#fde68a',
  },
  {
    level: 'low',
    label: 'Low',
    sublabel: 'Light work',
    emoji: '🌙',
    bg: 'rgba(17,24,39,0.6)',
    border: 'rgba(75,85,99,0.35)',
    activeBg: 'rgba(17,24,39,0.8)',
    activeBorder: 'rgba(107,114,128,0.45)',
    textColor: '#d1d5db',
  },
];

export function EnergyBanner() {
  const { data, isLoading } = useTodayEnergy();
  const { mutate: submit, isPending } = useSubmitEnergy();

  if (isLoading) return null;

  /* Already selected — compact status row */
  if (data?.level) {
    const info = LEVELS.find((l) => l.level === data.level)!;
    return (
      <div
        className="mx-4 mb-3 px-4 py-3 rounded-2xl flex items-center gap-3 animate-slide-up"
        style={{ background: info.activeBg, border: `1px solid ${info.activeBorder}` }}
      >
        <span className="text-xl">{info.emoji}</span>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: info.textColor }}>{info.label} energy today</p>
          <p className="text-[11px] text-white/30 mt-0.5">AI has adjusted your schedule</p>
        </div>
      </div>
    );
  }

  /* Picker — outer container card + 3 big emoji cards, exactly like mockup */
  return (
    <div
      className="mx-4 mb-3 rounded-2xl p-3 animate-slide-up"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <p className="text-sm font-semibold text-white mb-3">How's your energy today?</p>
      <div className="flex gap-2">
        {LEVELS.map(({ level, label, sublabel, emoji, bg, border, textColor }) => (
          <button
            key={level}
            onClick={() => submit(level)}
            disabled={isPending}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50 hover:brightness-110"
            style={{ background: bg, border: `1px solid ${border}` }}
          >
            <span className="text-2xl leading-none">{emoji}</span>
            <span className="text-xs font-bold mt-0.5" style={{ color: textColor }}>{label}</span>
            <span className="text-[9px] text-white/30">{sublabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
