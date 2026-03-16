import { useState } from 'react';
import { Repeat, Plus, Trash2, ToggleLeft, ToggleRight, X, Check, Clock, Timer } from 'lucide-react';
import { PageShell } from '../components/layout/PageShell';
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from '../hooks/useTemplates';
import { CATEGORY_COLORS, CATEGORY_LIST } from '../constants/categories';
import type { Category } from '../types/task';

const RECURRENCE_OPTIONS = ['daily', 'weekdays', 'weekly', 'monthly'] as const;
type Recurrence = typeof RECURRENCE_OPTIONS[number];

interface TemplateFormState {
  title: string;
  category: Category;
  priority: number;
  scheduled_time: string;
  duration_minutes: string;
  recurrence: Recurrence;
  note: string;
}

const DEFAULT_FORM: TemplateFormState = {
  title: '',
  category: 'Work',
  priority: 3,
  scheduled_time: '',
  duration_minutes: '',
  recurrence: 'daily',
  note: '',
};

function TemplateForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<TemplateFormState>;
  onSave: (data: TemplateFormState) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<TemplateFormState>({ ...DEFAULT_FORM, ...initial });

  function set<K extends keyof TemplateFormState>(key: K, val: TemplateFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-[#18181b] border border-gray-100 dark:border-white/[0.08] rounded-2xl p-4 shadow-sm"
    >
      {/* Title */}
      <input
        autoFocus
        type="text"
        placeholder="Template title…"
        value={form.title}
        onChange={(e) => set('title', e.target.value)}
        className="w-full text-sm font-semibold bg-transparent text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-white/20 focus:outline-none mb-3 border-b border-gray-100 dark:border-white/[0.06] pb-2"
      />

      {/* Category */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {CATEGORY_LIST.map((cat) => {
          const color = CATEGORY_COLORS[cat];
          const active = form.category === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => set('category', cat)}
              className="px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all cursor-pointer"
              style={{
                backgroundColor: active ? `${color}33` : `${color}11`,
                color,
                outline: active ? `2px solid ${color}55` : 'none',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Priority */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-gray-400 dark:text-white/40 w-16 shrink-0">Priority</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => set('priority', p)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                form.priority === p
                  ? 'bg-[#ec5b13] text-white'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/30 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Time + Duration */}
      <div className="flex gap-3 mb-3">
        <label className="flex-1 flex flex-col gap-1">
          <span className="text-[11px] text-gray-400 dark:text-white/35 flex items-center gap-1">
            <Clock size={10} /> Time (HH:MM)
          </span>
          <input
            type="time"
            value={form.scheduled_time}
            onChange={(e) => set('scheduled_time', e.target.value)}
            className="text-sm bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/[0.07] rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-white/70 focus:outline-none focus:border-[#ec5b13]/50"
          />
        </label>
        <label className="flex-1 flex flex-col gap-1">
          <span className="text-[11px] text-gray-400 dark:text-white/35 flex items-center gap-1">
            <Timer size={10} /> Duration (min)
          </span>
          <input
            type="number"
            min={1}
            placeholder="30"
            value={form.duration_minutes}
            onChange={(e) => set('duration_minutes', e.target.value)}
            className="text-sm bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/[0.07] rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-white/70 focus:outline-none focus:border-[#ec5b13]/50"
          />
        </label>
      </div>

      {/* Recurrence */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {RECURRENCE_OPTIONS.map((rec) => (
          <button
            key={rec}
            type="button"
            onClick={() => set('recurrence', rec)}
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
              form.recurrence === rec
                ? 'bg-[#ec5b13]/20 text-[#ec5b13] outline outline-2 outline-[#ec5b13]/40'
                : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/35 hover:bg-gray-200 dark:hover:bg-white/10'
            }`}
          >
            {rec}
          </button>
        ))}
      </div>

      {/* Note */}
      <textarea
        placeholder="Optional note…"
        rows={2}
        value={form.note}
        onChange={(e) => set('note', e.target.value)}
        className="w-full text-xs bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/[0.07] rounded-lg px-2.5 py-2 text-gray-600 dark:text-white/50 placeholder-gray-300 dark:placeholder-white/20 focus:outline-none focus:border-amber-400/40 resize-none mb-3"
      />

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-400 dark:text-white/30 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X size={11} /> Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !form.title.trim()}
          className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#ec5b13] hover:bg-[#d94e0f] transition-colors cursor-pointer disabled:opacity-50"
        >
          <Check size={11} /> {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

export function TemplatesScreen() {
  const { data: templates = [], isLoading } = useTemplates();
  const { mutate: create, isPending: isCreating } = useCreateTemplate();
  const { mutate: update } = useUpdateTemplate();
  const { mutate: remove } = useDeleteTemplate();
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleCreate(form: TemplateFormState) {
    create(
      {
        title: form.title.trim(),
        category: form.category,
        priority: form.priority,
        scheduled_time: form.scheduled_time || null,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
        recurrence: form.recurrence,
        note: form.note.trim() || null,
      },
      { onSuccess: () => setShowForm(false) }
    );
  }

  function handleToggleActive(id: string, isActive: boolean) {
    update({ id, is_active: !isActive });
  }

  function handleDelete(id: string) {
    if (confirmDelete === id) {
      remove(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  }

  return (
    <PageShell>
      <div className="max-w-lg mx-auto px-4 pt-6 pb-28">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ec5b13]/10 flex items-center justify-center">
              <Repeat size={18} className="text-[#ec5b13]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Recurring Templates</h1>
              <p className="text-xs text-gray-400 dark:text-white/35">Tasks spawned automatically each day</p>
            </div>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-[#ec5b13] hover:bg-[#d94e0f] transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Plus size={13} /> New
            </button>
          )}
        </div>

        {/* Create form */}
        {showForm && (
          <div className="mb-4">
            <TemplateForm
              onSave={handleCreate}
              onCancel={() => setShowForm(false)}
              saving={isCreating}
            />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && templates.length === 0 && !showForm && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#ec5b13]/8 flex items-center justify-center mb-3">
              <Repeat size={24} className="text-[#ec5b13]/50" />
            </div>
            <p className="text-sm font-semibold text-gray-400 dark:text-white/30">No templates yet</p>
            <p className="text-xs text-gray-300 dark:text-white/20 mt-1">Create a template to auto-spawn daily tasks</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#ec5b13] hover:bg-[#d94e0f] transition-all cursor-pointer"
            >
              <Plus size={14} /> Create first template
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {/* Template list */}
        {!isLoading && templates.length > 0 && (
          <div className="flex flex-col gap-2">
            {(templates as Record<string, unknown>[]).map((tmpl) => {
              const id = tmpl.id as string;
              const title = tmpl.title as string;
              const category = tmpl.category as Category;
              const priority = tmpl.priority as number;
              const recurrence = tmpl.recurrence as string;
              const scheduled_time = tmpl.scheduled_time as string | null;
              const duration_minutes = tmpl.duration_minutes as number | null;
              const is_active = tmpl.is_active as boolean;
              const catColor = CATEGORY_COLORS[category] ?? '#888';

              return (
                <div
                  key={id}
                  className={`bg-white dark:bg-[#18181b] border border-gray-100 dark:border-white/[0.08] rounded-2xl px-4 py-3 shadow-sm transition-all ${!is_active ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* Left content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{title}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                        {/* Category */}
                        <span
                          className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                          style={{ backgroundColor: `${catColor}22`, color: catColor }}
                        >
                          {category}
                        </span>
                        {/* Priority */}
                        <span className="text-[11px] text-gray-400 dark:text-white/35 font-medium">P{priority}</span>
                        {/* Recurrence */}
                        <span className="flex items-center gap-0.5 text-[11px] font-medium text-[#ec5b13]/70 bg-[#ec5b13]/8 px-2 py-0.5 rounded-full capitalize">
                          <Repeat size={9} />
                          {recurrence}
                        </span>
                        {/* Time */}
                        {scheduled_time && (
                          <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-white/35">
                            <Clock size={9} /> {scheduled_time.slice(0, 5)}
                          </span>
                        )}
                        {/* Duration */}
                        {duration_minutes && (
                          <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-white/35">
                            <Timer size={9} /> {duration_minutes}m
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Active toggle */}
                      <button
                        onClick={() => handleToggleActive(id, is_active)}
                        title={is_active ? 'Disable template' : 'Enable template'}
                        className="text-gray-300 dark:text-white/20 hover:text-[#ec5b13] transition-colors cursor-pointer"
                      >
                        {is_active
                          ? <ToggleRight size={22} className="text-[#ec5b13]" />
                          : <ToggleLeft size={22} />
                        }
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(id)}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                          confirmDelete === id
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'text-gray-300 dark:text-white/20 hover:text-rose-400 hover:bg-rose-500/10'
                        }`}
                        title={confirmDelete === id ? 'Confirm delete' : 'Delete template'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
