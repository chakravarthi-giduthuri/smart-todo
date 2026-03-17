import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  Animated,
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTabVisibility } from '../../src/contexts/TabVisibilityContext';
import { ABOVE_NAV, CONTENT_BOTTOM_FAB } from '../../src/constants/layout';
import {
  useTasks,
  useCompleteTask,
  useDeleteTask,
  useCreateTask,
  useTodayEnergy,
  useDailyPlan,
} from '@smart-todo/shared';
import type { Task } from '@smart-todo/shared';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { EnergyBanner } from '../../src/components/EnergyBanner';
import { SmartSuggestions } from '../../src/components/SmartSuggestions';
import { TaskEditSheet } from '../../src/components/TaskEditSheet';
import { SwipeableTaskItem } from '../../src/components/SwipeableTaskItem';
import {
  getTodayStr,
  DailyPlanBannerNative,
  CapacityBarNative,
  UpcomingNextHour,
  FutureTasksSection,
} from '../../src/components/HomeHeaderSections';

// ─── helpers ──────────────────────────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function getTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 22) return 'Good evening';
  return 'Good night';
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { hideTabBar, showTabBar, scheduleShow, tabAnimLayout } = useTabVisibility();

  // FAB slides down with the nav bar when it hides
  const fabBottom = tabAnimLayout.interpolate({
    inputRange: [0, 1],
    outputRange: [20, ABOVE_NAV],
    extrapolate: 'clamp',
  });

  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<'active' | 'done'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [futurExpanded, setFuturExpanded] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // ── undo-delete state ──
  // pendingDelete holds the id of the task that was swiped but not yet
  // committed to the API.  The task is hidden from the list immediately
  // (optimistic) and the actual DELETE fires after 3.5 s unless the user
  // taps Undo first.
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingTaskRef = useRef<Task | null>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // toast animation (slide up from bottom)
  const toastTranslateY = useSharedValue(80);
  const toastOpacity = useSharedValue(0);
  const toastStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: toastTranslateY.value }],
    opacity: toastOpacity.value,
  }));

  // Animation 4: FAB spring entrance
  const fabScale = useSharedValue(0);
  const fabScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  // Animation 5: Chat panel slide-up
  const chatSlide = useSharedValue(0);
  const chatPanelStyle = useAnimatedStyle(() => ({
    opacity: chatSlide.value,
    transform: [{ translateY: (1 - chatSlide.value) * 60 }],
  }));

  useEffect(() => {
    fabScale.value = withDelay(400, withSpring(1, { damping: 12, stiffness: 180 }));
  }, []);

  useEffect(() => {
    if (chatOpen) {
      chatSlide.value = withSpring(1, { damping: 14, stiffness: 160 });
    } else {
      chatSlide.value = withTiming(0, { duration: 180 });
    }
  }, [chatOpen]);
  const inputRef = useRef<TextInput>(null);

  const { data: tasks = [], isLoading } = useTasks();
  const complete = useCompleteTask();
  const del = useDeleteTask();
  const create = useCreateTask();
  const { data: energyData } = useTodayEnergy();

  const today = getTodayStr();
  const tomorrow = getTomorrowStr();
  const { data: plan } = useDailyPlan(today);

  const planCount = plan?.task_ids?.length ?? 0;
  const planGoal = plan?.goal?.trim() || null;
  const energyLevel = energyData?.level ?? undefined;

  // ── derived task slices ──
  const todayTasks = tasks.filter((t) => !t.is_archived && t.scheduled_date === today);
  const todayDone = todayTasks.filter((t) => t.is_completed).length;

  const now = new Date();
  const upcomingNextHour = tasks
    .filter((t) => {
      if (t.is_completed || !t.scheduled_date || !t.scheduled_time) return false;
      if (t.scheduled_date !== today) return false;
      const [h, m] = t.scheduled_time.split(':').map(Number);
      const taskTime = new Date();
      taskTime.setHours(h, m, 0, 0);
      const diffMin = (taskTime.getTime() - now.getTime()) / 60000;
      return diffMin >= 0 && diffMin <= 60;
    })
    .sort((a, b) => (a.scheduled_time! < b.scheduled_time! ? -1 : 1));

  const futureTasks = tasks
    .filter((t) => !t.is_completed && !t.is_archived && t.scheduled_date && t.scheduled_date >= tomorrow)
    .sort((a, b) => {
      const da = `${a.scheduled_date ?? ''}${a.scheduled_time ?? ''}`;
      const db = `${b.scheduled_date ?? ''}${b.scheduled_time ?? ''}`;
      return da < db ? -1 : 1;
    });

  const baseFiltered = tasks.filter((t) =>
    filter === 'active' ? !t.is_completed && !t.is_archived : t.is_completed
  );

  // Exclude any task that is in the pending-delete undo window.
  const visibleTasks = (
    searchQuery.trim()
      ? baseFiltered.filter(
          (t) =>
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : baseFiltered
  ).filter((t) => t.id !== pendingDeleteId);

  // ── handlers ──

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || create.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput('');
    create.mutate(text);
    setChatOpen(false);
  }, [input, create]);

  const openChat = useCallback(() => {
    setChatOpen(true);
    hideTabBar();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => inputRef.current?.focus(), 120);
  }, [hideTabBar]);

  const closeChat = useCallback(() => {
    setChatOpen(false);
    setInput('');
    inputRef.current?.blur();
    showTabBar();
  }, [showTabBar]);

  // Show the undo toast with a spring slide-up.
  const showToast = useCallback(() => {
    toastTranslateY.value = withSpring(0, { damping: 18, stiffness: 200 });
    toastOpacity.value = withTiming(1, { duration: 180 });
  }, [toastOpacity, toastTranslateY]);

  // Hide the undo toast with a quick fade+slide-down.
  const hideToast = useCallback(() => {
    toastTranslateY.value = withTiming(80, { duration: 220 });
    toastOpacity.value = withTiming(0, { duration: 220 });
  }, [toastOpacity, toastTranslateY]);

  // Called by SwipeableTaskItem via onDeleteIntent — starts the undo window.
  const handleDeleteIntent = useCallback(
    (id: string) => {
      // If there is already a pending delete for a different task, commit it
      // immediately before starting a new undo window.
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current);
        deleteTimerRef.current = null;
        if (pendingDeleteId && pendingDeleteId !== id) {
          del.mutate(pendingDeleteId);
        }
      }

      // Capture the task object so we can restore it on undo.
      const taskToDelete = tasks.find((t) => t.id === id) ?? null;
      pendingTaskRef.current = taskToDelete;
      setPendingDeleteId(id);
      showToast();

      deleteTimerRef.current = setTimeout(() => {
        deleteTimerRef.current = null;
        pendingTaskRef.current = null;
        setPendingDeleteId(null);
        hideToast();
        del.mutate(id);
      }, 3500);
    },
    [del, tasks, pendingDeleteId, showToast, hideToast]
  );

  // Called when the user taps "Undo" in the toast.
  const handleUndo = useCallback(() => {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
    pendingTaskRef.current = null;
    setPendingDeleteId(null);
    hideToast();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [hideToast]);

  // ── theme tokens ──
  const bg = isDark ? '#080810' : '#f8f8f8';
  const textColor = isDark ? '#f4f4f5' : '#18181b';
  const subText = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const inputBg = isDark ? '#1a1a2e' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e5e7eb';
  const pillInactiveBg = isDark ? '#1e1e2e' : '#f1f5f9';
  const pillInactiveBorder = isDark ? '#3f3f5a' : '#d1d5db';
  const searchBg = isDark ? '#1a1a2e' : '#f1f5f9';

  // ── stable FlatList header (useMemo so it doesn't re-mount on every render) ──
  const ListHeader = useMemo(
    () => (
      <View>
        <EnergyBanner />

        <DailyPlanBannerNative
          planCount={planCount}
          goalText={planGoal}
          onPress={() => router.push('/(tabs)/plan')}
          isDark={isDark}
        />

        <CapacityBarNative
          todayDone={todayDone}
          todayTotal={todayTasks.length}
          isDark={isDark}
        />

        {tasks.length > 0 && filter === 'active' && (
          <SmartSuggestions
            tasks={tasks}
            energyLevel={energyLevel}
            onSelect={(task) => setEditingTask(task)}
          />
        )}

        <UpcomingNextHour tasks={upcomingNextHour} isDark={isDark} />

        <Text style={[styles.count, { color: subText }]}>
          {visibleTasks.length} task{visibleTasks.length !== 1 ? 's' : ''}
        </Text>
      </View>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      planCount, planGoal, isDark, todayDone, todayTasks.length,
      tasks, filter, energyLevel, upcomingNextHour, visibleTasks.length,
      subText, borderColor,
    ]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      {/* ── Fixed header ── */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <View>
          <Text style={[styles.greeting, { color: subText }]}>{getGreeting()}</Text>
          <Text style={[styles.userName, { color: textColor }]}>
            {(user?.user_metadata?.display_name as string | undefined) || user?.email?.split('@')[0] || 'You'}
          </Text>
        </View>
        <View style={styles.filterRow}>
          <Pressable
            onPress={() => setFilter('active')}
            style={[
              styles.filterBtn,
              filter === 'active'
                ? styles.filterBtnActive
                : { backgroundColor: pillInactiveBg, borderColor: pillInactiveBorder },
            ]}
          >
            <Text style={[styles.filterText, { color: filter === 'active' ? '#fff' : textColor }]}>Active</Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter('done')}
            style={[
              styles.filterBtn,
              { marginLeft: 8 },
              filter === 'done' ? styles.filterBtnActive : { backgroundColor: pillInactiveBg, borderColor: pillInactiveBorder },
            ]}
          >
            <Text style={[styles.filterText, { color: filter === 'done' ? '#fff' : textColor }]}>Done</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Fixed search bar (outside FlatList so it never re-mounts) ── */}
      <View style={[styles.searchWrap, { backgroundColor: searchBg, borderColor }]}>
        <Ionicons name="search" size={16} color={subText} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search tasks..."
          placeholderTextColor={subText}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <Ionicons name="close" size={16} color={subText} />
          </Pressable>
        )}
      </View>

      {/* ── Task list ── */}
      {isLoading ? (
        <ActivityIndicator color="#ec5b13" style={styles.loader} />
      ) : (
        <FlatList
          data={visibleTasks}
          keyExtractor={(t) => t.id}
          renderItem={({ item, index }) => (
            <View style={styles.taskItemWrap}>
              <SwipeableTaskItem
                task={item}
                onComplete={(id) => complete.mutate(id)}
                onDelete={(id) => del.mutate(id)}
                onDeleteIntent={handleDeleteIntent}
                onPress={() => setEditingTask(item)}
                isDark={isDark}
                index={index}
              />
            </View>
          )}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.list}
          onScrollBeginDrag={hideTabBar}
          onMomentumScrollEnd={() => scheduleShow()}
          onScrollEndDrag={() => scheduleShow()}
          scrollEventThrottle={16}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: subText }]}>
              {filter === 'active' ? 'No tasks — tap + below to add' : 'No completed tasks yet'}
            </Text>
          }
          ListFooterComponent={
            filter === 'active' ? (
              <FutureTasksSection
                tasks={futureTasks}
                expanded={futurExpanded}
                onToggle={() => setFuturExpanded((v) => !v)}
                isDark={isDark}
              />
            ) : null
          }
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* ── FAB or expanded chat panel ── */}
      {chatOpen ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ReAnimated.View style={chatPanelStyle}>
            <View style={[styles.chatPanel, { backgroundColor: inputBg, borderTopColor: borderColor }]}>
              <Pressable onPress={closeChat} style={styles.chatDismiss} hitSlop={8}>
                <Ionicons name="chevron-down" size={20} color={subText} />
              </Pressable>
              <TextInput
                ref={inputRef}
                style={[styles.chatInput, { color: textColor }]}
                value={input}
                onChangeText={setInput}
                placeholder="What do you need to do?"
                placeholderTextColor={subText}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
                multiline={false}
                autoFocus
              />
              <Pressable
                onPress={handleSend}
                disabled={!input.trim() || create.isPending}
                style={[styles.sendBtn, (!input.trim() || create.isPending) && styles.sendBtnDisabled]}
              >
                {create.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={18} color="#fff" />
                )}
              </Pressable>
            </View>
          </ReAnimated.View>
        </KeyboardAvoidingView>
      ) : (
        <Animated.View style={[styles.fabWrapper, { bottom: fabBottom }]}>
          <ReAnimated.View style={fabScaleStyle}>
            <Pressable onPress={openChat} style={styles.fab}>
              <Ionicons name="add" size={28} color="#fff" />
            </Pressable>
          </ReAnimated.View>
        </Animated.View>
      )}

      <TaskEditSheet task={editingTask} onClose={() => setEditingTask(null)} />

      {/* ── Undo-delete toast ── */}
      <ReAnimated.View
        style={[styles.undoToast, { bottom: ABOVE_NAV + 16 }, toastStyle]}
        pointerEvents={pendingDeleteId ? 'auto' : 'none'}
      >
        <Text style={styles.undoToastText}>Task deleted</Text>
        <Pressable onPress={handleUndo} hitSlop={8}>
          <Text style={styles.undoBtn}>Undo</Text>
        </Pressable>
      </ReAnimated.View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  greeting: { fontSize: 13 },
  userName: { fontSize: 22, fontWeight: '700' },
  filterRow: { flexDirection: 'row' },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterBtnActive: { backgroundColor: '#ec5b13', borderColor: '#ec5b13' },
  filterText: { fontSize: 13, fontWeight: '600' },
  // Search (fixed, outside FlatList)
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  // List
  taskItemWrap: { paddingHorizontal: 16 },
  count: { paddingHorizontal: 20, fontSize: 13, marginBottom: 4 },
  loader: { marginTop: 40 },
  list: { paddingBottom: CONTENT_BOTTOM_FAB, paddingTop: 8 },
  emptyText: { fontSize: 15, textAlign: 'center', marginTop: 40 },
  separator: { height: 8 },
  // FAB
  fabWrapper: {
    position: 'absolute',
    right: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ec5b13',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ec5b13',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  // Chat panel
  chatPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    borderTopWidth: 1,
  },
  chatDismiss: {
    padding: 4,
    marginRight: 8,
  },
  chatInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
    marginRight: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 28,
    backgroundColor: '#ec5b13',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#ec5b1355' },
  // Undo-delete toast
  undoToast: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(20,20,30,0.95)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  undoToastText: {
    color: '#f4f4f5',
    fontSize: 14,
    fontWeight: '500',
  },
  undoBtn: {
    color: '#ec5b13',
    fontSize: 14,
    fontWeight: '700',
  },
});
