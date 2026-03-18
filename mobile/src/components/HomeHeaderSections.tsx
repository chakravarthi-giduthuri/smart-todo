import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReAnimated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

// ─── helpers ──────────────────────────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fmt12h(time: string | null): string {
  if (!time) return '';
  const [h, m] = time.slice(0, 5).split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
}

function getRelativeTime(scheduledTime: string): string {
  const now = new Date();
  const [h, m] = scheduledTime.slice(0, 5).split(':').map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  const diffMin = Math.round((target.getTime() - now.getTime()) / 60000);
  if (diffMin <= 0) return 'Now';
  if (diffMin < 60) return `in ${diffMin}m`;
  return `in ${Math.round(diffMin / 60)}h`;
}

const CATEGORY_COLORS: Record<string, string> = {
  Work: '#3B82F6',
  Study: '#8B5CF6',
  Personal: '#10B981',
  Health: '#F59E0B',
  Errand: '#EC4899',
};

// ─── StatsTiles ───────────────────────────────────────────────────────────────

interface StatsTilesProps {
  todayDoneCount: number;
  streakDays: number;
  overdueCount: number;
  isDark: boolean;
  showOverdueOnly?: boolean;
  onPressDone?: () => void;
  onPressStreak?: () => void;
  onPressOverdue?: () => void;
}

export function StatsTiles({ todayDoneCount, streakDays, overdueCount, isDark, showOverdueOnly, onPressDone, onPressStreak, onPressOverdue }: StatsTilesProps) {
  const cardBg = isDark ? '#1c1c28' : '#ffffff';
  const border = isDark ? '#27272a' : '#e5e7eb';
  const labelColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const valueColor = isDark ? '#f4f4f5' : '#18181b';

  const tiles = [
    { emoji: '✅', label: 'TODAY DONE', value: String(todayDoneCount), valueColor, onPress: onPressDone, active: false },
    { emoji: '🔥', label: 'STREAK', value: `${streakDays}d`, valueColor, onPress: onPressStreak, active: false },
    { emoji: '⚠️', label: 'OVERDUE', value: String(overdueCount), valueColor: overdueCount > 0 ? '#ef4444' : valueColor, onPress: onPressOverdue, active: !!showOverdueOnly },
  ];

  return (
    <View style={st.statsRow}>
      {tiles.map((tile) => (
        <Pressable
          key={tile.label}
          onPress={tile.onPress}
          style={[
            st.statCard,
            { backgroundColor: tile.active ? 'rgba(239,68,68,0.08)' : cardBg, borderColor: tile.active ? '#ef4444' : border },
          ]}
        >
          <Text style={st.statEmoji}>{tile.emoji}</Text>
          <Text style={[st.statLabel, { color: labelColor }]}>{tile.label}</Text>
          <Text style={[st.statValue, { color: tile.valueColor }]}>{tile.value}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── DailyPlanBannerNative ────────────────────────────────────────────────────

interface DailyPlanBannerNativeProps {
  planCount: number;
  goalText: string | null;
  onPress: () => void;
  isDark: boolean;
}

export function DailyPlanBannerNative({
  planCount,
  goalText,
  onPress,
  isDark,
}: DailyPlanBannerNativeProps) {
  const borderColor = isDark ? 'rgba(236,91,19,0.35)' : 'rgba(236,91,19,0.25)';
  const bg = isDark ? 'rgba(236,91,19,0.08)' : 'rgba(236,91,19,0.06)';
  const subColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const mainColor = isDark ? '#f4f4f5' : '#18181b';

  const opacity = useSharedValue(0);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  useEffect(() => { opacity.value = withTiming(1, { duration: 400 }); }, []);

  const headline =
    planCount > 0
      ? `Today's Plan: ${goalText ? goalText : `${planCount} task${planCount !== 1 ? 's' : ''} committed`}`
      : 'Start your daily plan';
  const sub =
    planCount > 0 && goalText
      ? `${planCount} task${planCount !== 1 ? 's' : ''} committed`
      : 'Commit to tasks and set your goal for today';

  return (
    <ReAnimated.View style={fadeStyle}>
    <Pressable
      onPress={onPress}
      style={[st.planBanner, { backgroundColor: bg, borderColor }]}
    >
      <View style={st.planIconWrap}>
        <Ionicons name="clipboard-outline" size={18} color="#ec5b13" />
      </View>
      <View style={st.planTextWrap}>
        <Text style={[st.planHeadline, { color: mainColor }]} numberOfLines={1}>
          {headline}
        </Text>
        <Text style={[st.planSub, { color: subColor }]}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#ec5b13" />
    </Pressable>
    </ReAnimated.View>
  );
}

// ─── CapacityBarNative ────────────────────────────────────────────────────────

interface CapacityBarNativeProps {
  todayDone: number;
  todayTotal: number;
  isDark: boolean;
}

export function CapacityBarNative({ todayDone, todayTotal, isDark }: CapacityBarNativeProps) {
  const pct = todayTotal > 0 ? (todayDone / todayTotal) * 100 : 0;
  const fillColor = pct >= 100 ? '#10b981' : '#ec5b13';
  const cardBg = isDark ? '#1c1c28' : '#ffffff';
  const border = isDark ? '#27272a' : '#e5e7eb';
  const trackBg = isDark ? '#27272a' : '#e5e7eb';
  const labelColor = isDark ? '#f4f4f5' : '#18181b';
  const subColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

  const opacity = useSharedValue(0);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  useEffect(() => { opacity.value = withTiming(1, { duration: 400 }); }, []);

  return (
    <ReAnimated.View style={[st.capacityCard, { backgroundColor: cardBg, borderColor: border }, fadeStyle]}>
      <View style={st.capacityRow}>
        <Text style={[st.capacityLabel, { color: labelColor }]}>Today's Progress</Text>
        <Text style={[st.capacityPct, { color: fillColor }]}>{Math.round(pct)}%</Text>
      </View>
      <Text style={[st.capacitySub, { color: subColor }]}>
        {todayDone} of {todayTotal} tasks done
      </Text>
      <View style={[st.capacityTrack, { backgroundColor: trackBg }]}>
        <View
          style={[
            st.capacityFill,
            { width: `${Math.min(pct, 100)}%` as any, backgroundColor: fillColor },
          ]}
        />
      </View>
      {todayTotal === 0 && (
        <Text style={[st.capacityEmpty, { color: subColor }]}>No tasks scheduled for today.</Text>
      )}
    </ReAnimated.View>
  );
}

// ─── UpcomingNextHour ─────────────────────────────────────────────────────────

interface UpcomingTask {
  id: string;
  title: string;
  scheduled_time: string | null;
  category: string;
  duration_minutes?: number | null;
  priority?: number | null;
}

interface UpcomingNextHourProps {
  tasks: UpcomingTask[];
  isDark: boolean;
}

export function UpcomingNextHour({ tasks, isDark }: UpcomingNextHourProps) {
  if (tasks.length === 0) return null;

  const cardBg = isDark ? '#1c1c28' : '#ffffff';
  const border = isDark ? '#27272a' : '#e5e7eb';
  const textColor = isDark ? '#f4f4f5' : '#18181b';
  const subColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const divider = isDark ? '#27272a' : '#f1f5f9';

  return (
    <View style={[st.sectionCard, { backgroundColor: cardBg, borderColor: border }]}>
      <View style={st.sectionHeader}>
        <View style={st.sectionIconWrap}>
          <Ionicons name="flash" size={15} color="#f59e0b" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[st.sectionTitle, { color: textColor }]}>Upcoming</Text>
          <Text style={[st.sectionSub, { color: subColor }]}>Tasks in the next hour</Text>
        </View>
        <View style={st.sectionBadge}>
          <Text style={st.sectionBadgeText}>{tasks.length}</Text>
        </View>
      </View>
      {tasks.map((task, i) => {
        const rel = getRelativeTime(task.scheduled_time!);
        const isNow = rel === 'Now';
        const catColor = CATEGORY_COLORS[task.category] ?? '#6b7280';
        return (
          <View
            key={task.id}
            style={[st.upcomingRow, i > 0 && { borderTopWidth: 1, borderTopColor: divider }]}
          >
            <View
              style={[
                st.upcomingTimeBadge,
                { backgroundColor: isNow ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)' },
              ]}
            >
              <Text
                style={[st.upcomingRelTime, { color: isNow ? '#ef4444' : '#f59e0b' }]}
              >
                {isNow ? 'NOW' : rel}
              </Text>
              <Text style={[st.upcomingAbsTime, { color: subColor }]}>
                {fmt12h(task.scheduled_time)}
              </Text>
            </View>
            <View style={st.upcomingBody}>
              <Text style={[st.upcomingTitle, { color: textColor }]} numberOfLines={1}>
                {task.title}
              </Text>
              <View style={st.upcomingMeta}>
                <View style={[st.catChip, { backgroundColor: catColor + '22' }]}>
                  <Text style={[st.catChipText, { color: catColor }]}>{task.category}</Text>
                </View>
                {task.duration_minutes ? (
                  <Text style={[st.metaText, { color: subColor }]}>
                    {task.duration_minutes}m
                  </Text>
                ) : null}
              </View>
            </View>
            {task.priority != null && task.priority <= 3 ? (
              <View style={[st.priorityDot, { backgroundColor: task.priority === 1 ? '#ef4444' : task.priority === 2 ? '#f97316' : '#eab308' }]} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

// ─── FutureTasksSection ───────────────────────────────────────────────────────

interface FutureTask {
  id: string;
  title: string;
  category: string;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  priority?: number | null;
}

interface FutureTasksSectionProps {
  tasks: FutureTask[];
  expanded: boolean;
  onToggle: () => void;
  isDark: boolean;
}

export function FutureTasksSection({ tasks, expanded, onToggle, isDark }: FutureTasksSectionProps) {
  const tomorrow = getTomorrowStr();
  const cardBg = isDark ? '#1c1c28' : '#ffffff';
  const border = isDark ? '#27272a' : '#e5e7eb';
  const textColor = isDark ? '#f4f4f5' : '#18181b';
  const subColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const divider = isDark ? '#27272a' : '#f1f5f9';

  const chevronRotation = useSharedValue(expanded ? 180 : 0);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));
  useEffect(() => {
    chevronRotation.value = withTiming(expanded ? 180 : 0, { duration: 280 });
  }, [expanded]);

  function handleToggle() {
    onToggle();
  }

  const visible = expanded ? tasks : tasks.slice(0, 3);
  const hidden = tasks.length - 3;

  return (
    <View style={[st.sectionCard, { backgroundColor: cardBg, borderColor: border }]}>
      <Pressable style={st.sectionHeader} onPress={handleToggle}>
        <View style={[st.sectionIconWrap, { backgroundColor: 'rgba(236,91,19,0.1)' }]}>
          <Ionicons name="calendar-outline" size={15} color="#ec5b13" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[st.sectionTitle, { color: textColor }]}>Future Tasks</Text>
          <Text style={[st.sectionSub, { color: subColor }]}>From tomorrow onwards</Text>
        </View>
        <View style={[st.sectionBadge, { backgroundColor: isDark ? '#27272a' : '#f1f5f9' }]}>
          <Text style={[st.sectionBadgeText, { color: subColor }]}>{tasks.length}</Text>
        </View>
        <ReAnimated.View style={[{ marginLeft: 4 }, chevronStyle]}>
          <Ionicons name="chevron-down" size={16} color={subColor} />
        </ReAnimated.View>
      </Pressable>

      {tasks.length === 0 ? (
        <Text style={[st.emptyMsg, { color: subColor }]}>No future tasks scheduled.</Text>
      ) : (
        <>
          {visible.map((task, i) => {
            const catColor = CATEGORY_COLORS[task.category] ?? '#6b7280';
            const isTmr = task.scheduled_date === tomorrow;
            const dateLabel = !task.scheduled_date
              ? 'Unscheduled'
              : isTmr
              ? 'TMR'
              : new Date(task.scheduled_date + 'T00:00:00')
                  .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  .toUpperCase();
            return (
              <View
                key={task.id}
                style={[st.futureRow, i > 0 && { borderTopWidth: 1, borderTopColor: divider }]}
              >
                <View style={[st.futureDateBadge, { backgroundColor: 'rgba(236,91,19,0.08)' }]}>
                  <Text style={st.futureDateText}>{dateLabel}</Text>
                  {task.scheduled_time ? (
                    <Text style={[st.futureTimeText, { color: subColor }]}>
                      {fmt12h(task.scheduled_time)}
                    </Text>
                  ) : null}
                </View>
                <View style={st.upcomingBody}>
                  <Text style={[st.upcomingTitle, { color: textColor }]} numberOfLines={1}>
                    {task.title}
                  </Text>
                  <View style={st.upcomingMeta}>
                    <View style={[st.catChip, { backgroundColor: catColor + '22' }]}>
                      <Text style={[st.catChipText, { color: catColor }]}>{task.category}</Text>
                    </View>
                    {isTmr && (
                      <Text style={[st.metaText, { color: '#ec5b13' }]}>Tomorrow</Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
          {tasks.length > 3 && (
            <Pressable style={[st.showMoreBtn, { borderTopColor: divider }]} onPress={handleToggle}>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={13}
                color={subColor}
              />
              <Text style={[st.showMoreText, { color: subColor }]}>
                {expanded ? 'Show less' : `${hidden} more task${hidden !== 1 ? 's' : ''}`}
              </Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    gap: 2,
  },
  statEmoji: { fontSize: 20, marginBottom: 2 },
  statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  statValue: { fontSize: 18, fontWeight: '800' },

  // Plan banner
  planBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  planIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(236,91,19,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTextWrap: { flex: 1 },
  planHeadline: { fontSize: 13, fontWeight: '700' },
  planSub: { fontSize: 11, marginTop: 1 },

  // Capacity
  capacityCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  capacityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  capacityLabel: { fontSize: 13, fontWeight: '700' },
  capacityPct: { fontSize: 22, fontWeight: '800' },
  capacitySub: { fontSize: 11 },
  capacityTrack: { height: 8, borderRadius: 999, overflow: 'hidden', marginTop: 6 },
  capacityFill: { height: '100%', borderRadius: 999 },
  capacityEmpty: { fontSize: 11, fontStyle: 'italic', marginTop: 4 },

  // Shared section card
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(245,158,11,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 13, fontWeight: '700' },
  sectionSub: { fontSize: 10, marginTop: 1 },
  sectionBadge: {
    minWidth: 24,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(245,158,11,0.12)',
    alignItems: 'center',
  },
  sectionBadgeText: { fontSize: 11, fontWeight: '700', color: '#f59e0b' },

  // Upcoming rows
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  upcomingTimeBadge: {
    minWidth: 52,
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 8,
  },
  upcomingRelTime: { fontSize: 10, fontWeight: '800' },
  upcomingAbsTime: { fontSize: 10, marginTop: 2 },
  upcomingBody: { flex: 1 },
  upcomingTitle: { fontSize: 13, fontWeight: '600' },
  upcomingMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  catChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  catChipText: { fontSize: 10, fontWeight: '700' },
  metaText: { fontSize: 10 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },

  // Future rows
  futureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  futureDateBadge: {
    minWidth: 52,
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 8,
  },
  futureDateText: { fontSize: 10, fontWeight: '800', color: '#ec5b13' },
  futureTimeText: { fontSize: 10, marginTop: 2 },

  emptyMsg: { fontSize: 13, fontStyle: 'italic', paddingHorizontal: 14, paddingBottom: 14 },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 4,
  },
  showMoreText: { fontSize: 12, fontWeight: '700' },
});
