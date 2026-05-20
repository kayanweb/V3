import { announcementRepo } from '@/lib/repositories';
import type { AnnouncementRecord } from '@/lib/repositories';

export async function getAllAnnouncements(): Promise<AnnouncementRecord[]> {
  return announcementRepo().getAll();
}

export async function createAnnouncement(ann: Omit<AnnouncementRecord, 'id' | 'createdAt'>): Promise<AnnouncementRecord> {
  return announcementRepo().create(ann);
}

export async function updateAnnouncement(id: string, updates: Partial<AnnouncementRecord>): Promise<AnnouncementRecord | undefined> {
  return announcementRepo().update(id, updates);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  return announcementRepo().delete(id);
}