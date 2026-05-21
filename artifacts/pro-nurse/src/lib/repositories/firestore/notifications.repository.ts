import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  Timestamp,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import { INotificationRepository, NotificationRecord } from '../contracts';

const COLLECTION = 'notifications';

export class FirestoreNotificationRepository implements INotificationRepository {
  private db = getFirestoreDb();
  private coll = collection(this.db, COLLECTION);

  private mapDoc(docSnap: any): NotificationRecord {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate().toISOString(),
    } as NotificationRecord;
  }

  async getByUser(userId: string): Promise<NotificationRecord[]> {
    const q = query(this.coll, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(this.mapDoc);
  }

  async getUnreadByUser(userId: string): Promise<NotificationRecord[]> {
    const q = query(this.coll, where('userId', '==', userId), where('status', '==', 'unread'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(this.mapDoc);
  }

  async markAsRead(id: string): Promise<void> {
    const docRef = doc(this.db, COLLECTION, id);
    await updateDoc(docRef, { status: 'read' });
  }

  async create(notification: Omit<NotificationRecord, 'id' | 'createdAt' | 'status'>): Promise<NotificationRecord> {
    const now = Timestamp.now();
    const docRef = await addDoc(this.coll, {
      ...notification,
      status: 'unread',
      createdAt: now,
    });
    const snap = await getDoc(docRef);
    return this.mapDoc(snap);
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.db, COLLECTION, id));
  }
}