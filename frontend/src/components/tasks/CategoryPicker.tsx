import type { Category } from '../../types/task';
import { CATEGORY_LIST, CATEGORY_COLORS } from '../../constants/categories';

interface Props { value: Category; onChange: (c: Category) => void; }

export function CategoryPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 py-1">
      {CATEGORY_LIST.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          style={value === cat ? { backgroundColor: CATEGORY_COLORS[cat], boxShadow: `0 4px 15px ${CATEGORY_COLORS[cat]}40` } : { borderColor: `${CATEGORY_COLORS[cat]}40`, color: CATEGORY_COLORS[cat] }}
          className={`px-4 h-11 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 cursor-pointer border ${
            value === cat ? 'text-white' : 'bg-transparent'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
