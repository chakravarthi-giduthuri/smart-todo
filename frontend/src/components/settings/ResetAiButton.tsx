import { Trash2 } from 'lucide-react';
import { useAiPrefs } from '@/hooks/useAiPrefs';

export function ResetAiButton() {
  const { reset } = useAiPrefs();
  function handleReset() {
    if (confirm('Reset all AI learned preferences? This cannot be undone.')) reset(undefined);
  }
  return (
    <button onClick={handleReset}
      className="w-full glass border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform cursor-pointer hover:border-rose-500/40">
      <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
        <Trash2 size={16} />
      </div>
      <div className="text-left">
        <p className="text-sm font-semibold text-rose-400">Reset AI Preferences</p>
        <p className="text-xs text-white/25 mt-0.5">Clears all override history and learned patterns</p>
      </div>
    </button>
  );
}
