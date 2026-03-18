import { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import type { Task } from '@smart-todo/shared';

const CATEGORY_COLORS: Record<string, string> = {
  Work: '#3B82F6',
  Study: '#8B5CF6',
  Personal: '#10B981',
  Health: '#F59E0B',
  Errand: '#EC4899',
};

interface Props {
  task: Task;
  hourHeight: number;
  startHour: number;
  onPress: () => void;
}

export function TimelineTaskBlock({ task, hourHeight, startHour, onPress }: Props) {
  const [h, m] = (task.scheduled_time ?? '00:00').split(':').map(Number);
  const topOffset = (h - startHour) * hourHeight + (m / 60) * hourHeight;
  const height = Math.max(((task.duration_minutes ?? 30) / 60) * hourHeight, 24);
  const color = CATEGORY_COLORS[task.category] ?? '#6b7280';

  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    opacity.value = withDelay(50, withTiming(1, { duration: 350 }));
  }, []);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.96); }}
      onPressOut={() => { scale.value = withSpring(1); }}
    >
      <ReAnimated.View
        style={[
          styles.block,
          {
            top: topOffset,
            height,
            backgroundColor: color + 'dd',
            borderLeftColor: color,
          },
          animStyle,
        ]}
      >
        <Text style={styles.blockTitle} numberOfLines={1}>
          {task.title}
        </Text>
        {task.duration_minutes != null && (
          <Text style={styles.blockDuration}>{task.duration_minutes}m</Text>
        )}
      </ReAnimated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    left: 60,
    right: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  blockTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  blockDuration: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
  },
});
