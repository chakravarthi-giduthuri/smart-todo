import { useState, useEffect } from 'react';
import { Settings, Sun, Moon, Globe, LogOut, Bell, Plug, Shield, User, Pencil, Check, X, Lock, Trash2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { NotificationToggle } from '../components/settings/NotificationToggle';
import { AiLearningJournal } from '../components/settings/AiLearningJournal';
import { ResetAiButton } from '../components/settings/ResetAiButton';
import { useThemeContext } from '../contexts/ThemeContext';
import { getLocalTimezone } from '../utils/dateFormat';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'profile' | 'notifications' | 'integrations' | 'security';

const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: 'profile',       label: 'Profile',       Icon: User   },
  { key: 'notifications', label: 'Notifications',  Icon: Bell   },
  { key: 'integrations',  label: 'Integrations',   Icon: Plug   },
  { key: 'security',      label: 'Security',       Icon: Shield },
];

export function SettingsScreen() {
  const { theme, toggleTheme } = useThemeContext();
  const { user, signOut, updateProfile, changePassword, deleteAccount } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [toast, setToast] = useState<{ msg: string; type?: 'success' | 'error' } | null>(null);

  // Profile editing
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.user_metadata?.full_name ?? '');
  const [nameSaving, setNameSaving] = useState(false);

  // Change password
  const [showPwForm, setShowPwForm] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'User';

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Sync name value when user changes
  useEffect(() => {
    setNameValue(user?.user_metadata?.full_name ?? '');
  }, [user?.user_metadata?.full_name]);

  async function handleSaveName() {
    const trimmed = nameValue.trim();
    if (!trimmed) return;
    setNameSaving(true);
    try {
      await updateProfile(trimmed);
      setEditingName(false);
      setToast({ msg: 'Name updated successfully', type: 'success' });
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : 'Failed to update name', type: 'error' });
    } finally {
      setNameSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!pwCurrent) {
      setToast({ msg: 'Enter your current password', type: 'error' });
      return;
    }
    if (!pwNew || pwNew.length < 6) {
      setToast({ msg: 'New password must be at least 6 characters', type: 'error' });
      return;
    }
    if (pwNew !== pwConfirm) {
      setToast({ msg: 'Passwords do not match', type: 'error' });
      return;
    }
    setPwSaving(true);
    try {
      await changePassword(pwCurrent, pwNew);
      setPwCurrent(''); setPwNew(''); setPwConfirm('');
      setShowPwForm(false);
      setToast({ msg: 'Password changed successfully', type: 'success' });
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : 'Failed to change password', type: 'error' });
    } finally {
      setPwSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      await deleteAccount();
      // signOut is called inside deleteAccount — user will be redirected by ProtectedRoute
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : 'Failed to delete account', type: 'error' });
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

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

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all ${
          toast.type === 'error'
            ? 'bg-rose-500 text-white'
            : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center">
                <AlertTriangle size={20} className="text-rose-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Delete Account</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              This will permanently delete your account and <strong>all your tasks, overrides, and data</strong>. You will not be able to recover this.
            </p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Type <span className="text-rose-500 font-mono">DELETE</span> to confirm:</p>
            <input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white font-mono mb-4 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 disabled:opacity-40 transition-colors cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto py-8 px-6 md:px-8 pb-32 md:pb-8">

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

        {/* ── Profile tab ── */}
        {activeTab === 'profile' && (
          <div className="space-y-8">

            {/* Personal Information */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Personal Information</h2>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">

                {/* Avatar row */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-5">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-black">
                    {firstName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                      {user?.user_metadata?.full_name ?? firstName}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
                  </div>
                </div>

                {/* Fields */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* Full Name — editable */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <div className="flex gap-2">
                      <input
                        value={nameValue}
                        onChange={(e) => { if (!editingName) setEditingName(true); setNameValue(e.target.value); }}
                        onClick={() => { if (!editingName) { setNameValue(user?.user_metadata?.full_name ?? ''); setEditingName(true); } }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                        className={`flex-1 border rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors ${
                          editingName
                            ? 'bg-white dark:bg-slate-800 border-primary/60'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-pointer'
                        }`}
                        placeholder={user?.user_metadata?.full_name ?? 'Click to add your full name'}
                      />
                      {!editingName ? (
                        <button
                          onClick={() => { if (!editingName) { setNameValue(user?.user_metadata?.full_name ?? ''); setEditingName(true); } }}
                          className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer shrink-0"
                          title="Edit name"
                        >
                          <Pencil size={14} />
                        </button>
                      ) : (
                        <div className="flex gap-1.5">
                          <button
                            onClick={handleSaveName}
                            disabled={nameSaving || !nameValue.trim()}
                            className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                            title="Save"
                          >
                            {nameSaving ? <span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Check size={14} />}
                          </button>
                          <button
                            onClick={() => setEditingName(false)}
                            className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email — read only */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <input
                      readOnly
                      defaultValue={user?.email ?? ''}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none opacity-70 cursor-not-allowed"
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

            {/* AI Learning */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">AI Learning</h2>
              <div className="space-y-3">
                <AiLearningJournal />
                <ResetAiButton />
              </div>
            </section>

            {/* Account actions */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Account</h2>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
                {/* Sign out */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg">
                      <LogOut size={18} className="text-rose-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">Sign Out</p>
                      <p className="text-xs text-slate-400 truncate max-w-[200px]">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={signOut}
                    className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-4 py-2 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors cursor-pointer"
                  >
                    Sign out
                  </button>
                </div>
                {/* Delete account */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg">
                      <Trash2 size={18} className="text-rose-600" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">Delete Account</p>
                      <p className="text-xs text-slate-400">Permanently delete your account and all data</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-500/10 px-4 py-2 rounded-lg hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </section>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-400">Smart To-Do — Version 1.0</p>
            </div>
          </div>
        )}

        {/* ── Notifications tab ── */}
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

        {/* ── Integrations tab ── */}
        {activeTab === 'integrations' && (
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">App Integrations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Google Calendar', desc: 'Sync tasks to your calendar', icon: '📅' },
                  { label: 'Slack',           desc: 'Send notifications to channels', icon: '💬' },
                  { label: 'Notion',          desc: 'Sync notes and tasks', icon: '📝' },
                  { label: 'GitHub',          desc: 'Link tasks to PRs and issues', icon: '🐙' },
                ].map(({ label, desc, icon }) => (
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
                      onClick={() => setToast({ msg: `${label} integration coming soon!` })}
                      className="text-xs font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ── Security tab ── */}
        {activeTab === 'security' && (
          <div className="space-y-8">

            {/* Change Password */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Security</h2>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm divide-y divide-slate-100 dark:divide-slate-800">

                {/* Change password row */}
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Lock size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">Change Password</p>
                        <p className="text-xs text-slate-400 mt-0.5">Update your account password</p>
                      </div>
                    </div>
                    {!showPwForm && (
                      <button
                        onClick={() => setShowPwForm(true)}
                        className="text-xs font-bold px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all cursor-pointer"
                      >
                        Update
                      </button>
                    )}
                  </div>

                  {/* Expanded form */}
                  {showPwForm && (
                    <div className="mt-5 space-y-3">
                      {/* Current password */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Password</label>
                        <div className="relative">
                          <input
                            type={showPw ? 'text' : 'password'}
                            value={pwCurrent}
                            onChange={(e) => setPwCurrent(e.target.value)}
                            placeholder="Enter current password"
                            autoFocus
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 pr-10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
                          />
                          <button type="button" onClick={() => setShowPw((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">
                            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      {/* New password */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Password</label>
                        <input
                          type={showPw ? 'text' : 'password'}
                          value={pwNew}
                          onChange={(e) => setPwNew(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>

                      {/* Confirm new password */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                        <input
                          type={showPw ? 'text' : 'password'}
                          value={pwConfirm}
                          onChange={(e) => setPwConfirm(e.target.value)}
                          placeholder="Repeat new password"
                          onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                          className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                            pwConfirm && pwNew !== pwConfirm
                              ? 'border-rose-400 focus:ring-rose-400/40'
                              : 'border-slate-200 dark:border-slate-700 focus:ring-primary/40'
                          }`}
                        />
                        {pwConfirm && pwNew !== pwConfirm && (
                          <p className="text-xs text-rose-500">Passwords do not match</p>
                        )}
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => { setShowPwForm(false); setPwCurrent(''); setPwNew(''); setPwConfirm(''); }}
                          className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleChangePassword}
                          disabled={pwSaving || !pwCurrent || !pwNew || !pwConfirm || pwNew !== pwConfirm}
                          className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-40 transition-all cursor-pointer"
                        >
                          {pwSaving ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2FA row */}
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <Shield size={16} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">Two-Factor Authentication</p>
                      <p className="text-xs text-slate-400 mt-0.5">Add an extra layer of security</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setToast({ msg: 'Two-factor authentication coming soon!' })}
                    className="text-xs font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Enable
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
