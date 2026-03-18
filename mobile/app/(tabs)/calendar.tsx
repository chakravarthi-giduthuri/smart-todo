import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useTasks, useCreateTask } from '@smart-todo/shared';
import type { Task } from '@smart-todo/shared';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useTabVisibility } from '../../src/contexts/TabVisibilityContext';
import { CONTENT_BOTTOM } from '../../src/constants/layout';
import { TaskEditSheet } from '../../src/components/TaskEditSheet';
import { TimelineTaskBlock } from '../../src/components/TimelineTaskBlock';

// ─── Timeline constants ────────────────────────────────────────────────────────

const START_HOUR = 6;
const END_HOUR = 23;
const HOUR_HEIGHT = 60;
const TIME_LABEL_WIDTH = 52;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Work: '#3B82F6',
  Study: '#8B5CF6',
  Personal: '#10B981',
  Health: '#F59E0B',
  Errand: '#EC4899',
};

function pad(n: number) { return String(n).padStart(2, '0'); }

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatHourLabel(hour: number) {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

function friendlyDate(dateStr: string) {
  const today = todayStr();
  if (dateStr === today) return 'Today';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ─── FadeInView ───────────────────────────────────────────────────────────────

function FadeInView({ children }: { children: React.ReactNode }) {
  const opacity = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  useEffect(() => { opacity.value = withTiming(1, { duration: 300 }); }, []);
  return (
    <ReAnimated.View style={[{ flex: 1 }, animStyle]}>
      {children}
    </ReAnimated.View>
  );
}

// ─── Quick Create Modal ───────────────────────────────────────────────────────

function QuickCreateModal({
  visible,
  prefilledHour,
  selectedDate,
  onClose,
  isDark,
}: {
  visible: boolean;
  prefilledHour: number | null;
  selectedDate: string;
  onClose: () => void;
  isDark: boolean;
}) {
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
    const now = new Date();
    const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const off = -now.getTimezoneOffset();
    const tz = `${off >= 0 ? '+' : '-'}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`;
    create.mutate(
      { raw_input: trimmed, current_date: `${local}${tz}` },
      { onSuccess: () => { setTitle(''); onClose(); } }
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { setTitle(''); onClose(); }}>
      <KeyboardAvoidingView style={st.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={st.modalBackdrop} onPress={() => { setTitle(''); onClose(); }} />
        <View style={[st.quickSheet, { backgroundColor: bg, borderColor: border }]}>
          <Text style={[st.quickTitle, { color: textColor }]}>
            New task{prefilledHour != null ? ` at ${formatHourLabel(prefilledHour)}` : ''}
          </Text>
          <TextInput
            style={[st.quickInput, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
            value={title}
            onChangeText={setTitle}
            placeholder="What do you need to do?"
            placeholderTextColor={subText}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCreate}
          />
          <View style={st.quickActions}>
            <Pressable onPress={() => { setTitle(''); onClose(); }} style={[st.cancelBtn, { borderColor: border }]}>
              <Text style={[st.cancelText, { color: subText }]}>Cancel</Text>
            </Pressable>
            <TouchableOpacity
              onPress={handleCreate}
              disabled={create.isPending || !title.trim()}
              activeOpacity={0.8}
              style={[st.confirmBtn, (!title.trim() || create.isPending) && st.confirmBtnDisabled]}
            >
              {create.isPending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={st.confirmText}>Add Task</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── CalendarScreen ───────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const { isDark } = useTheme();
  const { hideTabBar, scheduleShow } = useTabVisibility();
  const { data: tasks = [], isLoading } = useTasks();
  const today = todayStr();

  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

  const dayScale = useSharedValue(1);
  const viewOpacity = useSharedValue(1);

  const viewAnimStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: viewOpacity.value,
  }));
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [quickCreateHour, setQuickCreateHour] = useState<number | null>(null);
  const [quickCreateVisible, setQuickCreateVisible] = useState(false);
  const [unscheduledExpanded, setUnscheduledExpanded] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  const bg = isDark ? '#080810' : '#f8f8f8';
  const textColor = isDark ? '#f4f4f5' : '#18181b';
  const subText = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const cardBg = isDark ? '#1c1c28' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e5e7eb';
  const gridLine = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const segBg = isDark ? '#1a1a2e' : '#f1f5f9';

  const active = tasks.filter((t) => !t.is_completed && !t.is_archived);
  const dayTasks = active.filter((t) => t.scheduled_date === selectedDate);
  const scheduledTasks = dayTasks.filter((t) => t.scheduled_time != null);
  const unscheduledTasks = dayTasks.filter((t) => t.scheduled_time == null);

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const nowTop = (nowMins - START_HOUR * 60) * (HOUR_HEIGHT / 60);
  const isToday = selectedDate === today;
  const nowIsVisible = isToday && nowMins >= START_HOUR * 60 && nowMins <= END_HOUR * 60;

  // Auto-scroll to current time in timeline mode
  useEffect(() => {
    if (viewMode !== 'timeline' || !nowIsVisible) return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, nowTop - 120), animated: true });
    }, 300);
    return () => clearTimeout(t);
  }, [viewMode, selectedDate]);

  // Fade content when switching view mode
  useEffect(() => {
    viewOpacity.value = withTiming(0, { duration: 120 }, () => {
      viewOpacity.value = withTiming(1, { duration: 200 });
    });
  }, [viewMode]);

  // Build marked dates
  const markedDates: Record<string, object> = {};
  active.forEach((task) => {
    if (task.scheduled_date) {
      const color = CATEGORY_COLORS[task.category] ?? '#6b7280';
      if (!markedDates[task.scheduled_date]) {
        markedDates[task.scheduled_date] = { dots: [], marked: true };
      }
      const existing = markedDates[task.scheduled_date] as any;
      if ((existing.dots?.length ?? 0) < 3) {
        existing.dots = [...(existing.dots ?? []), { color }];
      }
    }
  });
  if (selectedDate) {
    markedDates[selectedDate] = {
      ...(markedDates[selectedDate] ?? {}),
      selected: true,
      selectedColor: '#ec5b13',
    };
  }

  const calendarTheme = {
    // backgrounds — must cover every internal sub-view
    backgroundColor: cardBg,
    calendarBackground: cardBg,
    // header (month title + nav arrows row)
    monthTextColor: textColor,
    textMonthFontSize: 15,
    textMonthFontWeight: '700' as const,
    arrowColor: '#ec5b13',
    disabledArrowColor: subText,
    // weekday row (Sun Mon … Sat)
    textSectionTitleColor: isDark ? 'rgba(240,240,245,0.5)' : 'rgba(17,17,24,0.45)',
    textSectionTitleDisabledColor: subText,
    textDayHeaderFontSize: 12,
    textDayHeaderFontWeight: '600' as const,
    // day numbers
    dayTextColor: textColor,
    textDayFontSize: 15,
    textDayFontWeight: '400' as const,
    textDisabledColor: isDark ? 'rgba(240,240,245,0.2)' : 'rgba(17,17,24,0.2)',
    // selected / today
    selectedDayBackgroundColor: '#ec5b13',
    selectedDayTextColor: '#ffffff',
    todayTextColor: '#ec5b13',
    todayBackgroundColor: 'transparent',
    // dots
    dotColor: '#ec5b13',
    selectedDotColor: '#ffffff',
    indicatorColor: '#ec5b13',
  };

  // ── Calendar + segment control (shared header) ──
  const CalendarHeader = (
    <View>
      <View style={[st.calendarWrapper, { backgroundColor: cardBg, borderColor }]}>
        <Calendar
          key={isDark ? 'dark' : 'light'}
          markingType="multi-dot"
          markedDates={markedDates}
          onDayPress={(day) => {
            setSelectedDate(day.dateString);
            dayScale.value = withSequence(
              withSpring(0.85, { damping: 10 }),
              withSpring(1, { damping: 12 }),
            );
          }}
          theme={calendarTheme}
          style={{ backgroundColor: cardBg }}
          enableSwipeMonths
        />
      </View>

      {/* List / Timeline segment */}
      <View style={[st.segmentRow, { backgroundColor: segBg }]}>
        <Pressable
          onPress={() => setViewMode('list')}
          style={[st.segBtn, viewMode === 'list' && st.segBtnActive]}
        >
          <Ionicons name="list" size={14} color={viewMode === 'list' ? '#fff' : subText} style={{ marginRight: 4 }} />
          <Text style={[st.segText, { color: viewMode === 'list' ? '#fff' : subText }]}>List</Text>
        </Pressable>
        <Pressable
          onPress={() => setViewMode('timeline')}
          style={[st.segBtn, viewMode === 'timeline' && st.segBtnActive]}
        >
          <Ionicons name="time-outline" size={14} color={viewMode === 'timeline' ? '#fff' : subText} style={{ marginRight: 4 }} />
          <Text style={[st.segText, { color: viewMode === 'timeline' ? '#fff' : subText }]}>Timeline</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[st.container, { backgroundColor: bg }]}>
      <FadeInView>
      {/* Screen header */}
      <View style={st.header}>
        <Text style={[st.title, { color: textColor }]}>Calendar</Text>
        <Text style={[st.sub, { color: subText }]}>
          {active.length} active task{active.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ReAnimated.View style={viewAnimStyle}>
      {!isLoading && viewMode === 'list' && (
        <FlatList
          data={dayTasks}
          keyExtractor={(t) => t.id}
          renderItem={({ item, index }) => {
            const color = CATEGORY_COLORS[item.category] ?? '#6b7280';
            const isLast = index === dayTasks.length - 1;
            return (
              <Pressable
                onPress={() => setEditTask(item)}
                style={[st.taskRow, !isLast && { borderBottomWidth: 1, borderBottomColor: borderColor }]}
              >
                <View style={[st.dot, { backgroundColor: color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[st.taskTitle, { color: textColor }]} numberOfLines={1}>{item.title}</Text>
                  <Text style={[st.taskMeta, { color: subText }]}>
                    {item.scheduled_time ? item.scheduled_time.slice(0, 5) : ''}
                    {item.duration_minutes ? ` · ${item.duration_minutes}min` : ''}
                  </Text>
                </View>
                <View style={[st.badge, { backgroundColor: color + '22' }]}>
                  <Text style={[st.badgeText, { color }]}>{item.category}</Text>
                </View>
              </Pressable>
            );
          }}
          ListHeaderComponent={
            <View>
              {CalendarHeader}
              <Text style={[st.dayHeading, { color: textColor }]}>
                {selectedDate === today ? 'Today' : friendlyDate(selectedDate)}
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: CONTENT_BOTTOM }}
          onScrollBeginDrag={hideTabBar}
          onMomentumScrollEnd={() => scheduleShow()}
          onScrollEndDrag={() => scheduleShow()}
          scrollEventThrottle={16}
          ListEmptyComponent={
            <Text style={[st.emptyText, { color: subText }]}>No tasks on this day</Text>
          }
          style={{ backgroundColor: bg }}
        />
      )}

      {!isLoading && viewMode === 'timeline' && (
        <>
          {CalendarHeader}
          <Text style={[st.dayHeading, { color: textColor }]}>
            {friendlyDate(selectedDate)}
          </Text>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: CONTENT_BOTTOM }}
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={hideTabBar}
            onMomentumScrollEnd={() => scheduleShow()}
            onScrollEndDrag={() => scheduleShow()}
            scrollEventThrottle={16}
          >
            {/* Hour grid */}
            <View style={{ height: (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT, position: 'relative' }}>
              {HOURS.map((hour) => {
                const top = (hour - START_HOUR) * HOUR_HEIGHT;
                return (
                  <Pressable
                    key={hour}
                    onPress={() => { setQuickCreateHour(hour); setQuickCreateVisible(true); }}
                    style={[st.hourRow, { top, borderBottomColor: gridLine }]}
                  >
                    <Text style={[st.hourLabel, { color: subText }]}>{formatHourLabel(hour)}</Text>
                    <View style={st.hourTrack} />
                  </Pressable>
                );
              })}

              {/* Current time line */}
              {nowIsVisible && (
                <View style={[st.nowLine, { top: nowTop }]} pointerEvents="none">
                  <View style={[st.nowDot, { marginLeft: TIME_LABEL_WIDTH - 4 }]} />
                  <View style={st.nowLineBar} />
                </View>
              )}

              {/* Task blocks */}
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

            {/* Unscheduled */}
            <Pressable
              onPress={() => setUnscheduledExpanded((v) => !v)}
              style={[st.unscheduledHeader, { borderTopColor: borderColor, backgroundColor: cardBg }]}
            >
              <Ionicons
                name={unscheduledExpanded ? 'chevron-down' : 'chevron-forward'}
                size={13}
                color={subText}
              />
              <Text style={[st.unscheduledLabel, { color: subText, marginLeft: 6 }]}>
                Unscheduled ({unscheduledTasks.length})
              </Text>
            </Pressable>

            {unscheduledExpanded && unscheduledTasks.map((task) => (
              <Pressable
                key={task.id}
                onPress={() => setEditTask(task)}
                style={[st.unscheduledItem, { borderBottomColor: borderColor, backgroundColor: cardBg }]}
              >
                <View style={[st.dot, { backgroundColor: CATEGORY_COLORS[task.category] ?? '#6b7280' }]} />
                <Text style={[st.taskTitle, { color: textColor, flex: 1 }]} numberOfLines={1}>{task.title}</Text>
                <Ionicons name="chevron-forward" size={13} color={subText} />
              </Pressable>
            ))}

            {dayTasks.length === 0 && (
              <View style={st.emptyState}>
                <Ionicons name="time-outline" size={36} color={subText} />
                <Text style={[st.emptyText, { color: subText, marginTop: 8 }]}>No tasks — tap a time slot to add one</Text>
              </View>
            )}
          </ScrollView>
        </>
      )}
      </ReAnimated.View>

      <QuickCreateModal
        visible={quickCreateVisible}
        prefilledHour={quickCreateHour}
        selectedDate={selectedDate}
        onClose={() => setQuickCreateVisible(false)}
        isDark={isDark}
      />

      <TaskEditSheet task={editTask} onClose={() => setEditTask(null)} />
      </FadeInView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  title: { fontSize: 26, fontWeight: '700' },
  sub: { fontSize: 13, marginTop: 2 },
  calendarWrapper: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
  },
  // Segment control
  segmentRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 3,
  },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  segBtnActive: {
    backgroundColor: '#ec5b13',
  },
  segText: { fontSize: 13, fontWeight: '600' },
  // Day heading
  dayHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  // List view
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 2, marginRight: 10 },
  taskTitle: { fontSize: 15, fontWeight: '500' },
  taskMeta: { fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, marginLeft: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  emptyText: { textAlign: 'center', fontSize: 15, marginTop: 32, paddingHorizontal: 20 },
  // Timeline view
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
  hourTrack: { flex: 1, height: HOUR_HEIGHT },
  nowLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  nowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  nowLineBar: { flex: 1, height: 2, backgroundColor: '#ef4444' },
  unscheduledHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    marginTop: 8,
  },
  unscheduledLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  unscheduledItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
  },
  emptyState: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 32 },
  // Quick create modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  quickSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  quickTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  quickInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 14,
    minHeight: 44,
  },
  quickActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  cancelText: { fontSize: 15, fontWeight: '500' },
  confirmBtn: { flex: 2, backgroundColor: '#ec5b13', borderRadius: 10, paddingVertical: 12, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  confirmBtnDisabled: { backgroundColor: 'rgba(236,91,19,0.4)' },
  confirmText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
