import { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Square } from 'lucide-react';
import type { Task } from '../../types/task';
import { apiFetch } from '../../api/client';

interface Props {
  task: Task;
  onClose: () => void;
}

const CIRCUMFERENCE = 2 * Math.PI * 90; // radius = 90

export function FocusTimer({ task, onClose }: Props) {
  const plannedMinutes = task.duration_minutes ?? 25;
  const totalSeconds = plannedMinutes * 60;

  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);
  const [flash, setFlash] = useState(false);
  const confirmStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Countdown interval
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleComplete(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  // Clean up confirm-stop auto-dismiss timer
  useEffect(() => {
    return () => {
      if (confirmStopTimer.current) clearTimeout(confirmStopTimer.current);
    };
  }, []);

  async function handleStart() {
    try {
      const res = await apiFetch<{ id: string }>('/api/focus-sessions/start', {
        method: 'POST',
        body: JSON.stringify({ task_id: task.id, planned_minutes: plannedMinutes }),
      });
      setSessionId(res.id);
    } catch {
      // Non-fatal — proceed with timer even if API fails
    }
    setIsRunning(true);
  }

  async function handleComplete(remaining: number) {
    setIsRunning(false);
    setIsComplete(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 800);

    if (sessionId) {
      const elapsed = Math.round((totalSeconds - remaining) / 60);
      try {
        await apiFetch(`/api/focus-sessions/${sessionId}/end`, {
          method: 'PATCH',
          body: JSON.stringify({ actual_minutes: elapsed, completed: remaining === 0 }),
        });
      } catch {
        // Non-fatal
      }
    }
  }

  async function handleStop() {
    if (!confirmStop) {
      setConfirmStop(true);
      confirmStopTimer.current = setTimeout(() => setConfirmStop(false), 3000);
      return;
    }
    setIsRunning(false);
    const elapsed = Math.round((totalSeconds - timeLeft) / 60);
    if (sessionId) {
      try {
        await apiFetch(`/api/focus-sessions/${sessionId}/end`, {
          method: 'PATCH',
          body: JSON.stringify({ actual_minutes: elapsed, completed: false }),
        });
      } catch {
        // Non-fatal
      }
    }
    onClose();
  }

  function handlePause() {
    setIsRunning((v) => !v);
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const progress = timeLeft / totalSeconds;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 transition-all ${flash ? 'bg-[#ec5b13]/20' : ''}`}
      style={{ backdropFilter: 'blur(8px)' }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        aria-label="Close focus timer"
      >
        <X size={18} />
      </button>

      {/* Label */}
      <p className="text-xs font-bold uppercase tracking-widest text-[#ec5b13] mb-4">
        {isComplete ? 'Session Complete!' : 'Focus Mode'}
      </p>

      {/* Task title */}
      <h2 className="text-lg font-bold text-white text-center px-8 mb-8 leading-snug max-w-xs">
        {task.title}
      </h2>

      {/* SVG circular timer */}
      <div className="relative mb-8">
        <svg width="220" height="220" viewBox="0 0 220 220">
          {/* Track */}
          <circle
            cx="110"
            cy="110"
            r="90"
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="8"
          />
          {/* Progress arc */}
          <circle
            cx="110"
            cy="110"
            r="90"
            fill="none"
            stroke={isComplete ? '#10b981' : '#ec5b13'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={isComplete ? 0 : dashOffset}
            transform="rotate(-90 110 110)"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease' }}
          />
        </svg>

        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isComplete ? (
            <span className="text-3xl font-bold text-emerald-400">Done!</span>
          ) : (
            <>
              <span className="text-4xl font-bold tabular-nums text-white">
                {pad(minutes)}:{pad(seconds)}
              </span>
              <span className="text-xs text-white/30 mt-1">
                {Math.round((totalSeconds - timeLeft) / 60)}m elapsed
              </span>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      {!isComplete ? (
        <div className="flex items-center gap-4">
          {/* Stop */}
          <button
            onClick={handleStop}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              confirmStop
                ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                : 'bg-white/8 text-white/50 hover:bg-white/15 hover:text-white/80 border border-white/10'
            }`}
          >
            <Square size={14} />
            {confirmStop ? 'Confirm stop' : 'Stop'}
          </button>

          {/* Play / Pause */}
          <button
            onClick={isRunning ? handlePause : (sessionId ? handlePause : handleStart)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all cursor-pointer active:scale-95"
            style={{ background: '#ec5b13', boxShadow: '0 4px 20px rgba(236,91,19,0.35)' }}
          >
            {isRunning ? <><Pause size={14} /> Pause</> : <><Play size={14} /> {sessionId ? 'Resume' : 'Start'}</>}
          </button>
        </div>
      ) : (
        <button
          onClick={onClose}
          className="px-8 py-3 rounded-xl font-bold text-sm text-white bg-emerald-500 hover:bg-emerald-400 transition-all cursor-pointer active:scale-95"
        >
          Close
        </button>
      )}

      {/* Duration info */}
      <p className="mt-6 text-xs text-white/20">
        {plannedMinutes} minute session
      </p>
    </div>
  );
}
