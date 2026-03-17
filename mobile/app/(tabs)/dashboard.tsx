import { View, Text, ScrollView, StyleSheet, SafeAreaView, Dimensions, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import ReAnimated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import { BarChart, PieChart, LineChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { useDashboard, useTasks, useWeeklyReviews } from '@smart-todo/shared';
import type { WeeklyReview } from '@smart-todo/shared';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useTabVisibility } from '../../src/contexts/TabVisibilityContext';
import { CONTENT_BOTTOM } from '../../src/constants/layout';

const { width: SW } = Dimensions.get('window');

const CAT_COLORS: Record<string, string> = {
  Work: '#3B82F6', Study: '#8B5CF6', Personal: '#10B981', Health: '#F59E0B', Errand: '#EC4899',
};
const CATS = ['Work', 'Study', 'Personal', 'Health', 'Errand'];

function FadeIn({ delay = 0, children, style }: { delay?: number; children: React.ReactNode; style?: any }) {
  const op = useSharedValue(0);
  const ty = useSharedValue(12);
  const anim = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateY: ty.value }] }));
  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 380 }));
    ty.value = withDelay(delay, withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) }));
  }, []);
  return <ReAnimated.View style={[style, anim]}>{children}</ReAnimated.View>;
}

function AnimBar({ pct, color, delay }: { pct: number; color: string; delay: number }) {
  const { isDark } = useTheme();
  const trackBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const w = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({ width: `${w.value}%` as any }));
  useEffect(() => { w.value = withDelay(delay, withTiming(pct, { duration: 700 })); }, [pct]);
  return (
    <View style={[styles.barTrack, { backgroundColor: trackBg }]}>
      <ReAnimated.View style={[styles.barFill, { backgroundColor: color }, anim]} />
    </View>
  );
}

export default function DashboardScreen() {
  const { isDark } = useTheme();
  const { hideTabBar, scheduleShow } = useTabVisibility();
  const { data: dash } = useDashboard();
  const { data: tasks = [] } = useTasks();
  const { data: reviews = [] } = useWeeklyReviews();

  const bg     = isDark ? '#0d0d17' : '#f5f5f7';
  const card   = isDark ? '#1c1c28' : '#ffffff';
  const txt    = isDark ? '#f0f0f5' : '#111118';
  const muted  = isDark ? 'rgba(240,240,245,0.58)' : 'rgba(17,17,24,0.42)';
  const mutedStrong = isDark ? 'rgba(240,240,245,0.75)' : 'rgba(17,17,24,0.6)';
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  const active = tasks.filter((t) => !t.is_archived);
  const total  = active.length;
  const catMap: Record<string, number> = {};
  active.forEach((t) => { catMap[t.category] = (catMap[t.category] ?? 0) + 1; });
  const priMap: Record<number, number> = {};
  active.forEach((t) => { priMap[t.priority] = (priMap[t.priority] ?? 0) + 1; });

  const donePct  = Math.round(dash?.completion_rate ?? 0);
  const todayDone = dash?.completed_today ?? 0;
  const streak   = dash?.streak_days ?? 0;
  const overdue  = dash?.overdue_count ?? 0;
  const thisWeek = dash?.tasks_this_week ?? 0;
  const weekMax  = Math.max(...(dash?.week_chart?.map((d) => d.total ?? 0) ?? [0]), 1);
  const noOfSections = Math.min(weekMax, 5);
  const stepValue = Math.max(1, Math.ceil(weekMax / noOfSections));
  const chartMax = stepValue * noOfSections;
  const [chartMode, setChartMode] = useState<'bar' | 'line'>('bar');

  const donutData = total > 0
    ? CATS.filter((c) => (catMap[c] ?? 0) > 0).map((c) => ({ value: catMap[c] ?? 0, color: CAT_COLORS[c] }))
    : [{ value: 1, color: border }];

  const insights: string[] = (
    [
      overdue > 0 ? `${overdue} overdue task${overdue > 1 ? 's' : ''} need your attention` : null,
      streak > 0  ? `${streak}-day streak — you're on a roll` : null,
      donePct >= 80 ? "Outstanding! You're crushing your goals today." : null,
      donePct < 30 && total > 0 ? 'Try tackling your top 3 tasks before lunch.' : null,
    ] as (string | null)[]
  ).filter((s): s is string => s !== null);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: CONTENT_BOTTOM }}
        onScrollBeginDrag={hideTabBar}
        onMomentumScrollEnd={() => scheduleShow()}
        onScrollEndDrag={() => scheduleShow()}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: txt }]}>Stats</Text>
          <Text style={[styles.pageDate, { color: muted }]}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        </View>

        {/* ── Hero card ── */}
        <FadeIn delay={0} style={styles.px}>
          <View style={[styles.heroCard, { backgroundColor: card, borderColor: border }]}>
            <View style={styles.heroLeft}>
              <Text style={[styles.heroEyebrow, { color: muted }]}>TODAY</Text>
              <Text style={[styles.heroNum, { color: txt }]}>{todayDone}
                <Text style={[styles.heroTotal, { color: muted }]}>/{total}</Text>
              </Text>
              <Text style={[styles.heroSub, { color: muted }]}>tasks completed</Text>
              <View style={[styles.pctPill, { backgroundColor: donePct >= 50 ? '#10B98120' : '#ef444420' }]}>
                <View style={[styles.pctDot, { backgroundColor: donePct >= 50 ? '#10B981' : '#ef4444' }]} />
                <Text style={[styles.pctText, { color: donePct >= 50 ? '#10B981' : '#ef4444' }]}>
                  {donePct}% complete
                </Text>
              </View>
            </View>
            <View>
              {total > 0 ? (
                <PieChart
                  donut radius={58} innerRadius={40}
                  isAnimated animationDuration={900}
                  data={donutData}
                  innerCircleColor={card}
                  centerLabelComponent={() => (
                    <Text style={{ color: txt, fontSize: 14, fontWeight: '700' }}>{donePct}%</Text>
                  )}
                />
              ) : (
                <View style={[styles.emptyRing, { borderColor: border }]} />
              )}
            </View>
          </View>
        </FadeIn>

        {/* ── 3 mini chips ── */}
        {dash && (
          <FadeIn delay={80} style={[styles.px, { marginTop: 10 }]}>
            <View style={styles.chipsRow}>
              {[
                { icon: 'flame' as const,           value: `${streak}d`,  label: 'streak',    color: '#ec5b13' },
                { icon: 'alert-circle-outline' as const, value: `${overdue}`,  label: 'overdue',   color: overdue > 0 ? '#ef4444' : muted },
                { icon: 'layers-outline' as const,  value: `${thisWeek}`, label: 'this week', color: '#3B82F6' },
              ].map(({ icon, value, label, color }) => (
                <View key={label} style={[styles.chip, { backgroundColor: card, borderColor: border }]}>
                  <Ionicons name={icon} size={15} color={color} />
                  <Text style={[styles.chipVal, { color: txt }]}>{value}</Text>
                  <Text style={[styles.chipLbl, { color: muted }]}>{label}</Text>
                </View>
              ))}
            </View>
          </FadeIn>
        )}

        {/* ── Activity chart ── */}
        {dash?.week_chart && dash.week_chart.length > 0 && (
          <FadeIn delay={160} style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionLabel, { color: muted, marginBottom: 0 }]}>ACTIVITY</Text>
              <View style={[styles.togglePill, { backgroundColor: isDark ? '#1e1e2e' : '#e8e8ed' }]}>
                {(['bar', 'line'] as const).map((mode) => (
                  <Pressable
                    key={mode}
                    onPress={() => setChartMode(mode)}
                    style={[styles.toggleBtn, chartMode === mode && { backgroundColor: card }]}
                  >
                    <Ionicons
                      name={mode === 'bar' ? 'bar-chart' : 'trending-up'}
                      size={13}
                      color={chartMode === mode ? '#ec5b13' : muted}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
              {chartMode === 'bar' ? (
                <BarChart
                  data={dash.week_chart.map((d) => ({
                    value: d.total ?? 0,
                    label: new Date((d.date ?? '') + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
                    frontColor: '#ec5b13',
                    topLabelComponent: () => (
                      <Text style={{ color: mutedStrong, fontSize: 9, marginBottom: 2 }}>{d.total ?? 0}</Text>
                    ),
                  }))}
                  barWidth={26} spacing={16} roundedTop hideRules
                  xAxisColor="transparent" yAxisColor="transparent"
                  yAxisTextStyle={{ color: mutedStrong, fontSize: 9 }}
                  xAxisLabelTextStyle={{ color: mutedStrong, fontSize: 11 }}
                  noOfSections={noOfSections} stepValue={stepValue} maxValue={chartMax} barBorderRadius={5}
                  height={110} width={SW - 80}
                  isAnimated animationDuration={800}
                  backgroundColor="transparent"
                />
              ) : (
                <LineChart
                  data={dash.week_chart.map((d) => ({ value: d.total ?? 0 }))}
                  xAxisLabelTexts={dash.week_chart.map((d) =>
                    new Date((d.date ?? '') + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })
                  )}
                  color="#ec5b13"
                  dataPointsColor="#ec5b13"
                  startFillColor="#ec5b13"
                  endFillColor="transparent"
                  startOpacity={0.18}
                  endOpacity={0}
                  areaChart
                  curved
                  hideRules
                  xAxisColor="transparent"
                  yAxisColor="transparent"
                  yAxisTextStyle={{ color: mutedStrong, fontSize: 9 }}
                  xAxisLabelTextStyle={{ color: mutedStrong, fontSize: 11 }}
                  noOfSections={noOfSections} stepValue={stepValue} maxValue={chartMax}
                  height={110} width={SW - 80}
                  thickness={2}
                  isAnimated animationDuration={800}
                  backgroundColor="transparent"
                />
              )}
            </View>
          </FadeIn>
        )}

        {/* ── Categories ── */}
        {total > 0 && (
          <FadeIn delay={240} style={styles.section}>
            <Text style={[styles.sectionLabel, { color: muted }]}>CATEGORIES</Text>
            <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
              {CATS.filter((c) => (catMap[c] ?? 0) > 0).map((cat, i) => {
                const count = catMap[cat] ?? 0;
                const pct   = (count / total) * 100;
                const color = CAT_COLORS[cat];
                return (
                  <View key={cat} style={i > 0 ? styles.catRowSpaced : undefined}>
                    <View style={styles.catHeader}>
                      <View style={styles.catLeft}>
                        <View style={[styles.dot, { backgroundColor: color }]} />
                        <Text style={[styles.catName, { color: txt }]}>{cat}</Text>
                      </View>
                      <Text style={[styles.catCount, { color: mutedStrong }]}>{count}</Text>
                    </View>
                    <AnimBar pct={pct} color={color} delay={260 + i * 60} />
                  </View>
                );
              })}
            </View>
          </FadeIn>
        )}

        {/* ── Priority ── */}
        {total > 0 && (
          <FadeIn delay={320} style={styles.section}>
            <Text style={[styles.sectionLabel, { color: muted }]}>PRIORITY</Text>
            <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
              {[
                { p: 1, label: 'Critical', color: '#ef4444' },
                { p: 2, label: 'High',     color: '#f97316' },
                { p: 3, label: 'Normal',   color: '#ec5b13' },
                { p: 4, label: 'Low',      color: '#6b7280' },
                { p: 5, label: 'Minimal',  color: '#9ca3af' },
              ].map(({ p, label, color }, i) => {
                const count = priMap[p] ?? 0;
                if (!count) return null;
                return (
                  <View key={p} style={[styles.priRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: border }]}>
                    <View style={[styles.dot, { backgroundColor: color }]} />
                    <Text style={[styles.priLabel, { color: txt }]}>{label}</Text>
                    <View style={[styles.badge, { backgroundColor: color + '22' }]}>
                      <Text style={[styles.badgeText, { color }]}>{count}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </FadeIn>
        )}

        {/* ── Insights ── */}
        {insights.length > 0 && (
          <FadeIn delay={400} style={styles.section}>
            <Text style={[styles.sectionLabel, { color: muted }]}>INSIGHTS</Text>
            <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
              {insights.slice(0, 2).map((tip, i) => (
                <View key={i} style={[styles.insightRow, i > 0 && { marginTop: 12 }]}>
                  <View style={[styles.insightIcon, { backgroundColor: '#ec5b1320' }]}>
                    <Ionicons name="bulb-outline" size={14} color="#ec5b13" />
                  </View>
                  <Text style={[styles.insightText, { color: txt }]}>{tip}</Text>
                </View>
              ))}
            </View>
          </FadeIn>
        )}

        {/* ── Past reviews ── */}
        {reviews.length > 0 && (
          <FadeIn delay={480} style={styles.section}>
            <Text style={[styles.sectionLabel, { color: muted }]}>PAST REVIEWS</Text>
            {reviews.slice(0, 2).map((r: WeeklyReview) => {
              const sc      = r.score ?? 0;
              const scColor = sc >= 7 ? '#10B981' : sc >= 5 ? '#F59E0B' : '#ef4444';
              const dateLabel = new Date((r.week_start ?? '') + 'T00:00:00')
                .toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return (
                <View key={r.id} style={[styles.card, { backgroundColor: card, borderColor: border, marginBottom: 10 }]}>
                  <View style={styles.reviewTop}>
                    <Text style={[styles.reviewWeek, { color: muted }]}>Week of {dateLabel}</Text>
                    {r.score != null && (
                      <View style={[styles.badge, { backgroundColor: scColor + '22' }]}>
                        <Text style={[styles.badgeText, { color: scColor }]}>{r.score}/10</Text>
                      </View>
                    )}
                  </View>
                  {r.summary && <Text style={[styles.reviewSummary, { color: txt }]}>{r.summary}</Text>}
                </View>
              );
            })}
          </FadeIn>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  px: { paddingHorizontal: 20 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18 },
  pageTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  pageDate: { fontSize: 13, marginTop: 3, fontWeight: '500' },
  // Hero
  heroCard: { borderRadius: 20, borderWidth: 1, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLeft: { flex: 1, paddingRight: 12 },
  heroEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 8 },
  heroNum: { fontSize: 44, fontWeight: '800', letterSpacing: -1.5 },
  heroTotal: { fontSize: 28, fontWeight: '600' },
  heroSub: { fontSize: 13, marginTop: 2 },
  pctPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  pctDot: { width: 6, height: 6, borderRadius: 3 },
  pctText: { fontSize: 12, fontWeight: '700' },
  emptyRing: { width: 116, height: 116, borderRadius: 58, borderWidth: 14 },
  // Chips
  chipsRow: { flexDirection: 'row', gap: 10 },
  chip: { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 14, alignItems: 'center', gap: 3 },
  chipVal: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  chipLbl: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  // Sections
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.1, marginBottom: 10 },
  togglePill: { flexDirection: 'row', borderRadius: 8, padding: 3, gap: 2 },
  toggleBtn: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  // Category
  catRowSpaced: { marginTop: 16 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  catName: { fontSize: 14, fontWeight: '600' },
  catCount: { fontSize: 12, fontWeight: '500' },
  barTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2 },
  // Priority
  priRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  priLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  // Insights
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  insightIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  insightText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  // Reviews
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewWeek: { fontSize: 12, fontWeight: '600' },
  reviewSummary: { fontSize: 13, lineHeight: 19 },
});
