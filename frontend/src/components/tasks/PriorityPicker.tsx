import type { Priority } from '../../types/task';

const LABELS: Record<Priority, string> = { 1:'Critical', 2:'High', 3:'Medium', 4:'Low', 5:'Minimal' };
const COLORS: Record<Priority, string> = {
  1: 'bg-red-500/20 border-red-500/50 text-red-300',
  2: 'bg-orange-500/20 border-orange-500/50 text-orange-300',
  3: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300',
  4: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
  5: 'bg-gray-500/20 border-gray-500/50 text-gray-400',
};
const ACTIVE: Record<Priority, string> = {
  1:'bg-red-500 text-white border-red-500',
  2:'bg-orange-500 text-white border-orange-500',
  3:'bg-yellow-500 text-white border-yellow-500',
  4:'bg-blue-500 text-white border-blue-500',
  5:'bg-gray-500 text-white border-gray-500',
};

interface Props { value: Priority; onChange: (p: Priority) => void; }

export function PriorityPicker({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 py-1">
      {([1,2,3,4,5] as Priority[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`flex-1 h-12 rounded-xl text-xs font-semibold border transition-all duration-200 active:scale-95 cursor-pointer ${
            value === p ? ACTIVE[p] : COLORS[p]
          }`}
        >
          <span className="block">{p}</span>
          <span className="block text-[9px] opacity-75 mt-0.5">{LABELS[p]}</span>
        </button>
      ))}
    </div>
  );
}
