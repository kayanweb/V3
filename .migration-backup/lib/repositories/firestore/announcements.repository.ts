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
  orderBy,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import { IAnnouncementRepository, AnnouncementRecord } from '../contracts';

const COLLECTION = 'announcements';

export class FirestoreAnnouncementRepository implements IAnnouncementRepository {
  private db = getFirestoreDb();
  private coll = collection(this.db, COLLECTION);

  private mapDoc(docSnap: any): AnnouncementRecord {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
    } as AnnouncementRecord;
  }

  async getAll(): Promise<AnnouncementRecord[]> {
    const q = query(this.coll, orderBy('pinned', 'desc'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(this.mapDoc);
  }

  async getById(id: string): Promise<AnnouncementRecord | undefined> {
    const docRef = doc(this.db, COLLECTION, id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? this.mapDoc(snapshot) : undefined;
  }

  async create(ann: Omit<AnnouncementRecord, 'id' | 'createdAt'>): Promise<AnnouncementRecord> {
    const now = Timestamp.now();
    const docRef = await addDoc(this.coll, {
      ...ann,
      createdAt: now,
    });
    const snap = await getDoc(docRef);
    return this.mapDoc(snap);
  }

  async update(id: string, updates: Partial<AnnouncementRecord>): Promise<AnnouncementRecord | undefined> {
    const docRef = doc(this.db, COLLECTION, id);
    await updateDoc(docRef, updates as any);
    const snap = await getDoc(docRef);
    return snap.exists() ? this.mapDoc(snap) : undefined;
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.db, COLLECTION, id));
  }
}

export const announcementRepo = new FirestoreAnnouncementRepository();