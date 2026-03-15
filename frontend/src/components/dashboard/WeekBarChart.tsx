interface Bar { date: string; total: number; completed: number; }
interface Props { data: Bar[]; }

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export function WeekBarChart({ data }: Props) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="rounded-2xl p-5 animate-scale-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-5">7-Day Activity</p>
      <div className="flex items-end gap-2 h-24">
        {data.map((bar, i) => {
          const isToday = bar.date === today;
          const totalH  = Math.max((bar.total     / maxTotal) * 100, 4);
          const compH   = Math.max((bar.completed / maxTotal) * 100, 0);
          const dayName = DAYS[new Date(bar.date + 'T12:00:00').getDay()];

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="relative w-full flex items-end" style={{ height: '72px' }}>
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-500"
                  style={{ height: `${totalH}%`, background: isToday ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.05)' }}
                />
                {bar.completed > 0 && (
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-700"
                    style={{
                      height: `${compH}%`,
                      background: isToday ? 'linear-gradient(180deg, #f97316, #fb923c)' : 'rgba(255,255,255,0.18)',
                      boxShadow: isToday ? '0 0 12px rgba(249,115,22,0.4)' : 'none',
                    }}
                  />
                )}
              </div>
              <span className={`text-[10px] font-bold ${isToday ? 'text-orange-400' : 'text-white/25'}`}>{dayName}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }} />
          <span className="text-[10px] text-white/40 font-medium">Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-white/10" />
          <span className="text-[10px] text-white/40 font-medium">Total</span>
        </div>
      </div>
    </div>
  );
}
