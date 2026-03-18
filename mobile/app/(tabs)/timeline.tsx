import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTasks, useCreateTask } from '@smart-todo/shared';
import type { Task } from '@smart-todo/shared';
import { useTheme } from '../../src/contexts/ThemeContext';
import { TaskEditSheet } from '../../src/components/TaskEditSheet';
import { TimelineTaskBlock } from '../../src/components/TimelineTaskBlock';

const START_HOUR = 6;
const END_HOUR = 23;
const HOUR_HEIGHT = 60;
const TIME_LABEL_WIDTH = 52;

const HOURS = Array.from(
  { length: END_HOUR - START_HOUR + 1 },
  (_, i) => START_HOUR + i
);

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayStr(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function friendlyDate(dateStr: string): string {
  const today = todayStr();
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  if (dateStr === yesterday) return 'Yesterday';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function padTime(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

interface QuickCreateModalProps {
  visible: boolean;
  prefilledHour: number | null;
  selectedDate: string;
  onClose: () => void;
  isDark: boolean;
}

function QuickCreateModal({
  visible,
  prefilledHour,
  selectedDate,
  onClose,
  isDark,
}: QuickCreateModalProps) {
  const [title, setTitle] = useState('');
  const create = useCreateTask();

  const bg = isDark ? '#1c1c28' : '#ffffff';
  const border = isDark ? '#27272a' : '#e5e7eb';
  const textColor = isDark ? '#f4f4f5' : '#18181b';
  const subText = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const inputBg = isDark ? '#1a1a2e' : '#f8f8f8';

  function handleCreate() {
    const trimmed = title.trim();
    if (!trimmed) return;
    const scheduledTime = prefilledHour != null ? padTime(prefilledHour) : undefined;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const off = -now.getTimezoneOffset();
    const tz = `${off >= 0 ? '+' : '-'}${pad(Math.floor(Math.abs(off) / 60))}:${pad(
      Math.abs(off) % 60
    )}`;
    create.mutate(
      {
        raw_input: trimmed,
        current_date: `${local}${tz}`,
        ...(scheduledTime ? {} : {}),
      },
      {
        onSuccess: () => {
          setTitle('');
          onClose();
        },
      }
    );
  }

  function handleClose() {
    setTitle('');
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.modalBackdrop} onPress={handleClose} />
        <View style={[styles.quickCreateSheet, { backgroundColor: bg, borderColor: border }]}>
          <Text style={[styles.quickCreateTitle, { color: textColor }]}>
            New task{prefilledHour != null ? ` at ${formatHourLabel(prefilledHour)}` : ''}
          </Text>
          <TextInput
            style={[
              styles.quickCreateInput,
              { backgroundColor: inputBg, color: textColor, borderColor: border },
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="What do you need to do?"
            placeholderTextColor={subText}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCreate}
          />
          <View style={styles.quickCreateActions}>
            <Pressable
              onPress={handleClose}
              style={[styles.quickCancelBtn, { borderColor: border }]}
            >
              <Text style={[styles.quickCancelText, { color: subText }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleCreate}
              disabled={create.isPending || !title.trim()}
              style={[
                styles.quickConfirmBtn,
                (!title.trim() || create.isPending) && styles.quickConfirmDisabled,
              ]}
            >
              {create.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.quickConfirmText}>Add Task</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function TimelineScreen() {
  const { isDark } = useTheme();
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [quickCreateHour, setQuickCreateHour] = useState<number | null>(null);
  const [quickCreateVisible, setQuickCreateVisible] = useState(false);
  const [unscheduledExpanded, setUnscheduledExpanded] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  const { data: allTasks = [] } = useTasks();

  const bg = isDark ? '#080810' : '#f8f8f8';
  const cardBg = isDark ? '#1c1c28' : '#ffffff';
  const textColor = isDark ? '#f4f4f5' : '#18181b';
  const subText = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const borderColor = isDark ? '#27272a' : '#e5e7eb';
  const gridLine = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const isToday = selectedDate === todayStr();

  const dayTasks = allTasks.filter(
    (t) => !t.is_completed && !t.is_archived && t.scheduled_date === selectedDate
  );
  const scheduledTasks = dayTasks.filter((t) => t.scheduled_time != null);
  const unscheduledTasks = dayTasks.filter((t) => t.scheduled_time == null);

  // Current time indicator position from top of 6 AM
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const nowTop = (nowMins - START_HOUR * 60) * (HOUR_HEIGHT / 60);
  const nowIsVisible = nowMins >= START_HOUR * 60 && nowMins <= END_HOUR * 60;

  // Auto-scroll to current time when viewing today
  useEffect(() => {
    if (!isToday || !nowIsVisible) return;
    const scrollTarget = Math.max(0, nowTop - 120);
    // Slight delay to let layout complete
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: scrollTarget, animated: true });
    }, 300);
    return () => clearTimeout(t);
  }, [selectedDate]);

  function handleHourPress(hour: number) {
    setQuickCreateHour(hour);
    setQuickCreateVisible(true);
  }

  const totalHeight = (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <View style={styles.headerLeft}>
          <Ionicons name="time-outline" size={20} color="#ec5b13" />
          <Text style={[styles.headerTitle, { color: textColor }]}>Timeline</Text>
        </View>
        <View style={styles.dateNav}>
          <Pressable
            onPress={() => setSelectedDate((d) => addDays(d, -1))}
            style={styles.navBtn}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={18} color={subText} />
          </Pressable>
          <Pressable
            onPress={() => setSelectedDate(todayStr())}
            style={styles.datePill}
          >
            <Text style={[styles.datePillText, { color: textColor }]}>
              {friendlyDate(selectedDate)}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedDate((d) => addDays(d, 1))}
            style={styles.navBtn}
            hitSlop={8}
          >
            <Ionicons name="chevron-forward" size={18} color={subText} />
          </Pressable>
        </View>
      </View>

      {/* Scrollable timeline */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollArea}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hour rows */}
        <View style={{ height: totalHeight, position: 'relative' }}>
          {HOURS.map((hour) => {
            const top = (hour - START_HOUR) * HOUR_HEIGHT;
            return (
              <Pressable
                key={hour}
                onPress={() => handleHourPress(hour)}
                style={[styles.hourRow, { top, borderBottomColor: gridLine }]}
              >
                <Text style={[styles.hourLabel, { color: subText }]}>
                  {formatHourLabel(hour)}
                </Text>
                <View style={[styles.hourTrack, { borderBottomColor: gridLine }]} />
              </Pressable>
            );
          })}

          {/* Current time red line */}
          {isToday && nowIsVisible && (
            <View
              style={[styles.nowLine, { top: nowTop }]}
              pointerEvents="none"
            >
              <View style={styles.nowDot} />
              <View style={styles.nowLineBar} />
            </View>
          )}

          {/* Scheduled task blocks */}
          {scheduledTasks.map((task) => {
            const [h] = (task.scheduled_time ?? '00:00').split(':').map(Number);
            if (h < START_HOUR || h > END_HOUR) return null;
            return (
              <TimelineTaskBlock
                key={task.id}
                task={task}
                hourHeight={HOUR_HEIGHT}
                startHour={START_HOUR}
                onPress={() => setEditTask(task)}
              />
            );
          })}
        </View>

        {/* Unscheduled section */}
        <Pressable
          onPress={() => setUnscheduledExpanded((v) => !v)}
          style={[styles.unscheduledHeader, { borderTopColor: borderColor, backgroundColor: cardBg }]}
        >
          <View style={styles.unscheduledHeaderLeft}>
            <Ionicons
              name={unscheduledExpanded ? 'chevron-down' : 'chevron-forward'}
              size={14}
              color={subText}
            />
            <Text style={[styles.unscheduledLabel, { color: subText }]}>
              Unscheduled ({unscheduledTasks.length})
            </Text>
          </View>
        </Pressable>

        {unscheduledExpanded && unscheduledTasks.length > 0 && (
          <View style={[styles.unscheduledList, { backgroundColor: cardBg }]}>
            {unscheduledTasks.map((task) => (
              <Pressable
                key={task.id}
                onPress={() => setEditTask(task)}
                style={[styles.unscheduledItem, { borderBottomColor: borderColor }]}
              >
                <View
                  style={[
                    styles.unscheduledDot,
                    {
                      backgroundColor:
                        {
                          Work: '#3B82F6',
                          Study: '#8B5CF6',
                          Personal: '#10B981',
                          Health: '#F59E0B',
                          Errand: '#EC4899',
                        }[task.category] ?? '#6b7280',
                    },
                  ]}
                />
                <Text style={[styles.unscheduledTitle, { color: textColor }]} numberOfLines={1}>
                  {task.title}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={subText} />
              </Pressable>
            ))}
          </View>
        )}

        {unscheduledExpanded && unscheduledTasks.length === 0 && (
          <View style={[styles.unscheduledEmpty, { backgroundColor: cardBg }]}>
            <Text style={[styles.unscheduledEmptyText, { color: subText }]}>
              All tasks for this day are scheduled.
            </Text>
          </View>
        )}

        {/* Empty state when no tasks at all */}
        {dayTasks.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={40} color={subText} />
            <Text style={[styles.emptyTitle, { color: subText }]}>No tasks for this day</Text>
            <Text style={[styles.emptySubtitle, { color: subText }]}>
              Tap any time slot to create a task
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Quick create modal */}
      <QuickCreateModal
        visible={quickCreateVisible}
        prefilledHour={quickCreateHour}
        selectedDate={selectedDate}
        onClose={() => setQuickCreateVisible(false)}
        isDark={isDark}
      />

      {/* Task edit sheet */}
      <TaskEditSheet task={editTask} onClose={() => setEditTask(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  datePillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
  },
  hourRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: HOUR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hourLabel: {
    width: TIME_LABEL_WIDTH,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'right',
    paddingRight: 8,
    paddingTop: 2,
  },
  hourTrack: {
    flex: 1,
    height: HOUR_HEIGHT,
  },
  nowLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  nowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginLeft: TIME_LABEL_WIDTH - 4,
  },
  nowLineBar: {
    flex: 1,
    height: 2,
    backgroundColor: '#ef4444',
  },
  unscheduledHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    marginTop: 8,
  },
  unscheduledHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unscheduledLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  unscheduledList: {
    paddingHorizontal: 16,
  },
  unscheduledItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
    minHeight: 44,
  },
  unscheduledDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  unscheduledTitle: {
    flex: 1,
    fontSize: 14,
  },
  unscheduledEmpty: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  unscheduledEmptyText: {
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  // Quick create modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  quickCreateSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  quickCreateTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  quickCreateInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 14,
    minHeight: 44,
  },
  quickCreateActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  quickCancelText: {
    fontSize: 15,
    fontWeight: '500',
  },
  quickConfirmBtn: {
    flex: 2,
    backgroundColor: '#ec5b13',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  quickConfirmDisabled: {
    opacity: 0.5,
  },
  quickConfirmText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
