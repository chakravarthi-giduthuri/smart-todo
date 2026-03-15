import { useState, useEffect } from 'react';
import { Settings, Sun, Moon, Globe, LogOut, Bell, Plug, Shield } from 'lucide-react';
import { NotificationToggle } from '../components/settings/NotificationToggle';
import { AiLearningJournal } from '../components/settings/AiLearningJournal';
import { ResetAiButton } from '../components/settings/ResetAiButton';
import { useThemeContext } from '../contexts/ThemeContext';
import { getLocalTimezone } from '../utils/dateFormat';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'profile' | 'notifications' | 'integrations' | 'security';

const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: 'profile',       label: 'Profile',       Icon: Settings },
  { key: 'notifications', label: 'Notifications',  Icon: Bell     },
  { key: 'integrations',  label: 'Integrations',   Icon: Plug     },
  { key: 'security',      label: 'Security',       Icon: Shield   },
];

export function SettingsScreen() {
  const { theme, toggleTheme } = useThemeContext();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [toast, setToast] = useState<string | null>(null);
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'User';

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--app-bg)' }}>

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
          <Settings size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-900 dark:text-white leading-none">Settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage your account and preferences</p>
        </div>
      </header>

      {toast && (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all">
          {toast}
        </div>
      )}

      <div className="max-w-4xl mx-auto py-8 px-8">

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800 mb-8">
          <div className="flex gap-6 overflow-x-auto">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`pb-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  activeTab === key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Profile tab */}
        {activeTab === 'profile' && (
          <div className="space-y-8">
            {/* Account info */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Personal Information</h2>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-5">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-black">
                    {firstName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{firstName}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <input
                      readOnly
                      defaultValue={user?.user_metadata?.full_name ?? ''}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <input
                      readOnly
                      defaultValue={user?.email ?? ''}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Appearance */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Appearance</h2>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                      {theme === 'dark' ? <Moon size={18} className="text-blue-500" /> : <Sun size={18} className="text-blue-500" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">Theme</p>
                      <p className="text-xs text-slate-400">{theme === 'dark' ? 'Dark mode active' : 'Light mode active'}</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="w-11 h-6 rounded-full relative transition-all duration-300 cursor-pointer focus:outline-none"
                    style={{ background: theme === 'dark' ? '#0d6cf2' : '#e2e8f0' }}
                  >
                    <span
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300"
                      style={{ left: theme === 'dark' ? '22px' : '2px' }}
                    />
                  </button>
                </div>
                <div className="p-4 flex items-center gap-4">
                  <div className="p-2 bg-cyan-50 dark:bg-cyan-500/10 rounded-lg">
                    <Globe size={18} className="text-cyan-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-slate-900 dark:text-white">Timezone</p>
                    <p className="text-xs text-slate-400 truncate">{getLocalTimezone()}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">Auto</span>
                </div>
              </div>
            </section>

            {/* AI settings */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">AI Learning</h2>
              <div className="space-y-3">
                <AiLearningJournal />
                <ResetAiButton />
              </div>
            </section>

            {/* Sign out */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Account</h2>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg">
                    <LogOut size={18} className="text-rose-500" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">Sign Out</p>
                    <p className="text-xs text-slate-400 truncate max-w-[180px]">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-4 py-2 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            </section>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <p className="text-xs text-slate-400">Smart To-Do — Version 1.0</p>
            </div>
          </div>
        )}

        {/* Notifications tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Notifications</h2>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                <NotificationToggle />
              </div>
            </section>
          </div>
        )}

        {/* Integrations tab */}
        {activeTab === 'integrations' && (
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">App Integrations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Google Calendar', desc: 'Sync tasks to your calendar', icon: '📅', connected: false },
                  { label: 'Slack',           desc: 'Send notifications to channels', icon: '💬', connected: false },
                  { label: 'Notion',          desc: 'Sync notes and tasks', icon: '📝', connected: false },
                  { label: 'GitHub',          desc: 'Link tasks to PRs and issues', icon: '🐙', connected: false },
                ].map(({ label, desc, icon, connected }) => (
                  <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex justify-between items-center hover:border-primary/40 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-2xl border border-slate-100 dark:border-slate-700">
                        {icon}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{label}</p>
                        <p className="text-xs text-slate-400">{desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setToast(`${label} integration coming soon!`)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        connected
                          ? 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {connected ? 'Connected' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Security tab */}
        {activeTab === 'security' && (
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Security</h2>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">Two-Factor Authentication</p>
                    <p className="text-xs text-slate-400 mt-0.5">Add an extra layer of security</p>
                  </div>
                  <button
                    onClick={() => setToast('Two-factor authentication coming soon!')}
                    className="text-xs font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Enable
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">Change Password</p>
                    <p className="text-xs text-slate-400 mt-0.5">Update your account password</p>
                  </div>
                  <button
                    onClick={() => setToast('Password change coming soon!')}
                    className="text-xs font-bold px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all cursor-pointer"
                  >
                    Update
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

      </div>
    </div>
  );
}
