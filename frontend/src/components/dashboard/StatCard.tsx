import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: string;
  subtext?: string;
}

export function StatCard({ label, value, icon, accent = 'text-indigo-400', subtext }: Props) {
  return (
    <div className="glass rounded-2xl p-4 transition-all duration-200 hover:bg-white/[0.06] animate-scale-in">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 ${accent}`}>
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-extrabold tracking-tight ${accent}`}>{value}</p>
      <p className="text-xs font-medium text-white/40 mt-0.5">{label}</p>
      {subtext && <p className="text-[10px] text-white/25 mt-0.5">{subtext}</p>}
    </div>
  );
}
