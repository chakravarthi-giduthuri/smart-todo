import type { Task } from '../../types/task';
import type { EnergyLevel } from '../../types/task';

interface Props { energyLevel?: EnergyLevel; tasks: Task[]; }

const ENERGY_LABELS: Record<EnergyLevel, { text: string; color: string }> = {
  high:   { text: 'High Energy',   color: 'text-yellow-400' },
  medium: { text: 'Medium Energy', color: 'text-orange-400' },
  low:    { text: 'Low Energy',    color: 'text-blue-400'   },
};

export function SmartSuggestions({ energyLevel, tasks }: Props) {
  const incomplete = tasks.filter((t) => !t.is_completed);
  // Suggest top 3 tasks based on energy level
  const suggestions = energyLevel === 'high'
    ? incomplete.filter((t) => t.priority <= 2).slice(0, 3)
    : energyLevel === 'medium'
    ? incomplete.filter((t) => t.priority >= 2 && t.priority <= 3).slice(0, 3)
    : incomplete.filter((t) => t.priority >= 4).slice(0, 3);

  // Fallback: show first 3 incomplete tasks
  const shown = suggestions.length > 0 ? suggestions : incomplete.slice(0, 3);
  const energyInfo = energyLevel ? ENERGY_LABELS[energyLevel] : null;

  return (
    <div className="bg-indigo-900 rounded-2xl p-6 text-white relative overflow-hidden soft-shadow">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-700 rounded-full opacity-20" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">⚡</span>
          <h3 className="font-semibold">Smart Suggestions</h3>
        </div>
        {energyInfo ? (
          <p className="text-indigo-200 text-sm mb-4">
            Based on your{' '}
            <span className={`font-bold ${energyInfo.color}`}>{energyInfo.text}</span>
            {' '}level, tackle these:
          </p>
        ) : (
          <p className="text-indigo-200 text-sm mb-4">Set your energy level to get personalized suggestions.</p>
        )}

        {shown.length > 0 ? (
          <div className="space-y-2">
            {shown.map((task, i) => (
              <div
                key={task.id}
                className={`bg-indigo-800/50 p-3 rounded-xl border border-indigo-700 hover:bg-indigo-800 transition-colors cursor-pointer ${i === 2 ? 'opacity-60' : ''}`}
              >
                <p className="text-sm font-medium text-white truncate">{task.title}</p>
                <p className="text-[10px] text-indigo-400 mt-0.5 italic">
                  {task.category} · {task.duration_minutes ? `${task.duration_minutes}m` : 'No duration'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-indigo-300 text-sm text-center py-4">No tasks yet — add some below!</p>
        )}

        <button className="mt-4 w-full py-2 bg-indigo-400/20 border border-indigo-400/30 rounded-lg text-xs font-semibold hover:bg-indigo-400/40 transition-colors cursor-pointer">
          Refresh Suggestions
        </button>
      </div>
    </div>
  );
}
