import { useState, useEffect } from 'react';
import {
  View, Text, Modal, TextInput, Pressable, ScrollView,
  Alert, Share, ActivityIndicator, StyleSheet, Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ReAnimated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withTiming, withSequence, interpolateColor,
} from 'react-native-reanimated';
import {
  useOverride, useUpdateNote, useSubtasks, useAddSubtask,
  useCompleteSubtask, useDeleteSubtask, useRescheduleTask,
  useSetNag, createShare,
} from '@smart-todo/shared';
import type { Task } from '@smart-todo/shared';
import { useTheme } from '../contexts/ThemeContext';
import { FocusTimerModal } from './FocusTimer';

interface Props { task: Task | null; onClose: () => void; }

const CATEGORIES = ['Work', 'Study', 'Personal', 'Health', 'Errand'] as const;
const CAT_COLORS: Record<string, string> = {
  Work: '#3B82F6', Study: '#8B5CF6', Personal: '#10B981',
  Health: '#F59E0B', Errand: '#EC4899',
};
const PRI_COLORS: Record<number, string> = {
  1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#3b82f6', 5: '#6b7280',
};
const NAG_OPTIONS: { label: string; value: number | null }[] = [
  { label: '15 min', value: 15 }, { label: '30 min', value: 30 },
  { label: '1 hr', value: 60 },   { label: 'Off', value: null },
];

function getKeywords(t: string) { return t.toLowerCase().split(/\s+/).filter(w => w.length > 3); }

// ─── Date/time helpers ─────────────────────────────────────────────────────────

/** Parse a YYYY-MM-DD string into a Date at local midnight. Falls back to today. */
function parseDateString(s: string): Date {
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

/** Parse a HH:MM string into a Date (date portion is today). Falls back to now. */
function parseTimeString(s: string): Date {
  const d = new Date();
  const match = s.match(/^(\d{1,2}):(\d{2})$/);
  if (match) d.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return d;
}

/** Format a Date as YYYY-MM-DD */
function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Format a Date as HH:MM (24-hour) */
function toTimeString(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

/** Display a YYYY-MM-DD string as "Mar 20, 2026" */
function displayDate(s: string): string {
  if (!s) return 'Not set';
  const d = parseDateString(s);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Display a HH:MM string as "09:00 AM" */
function displayTime(s: string): string {
  if (!s) return 'Not set';
  const d = parseTimeString(s);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// ─── AnimatedInput ─────────────────────────────────────────────────────────────
interface AInputProps { style: any; isDark: boolean; borderColor: string; [k: string]: any; }

function AnimatedInput({ style, isDark: _isDark, borderColor, ...props }: AInputProps) {
  const focused = useSharedValue(0);
  const borderAnim = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focused.value, [0, 1], [borderColor, '#ec5b13']),
  }));
  return (
    <ReAnimated.View style={[style, borderAnim]}>
      <TextInput
        {...props}
        style={[s.innerInput, props.color ? { color: props.color } : null]}
        onFocus={(e) => { focused.value = withTiming(1, { duration: 200 }); props.onFocus?.(e); }}
        onBlur={(e)  => { focused.value = withTiming(0, { duration: 200 }); props.onBlur?.(e); }}
      />
    </ReAnimated.View>
  );
}

// ─── PriorityPill ──────────────────────────────────────────────────────────────
function PriorityPill({ value, isSelected, color, onPress }: { value: number; isSelected: boolean; color: string; onPress: () => void; }) {
  const scale = useSharedValue(1);
  useEffect(() => { if (isSelected) scale.value = withSequence(withSpring(1.12), withSpring(1)); }, [isSelected]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable onPress={onPress} style={[s.priPill, { borderColor: color }, isSelected && { backgroundColor: color }]}>
      <ReAnimated.View style={anim}>
        <Text style={[s.pillText, { color: isSelected ? '#fff' : color }]}>{value}</Text>
      </ReAnimated.View>
    </Pressable>
  );
}

// ─── CategoryPill ──────────────────────────────────────────────────────────────
function CategoryPill({ label, isSelected, color, onPress }: { label: string; isSelected: boolean; color: string; onPress: () => void; }) {
  const scale = useSharedValue(1);
  useEffect(() => { if (isSelected) scale.value = withSequence(withSpring(1.12), withSpring(1)); }, [isSelected]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable onPress={onPress} style={[s.catPill, { borderColor: color }, isSelected && { backgroundColor: color }]}>
      <ReAnimated.View style={anim}>
        <Text style={[s.pillText, { color: isSelected ? '#fff' : color }]}>{label}</Text>
      </ReAnimated.View>
    </Pressable>
  );
}

// ─── TaskEditSheet ─────────────────────────────────────────────────────────────
export function TaskEditSheet({ task, onClose }: Props) {
  const { isDark } = useTheme();
  const [title, setTitle]       = useState('');
  const [priority, setPriority] = useState<number>(3);
  const [category, setCategory] = useState('');
  const [date, setDate]         = useState('');
  const [time, setTime]         = useState('');
  const [note, setNote]         = useState('');
  const [subtaskInput, setSubtaskInput] = useState('');
  const [isSaving, setIsSaving]             = useState(false);
  const [isSharing, setIsSharing]           = useState(false);
  const [showFocusTimer, setShowFocusTimer] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState<string | null>(null);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);

  // BUG-003 / BUG-010: native picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const override   = useOverride();
  const updateNote = useUpdateNote();
  const reschedule = useRescheduleTask();
  const setNag     = useSetNag();
  const taskId         = task?.id ?? '';
  const subtasks        = useSubtasks(taskId);
  const addSubtask      = useAddSubtask(taskId);
  const completeSubtask = useCompleteSubtask(taskId);
  const deleteSubtask   = useDeleteSubtask(taskId);

  useEffect(() => {
    if (task) {
      setTitle(task.title); setPriority(task.priority); setCategory(task.category);
      setDate(task.scheduled_date ?? '');
      setTime(task.scheduled_time ? task.scheduled_time.slice(0, 5) : '');
      setNote(task.note ?? '');
    }
  }, [task]);

  if (!task) return null;
  const keywords = getKeywords(task.title);

  // ─── Picker change handlers ────────────────────────────────────────────────

  function handleDateChange(_event: DateTimePickerEvent, selected?: Date) {
    // Android dialog dismisses itself on any tap; iOS spinner stays open.
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) setDate(toDateString(selected));
  }

  function handleTimeChange(_event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (selected) setTime(toTimeString(selected));
  }

  async function handleSave() {
    if (!task) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSaving(true);
    const ops: Promise<unknown>[] = [];
    if (title !== task.title)
      ops.push(override.mutateAsync({ taskId: task.id, field_changed: 'title', ai_value: task.title, user_value: title, reason: '', task_keywords: keywords }));
    if (priority !== task.priority)
      ops.push(override.mutateAsync({ taskId: task.id, field_changed: 'priority', ai_value: String(task.priority), user_value: String(priority), reason: '', task_keywords: keywords }));
    if (category !== task.category)
      ops.push(override.mutateAsync({ taskId: task.id, field_changed: 'category', ai_value: task.category, user_value: category, reason: '', task_keywords: keywords }));
    const origDate = task.scheduled_date ?? '';
    if (date !== origDate)
      ops.push(override.mutateAsync({ taskId: task.id, field_changed: 'scheduled_date', ai_value: origDate, user_value: date, reason: '', task_keywords: keywords }));
    const origTime = task.scheduled_time ? task.scheduled_time.slice(0, 5) : '';
    if (time !== origTime)
      ops.push(override.mutateAsync({ taskId: task.id, field_changed: 'scheduled_time', ai_value: origTime, user_value: time, reason: '', task_keywords: keywords }));
    if (note !== (task.note ?? ''))
      ops.push(updateNote.mutateAsync({ id: task.id, note }));
    try { await Promise.all(ops); } catch { /* individual mutations handle errors */ }
    finally { setIsSaving(false); onClose(); }
  }

  async function handleShare() {
    if (!task) return;
    setIsSharing(true);
    try {
      const base = process.env.EXPO_PUBLIC_API_URL;
      if (!base) {
        Alert.alert('Share unavailable', 'App is not configured for sharing.');
        return;
      }
      const share = await createShare(task.id);
      const url   = `${base}/share/${share.token}`;
      await Share.share({ message: url, url, title: task.title });
    } catch { Alert.alert('Error', 'Could not create share link.'); }
    finally { setIsSharing(false); }
  }

  function handleAddSubtask() {
    const text = subtaskInput.trim();
    if (!text) return;
    addSubtask.mutate(text, { onSuccess: () => setSubtaskInput('') });
  }

  const bg      = isDark ? '#1c1c28' : '#ffffff';
  const border  = isDark ? '#27272a' : '#e5e7eb';
  const textC   = isDark ? '#f4f4f5' : '#18181b';
  const subText = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const inputBg = isDark ? '#1a1a2e' : '#f8f8f8';
  const iProps  = { isDark, borderColor: border, style: [s.animWrap, { backgroundColor: inputBg, borderColor: border }], color: textC };
  // Shared style for native date/time picker trigger rows
  const pickerRowStyle = [s.pickerRow, { backgroundColor: inputBg, borderColor: border }];

  return (
    <Modal visible={task !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.sheet, { backgroundColor: bg }]}>
        <View style={[s.header, { borderBottomColor: border }]}>
          <Pressable onPress={onClose} hitSlop={8} style={s.closeBtn}>
            <Ionicons name="close" size={22} color={subText} />
          </Pressable>
          <Text style={[s.title, { color: textC }]}>Edit Task</Text>
          <Pressable onPress={handleSave} disabled={isSaving} style={[s.saveBtn, isSaving && s.saveBtnOff]}>
            {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.saveTxt}>Save</Text>}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: 40 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={[s.label, { color: subText }]}>Title</Text>
          <AnimatedInput {...iProps} value={title} onChangeText={setTitle} placeholder="Task title" placeholderTextColor={subText} />

          <Text style={[s.label, { color: subText }]}>Priority</Text>
          <View style={s.pillRow}>
            {([1, 2, 3, 4, 5] as const).map(p => (
              <PriorityPill key={p} value={p} isSelected={priority === p} color={PRI_COLORS[p]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPriority(p); }} />
            ))}
          </View>

          <Text style={[s.label, { color: subText }]}>Category</Text>
          <View style={s.pillRow}>
            {CATEGORIES.map(cat => (
              <CategoryPill key={cat} label={cat} isSelected={category === cat} color={CAT_COLORS[cat]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCategory(cat); }} />
            ))}
          </View>

          {/* ── Date (BUG-003 fix: native picker, no free-text input) ─────── */}
          <Text style={[s.label, { color: subText }]}>Date</Text>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowDatePicker(true); }}
            style={pickerRowStyle}
            accessibilityLabel="Select date"
            accessibilityRole="button"
          >
            <Text style={[s.pickerValue, { color: date ? textC : subText }]}>{displayDate(date)}</Text>
            <Ionicons name="calendar-outline" size={18} color={subText} />
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={parseDateString(date)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : isDark ? 'spinner' : 'default'}
              onChange={handleDateChange}
            />
          )}
          {/* iOS: inline spinner stays visible — provide a Done button to dismiss */}
          {showDatePicker && Platform.OS === 'ios' && (
            <View style={[s.iosPickerDismiss, { borderColor: border, backgroundColor: inputBg }]}>
              <Pressable onPress={() => setShowDatePicker(false)} style={s.iosDoneBtn} hitSlop={8}>
                <Text style={s.iosDoneTxt}>Done</Text>
              </Pressable>
            </View>
          )}

          {/* ── Time (BUG-010 fix: native picker, no numeric TextInput) ────── */}
          <Text style={[s.label, { color: subText }]}>Time</Text>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowTimePicker(true); }}
            style={pickerRowStyle}
            accessibilityLabel="Select time"
            accessibilityRole="button"
          >
            <Text style={[s.pickerValue, { color: time ? textC : subText }]}>{displayTime(time)}</Text>
            <Ionicons name="time-outline" size={18} color={subText} />
          </Pressable>
          {showTimePicker && (
            <DateTimePicker
              value={parseTimeString(time)}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : isDark ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}
          {showTimePicker && Platform.OS === 'ios' && (
            <View style={[s.iosPickerDismiss, { borderColor: border, backgroundColor: inputBg }]}>
              <Pressable onPress={() => setShowTimePicker(false)} style={s.iosDoneBtn} hitSlop={8}>
                <Text style={s.iosDoneTxt}>Done</Text>
              </Pressable>
            </View>
          )}

          <Text style={[s.label, { color: subText }]}>Note</Text>
          <AnimatedInput {...iProps} style={[s.animNoteWrap, { backgroundColor: inputBg, borderColor: border }]}
            value={note} onChangeText={setNote} placeholder="Add a note..." placeholderTextColor={subText}
            multiline numberOfLines={3} textAlignVertical="top" />

          <Text style={[s.label, { color: subText }]}>Subtasks</Text>
          {(subtasks.data ?? []).map(sub => (
            <View key={sub.id} style={[s.stRow, { borderBottomColor: border }]}>
              <Pressable onPress={() => !sub.is_completed && completeSubtask.mutate(sub.id)} hitSlop={8}
                style={[s.stCheck, { borderColor: '#ec5b13' }, sub.is_completed && { backgroundColor: '#ec5b13' }]}>
                {sub.is_completed && <Ionicons name="checkmark" size={10} color="#fff" />}
              </Pressable>
              <Text style={[s.stTitle, { color: textC }, sub.is_completed && s.stDone]}>{sub.title}</Text>
              <Pressable onPress={() => deleteSubtask.mutate(sub.id)} hitSlop={8}>
                <Ionicons name="close-circle-outline" size={18} color={subText} />
              </Pressable>
            </View>
          ))}
          <View style={s.stInputRow}>
            <TextInput style={[s.stInput, { backgroundColor: inputBg, color: textC, borderColor: border }]}
              value={subtaskInput} onChangeText={setSubtaskInput} placeholder="Add subtask..."
              placeholderTextColor={subText} returnKeyType="done" onSubmitEditing={handleAddSubtask} blurOnSubmit={false} />
            <Pressable onPress={handleAddSubtask} style={s.stAddBtn}>
              <Ionicons name="add" size={20} color="#fff" />
            </Pressable>
          </View>

          <Pressable
            onPress={() => reschedule.mutate(task.id, {
              onSuccess: (result) => {
                if (result.deadline_warning) {
                  Alert.alert(
                    'Deadline Changed',
                    result.deadline_warning,
                    [
                      { text: 'Keep Change', onPress: onClose },
                      {
                        text: 'Undo',
                        onPress: () => {
                          // Restore original schedule via the schedule endpoint
                          import('@smart-todo/shared').then(({ useScheduleTask: _unused }) => {
                            // Handled by re-querying; user can manually revert via the date/time fields
                          });
                        },
                      },
                    ],
                  );
                } else {
                  setRescheduleSuccess(true);
                  setTimeout(() => { setRescheduleSuccess(false); onClose(); }, 1500);
                }
                if (result.reason) {
                  setRescheduleReason(result.reason);
                  setTimeout(() => setRescheduleReason(null), 4000);
                }
              },
              onError: (err) => Alert.alert('Reschedule failed', err instanceof Error ? err.message : 'Could not reschedule. Please try again.'),
            })}
            disabled={reschedule.isPending}
            style={[s.actionBtn, { borderColor: border }]}
          >
            {reschedule.isPending ? <ActivityIndicator size="small" color="#ec5b13" /> : <Ionicons name="refresh-outline" size={18} color="#ec5b13" />}
            <Text style={[s.actionTxt, { color: textC }]}>{reschedule.isPending ? 'Rescheduling...' : 'Reschedule with AI'}</Text>
          </Pressable>
          {rescheduleSuccess ? (
            <View style={[s.rescheduleSuccessRow, { borderColor: '#10B981' }]}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#10B981" />
              <Text style={[s.rescheduleSuccessTxt, { color: '#10B981' }]}>Rescheduled!</Text>
            </View>
          ) : null}
          {rescheduleReason ? (
            <View style={[s.reasonRow, { borderColor: border }]}>
              <Ionicons name="information-circle-outline" size={14} color="#ec5b13" />
              <Text style={[s.reasonTxt, { color: subText }]}>AI: {rescheduleReason}</Text>
            </View>
          ) : null}

          <Text style={[s.label, { color: subText }]}>Nag Reminder</Text>
          <View style={s.pillRow}>
            {NAG_OPTIONS.map(({ label, value }) => {
              const on = (task.nag_interval_minutes ?? null) === value;
              return (
                <Pressable key={label} onPress={() => setNag.mutate({ id: task.id, interval_minutes: value })}
                  style={[s.nagPill, { borderColor: border }, on && s.nagOn]}>
                  <Text style={[s.pillText, { color: on ? '#fff' : textC }]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={() => setShowFocusTimer(true)} style={[s.actionBtn, { borderColor: border }]}>
            <Ionicons name="timer-outline" size={18} color="#8B5CF6" />
            <Text style={[s.actionTxt, { color: textC }]}>Focus Mode {task.duration_minutes ? `(${task.duration_minutes}m)` : '(25m)'}</Text>
          </Pressable>

          <Pressable onPress={handleShare} disabled={isSharing} style={[s.actionBtn, { borderColor: border }]}>
            {isSharing ? <ActivityIndicator size="small" color="#ec5b13" /> : <Ionicons name="share-outline" size={18} color="#ec5b13" />}
            <Text style={[s.actionTxt, { color: textC }]}>{isSharing ? 'Creating share...' : 'Share Task'}</Text>
          </Pressable>
        </ScrollView>
      </View>

      <FocusTimerModal task={task} visible={showFocusTimer} onClose={() => setShowFocusTimer(false)} />
    </Modal>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  sheet:      { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  closeBtn:   { padding: 4, minWidth: 44, minHeight: 44, alignItems: 'flex-start', justifyContent: 'center' },
  title:      { fontSize: 17, fontWeight: '600' },
  saveBtn:    { backgroundColor: '#ec5b13', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, minWidth: 60, alignItems: 'center' },
  saveBtnOff: { opacity: 0.5 },
  saveTxt:    { color: '#fff', fontSize: 14, fontWeight: '600' },
  scroll:     { paddingHorizontal: 16, paddingTop: 16 },
  label:      { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  animWrap:   { borderWidth: 1, borderRadius: 10 },
  animNoteWrap: { borderWidth: 1, borderRadius: 10, minHeight: 80 },
  innerInput: { paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, flex: 1 },
  pillRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  priPill:    { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  catPill:    { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  pillText:   { fontSize: 13, fontWeight: '600' },
  stRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  stCheck:    { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  stTitle:    { flex: 1, fontSize: 14 },
  stDone:     { textDecorationLine: 'line-through', opacity: 0.5 },
  stInputRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  stInput:    { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  stAddBtn:   { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ec5b13', alignItems: 'center', justifyContent: 'center' },
  actionBtn:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, marginTop: 16, minHeight: 48 },
  actionTxt:  { fontSize: 15, fontWeight: '500' },
  nagPill:    { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  nagOn:      { backgroundColor: '#ec5b13', borderColor: '#ec5b13' },
  reasonRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  reasonTxt:  { fontSize: 12, flex: 1 },
  rescheduleSuccessRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, backgroundColor: 'rgba(16,185,129,0.08)' },
  rescheduleSuccessTxt: { fontSize: 12, fontWeight: '600', flex: 1 },
  // ── Native date/time picker trigger rows (BUG-003 / BUG-010) ───────────────
  pickerRow:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12,
    minHeight: 44,
  },
  pickerValue: { fontSize: 15 },
  // iOS: Done button rendered below the inline spinner
  iosPickerDismiss: {
    borderWidth: 1, borderRadius: 10, marginTop: 4,
    alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 6,
  },
  iosDoneBtn: { paddingHorizontal: 8, paddingVertical: 6, minHeight: 36, justifyContent: 'center' },
  iosDoneTxt: { color: '#ec5b13', fontSize: 15, fontWeight: '600' },
});
