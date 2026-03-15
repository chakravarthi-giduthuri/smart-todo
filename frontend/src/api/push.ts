import { apiFetch } from './client';

export async function subscribePush(subscription: PushSubscription): Promise<void> {
  await apiFetch('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription.toJSON()),
  });
}

export async function testPush(): Promise<void> {
  await apiFetch('/api/push/test', { method: 'POST' });
}
