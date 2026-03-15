import { Check } from 'lucide-react';

interface Props { checked: boolean; onChange: () => void; }

export function CompletionToggle({ checked, onChange }: Props) {
  return (
    <button
      onClick={onChange}
      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 active:scale-90 cursor-pointer shrink-0 mt-0.5 ${
        checked
          ? 'bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/30'
          : 'border-white/20 hover:border-white/50 hover:bg-white/5'
      }`}
    >
      {checked && <Check size={14} strokeWidth={3} className="text-white" />}
    </button>
  );
}
