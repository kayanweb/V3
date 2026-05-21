import { notificationRepo } from '@/lib/repositories';
import type { NotificationRecord } from '@/lib/repositories';

export async function getNotificationsByUser(userId: string): Promise<NotificationRecord[]> {
  return notificationRepo().getByUser(userId);
}

export async function getUnreadNotificationsByUser(userId: string): Promise<NotificationRecord[]> {
  return notificationRepo().getUnreadByUser(userId);
}

export async function markNotificationAsRead(id: string): Promise<void> {
  return notificationRepo().markAsRead(id);
}

export async function createNotification(notification: Omit<NotificationRecord, 'id' | 'createdAt' | 'status'>): Promise<NotificationRecord> {
  return notificationRepo().create(notification);
}

export async function deleteNotification(id: string): Promise<void> {
  return notificationRepo().delete(id);
}