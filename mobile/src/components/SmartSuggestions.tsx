import { useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import type { Task, EnergyLevel } from '@smart-todo/shared';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  tasks: Task[];
  energyLevel?: EnergyLevel;
  onSelect: (task: Task) => void;
}

const ENERGY_CATEGORY_MAP: Record<EnergyLevel, string[]> = {
  high:   ['Work', 'Study'],
  medium: ['Work', 'Personal', 'Errand'],
  low:    ['Personal', 'Health', 'Errand'],
};

function scoreTask(task: Task, energyLevel?: EnergyLevel): number {
  let score = 0;

  // Priority score: priority 1 = highest urgency
  score += (6 - task.priority) * 12;

  // Date-based scoring
  if (task.scheduled_date) {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    if (task.scheduled_date < todayStr) {
      score += 40; // overdue
    } else if (task.scheduled_date === todayStr) {
      score += 25; // due today
    } else if (task.scheduled_date === tomorrowStr) {
      score += 10; // due tomorrow
    }
  }

  // Energy category match
  if (energyLevel) {
    const matchCategories = ENERGY_CATEGORY_MAP[energyLevel];
    if (matchCategories.includes(task.category)) {
      score += 15;
    }
  }

  // Has scheduled time
  if (task.scheduled_time) {
    score += 5;
  }

  // Context tag @5min
  if (Array.isArray(task.context_tags) && task.context_tags.includes('@5min')) {
    score += 8;
  }

  return score;
}

interface SuggestionCardProps {
  task: Task;
  index: number;
  onSelect: (task: Task) => void;
  chipBg: string;
  chipText: string;
  headingColor: string;
}

function SuggestionCard({ task, index, onSelect, chipBg, chipText, headingColor }: SuggestionCardProps) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(30);
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  useEffect(() => {
    opacity.value = withDelay(index * 80, withTiming(1, { duration: 300 }));
    translateX.value = withDelay(index * 80, withTiming(0, { duration: 300 }));
  }, []);

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={() => onSelect(task)}
    >
      <ReAnimated.View style={[styles.chip, { backgroundColor: chipBg }, animStyle]}>
        <Text style={[styles.chipText, { color: chipText }]} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={styles.chipMeta}>
          <Text style={[styles.chipCategory, { color: '#ec5b13' }]}>
            {task.category}
          </Text>
          {task.scheduled_date ? (
            <Text style={[styles.chipDate, { color: headingColor }]}>
              {task.scheduled_date}
            </Text>
          ) : null}
        </View>
      </ReAnimated.View>
    </Pressable>
  );
}

export function SmartSuggestions({ tasks, energyLevel, onSelect }: Props) {
  const { isDark } = useTheme();

  const activeTasks = tasks.filter((t) => !t.is_completed && !t.is_archived);
  const scored = activeTasks
    .map((t) => ({ task: t, score: scoreTask(t, energyLevel) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (scored.length === 0) return null;

  const containerBg = isDark ? '#1a1a2e' : '#f1f5f9';
  const borderColor = isDark ? '#27272a' : '#e5e7eb';
  const headingColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const chipBg = isDark ? '#27272a' : '#ffffff';
  const chipText = isDark ? '#f4f4f5' : '#18181b';

  return (
    <View style={[styles.container, { backgroundColor: containerBg, borderColor }]}>
      <Text style={[styles.heading, { color: headingColor }]}>Smart Suggestions</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {scored.map(({ task }, index) => (
          <SuggestionCard
            key={task.id}
            task={task}
            index={index}
            onSelect={onSelect}
            chipBg={chipBg}
            chipText={chipText}
            headingColor={headingColor}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  heading: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scroll: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    width: 160,
    borderRadius: 10,
    padding: 10,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  chipMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  chipCategory: {
    fontSize: 11,
    fontWeight: '600',
  },
  chipDate: {
    fontSize: 10,
  },
});
