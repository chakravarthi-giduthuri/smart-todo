import { apiFetch } from './client';
import type { ConversationMessage, ConversationResult } from '../types/api';

export async function sendConversationMessage(
  messages: ConversationMessage[],
  currentDate: string,
  timezone?: string,
): Promise<ConversationResult> {
  return apiFetch<ConversationResult>('/api/conversation', {
    method: 'POST',
    body: JSON.stringify({ messages, current_date: currentDate, timezone }),
  });
}
