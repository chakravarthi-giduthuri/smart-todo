import { Zap, Sun, Moon, CheckCircle2 } from 'lucide-react';
import { useTodayEnergy, useSubmitEnergy } from '../../hooks/useEnergy';
import type { EnergyLevel } from '../../types/task';

const LEVELS: {
  level: EnergyLevel;
  label: string;
  sublabel: string;
  Icon: React.ElementType;
  color: string;
  iconBg: string;
  border: string;
  activeBg: string;
}[] = [
  {
    level: 'high',
    label: 'High Energy',
    sublabel: 'Deep focus',
    Icon: Zap,
    color: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    activeBg: 'bg-emerald-500/10',
  },
  {
    level: 'medium',
    label: 'Medium',
    sublabel: 'Routine tasks',
    Icon: Sun,
    color: 'text-amber-400',
    iconBg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    activeBg: 'bg-amber-500/10',
  },
  {
    level: 'low',
    label: 'Low Energy',
    sublabel: 'Admin work',
    Icon: Moon,
    color: 'text-slate-400',
    iconBg: 'bg-slate-500/15',
    border: 'border-slate-500/20',
    activeBg: 'bg-slate-500/8',
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
      <div className={`mx-4 mb-3 px-4 py-3 rounded-2xl flex items-center gap-3 border ${info.border} ${info.activeBg} animate-slide-up`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${info.iconBg}`}>
          <Icon size={16} className={info.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold ${info.color}`}>{info.label} today</p>
          <p className="text-[10px] text-white/25 mt-0.5">AI scheduling adjusted for your energy</p>
        </div>
        <CheckCircle2 size={14} className={`${info.color} opacity-60 shrink-0`} />
      </div>
    );
  }

  return (
    <div className="mx-4 mb-3 animate-slide-up">
      <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2.5 px-1">
        How's your energy?
      </p>
      <div className="flex gap-2">
        {LEVELS.map(({ level, label, sublabel, Icon, color, iconBg, border }, i) => (
          <button
            key={level}
            onClick={() => submit(level)}
            disabled={isPending}
            className={`flex-1 flex flex-col items-center gap-2 py-3.5 rounded-2xl border glass transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50 hover:bg-white/[0.05] group ${border}`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110 ${iconBg}`}>
              <Icon size={17} className={color} />
            </div>
            <div className="text-center">
              <p className={`text-[11px] font-bold leading-none ${color}`}>{label}</p>
              <p className="text-[9px] text-white/30 mt-0.5">{sublabel}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
