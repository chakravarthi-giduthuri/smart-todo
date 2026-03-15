import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, BarChart2, Settings, CheckCircle2, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const NAV = [
  { to: '/',          label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/calendar',  label: 'Planner',   Icon: CalendarDays   },
  { to: '/dashboard', label: 'Analytics', Icon: BarChart2       },
  { to: '/settings',  label: 'Settings',  Icon: Settings        },
];

export function SideNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'You';

  return (
    <aside
      className="fixed left-0 bottom-0 w-64 hidden md:flex flex-col z-50"
      style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)', top: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <CheckCircle2 size={20} />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight text-slate-900 dark:text-white">Smart To-Do</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Pro Productivity</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-1">
        {NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-150 text-sm ${
                isActive
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <button
          onClick={() => navigate('/')}
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-primary/20 cursor-pointer"
        >
          <Plus size={16} />
          <span>New Task</span>
        </button>

        {/* User */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{firstName}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
