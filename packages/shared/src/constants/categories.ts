import type { Category } from '../types/task';

export const CATEGORY_COLORS: Record<Category, string> = {
  Work: '#3B82F6',
  Study: '#8B5CF6',
  Personal: '#10B981',
  Health: '#F59E0B',
  Errand: '#EC4899',
};

export const CATEGORY_BG: Record<Category, string> = {
  Work: 'bg-blue-500/20 text-blue-300',
  Study: 'bg-purple-500/20 text-purple-300',
  Personal: 'bg-emerald-500/20 text-emerald-300',
  Health: 'bg-amber-500/20 text-amber-300',
  Errand: 'bg-pink-500/20 text-pink-300',
};

export const CATEGORY_LIST: Category[] = ['Work', 'Study', 'Personal', 'Health', 'Errand'];
