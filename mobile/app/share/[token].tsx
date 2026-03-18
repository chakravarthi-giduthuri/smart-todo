import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@smart-todo/shared';
import type { PublicShare } from '@smart-todo/shared';

const CATEGORY_COLORS: Record<string, string> = {
  Work: '#3B82F6',
  Study: '#8B5CF6',
  Personal: '#10B981',
  Health: '#F59E0B',
  Errand: '#EC4899',
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
}

function formatTime(timeStr?: string | null): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${m} ${ampm}`;
}

export default function ShareScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();

  const [data, setData] = useState<PublicShare | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid share link.');
      setIsLoading(false);
      return;
    }
    apiFetch<PublicShare>(`/api/shares/${token}`)
      .then((d) => {
        setData(d);
        setIsLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load task.');
        setIsLoading(false);
      });
  }, [token]);

  async function handleComplete() {
    if (!token || completing) return;
    setCompleting(true);
    try {
      await apiFetch(`/api/shares/${token}/complete`, { method: 'PATCH' });
      setCompleted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to mark as done.');
    } finally {
      setCompleting(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ec5b13" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={40} color="rgba(255,255,255,0.3)" />
        <Text style={styles.errorText}>{error ?? 'Task not found or link has expired.'}</Text>
      </View>
    );
  }

  const task = data.task;
  const catColor = CATEGORY_COLORS[task.category] ?? '#6b7280';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo row */}
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Ionicons name="sparkles" size={14} color="#fff" />
          </View>
          <Text style={styles.logoText}>Smart To-Do</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.sharedLabel}>Shared task</Text>

          {/* Category badge */}
          <View style={[styles.categoryBadge, { backgroundColor: `${catColor}25` }]}>
            <Text style={[styles.categoryText, { color: catColor }]}>{task.category}</Text>
          </View>

          {/* Title */}
          <Text style={styles.taskTitle}>{task.title}</Text>

          {/* Note */}
          {task.note ? (
            <Text style={styles.noteText}>{task.note}</Text>
          ) : null}

          {/* Date/time */}
          {(task.scheduled_date || task.scheduled_time) ? (
            <View style={styles.metaRow}>
              {task.scheduled_date ? (
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.metaText}>{formatDate(task.scheduled_date)}</Text>
                </View>
              ) : null}
              {task.scheduled_time ? (
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.metaText}>{formatTime(task.scheduled_time)}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Action */}
          {completed ? (
            <View style={styles.successRow}>
              <Ionicons name="checkmark-circle" size={22} color="#10b981" />
              <Text style={styles.successText}>Task marked as complete!</Text>
            </View>
          ) : (
            <Pressable
              onPress={handleComplete}
              disabled={completing}
              style={({ pressed }) => [
                styles.doneBtn,
                completing && styles.doneBtnDisabled,
                pressed && { opacity: 0.85 },
              ]}
            >
              {completing ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.doneBtnText}>Marking done...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={styles.doneBtnText}>Mark as Done</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080810',
  },
  centered: {
    flex: 1,
    backgroundColor: '#080810',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  errorText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#ec5b13',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
  },
  sharedLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 10,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 28,
    marginBottom: 12,
  },
  noteText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 20,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  doneBtn: {
    backgroundColor: '#ec5b13',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
  },
  doneBtnDisabled: {
    opacity: 0.5,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  successText: {
    color: '#10b981',
    fontSize: 15,
    fontWeight: '700',
  },
});
