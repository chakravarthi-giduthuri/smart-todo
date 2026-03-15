import { useTodayEnergy, useSubmitEnergy } from '../../hooks/useEnergy';
import type { EnergyLevel } from '../../types/task';

const LEVELS: {
  level: EnergyLevel;
  label: string;
  sublabel: string;
  iconBg: string;
  iconColor: string;
  emoji: string;
}[] = [
  { level: 'high',   label: 'High Energy',   sublabel: 'Ready for deep focus',  iconBg: 'bg-yellow-100 dark:bg-yellow-900/30', iconColor: 'text-yellow-600 dark:text-yellow-400', emoji: '⚡' },
  { level: 'medium', label: 'Medium Energy', sublabel: 'Handling routine tasks', iconBg: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-500 dark:text-orange-400', emoji: '☀️' },
  { level: 'low',    label: 'Low Energy',    sublabel: 'Light or admin work',    iconBg: 'bg-blue-100 dark:bg-blue-900/30',    iconColor: 'text-blue-600 dark:text-blue-400',   emoji: '🌙' },
];

export function EnergyBanner() {
  const { data, isLoading } = useTodayEnergy();
  const { mutate: submit, isPending } = useSubmitEnergy();

  if (isLoading) return null;

  const selected = data?.level;

  return (
    <section>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">How's your energy today?</h3>
      <div className="grid grid-cols-3 gap-4">
        {LEVELS.map(({ level, label, sublabel, iconBg, iconColor, emoji }) => {
          const isActive = selected === level;
          return (
            <button
              key={level}
              onClick={() => submit(level)}
              disabled={isPending}
              className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 text-left flex flex-col gap-3 shadow-sm group cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:opacity-50 ${
                isActive
                  ? 'border-primary bg-primary/5 dark:bg-primary/10 dark:border-primary'
                  : 'border-slate-200 dark:border-slate-800 hover:border-primary/40 dark:hover:border-primary/40'
              }`}
            >
              <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center text-lg`}>
                <span className={iconColor}>{emoji}</span>
              </div>
              <div>
                <span className="block font-bold text-gray-900 dark:text-white text-sm">{label}</span>
                <span className="text-xs text-gray-500 dark:text-white/40 mt-0.5 block">{sublabel}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
