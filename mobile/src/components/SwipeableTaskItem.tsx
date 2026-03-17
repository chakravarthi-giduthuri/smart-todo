import { useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import * as Haptics from 'expo-haptics';
import type { Task } from '@smart-todo/shared';

const CATEGORY_COLORS: Record<string, string> = {
  Work: '#3B82F6',
  Study: '#8B5CF6',
  Personal: '#10B981',
  Health: '#F59E0B',
  Errand: '#EC4899',
};

const PRIORITY_LABELS: Record<number, string> = { 1: '!!!', 2: '!!', 3: '!', 4: '', 5: '' };

interface Props {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  /** Optional — when provided, swipe/tap delete calls this instead of onDelete.
   *  The parent is responsible for deferring the real API call (undo toast pattern).
   *  onDelete is kept for backward-compat callers that do not use the undo flow. */
  onDeleteIntent?: (id: string) => void;
  onPress?: () => void;
  isDark: boolean;
  index?: number;
}

function isOverdue(task: Task): boolean {
  if (task.is_completed || task.priority > 2) return false;
  if (!task.scheduled_date) return false;
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  if (task.scheduled_date < todayStr) return true;
  if (task.scheduled_date === todayStr && task.scheduled_time) {
    return task.scheduled_time < `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
  return false;
}

const ROW_HEIGHT = 72;

export function SwipeableTaskItem({ task, onComplete, onDelete, onDeleteIntent, onPress, isDark, index = 0 }: Props) {
  const swipeRef = useRef<Swipeable>(null);
  const color = CATEGORY_COLORS[task.category] ?? '#6b7280';
  const priorityLabel = PRIORITY_LABELS[task.priority] ?? '';
  const overdue = isOverdue(task);
  const cardBg = isDark ? '#1c1c28' : '#ffffff';
  const textColor = isDark ? '#f4f4f5' : '#18181b';
  const subColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  // Animation 1: entrance fade + slide
  const entranceOpacity = useSharedValue(0);
  const entranceTranslateY = useSharedValue(20);

  // Animation 2: completion feedback
  const checkScale = useSharedValue(1);
  const titleOpacity = useSharedValue(1);

  // Animation 3: delete slide-out
  const rowOpacity = useSharedValue(1);
  const rowHeight = useSharedValue(ROW_HEIGHT);

  useEffect(() => {
    entranceOpacity.value = withDelay(
      index * 50,
      withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) })
    );
    entranceTranslateY.value = withDelay(
      index * 50,
      withTiming(0, { duration: 320, easing: Easing.out(Easing.quad) })
    );
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entranceOpacity.value,
    transform: [{ translateY: entranceTranslateY.value }],
  }));

  const checkScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const titleOpacityStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const deleteRowStyle = useAnimatedStyle(() => ({
    opacity: rowOpacity.value,
    height: rowHeight.value,
    overflow: 'hidden',
  }));

  function handleComplete() {
    if (task.is_completed) return;
    checkScale.value = withSequence(
      withSpring(1.35, { damping: 6, stiffness: 200 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );
    titleOpacity.value = withTiming(0.35, { duration: 300 });
    onComplete(task.id);
  }

  function handleDelete() {
    // Use onDeleteIntent when provided (undo-toast flow); fall back to onDelete
    // for backward-compat callers that handle deletion directly.
    const callback = onDeleteIntent ?? onDelete;
    rowOpacity.value = withTiming(0, { duration: 220 });
    rowHeight.value = withTiming(0, { duration: 220 }, (finished) => {
      if (finished) {
        runOnJS(callback)(task.id);
      }
    });
  }

  return (
    <Animated.View style={[entranceStyle, deleteRowStyle]}>
      <Swipeable
        ref={swipeRef}
        renderLeftActions={() => (
          <View style={styles.swipeLeft}>
            <Ionicons name="checkmark" size={28} color="#fff" />
            <Text style={styles.swipeLabel}>Done</Text>
          </View>
        )}
        renderRightActions={() => (
          <View style={styles.swipeRight}>
            <Ionicons name="trash" size={24} color="#fff" />
            <Text style={styles.swipeLabel}>Delete</Text>
          </View>
        )}
        onSwipeableLeftOpen={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          handleComplete();
          swipeRef.current?.close();
        }}
        onSwipeableRightOpen={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          handleDelete();
        }}
        friction={2}
        leftThreshold={60}
        rightThreshold={60}
        overshootLeft={false}
        overshootRight={false}
      >
        <Pressable
          onPress={onPress}
          style={[
            styles.taskCard,
            { backgroundColor: cardBg },
            task.is_completed && styles.taskCardDone,
            overdue && styles.taskCardOverdue,
          ]}
        >
          <Animated.View style={checkScaleStyle}>
            <Pressable
              onPress={handleComplete}
              style={[
                styles.checkCircle,
                { borderColor: color },
                task.is_completed && { backgroundColor: color },
              ]}
              hitSlop={8}
            >
              {task.is_completed && <Ionicons name="checkmark" size={14} color="#fff" />}
            </Pressable>
          </Animated.View>

          <View style={styles.taskBody}>
            <Animated.View style={titleOpacityStyle}>
              <Text
                style={[styles.taskTitle, { color: textColor }, task.is_completed && styles.taskTitleDone]}
                numberOfLines={2}
              >
                {priorityLabel ? <Text style={{ color }}>{priorityLabel} </Text> : null}
                {task.title}
              </Text>
            </Animated.View>
            <View style={styles.taskMeta}>
              <View style={[styles.categoryBadge, { backgroundColor: color + '22' }]}>
                <Text style={[styles.categoryText, { color }]}>{task.category}</Text>
              </View>
              {task.scheduled_date ? (
                <Text style={[styles.metaText, { color: subColor }]}>{task.scheduled_date}</Text>
              ) : null}
              {task.scheduled_time ? (
                <Text style={[styles.metaText, { color: subColor }]}>{task.scheduled_time.slice(0, 5)}</Text>
              ) : null}
              {task._hasOverride ? <Text style={styles.overrideIndicator}>✎</Text> : null}
              {overdue ? (
                <View style={styles.overdueTag}>
                  <Text style={styles.overdueTagText}>Overdue</Text>
                </View>
              ) : null}
              {(task.context_tags ?? []).slice(0, 2).map((tag) => (
                <View key={tag} style={[styles.contextTag, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f0f0f0' }]}>
                  <Text style={[styles.contextTagText, { color: subColor }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          <Pressable onPress={handleDelete} hitSlop={8} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color="#6b7280" />
          </Pressable>
        </Pressable>
      </Swipeable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  swipeLeft: {
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 12,
    marginRight: 4,
  },
  swipeRight: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 12,
    marginLeft: 4,
  },
  swipeLabel: { color: '#fff', fontSize: 11, fontWeight: '600' },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  taskCardDone: { opacity: 0.5 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskBody: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: '500', marginBottom: 4 },
  taskTitleDone: { textDecorationLine: 'line-through', color: '#71717a' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  categoryText: { fontSize: 11, fontWeight: '600' },
  metaText: { fontSize: 11 },
  overrideIndicator: { fontSize: 11, color: '#ec5b13' },
  deleteBtn: { padding: 4, marginLeft: 8 },
  taskCardOverdue: {
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  overdueTag: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  overdueTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ef4444',
  },
  contextTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  contextTagText: {
    fontSize: 10,
  },
});
