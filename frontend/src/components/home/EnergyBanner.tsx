import { Zap, Sun, Moon, Check } from 'lucide-react';
import { useTodayEnergy, useSubmitEnergy } from '../../hooks/useEnergy';
import type { EnergyLevel } from '../../types/task';

const LEVELS = [
  {
    level: 'high' as EnergyLevel,
    label: 'High',
    sublabel: 'Deep focus',
    Icon: Zap,
    bg: 'rgba(16,185,129,0.15)',
    border: 'rgba(16,185,129,0.35)',
    iconColor: '#10b981',
    textColor: '#6ee7b7',
  },
  {
    level: 'medium' as EnergyLevel,
    label: 'Medium',
    sublabel: 'Routine tasks',
    Icon: Sun,
    bg: 'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.35)',
    iconColor: '#f59e0b',
    textColor: '#fcd34d',
  },
  {
    level: 'low' as EnergyLevel,
    label: 'Low',
    sublabel: 'Light work',
    Icon: Moon,
    bg: 'rgba(100,116,139,0.12)',
    border: 'rgba(100,116,139,0.25)',
    iconColor: '#94a3b8',
    textColor: '#cbd5e1',
  },
];

export function EnergyBanner() {
  const { data, isLoading } = useTodayEnergy();
  const { mutate: submit, isPending } = useSubmitEnergy();

  if (isLoading) return null;

  if (data?.level) {
    const info = LEVELS.find((l) => l.level === data.level)!;
    const { Icon } = info;
    return (
      <div
        className="mx-4 mb-3 px-4 py-3 rounded-xl flex items-center gap-3 animate-slide-up"
        style={{ background: info.bg, border: `1px solid ${info.border}` }}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${info.bg}` }}>
          <Icon size={16} style={{ color: info.iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold" style={{ color: info.textColor }}>{info.label} energy today</p>
          <p className="text-[10px] text-white/30 mt-0.5">AI scheduling adjusted</p>
        </div>
        <Check size={14} style={{ color: info.iconColor }} className="opacity-70 shrink-0" />
      </div>
    );
  }

  return (
    <div className="mx-4 mb-3 animate-slide-up">
      <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2 px-0.5">
        How's your energy?
      </p>
      <div className="flex gap-2">
        {LEVELS.map(({ level, label, sublabel, Icon, bg, border, iconColor, textColor }, i) => (
          <button
            key={level}
            onClick={() => submit(level)}
            disabled={isPending}
            className="flex-1 flex flex-col items-center gap-2 py-4 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50"
            style={{
              background: bg,
              border: `1px solid ${border}`,
              animationDelay: `${i * 50}ms`,
            }}
          >
            <Icon size={20} style={{ color: iconColor }} />
            <div className="text-center">
              <p className="text-xs font-bold leading-none" style={{ color: textColor }}>{label}</p>
              <p className="text-[9px] text-white/30 mt-0.5">{sublabel}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
