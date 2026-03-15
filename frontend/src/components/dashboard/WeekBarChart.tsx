interface Bar { date: string; total: number; completed: number; }
interface Props { data: Bar[]; }

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export function WeekBarChart({ data }: Props) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const today = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; })();

  return (
    <div className="glass rounded-2xl p-5 animate-scale-in">
      <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-5">7-Day Activity</p>
      <div className="flex items-end gap-2 h-20">
        {data.map((bar, i) => {
          const isToday = bar.date === today;
          const totalH  = Math.max((bar.total     / maxTotal) * 100, 4);
          const compH   = Math.max((bar.completed / maxTotal) * 100, 0);
          const dayName = DAYS[new Date(bar.date + 'T12:00:00').getDay()];

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="relative w-full flex items-end" style={{ height: '64px' }}>
                {/* Total bar */}
                <div
                  className={`absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-500 ${isToday ? 'bg-indigo-500/20' : 'bg-white/5'}`}
                  style={{ height: `${totalH}%` }}
                />
                {/* Completed bar */}
                {bar.completed > 0 && (
                  <div
                    className={`absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-500 ${isToday ? 'bg-indigo-500' : 'bg-white/20'}`}
                    style={{ height: `${compH}%`, boxShadow: isToday ? '0 0 12px rgba(99,102,241,0.5)' : 'none' }}
                  />
                )}
              </div>
              <span className={`text-[10px] font-semibold ${isToday ? 'text-indigo-400' : 'text-white/25'}`}>{dayName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
