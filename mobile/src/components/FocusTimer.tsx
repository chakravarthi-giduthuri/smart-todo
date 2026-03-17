import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  Animated,
  Easing,
  AppState,
  type AppStateStatus,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { apiFetch } from '@smart-todo/shared';
import type { Task } from '@smart-todo/shared';

interface Props {
  task: Task;
  onClose: () => void;
}

const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function FocusTimer({ task, onClose }: Props) {
  const plannedMinutes = task.duration_minutes ?? 25;
  const totalSeconds = plannedMinutes * 60;

  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);

  const progressAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const confirmStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep a ref to timeLeft so the AppState handler can read the current value
  // without being stale inside the closure.
  const timeLeftRef = useRef(totalSeconds);

  // Keep timeLeftRef in sync
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // ── Interval management ────────────────────────────────────────────────────
  function startInterval() {
    if (intervalRef.current) return; // already running
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopInterval();
          handleComplete(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function stopInterval() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  // Start/stop interval based on isRunning and isPaused
  useEffect(() => {
    if (isRunning && !isPaused) {
      startInterval();
    } else {
      stopInterval();
    }
    return stopInterval;
  }, [isRunning, isPaused]);

  // ── AppState: auto-pause when app goes to background ──────────────────────
  useEffect(() => {
    function handleAppStateChange(nextState: AppStateStatus) {
      if (nextState === 'background' || nextState === 'inactive') {
        // Auto-pause — only when the timer is actively running
        setIsPaused((prev) => {
          if (isRunning && !prev) {
            // Side-effect: clear the interval immediately inside the handler
            stopInterval();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            return true;
          }
          return prev;
        });
      }
      // On foreground: do NOT auto-resume — user must tap Resume deliberately
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isRunning]);

  // ── Progress ring animation ────────────────────────────────────────────────
  useEffect(() => {
    const progress = timeLeft / totalSeconds;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 800,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [timeLeft]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopInterval();
      if (confirmStopTimer.current) clearTimeout(confirmStopTimer.current);
    };
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleStart() {
    try {
      const res = await apiFetch<{ id: string }>('/api/focus-sessions/start', {
        method: 'POST',
        body: JSON.stringify({ task_id: task.id, planned_minutes: plannedMinutes }),
      });
      setSessionId(res.id);
    } catch {
      // Non-fatal — continue timer without a session id
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPaused(false);
    setIsRunning(true);
  }

  async function handleComplete(remaining: number) {
    setIsRunning(false);
    setIsPaused(false);
    setIsComplete(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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
    setIsPaused(false);
    const elapsed = Math.round((totalSeconds - timeLeftRef.current) / 60);
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

  function handlePauseResume() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPaused((prev) => !prev);
  }

  // ── Derived display values ─────────────────────────────────────────────────
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  // Timer has been started at least once (used to distinguish Start vs Resume)
  const hasStarted = sessionId !== null || isRunning || isPaused;
  // Timer circle dims when paused (and the session has started)
  const circleOpacity = hasStarted && isPaused ? 0.6 : 1;

  return (
    <View style={styles.overlay}>
      {/* Close */}
      <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
        <Ionicons name="close" size={22} color="rgba(255,255,255,0.5)" />
      </Pressable>

      {/* Label */}
      <Text style={styles.modeLabel}>
        {isComplete ? 'Session Complete!' : isPaused ? 'Paused' : 'Focus Mode'}
      </Text>

      {/* Task title */}
      <Text style={styles.taskTitle} numberOfLines={2}>
        {task.title}
      </Text>

      {/* Circular timer */}
      <View style={styles.timerContainer}>
        <Animated.View
          style={[styles.svgContainer, { opacity: circleOpacity }]}
        >
          {/* Track circle */}
          <View style={[styles.circle, styles.trackCircle]} />

          {/* Animated progress ring */}
          <Animated.View
            style={[
              styles.circle,
              styles.progressCircle,
              {
                borderColor: isComplete ? '#10b981' : '#ec5b13',
                opacity: progressAnim,
              },
            ]}
          />

          {/* Center content */}
          <View style={styles.centerContent}>
            {isComplete ? (
              <Text style={styles.doneText}>Done!</Text>
            ) : (
              <>
                <Text style={styles.timeText}>{pad(minutes)}:{pad(seconds)}</Text>
                <Text style={styles.elapsedText}>
                  {Math.round((totalSeconds - timeLeft) / 60)}m elapsed
                </Text>
              </>
            )}
          </View>
        </Animated.View>
      </View>

      {/* Controls */}
      {!isComplete ? (
        <View style={styles.controls}>
          {/* Stop button */}
          <Pressable
            onPress={handleStop}
            style={[styles.stopBtn, confirmStop && styles.stopBtnConfirm]}
          >
            <Ionicons
              name="stop"
              size={16}
              color={confirmStop ? '#fca5a5' : 'rgba(255,255,255,0.5)'}
            />
            <Text style={[styles.stopBtnText, confirmStop && styles.stopBtnTextConfirm]}>
              {confirmStop ? 'Confirm stop' : 'Stop'}
            </Text>
          </Pressable>

          {/* Pause / Resume / Start button */}
          <Pressable
            onPress={hasStarted ? handlePauseResume : handleStart}
            style={styles.playBtn}
          >
            <Ionicons
              name={isRunning && !isPaused ? 'pause-outline' : 'play-outline'}
              size={18}
              color="#fff"
            />
            <Text style={styles.playBtnText}>
              {!hasStarted ? 'Start' : isPaused ? 'Resume' : 'Pause'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={onClose} style={styles.doneBtn}>
          <Text style={styles.doneBtnText}>Close</Text>
        </Pressable>
      )}

      <Text style={styles.durationNote}>{plannedMinutes} minute session</Text>
    </View>
  );
}

export function FocusTimerModal({
  task,
  visible,
  onClose,
}: {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!task) return null;
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <FocusTimer task={task} onClose={onClose} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#050508',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  modeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#ec5b13',
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
    maxWidth: 280,
  },
  timerContainer: {
    marginBottom: 40,
  },
  svgContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
  },
  trackCircle: {
    borderColor: 'rgba(255,255,255,0.07)',
  },
  progressCircle: {
    borderColor: '#ec5b13',
  },
  centerContent: {
    alignItems: 'center',
  },
  timeText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  elapsedText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
  },
  doneText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10b981',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minHeight: 46,
  },
  stopBtnConfirm: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderColor: 'rgba(239,68,68,0.4)',
  },
  stopBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  stopBtnTextConfirm: {
    color: '#fca5a5',
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ec5b13',
    minHeight: 46,
  },
  playBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  doneBtn: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#10b981',
    marginBottom: 24,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  durationNote: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.2)',
  },
});
