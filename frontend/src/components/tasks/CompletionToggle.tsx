import { Check } from 'lucide-react';

interface Props { checked: boolean; onChange: () => void; }

export function CompletionToggle({ checked, onChange }: Props) {
  return (
    <button
      onClick={onChange}
      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 active:scale-90 cursor-pointer shrink-0 ${
        checked
          ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/30'
          : 'border-white/20 hover:border-white/40'
      }`}
    >
      {checked && <Check size={12} strokeWidth={3} className="text-white" />}
    </button>
  );
}
