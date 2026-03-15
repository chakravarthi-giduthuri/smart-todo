import { Brain } from 'lucide-react';
import { useAiPrefs } from '@/hooks/useAiPrefs';

export function AiPrefsViewer() {
  const { rules, isLoading } = useAiPrefs();
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400">
          <Brain size={16} />
        </div>
        <p className="text-sm font-bold text-white">AI Learned Preferences</p>
        {rules.length > 0 && <span className="ml-auto text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full font-semibold">{rules.length} rules</span>}
      </div>
      {isLoading
        ? <p className="text-sm text-white/30">Loading...</p>
        : rules.length === 0
          ? <p className="text-sm text-white/30 leading-relaxed">No patterns yet. Override AI decisions to train it — after 5 edits, Claude adapts.</p>
          : <ul className="space-y-2">
              {rules.map((rule, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-violet-400 font-bold shrink-0">{i + 1}.</span>
                  <span className="text-white/60 leading-relaxed">{rule}</span>
                </li>
              ))}
            </ul>
      }
    </div>
  );
}
