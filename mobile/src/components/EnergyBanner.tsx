import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import ReAnimated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTodayEnergy, useSubmitEnergy } from '@smart-todo/shared';
import type { EnergyLevel } from '@smart-todo/shared';
import { useTheme } from '../contexts/ThemeContext';

const LEVELS: { level: EnergyLevel; label: string; emoji: string; sub: string }[] = [
  { level: 'high',   label: 'High',   emoji: '⚡', sub: 'Deep focus' },
  { level: 'medium', label: 'Medium', emoji: '☀️', sub: 'Routine work' },
  { level: 'low',    label: 'Low',    emoji: '🌙', sub: 'Light tasks' },
];

export function EnergyBanner() {
  const { isDark } = useTheme();
  const { data, isLoading } = useTodayEnergy();
  const submit = useSubmitEnergy();
  const [collapsed, setCollapsed] = useState(false);

  const chevronRotation = useSharedValue(0);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const selected: EnergyLevel | null = data?.level ?? null;

  const containerBg = isDark ? '#1a1a2e' : '#f1f5f9';
  const borderColor = isDark ? '#27272a' : '#e5e7eb';
  const labelColor = isDark ? '#f4f4f5' : '#18181b';
  const subColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const unselectedBg = isDark ? '#27272a' : '#ffffff';

  function handleToggle() {
    const next = !collapsed;
    chevronRotation.value = withTiming(next ? 0 : 180, { duration: 280 });
    setCollapsed(next);
  }

  return (
    <View style={[styles.container, { backgroundColor: containerBg, borderColor }]}>
      <Pressable style={[styles.headingRow, collapsed && { marginBottom: 0 }]} onPress={handleToggle}>
        <Text style={[styles.heading, { color: labelColor }]}>
          TODAY'S ENERGY{selected ? ` · ${selected.charAt(0).toUpperCase() + selected.slice(1)}` : ''}
        </Text>
        <ReAnimated.View style={chevronStyle}>
          <Ionicons
            name="chevron-up"
            size={16}
            color={subColor}
          />
        </ReAnimated.View>
      </Pressable>
      {!collapsed && isLoading && (
        <View style={styles.row}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.btn, styles.skeleton, { backgroundColor: isDark ? '#27272a' : '#e5e7eb' }]} />
          ))}
        </View>
      )}
      {!collapsed && !isLoading && (
        <View style={styles.row}>
          {LEVELS.map(({ level, label, emoji, sub }) => {
            const isSelected = selected === level;
            return (
              <Pressable
                key={level}
                onPress={() => {
                  if (!isSelected) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    submit.mutate(level);
                  }
                }}
                style={[
                  styles.btn,
                  { backgroundColor: isSelected ? '#ec5b13' : unselectedBg },
                  isSelected && styles.btnSelected,
                ]}
                disabled={submit.isPending}
              >
                <Text style={styles.emoji}>{emoji}</Text>
                <Text style={[styles.label, { color: isSelected ? '#fff' : labelColor }]}>
                  {label}
                </Text>
                <Text style={[styles.sub, { color: isSelected ? 'rgba(255,255,255,0.75)' : subColor }]}>
                  {sub}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
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
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  heading: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    gap: 2,
  },
  btnSelected: {
    shadowColor: '#ec5b13',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  emoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  sub: {
    fontSize: 10,
  },
  skeleton: {
    height: 72,
    borderRadius: 10,
    opacity: 0.6,
  },
});
