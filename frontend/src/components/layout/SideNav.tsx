import { NavLink } from 'react-router-dom';
import { Home, CalendarDays, BarChart2, Settings, Zap } from 'lucide-react';

const NAV = [
  { to: '/',          label: 'Home',     Icon: Home         },
  { to: '/calendar',  label: 'Calendar', Icon: CalendarDays },
  { to: '/dashboard', label: 'Stats',    Icon: BarChart2    },
  { to: '/settings',  label: 'Settings', Icon: Settings     },
];

export function SideNav() {
  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-64 flex flex-col z-50"
      style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
    >
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900/40">
            <Zap size={20} className="text-white" fill="white" />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">Smart To-Do</h1>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 mt-2 space-y-1">
        {NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-150 text-sm ${
                isActive
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white/80'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Upgrade CTA */}
      <div className="p-4" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <div className="bg-gray-900 dark:bg-black/40 rounded-2xl p-4 text-white">
          <p className="text-xs text-gray-400 font-medium">Upgrade to Pro</p>
          <p className="text-sm mt-1 text-gray-200">Unlock AI suggestions and analytics.</p>
          <button className="mt-3 w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer">
            Upgrade Now
          </button>
        </div>
      </div>
    </aside>
  );
}
