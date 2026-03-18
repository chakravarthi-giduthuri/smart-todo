import { useState, useEffect } from 'react';
import {
  Animated,
  View,
  Text,
  FlatList,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTasks, useDailyPlan, useUpsertDailyPlan } from '@smart-todo/shared';
import type { Task } from '@smart-todo/shared';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useTabVisibility } from '../../src/contexts/TabVisibilityContext';
import { ABOVE_NAV, CONTENT_BOTTOM } from '../../src/constants/layout';

const CATEGORY_COLORS: Record<string, string> = {
  Work: '#3B82F6',
  Study: '#8B5CF6',
  Personal: '#10B981',
  Health: '#F59E0B',
  Errand: '#EC4899',
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function formatDate(str: string) {
  const [y, m, d] = str.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
}

export default function PlanScreen() {
  const { isDark } = useTheme();
  const { hideTabBar, scheduleShow, tabAnimLayout } = useTabVisibility();

  // Save bar slides down in sync with the nav bar when hidden
  const saveBarBottom = tabAnimLayout.interpolate({
    inputRange: [0, 1],
    outputRange: [0, ABOVE_NAV],
    extrapolate: 'clamp',
  });
  const today = todayStr();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: existingPlan, isLoading: planLoading } = useDailyPlan(today);
  const upsertDailyPlan = useUpsertDailyPlan();

  const [goal, setGoal] = useState('');
  const [committedIds, setCommittedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (existingPlan) {
      setCommittedIds(existingPlan.plan_order?.length ? existingPlan.plan_order : (existingPlan.task_ids ?? []));
      setGoal(existingPlan.goal ?? '');
    }
  }, [existingPlan]);

  const bg = isDark ? '#080810' : '#f8f8f8';
  const textColor = isDark ? '#f4f4f5' : '#18181b';
  const subText = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const cardBg = isDark ? '#1c1c28' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e5e7eb';
  const inputBg = isDark ? '#1a1a24' : '#f3f4f6';
  const orange = '#ec5b13';

  const activeTasks = tasks.filter((t: Task) => !t.is_completed && !t.is_archived);

  const committedTasks: Task[] = committedIds
    .map((id) => activeTasks.find((t: Task) => t.id === id))
    .filter((t): t is Task => t !== undefined);

  const availableTasks: Task[] = activeTasks
    .filter((t: Task) => !committedIds.includes(t.id))
    .filter((t: Task) => {
      if (!search.trim()) return true;
      return t.title.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a: Task, b: Task) => a.priority - b.priority);

  const totalMinutes = committedTasks.reduce((s, t) => s + (t.duration_minutes ?? 30), 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  function addTask(id: string) {
    setCommittedIds((prev) => [...prev, id]);
  }

  function removeTask(id: string) {
    setCommittedIds((prev) => prev.filter((x) => x !== id));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    setCommittedIds((prev) => {
      const next = [...prev];
      const tmp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = tmp;
      return next;
    });
  }

  function moveDown(index: number) {
    setCommittedIds((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      const tmp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = tmp;
      return next;
    });
  }

  function savePlan() {
    upsertDailyPlan.mutate({
      plan_date: today,
      task_ids: committedIds,
      plan_order: committedIds,
      goal: goal.trim() || undefined,
    });
  }

  const isLoading = tasksLoading || planLoading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      {isLoading ? (
        <ActivityIndicator color={orange} style={{ marginTop: 40 }} />
      ) : (
        <>
          <FlatList
            data={availableTasks}
            keyExtractor={(t) => t.id}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <View>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={[styles.title, { color: textColor }]}>Daily Plan</Text>
                  <Text style={[styles.sub, { color: subText }]}>{formatDate(today)}</Text>
                </View>

                {/* Goal input */}
                <View style={[styles.goalBox, { backgroundColor: cardBg, borderColor }]}>
                  <Ionicons name="flag-outline" size={18} color={orange} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.goalInput, { color: textColor }]}
                    value={goal}
                    onChangeText={setGoal}
                    placeholder="What's your main goal today?"
                    placeholderTextColor={subText}
                    returnKeyType="done"
                  />
                </View>

                {/* Today's Plan section */}
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: textColor }]}>Today's Plan</Text>
                  <Text style={[styles.sectionMeta, { color: subText }]}>
                    {committedTasks.length} tasks
                    {totalMinutes > 0 ? ` · ${hours > 0 ? `${hours}h ` : ''}${mins > 0 ? `${mins}min` : ''}` : ''}
                  </Text>
                </View>

                {committedTasks.length === 0 ? (
                  <View style={[styles.emptyPlan, { borderColor }]}>
                    <Text style={[styles.emptyPlanText, { color: subText }]}>
                      Add tasks from below to build your plan
                    </Text>
                  </View>
                ) : (
                  committedTasks.map((task, index) => {
                    const color = CATEGORY_COLORS[task.category] ?? '#6b7280';
                    return (
                      <View key={task.id} style={[styles.committedCard, { backgroundColor: cardBg, borderColor }]}>
                        <View style={[styles.rankBadge, { backgroundColor: color + '22' }]}>
                          <Text style={[styles.rankText, { color }]}>{index + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.taskTitle, { color: textColor }]} numberOfLines={2}>
                            {task.title}
                          </Text>
                          <View style={styles.metaRow}>
                            <View style={[styles.catChip, { backgroundColor: color + '22' }]}>
                              <Text style={[styles.catChipText, { color }]}>{task.category}</Text>
                            </View>
                            {task.scheduled_time ? (
                              <Text style={[styles.metaText, { color: subText }]}>
                                {task.scheduled_time.slice(0, 5)}
                              </Text>
                            ) : null}
                            {task.duration_minutes ? (
                              <Text style={[styles.metaText, { color: subText }]}>
                                {task.duration_minutes}min
                              </Text>
                            ) : null}
                          </View>
                        </View>
                        <View style={styles.reorderBtns}>
                          <Pressable
                            onPress={() => moveUp(index)}
                            style={[styles.arrowBtn, { opacity: index === 0 ? 0.3 : 1 }]}
                            hitSlop={6}
                          >
                            <Ionicons name="chevron-up" size={16} color={subText} />
                          </Pressable>
                          <Pressable
                            onPress={() => moveDown(index)}
                            style={[styles.arrowBtn, { opacity: index === committedTasks.length - 1 ? 0.3 : 1 }]}
                            hitSlop={6}
                          >
                            <Ionicons name="chevron-down" size={16} color={subText} />
                          </Pressable>
                        </View>
                        <Pressable
                          onPress={() => removeTask(task.id)}
                          style={[styles.removeBtn, { borderColor: '#ef4444' }]}
                          hitSlop={6}
                        >
                          <Ionicons name="remove" size={16} color="#ef4444" />
                        </Pressable>
                      </View>
                    );
                  })
                )}

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: borderColor }]} />

                {/* Add Tasks section */}
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: textColor }]}>Add Tasks</Text>
                  <Text style={[styles.sectionMeta, { color: subText }]}>{availableTasks.length} available</Text>
                </View>

                {/* Search */}
                <View style={[styles.searchBox, { backgroundColor: inputBg, borderColor }]}>
                  <Ionicons name="search" size={16} color={subText} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.searchInput, { color: textColor }]}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search tasks…"
                    placeholderTextColor={subText}
                    returnKeyType="search"
                  />
                  {search.length > 0 && (
                    <Pressable onPress={() => setSearch('')} hitSlop={8}>
                      <Ionicons name="close-circle" size={16} color={subText} />
                    </Pressable>
                  )}
                </View>
              </View>
            }
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            ListEmptyComponent={
              <View style={styles.emptyAvail}>
                <Text style={[styles.emptyAvailText, { color: subText }]}>
                  {search.trim() ? 'No tasks match your search' : 'All tasks added to your plan'}
                </Text>
              </View>
            }
            renderItem={({ item: task }) => {
              const color = CATEGORY_COLORS[task.category] ?? '#6b7280';
              return (
                <View style={[styles.availCard, { backgroundColor: cardBg, borderColor }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.taskTitle, { color: textColor }]} numberOfLines={2}>
                      {task.title}
                    </Text>
                    <View style={styles.metaRow}>
                      <View style={[styles.catChip, { backgroundColor: color + '22' }]}>
                        <Text style={[styles.catChipText, { color }]}>{task.category}</Text>
                      </View>
                      <View style={[styles.priorityPill, { borderColor }]}>
                        <Text style={[styles.metaText, { color: subText }]}>P{task.priority}</Text>
                      </View>
                      {task.duration_minutes ? (
                        <Text style={[styles.metaText, { color: subText }]}>{task.duration_minutes}min</Text>
                      ) : null}
                    </View>
                  </View>
                  <Pressable
                    onPress={() => addTask(task.id)}
                    style={[styles.addBtn, { borderColor: orange }]}
                    hitSlop={6}
                  >
                    <Ionicons name="add" size={18} color={orange} />
                  </Pressable>
                </View>
              );
            }}
            onScrollBeginDrag={hideTabBar}
            onMomentumScrollEnd={() => scheduleShow()}
            onScrollEndDrag={() => scheduleShow()}
            scrollEventThrottle={16}
            ListFooterComponent={<View style={{ height: CONTENT_BOTTOM + 80 }} />}
          />

          {/* Save Plan button — animates with the nav bar */}
          <Animated.View
            style={[styles.saveBar, { backgroundColor: bg, borderTopColor: borderColor, bottom: saveBarBottom }]}
          >
            <TouchableOpacity
              onPress={savePlan}
              disabled={upsertDailyPlan.isPending}
              activeOpacity={0.8}
              style={[styles.saveBtn, upsertDailyPlan.isPending && styles.saveBtnPending]}
            >
              {upsertDailyPlan.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Plan</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '700' },
  sub: { fontSize: 13, marginTop: 2 },
  listContent: { paddingHorizontal: 16 },
  goalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  goalInput: { flex: 1, fontSize: 15 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionMeta: { fontSize: 13 },
  emptyPlan: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyPlanText: { fontSize: 14 },
  committedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    marginBottom: 8,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { fontSize: 14, fontWeight: '700' },
  taskTitle: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  catChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  catChipText: { fontSize: 11, fontWeight: '600' },
  metaText: { fontSize: 12 },
  priorityPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  reorderBtns: { gap: 2 },
  arrowBtn: { padding: 4 },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, marginVertical: 20 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15 },
  availCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAvail: { paddingVertical: 24, alignItems: 'center' },
  emptyAvailText: { fontSize: 14 },
  saveBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  saveBtn: {
    backgroundColor: '#ec5b13',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnPending: { backgroundColor: 'rgba(236,91,19,0.4)' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
