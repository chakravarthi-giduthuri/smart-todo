import { useState } from 'react';
import {
  Animated,
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
} from '@smart-todo/shared';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useTabVisibility } from '../../src/contexts/TabVisibilityContext';
import { ABOVE_NAV, CONTENT_BOTTOM_FAB } from '../../src/constants/layout';

const CATEGORY_COLORS: Record<string, string> = {
  Work: '#3B82F6',
  Study: '#8B5CF6',
  Personal: '#10B981',
  Health: '#F59E0B',
  Errand: '#EC4899',
};

const CATEGORIES = ['Work', 'Study', 'Personal', 'Health', 'Errand'] as const;
const RECURRENCES = ['daily', 'weekdays', 'weekly', 'monthly'] as const;

type Category = (typeof CATEGORIES)[number];
type Recurrence = (typeof RECURRENCES)[number];

interface Template {
  id: string;
  title: string;
  category: string;
  priority: number;
  scheduled_time?: string | null;
  duration_minutes?: number | null;
  recurrence: string;
  note?: string | null;
  is_active: boolean;
}

interface CreateForm {
  title: string;
  category: Category;
  priority: number;
  recurrence: Recurrence;
  scheduled_time: string;
  duration_minutes: string;
  note: string;
}

const DEFAULT_FORM: CreateForm = {
  title: '',
  category: 'Work',
  priority: 3,
  recurrence: 'daily',
  scheduled_time: '',
  duration_minutes: '',
  note: '',
};

function RecurrenceBadge({ value, isDark }: { value: string; isDark: boolean }) {
  const color = '#ec5b13';
  return (
    <View style={[styles.badge, { backgroundColor: color + '22' }]}>
      <Text style={[styles.badgeText, { color }]}>{value}</Text>
    </View>
  );
}

function PriorityBadge({ value }: { value: number }) {
  const colors = ['', '#22c55e', '#84cc16', '#f59e0b', '#f97316', '#ef4444'];
  const color = colors[value] ?? '#f59e0b';
  return (
    <View style={[styles.badge, { backgroundColor: color + '22' }]}>
      <Text style={[styles.badgeText, { color }]}>P{value}</Text>
    </View>
  );
}

export default function TemplatesScreen() {
  const { isDark } = useTheme();
  const { hideTabBar, scheduleShow, tabAnimLayout } = useTabVisibility();

  const fabBottom = tabAnimLayout.interpolate({
    inputRange: [0, 1],
    outputRange: [20, ABOVE_NAV],
    extrapolate: 'clamp',
  });
  const { data: templates = [], isLoading } = useTemplates();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const bg = isDark ? '#080810' : '#f8f8f8';
  const textColor = isDark ? '#f4f4f5' : '#18181b';
  const subText = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const cardBg = isDark ? '#1c1c28' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e5e7eb';
  const inputBg = isDark ? '#1a1a24' : '#f3f4f6';
  const orange = '#ec5b13';

  function openModal() {
    setEditingTemplate(null);
    setForm(DEFAULT_FORM);
    setShowModal(true);
  }

  function openEditModal(template: Template) {
    setEditingTemplate(template);
    setForm({
      title: template.title,
      category: (CATEGORIES.includes(template.category as Category) ? template.category : 'Work') as Category,
      priority: template.priority,
      recurrence: (RECURRENCES.includes(template.recurrence as Recurrence) ? template.recurrence : 'daily') as Recurrence,
      scheduled_time: template.scheduled_time ?? '',
      duration_minutes: template.duration_minutes != null ? String(template.duration_minutes) : '',
      note: template.note ?? '',
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingTemplate(null);
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      Alert.alert('Title required', 'Please enter a template title.');
      return;
    }
    setSaving(true);
    try {
      const fields = {
        title: form.title.trim(),
        category: form.category,
        priority: form.priority,
        recurrence: form.recurrence,
        scheduled_time: form.scheduled_time.trim() || undefined,
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes, 10) : undefined,
        note: form.note.trim() || undefined,
      };
      if (editingTemplate) {
        await updateTemplate.mutateAsync({ id: editingTemplate.id, ...fields });
      } else {
        await createTemplate.mutateAsync(fields);
      }
      setShowModal(false);
      setEditingTemplate(null);
    } catch {
      Alert.alert('Error', `Failed to ${editingTemplate ? 'update' : 'create'} template. Please try again.`);
    } finally {
      setSaving(false);
    }
  }

  function handleToggleActive(template: Template) {
    updateTemplate.mutate({ id: template.id, is_active: !template.is_active });
  }

  function handleDelete(template: Template) {
    Alert.alert(
      'Delete Template',
      `Delete "${template.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTemplate.mutate(template.id),
        },
      ]
    );
  }

  const typedTemplates = templates as Template[];

  function renderTemplate({ item }: { item: Template }) {
    const color = CATEGORY_COLORS[item.category] ?? '#6b7280';
    return (
      <View style={[styles.card, { backgroundColor: cardBg, borderColor, opacity: item.is_active ? 1 : 0.55 }]}>
        <View style={[styles.colorStripe, { backgroundColor: color }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.cardActions}>
              <Pressable
                onPress={() => handleToggleActive(item)}
                style={[styles.iconBtn, { borderColor }]}
                hitSlop={6}
              >
                <Ionicons
                  name={item.is_active ? 'pause-circle' : 'play-circle'}
                  size={20}
                  color={item.is_active ? orange : subText}
                />
              </Pressable>
              <Pressable
                onPress={() => openEditModal(item)}
                style={[styles.iconBtn, { borderColor }]}
                hitSlop={6}
              >
                <Ionicons name="create-outline" size={18} color={orange} />
              </Pressable>
              <Pressable
                onPress={() => handleDelete(item)}
                style={[styles.iconBtn, { borderColor }]}
                hitSlop={6}
              >
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </Pressable>
            </View>
          </View>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: color + '22' }]}>
              <Text style={[styles.badgeText, { color }]}>{item.category}</Text>
            </View>
            <PriorityBadge value={item.priority} />
            <RecurrenceBadge value={item.recurrence} isDark={isDark} />
            {item.scheduled_time && (
              <View style={[styles.badge, { backgroundColor: borderColor }]}>
                <Text style={[styles.badgeText, { color: subText }]}>
                  {item.scheduled_time.slice(0, 5)}
                </Text>
              </View>
            )}
            {item.duration_minutes != null && (
              <View style={[styles.badge, { backgroundColor: borderColor }]}>
                <Text style={[styles.badgeText, { color: subText }]}>{item.duration_minutes}min</Text>
              </View>
            )}
          </View>
          {item.note ? (
            <Text style={[styles.noteText, { color: subText }]} numberOfLines={1}>
              {item.note}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Templates</Text>
        <Text style={[styles.sub, { color: subText }]}>
          {typedTemplates.length} template{typedTemplates.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={orange} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={typedTemplates}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.listContent}
          onScrollBeginDrag={hideTabBar}
          onMomentumScrollEnd={() => scheduleShow()}
          onScrollEndDrag={() => scheduleShow()}
          scrollEventThrottle={16}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="repeat-outline" size={48} color={subText} />
              <Text style={[styles.emptyText, { color: subText }]}>No templates yet</Text>
              <Text style={[styles.emptyHint, { color: subText }]}>
                Tap + to create a recurring task template
              </Text>
            </View>
          }
          renderItem={renderTemplate}
        />
      )}

      <Animated.View style={[styles.fabWrapper, { bottom: fabBottom }]}>
        <Pressable
          style={[styles.fab, { backgroundColor: orange }]}
          onPress={openModal}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      </Animated.View>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={[styles.modalContainer, { backgroundColor: bg }]}>
            <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
              <Pressable onPress={closeModal} hitSlop={8}>
                <Text style={[styles.modalCancel, { color: subText }]}>Cancel</Text>
              </Pressable>
              <Text style={[styles.modalTitle, { color: textColor }]}>
                {editingTemplate ? 'Edit Template' : 'New Template'}
              </Text>
              <Pressable onPress={handleSubmit} disabled={saving} hitSlop={8}>
                <Text style={[styles.modalSave, { color: saving ? subText : orange }]}>
                  {saving ? 'Saving…' : editingTemplate ? 'Update' : 'Save'}
                </Text>
              </Pressable>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={[styles.fieldLabel, { color: subText }]}>TITLE *</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor }]}
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                placeholder="Template title"
                placeholderTextColor={subText}
                autoFocus
              />

              <Text style={[styles.fieldLabel, { color: subText }]}>CATEGORY</Text>
              <View style={styles.optionRow}>
                {CATEGORIES.map((cat) => {
                  const color = CATEGORY_COLORS[cat];
                  const active = form.category === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setForm((f) => ({ ...f, category: cat }))}
                      style={[
                        styles.optionChip,
                        { borderColor: active ? color : borderColor, backgroundColor: active ? color + '22' : 'transparent' },
                      ]}
                    >
                      <Text style={[styles.optionChipText, { color: active ? color : subText }]}>{cat}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { color: subText }]}>PRIORITY</Text>
              <View style={styles.optionRow}>
                {[1, 2, 3, 4, 5].map((p) => {
                  const colors = ['', '#22c55e', '#84cc16', '#f59e0b', '#f97316', '#ef4444'];
                  const color = colors[p];
                  const active = form.priority === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setForm((f) => ({ ...f, priority: p }))}
                      style={[
                        styles.priorityChip,
                        { borderColor: active ? color : borderColor, backgroundColor: active ? color + '22' : 'transparent' },
                      ]}
                    >
                      <Text style={[styles.optionChipText, { color: active ? color : subText }]}>P{p}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { color: subText }]}>RECURRENCE</Text>
              <View style={styles.optionRow}>
                {RECURRENCES.map((rec) => {
                  const active = form.recurrence === rec;
                  return (
                    <Pressable
                      key={rec}
                      onPress={() => setForm((f) => ({ ...f, recurrence: rec }))}
                      style={[
                        styles.optionChip,
                        { borderColor: active ? orange : borderColor, backgroundColor: active ? orange + '22' : 'transparent' },
                      ]}
                    >
                      <Text style={[styles.optionChipText, { color: active ? orange : subText }]}>
                        {rec.charAt(0).toUpperCase() + rec.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { color: subText }]}>TIME (optional)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor }]}
                value={form.scheduled_time}
                onChangeText={(v) => setForm((f) => ({ ...f, scheduled_time: v }))}
                placeholder="HH:MM (e.g. 09:00)"
                placeholderTextColor={subText}
                keyboardType="numbers-and-punctuation"
              />

              <Text style={[styles.fieldLabel, { color: subText }]}>DURATION (minutes, optional)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor }]}
                value={form.duration_minutes}
                onChangeText={(v) => setForm((f) => ({ ...f, duration_minutes: v.replace(/[^0-9]/g, '') }))}
                placeholder="e.g. 30"
                placeholderTextColor={subText}
                keyboardType="number-pad"
              />

              <Text style={[styles.fieldLabel, { color: subText }]}>NOTE (optional)</Text>
              <TextInput
                style={[styles.textInput, styles.noteInput, { backgroundColor: inputBg, color: textColor, borderColor }]}
                value={form.note}
                onChangeText={(v) => setForm((f) => ({ ...f, note: v }))}
                placeholder="Any notes for this template"
                placeholderTextColor={subText}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '700' },
  sub: { fontSize: 13, marginTop: 2 },
  listContent: { paddingHorizontal: 16, paddingBottom: CONTENT_BOTTOM_FAB },
  emptyContainer: { alignItems: 'center', marginTop: 80, gap: 10 },
  emptyText: { fontSize: 17, fontWeight: '600' },
  emptyHint: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  colorStripe: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  noteText: { fontSize: 12, marginTop: 2 },
  fabWrapper: {
    position: 'absolute',
    right: 24,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalCancel: { fontSize: 16 },
  modalSave: { fontSize: 16, fontWeight: '700' },
  formContent: { padding: 20, gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginTop: 16, marginBottom: 6 },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  noteInput: { minHeight: 80 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  priorityChip: { width: 48, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  optionChipText: { fontSize: 13, fontWeight: '600' },
});
