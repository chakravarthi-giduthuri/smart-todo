import { useState } from 'react';
import { Bell, BellOff, Send } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { testPush } from '@/api/push';

export function NotificationToggle() {
  const { permission, registered, register, unregister } = useNotifications();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'ok' | 'error' | null>(null);

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      await testPush();
      setTestResult('ok');
    } catch {
      setTestResult('error');
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(null), 4000);
    }
  }

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${permission === 'granted' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-white/40'}`}>
          {permission === 'granted' ? <Bell size={18} /> : <BellOff size={18} />}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">Push Notifications</p>
          <p className="text-xs text-white/30 mt-0.5">Custom reminder time per task · Safari iOS 16.4+</p>
        </div>
        {permission === 'granted' && registered
          ? <button onClick={unregister} className="text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-rose-500/15 hover:text-rose-400 px-3 py-1.5 rounded-xl cursor-pointer active:scale-95 transition-all duration-200">Active</button>
          : <button onClick={register} className="text-xs font-bold text-white bg-indigo-500 px-3 py-1.5 rounded-xl cursor-pointer active:scale-95 transition-transform">Enable</button>
        }
      </div>

      {permission === 'granted' && (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-40 active:scale-95"
          >
            <Send size={11} />
            {testing ? 'Sending…' : 'Send test notification'}
          </button>
          {testResult === 'ok' && <span className="text-xs text-emerald-400">Delivered!</span>}
          {testResult === 'error' && <span className="text-xs text-rose-400">Failed — check Railway logs</span>}
        </div>
      )}

      {permission === 'denied' && (
        <p className="text-xs text-amber-400/70 mt-3">Blocked — enable in browser Settings › Notifications</p>
      )}
    </div>
  );
}
