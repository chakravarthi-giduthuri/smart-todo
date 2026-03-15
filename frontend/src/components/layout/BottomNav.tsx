import { NavLink } from 'react-router-dom';
import { MessageCircle, CalendarDays, BarChart2, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',          label: 'Home',     Icon: MessageCircle },
  { to: '/calendar',  label: 'Calendar', Icon: CalendarDays  },
  { to: '/dashboard', label: 'Stats',    Icon: BarChart2     },
  { to: '/settings',  label: 'Settings', Icon: Settings      },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong pb-safe">
      <div className="flex">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-3 gap-1 transition-all duration-200 cursor-pointer min-h-[56px] ${
                isActive ? 'text-indigo-400' : 'text-gray-600 hover:text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`relative transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400" />
                  )}
                </div>
                <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-indigo-400' : ''}`}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
