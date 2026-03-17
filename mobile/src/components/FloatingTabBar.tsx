import { useEffect } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTabVisibility } from '../contexts/TabVisibilityContext';
import { useTheme } from '../contexts/ThemeContext';
import { TAB_BAR_HEIGHT, TAB_BAR_BOTTOM, TAB_BAR_SIDE } from '../constants/layout';

// ─── Route metadata ────────────────────────────────────────────────────────────

const ROUTE_META: Record<string, { active: string; inactive: string; label: string }> = {
  index:     { active: 'home',      inactive: 'home-outline',      label: 'Home' },
  calendar:  { active: 'calendar',  inactive: 'calendar-outline',  label: 'Calendar' },
  dashboard: { active: 'bar-chart', inactive: 'bar-chart-outline', label: 'Stats' },
  templates: { active: 'repeat',    inactive: 'repeat-outline',    label: 'Templates' },
  settings:  { active: 'settings',  inactive: 'settings-outline',  label: 'Settings' },
};

// Screens that exist in the router but must not appear in the tab bar
const HIDDEN_ROUTES = new Set(['timeline', 'plan']);

// Translate-Y distance when fully hidden (tab bar + gap + a few extra pixels)
const HIDE_OFFSET = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM + 16;

// ─── TabItem component ────────────────────────────────────────────────────────

interface TabItemProps {
  iconName: string;
  label: string;
  color: string;
  onPress: () => void;
  routeKey: string;
  isFocused: boolean;
}

function TabItem({ iconName, label, color, onPress, routeKey, isFocused }: TabItemProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      key={routeKey}
      onPressIn={() => {
        scale.value = withSpring(0.88, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1.0, { damping: 12, stiffness: 300 });
      }}
      onPress={onPress}
      style={styles.tab}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
    >
      <ReAnimated.View style={animStyle}>
        <Ionicons name={iconName as any} size={22} color={color} />
        <Text style={[styles.label, { color }]}>{label}</Text>
      </ReAnimated.View>
    </Pressable>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { tabAnim, showTabBar } = useTabVisibility();
  const { isDark } = useTheme();

  // Always show the nav bar when the active tab changes (user switched tabs)
  useEffect(() => {
    showTabBar();
  }, [state.index]);

  const bg = isDark ? '#1c1c28' : '#ffffff';
  const activeColor = '#ec5b13';
  const inactiveColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';

  const translateY = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [HIDE_OFFSET, 0],
    extrapolate: 'clamp',
  });

  const visibleRoutes = state.routes.filter((r) => !HIDDEN_ROUTES.has(r.name));

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          backgroundColor: bg,
          opacity: tabAnim,
          transform: [{ translateY }],
          shadowOpacity: isDark ? 0.5 : 0.14,
        },
      ]}
    >
      {visibleRoutes.map((route) => {
        const globalIndex = state.routes.indexOf(route);
        const isFocused = state.index === globalIndex;
        const color = isFocused ? activeColor : inactiveColor;
        const meta = ROUTE_META[route.name];
        const iconName = (isFocused ? meta?.active : meta?.inactive) ?? 'ellipse-outline';
        const label =
          (descriptors[route.key].options.title as string | undefined) ??
          meta?.label ??
          route.name;

        function onPress() {
          showTabBar();
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }

        return (
          <TabItem
            key={route.key}
            routeKey={route.key}
            iconName={iconName}
            label={label}
            color={color}
            onPress={onPress}
            isFocused={isFocused}
          />
        );
      })}
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: TAB_BAR_SIDE,
    right: TAB_BAR_SIDE,
    bottom: TAB_BAR_BOTTOM,
    height: TAB_BAR_HEIGHT,
    borderRadius: 32,
    flexDirection: 'row',
    // Shadow
    shadowColor: '#000',
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
    // Clip the rounded corners properly
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
});
