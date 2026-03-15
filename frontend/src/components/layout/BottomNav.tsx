import { NavLink } from 'react-router-dom';
import { CheckSquare, CalendarDays, BarChart2, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',          label: 'Tasks',    Icon: CheckSquare  },
  { to: '/calendar',  label: 'Calendar', Icon: CalendarDays },
  { to: '/dashboard', label: 'Stats',    Icon: BarChart2    },
  { to: '/settings',  label: 'Settings', Icon: Settings     },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 pb-safe bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 pt-2">
      <div className="flex justify-around items-center">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors ${
                isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={`text-[10px] font-bold uppercase tracking-tighter`}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
