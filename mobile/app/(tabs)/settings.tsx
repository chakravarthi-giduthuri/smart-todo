import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  SafeAreaView,
  Alert,
  TextInput,
  ActivityIndicator,
  Linking,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useTabVisibility } from '../../src/contexts/TabVisibilityContext';
import { CONTENT_BOTTOM } from '../../src/constants/layout';
import { supabase } from '../../src/lib/supabase';
import { useAiInsights } from '@smart-todo/shared';
import { registerForPushNotifications } from '../../src/hooks/useNotifications';
import type { RuleInsight } from '@smart-todo/shared';

const TABS = ['Profile', 'Notifications', 'Security', 'Account'] as const;
type TabType = typeof TABS[number];

function getInitials(email?: string | null): string {
  if (!email) return '?';
  const parts = email.split('@')[0].split(/[._-]/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export default function SettingsScreen() {
  const { isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { hideTabBar, scheduleShow } = useTabVisibility();
  const [activeTab, setActiveTab] = useState<TabType>('Profile');

  // Notifications tab
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifStatus, setNotifStatus] = useState<string>('unknown');

  // Security tab
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ text: string; error: boolean } | null>(null);

  // Profile tab — display name editing
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [nameSaving, setNameSaving] = useState(false);

  // Profile tab — AI learning
  const [resetting, setResetting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { data: insights, isLoading: insightsLoading, refetch: refetchInsights } = useAiInsights();

  const bg = isDark ? '#080810' : '#f8f8f8';
  const textColor = isDark ? '#f4f4f5' : '#18181b';
  const subText = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const sectionBg = isDark ? '#1c1c28' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e5e7eb';
  const inputBg = isDark ? '#1a1a2e' : '#f8f8f8';

  const initials = getInitials(user?.email);
  const emailPrefix = (user?.user_metadata?.display_name as string | undefined) || user?.email?.split('@')[0] || 'User';
  // Initialize displayName from metadata when user loads
  useEffect(() => {
    setDisplayName((user?.user_metadata?.display_name as string | undefined) || user?.email?.split('@')[0] || '');
  }, [user]);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) => {
      setNotifEnabled(status === 'granted');
      setNotifStatus(status);
    });
  }, []);


  async function handleNotificationsToggle(value: boolean) {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotifEnabled(status === 'granted');
      setNotifStatus(status);
      if (status === 'granted') {
        registerForPushNotifications().catch(() => {});
      }
    } else {
      setNotifEnabled(false);
      setNotifStatus('denied');
    }
  }

  async function handleEnableNotifications() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      setNotifEnabled(true);
      setNotifStatus('granted');
      await handleRegisterToken();
    } else {
      // Permission was previously denied — guide user to system Settings
      Alert.alert(
        'Notifications Blocked',
        'To enable notifications, open your device Settings and allow notifications for this app.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
    }
  }

  async function handleSaveName() {
    if (!displayName.trim()) return;
    setNameSaving(true);
    try {
      await supabase.auth.updateUser({ data: { display_name: displayName.trim() } });
      setEditingName(false);
    } catch {
      Alert.alert('Error', 'Could not update display name.');
    } finally {
      setNameSaving(false);
    }
  }

  async function handleChangePassword() {
    setPwMsg(null);
    if (!pwNew || pwNew.length < 6) {
      setPwMsg({ text: 'Password must be at least 6 characters', error: true });
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwMsg({ text: 'Passwords do not match', error: true });
      return;
    }
    setPwSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwNew });
      if (error) throw error;
      setPwNew('');
      setPwConfirm('');
      setPwMsg({ text: 'Password updated successfully', error: false });
    } catch (err) {
      setPwMsg({ text: err instanceof Error ? err.message : 'Failed to update password', error: true });
    } finally {
      setPwSaving(false);
    }
  }

  async function handleResetAiLearning() {
    Alert.alert(
      'Reset AI Learning',
      'This will delete all learned preferences. The AI will start fresh. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            try {
              await apiFetch('/api/preferences/reset', { method: 'DELETE' });
              refetchInsights();
              Alert.alert('Done', 'AI learning data has been reset.');
            } catch {
              Alert.alert('Error', 'Could not reset AI learning.');
            } finally {
              setResetting(false);
            }
          },
        },
      ],
    );
  }

  function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'To delete your account and all data, please contact support.',
      [{ text: 'OK' }],
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Text style={[styles.title, { color: textColor }]}>Settings</Text>
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { borderBottomColor: borderColor, backgroundColor: sectionBg }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarContent}>
          {TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabItem, active && { borderBottomColor: '#ec5b13', borderBottomWidth: 2 }]}
              >
                <Text style={[styles.tabLabel, { color: active ? '#ec5b13' : subText }]}>
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: CONTENT_BOTTOM }]}
        onScrollBeginDrag={hideTabBar}
        onMomentumScrollEnd={() => scheduleShow()}
        onScrollEndDrag={() => scheduleShow()}
        scrollEventThrottle={16}
      >

        {/* ── Profile tab ── */}
        {activeTab === 'Profile' && (
          <View style={styles.tabContent}>
            {/* Avatar + info */}
            <View style={[styles.profileCard, { backgroundColor: sectionBg, borderColor }]}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: textColor }]}>{emailPrefix}</Text>
                <Text style={[styles.profileEmail, { color: subText }]}>{user?.email}</Text>
              </View>
              <Pressable
                onPress={() => setEditingName(true)}
                style={styles.editProfileBtn}
                hitSlop={8}
              >
                <Ionicons name="pencil-outline" size={16} color="#ec5b13" />
              </Pressable>
            </View>

            {/* Fields */}
            <Text style={[styles.sectionLabel, { color: subText }]}>PERSONAL INFO</Text>
            <View style={[styles.section, { backgroundColor: sectionBg, borderColor }]}>
              {editingName ? (
                <View style={styles.fieldRow}>
                  <Text style={[styles.fieldKey, { color: subText }]}>Display Name</Text>
                  <TextInput
                    style={[styles.inlineInput, { color: textColor, borderColor, backgroundColor: inputBg }]}
                    value={displayName}
                    onChangeText={setDisplayName}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleSaveName}
                  />
                  <Pressable onPress={handleSaveName} disabled={nameSaving} hitSlop={6} style={{ marginLeft: 8 }}>
                    {nameSaving
                      ? <ActivityIndicator size="small" color="#ec5b13" />
                      : <Ionicons name="checkmark" size={20} color="#ec5b13" />
                    }
                  </Pressable>
                  <Pressable onPress={() => { setEditingName(false); setDisplayName(emailPrefix); }} hitSlop={6} style={{ marginLeft: 4 }}>
                    <Ionicons name="close" size={20} color={subText} />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.fieldRow}>
                  <Text style={[styles.fieldKey, { color: subText }]}>Display Name</Text>
                  <Text style={[styles.fieldVal, { color: textColor }]}>{emailPrefix}</Text>
                  <Pressable onPress={() => setEditingName(true)} hitSlop={6}>
                    <Ionicons name="pencil-outline" size={14} color="#ec5b13" />
                  </Pressable>
                </View>
              )}
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
              <View style={styles.fieldRow}>
                <Text style={[styles.fieldKey, { color: subText }]}>Email</Text>
                <Text style={[styles.fieldVal, { color: textColor }]} numberOfLines={1}>{user?.email ?? '—'}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
              <View style={styles.fieldRow}>
                <Text style={[styles.fieldKey, { color: subText }]}>Timezone</Text>
                <Text style={[styles.fieldVal, { color: textColor }]} numberOfLines={1}>{timezone}</Text>
              </View>
            </View>

            {/* AI Learning Journal */}
            <Text style={[styles.sectionLabel, { color: subText }]}>AI LEARNING JOURNAL</Text>
            <View style={[styles.section, { backgroundColor: sectionBg, borderColor }]}>
              {/* Header row */}
              <View style={[styles.aiHeader, { borderBottomColor: borderColor }]}>
                <View style={styles.aiHeaderLeft}>
                  <View style={[styles.aiIcon, { backgroundColor: 'rgba(139,92,246,0.15)' }]}>
                    <Ionicons name="bulb-outline" size={16} color="#8B5CF6" />
                  </View>
                  <View>
                    <Text style={[styles.aiTitle, { color: textColor }]}>How Claude evolves with your edits</Text>
                  </View>
                </View>
                {(insights?.rules?.length ?? 0) > 0 && (
                  <View style={styles.aiBadge}>
                    <Ionicons name="flash" size={10} color="#8B5CF6" />
                    <Text style={styles.aiBadgeText}>{insights!.rules.length} active</Text>
                  </View>
                )}
              </View>

              {/* Stats row */}
              {!insightsLoading && insights && (
                <View style={[styles.aiStatsRow, { borderBottomColor: borderColor }]}>
                  {[
                    { label: 'Total edits', value: String(insights.stats?.total_overrides ?? 0) },
                    { label: 'Rules learned', value: String(insights.stats?.rules_active ?? 0) },
                    { label: 'Until next', value: (insights.stats?.total_overrides ?? 0) < 5 ? String(5 - (insights.stats?.total_overrides ?? 0)) : String(insights.stats?.overrides_until_next_rule ?? '—') },
                  ].map(({ label, value }) => (
                    <View key={label} style={[styles.aiStatTile, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f4f4f5' }]}>
                      <Text style={[styles.aiStatValue, { color: textColor }]}>{value}</Text>
                      <Text style={[styles.aiStatLabel, { color: subText }]}>{label}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Progress bar when no rules yet */}
              {!insightsLoading && insights && (insights.rules?.length ?? 0) === 0 && (
                <View style={[styles.aiProgress, { borderBottomColor: borderColor }]}>
                  <View style={styles.aiProgressLabelRow}>
                    <Text style={[styles.aiProgressLabel, { color: subText }]}>Learning progress</Text>
                    <Text style={[styles.aiProgressLabel, { color: subText }]}>{insights.stats?.total_overrides ?? 0}/5 edits</Text>
                  </View>
                  <View style={[styles.aiProgressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb' }]}>
                    <View style={[styles.aiProgressFill, { width: `${Math.min(100, ((insights.stats?.total_overrides ?? 0) / 5) * 100)}%` as any }]} />
                  </View>
                  <Text style={[styles.aiProgressHint, { color: subText }]}>
                    {(insights.stats?.total_overrides ?? 0) === 0
                      ? 'Edit any task field to start teaching Claude your preferences.'
                      : `${5 - (insights.stats?.total_overrides ?? 0)} more edits until Claude starts adapting.`}
                  </Text>
                </View>
              )}

              {/* Active rules */}
              {(insights?.rules?.length ?? 0) > 0 && (
                <View style={[styles.aiRulesSection, { borderBottomColor: borderColor }]}>
                  <Text style={[styles.aiSubheading, { color: subText }]}>ACTIVE RULES</Text>
                  {insights!.rules.map((rule: RuleInsight, i: number) => {
                    const [from, to] = rule.direction.split('→');
                    const fieldColors: Record<string, string> = { priority: '#f97316', category: '#6366f1', scheduled_time: '#06b6d4', scheduled_date: '#10b981', title: '#a78bfa' };
                    const fc = fieldColors[rule.field] ?? '#6b7280';
                    return (
                      <View key={i} style={[styles.ruleCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f9f9f9', borderColor }]}>
                        <View style={styles.ruleTop}>
                          <Text style={[styles.ruleField, { color: fc }]}>{rule.field}</Text>
                          <View style={styles.ruleStrengthDots}>
                            {[1,2,3].map((d) => (
                              <View key={d} style={[styles.dot, {
                                backgroundColor: d <= (rule.strength === 'observing' ? 1 : rule.strength === 'learning' ? 2 : 3)
                                  ? (rule.strength === 'confident' ? '#10b981' : rule.strength === 'learning' ? '#eab308' : 'rgba(255,255,255,0.2)')
                                  : 'rgba(255,255,255,0.1)'
                              }]} />
                            ))}
                            <Text style={[styles.strengthLabel, { color: rule.strength === 'confident' ? '#10b981' : rule.strength === 'learning' ? '#eab308' : subText }]}>
                              {rule.strength}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.ruleDir}>
                          <Text style={[styles.ruleFrom, { color: subText }]}>{from || '—'}</Text>
                          <Text style={[styles.ruleArrow, { color: subText }]}> → </Text>
                          <Text style={[styles.ruleTo, { color: textColor }]}>{to || '—'}</Text>
                          <Text style={[styles.ruleCount, { color: subText }]}> · {rule.count}×</Text>
                        </View>
                        <Text style={[styles.ruleText, { color: subText }]}>{rule.rule_text}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Edit history toggle */}
              {(insights?.recent_overrides?.length ?? 0) > 0 && (
                <>
                  <Pressable
                    onPress={() => setShowHistory((v) => !v)}
                    style={[styles.historyToggle, { borderBottomColor: borderColor }]}
                  >
                    <Text style={[styles.aiSubheading, { color: subText }]}>EDIT HISTORY ({insights!.recent_overrides.length})</Text>
                    <Ionicons name={showHistory ? 'chevron-up' : 'chevron-down'} size={14} color={subText} />
                  </Pressable>
                  {showHistory && insights!.recent_overrides.map((entry) => (
                    <View key={entry.id} style={[styles.historyRow, { borderBottomColor: borderColor }]}>
                      <View>
                        {entry.task_title && <Text style={[styles.historyTask, { color: textColor }]} numberOfLines={1}>{entry.task_title}</Text>}
                        <Text style={[styles.historyChange, { color: subText }]}>
                          {entry.field_changed}: <Text style={{ textDecorationLine: 'line-through' }}>{entry.ai_value || '—'}</Text> → {entry.user_value || '—'}
                        </Text>
                      </View>
                      <Text style={[styles.historyTime, { color: subText }]}>
                        {Math.round((Date.now() - new Date(entry.created_at).getTime()) / 60000)}m ago
                      </Text>
                    </View>
                  ))}
                </>
              )}

              {/* Reset button */}
              <View style={styles.resetBtn}>
                <Pressable
                  onPress={handleResetAiLearning}
                  disabled={resetting}
                  style={styles.resetBtnInner}
                >
                  {resetting
                    ? <ActivityIndicator size="small" color="#ef4444" />
                    : <Ionicons name="refresh-outline" size={16} color="#ef4444" />
                  }
                  <Text style={styles.resetBtnText}>{resetting ? 'Resetting...' : 'Reset AI Learning'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* ── Notifications tab ── */}
        {activeTab === 'Notifications' && (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionLabel, { color: subText }]}>PUSH NOTIFICATIONS</Text>
            <View style={[styles.section, { backgroundColor: sectionBg, borderColor }]}>
              <View style={styles.switchRow}>
                <View style={styles.switchRowLeft}>
                  <View style={[styles.rowIcon, { backgroundColor: 'rgba(236,91,19,0.15)' }]}>
                    <Ionicons name="notifications-outline" size={18} color="#ec5b13" />
                  </View>
                  <View>
                    <Text style={[styles.rowLabel, { color: textColor }]}>Push Notifications</Text>
                    <Text style={[styles.rowSub, { color: notifEnabled ? '#10b981' : subText }]}>
                      {notifEnabled ? 'Enabled' : 'Not enabled'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notifEnabled}
                  onValueChange={handleNotificationsToggle}
                  trackColor={{ true: '#ec5b13', false: '#3f3f46' }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {!notifEnabled && (
              <>
                <Text style={[styles.hintText, { color: subText }]}>
                  Enable notifications to receive task reminders 15 minutes before they're due.
                </Text>
                <TouchableOpacity
                  onPress={handleEnableNotifications}
                  activeOpacity={0.8}
                  style={styles.enableNotifBtn}
                >
                  <Ionicons name="notifications-outline" size={16} color="#fff" />
                  <Text style={styles.enableNotifBtnText}>Enable Notifications</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* ── Security tab ── */}
        {activeTab === 'Security' && (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionLabel, { color: subText }]}>CHANGE PASSWORD</Text>
            <View style={[styles.section, { backgroundColor: sectionBg, borderColor }]}>
              <View style={styles.pwFormInner}>
                <Text style={[styles.fieldKey, { color: subText, marginBottom: 6 }]}>New Password</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
                  value={pwNew}
                  onChangeText={setPwNew}
                  placeholder="At least 6 characters"
                  placeholderTextColor={subText}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Text style={[styles.fieldKey, { color: subText, marginBottom: 6, marginTop: 14 }]}>Confirm Password</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: inputBg, color: textColor, borderColor: (pwConfirm && pwNew !== pwConfirm) ? '#ef4444' : borderColor },
                  ]}
                  value={pwConfirm}
                  onChangeText={setPwConfirm}
                  placeholder="Repeat new password"
                  placeholderTextColor={subText}
                  secureTextEntry
                  autoCapitalize="none"
                />
                {pwConfirm !== '' && pwNew !== pwConfirm && (
                  <Text style={styles.errorText}>Passwords do not match</Text>
                )}
                {pwMsg && (
                  <Text style={[styles.msgText, { color: pwMsg.error ? '#ef4444' : '#10b981' }]}>
                    {pwMsg.text}
                  </Text>
                )}
                <TouchableOpacity
                  onPress={handleChangePassword}
                  disabled={pwSaving || !pwNew || !pwConfirm || pwNew !== pwConfirm}
                  activeOpacity={0.8}
                  style={[
                    styles.submitBtn,
                    (pwSaving || !pwNew || !pwConfirm || pwNew !== pwConfirm) && styles.submitBtnDisabled,
                  ]}
                >
                  {pwSaving
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.submitBtnText}>Update Password</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ── Account tab ── */}
        {activeTab === 'Account' && (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionLabel, { color: subText }]}>APPEARANCE</Text>
            <View style={[styles.section, { backgroundColor: sectionBg, borderColor }]}>
              <View style={styles.switchRow}>
                <View style={styles.switchRowLeft}>
                  <View style={[styles.rowIcon, { backgroundColor: 'rgba(236,91,19,0.15)' }]}>
                    <Ionicons name="moon-outline" size={18} color="#ec5b13" />
                  </View>
                  <Text style={[styles.rowLabel, { color: textColor }]}>Dark Mode</Text>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ true: '#ec5b13', false: '#3f3f46' }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            <Text style={[styles.sectionLabel, { color: subText }]}>ABOUT</Text>
            <View style={[styles.section, { backgroundColor: sectionBg, borderColor }]}>
              <View style={styles.fieldRow}>
                <Text style={[styles.fieldKey, { color: subText }]}>App Version</Text>
                <Text style={[styles.fieldVal, { color: textColor }]}>{appVersion}</Text>
              </View>
            </View>

            <Text style={[styles.sectionLabel, { color: subText }]}>DANGER ZONE</Text>
            <View style={[styles.section, { backgroundColor: sectionBg, borderColor }]}>
              <Pressable onPress={handleSignOut}>
                <View style={[styles.switchRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor }]}>
                  <View style={styles.switchRowLeft}>
                    <View style={[styles.rowIcon, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                      <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                    </View>
                    <Text style={[styles.rowLabel, { color: '#ef4444' }]}>Sign Out</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#ef4444" />
                </View>
              </Pressable>
              <Pressable onPress={handleDeleteAccount}>
                <View style={styles.switchRow}>
                  <View style={styles.switchRowLeft}>
                    <View style={[styles.rowIcon, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </View>
                    <Text style={[styles.rowLabel, { color: '#ef4444' }]}>Delete Account</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#ef4444" />
                </View>
              </Pressable>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  tabBar: {
    borderBottomWidth: 1,
  },
  tabBarContent: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    minWidth: 80,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingTop: 4,
  },
  tabContent: {
    paddingHorizontal: 0,
    paddingBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  profileCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ec5b13',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldKey: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 100,
    marginRight: 8,
  },
  fieldVal: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  resetBtn: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'transparent',
  },
  resetBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
    columnGap: 8,
  },
  resetBtnText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 60,
  },
  switchRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  rowSub: {
    fontSize: 12,
    marginTop: 1,
  },
  hintText: {
    fontSize: 13,
    marginHorizontal: 20,
    marginTop: 10,
    lineHeight: 18,
  },
  enableNotifBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#ec5b13',
    minHeight: 48,
  },
  enableNotifBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  pwFormInner: {
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  msgText: {
    fontSize: 13,
    marginTop: 8,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#ec5b13',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 16,
    minHeight: 48,
  },
  submitBtnDisabled: {
    backgroundColor: 'rgba(236,91,19,0.4)',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  // AI Learning Journal styles
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  aiHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  aiIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.15)',
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  aiStatsRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  aiStatTile: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  aiStatValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  aiStatLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  aiProgress: {
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  aiProgressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  aiProgressLabel: {
    fontSize: 11,
  },
  aiProgressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  aiProgressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#8B5CF6',
  },
  aiProgressHint: {
    fontSize: 11,
    lineHeight: 16,
  },
  aiRulesSection: {
    padding: 14,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  aiSubheading: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  ruleCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  ruleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ruleField: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ruleStrengthDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  strengthLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginLeft: 4,
  },
  ruleDir: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ruleFrom: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  ruleArrow: {
    fontSize: 12,
  },
  ruleTo: {
    fontSize: 12,
    fontWeight: '600',
  },
  ruleCount: {
    fontSize: 11,
  },
  ruleText: {
    fontSize: 11,
    lineHeight: 16,
  },
  historyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  historyTask: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    flex: 1,
  },
  historyChange: {
    fontSize: 11,
    lineHeight: 16,
  },
  historyTime: {
    fontSize: 10,
    marginTop: 2,
    flexShrink: 0,
  },
  editProfileBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(236,91,19,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineInput: {
    flex: 1,
    fontSize: 14,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 36,
  },
});
