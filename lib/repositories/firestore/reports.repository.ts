import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  query,
  where,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import { IReportRepository, ReportRecord, ReportShift, ReportStatus } from '../contracts';

const COLLECTION = 'reports';

export class FirestoreReportRepository implements IReportRepository {
  private db = getFirestoreDb();
  private coll = collection(this.db, COLLECTION);

  private mapDocToReportRecord(docSnap: any): ReportRecord {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate().toISOString(),
      updatedAt: data.updatedAt?.toDate().toISOString(),
    } as ReportRecord;
  }

  async getAll(): Promise<ReportRecord[]> {
    const snapshot = await getDocs(this.coll);
    return snapshot.docs.map(this.mapDocToReportRecord);
  }

  async getById(id: string): Promise<ReportRecord | undefined> {
    const docRef = doc(this.db, COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return undefined;
    return this.mapDocToReportRecord(snapshot);
  }

  async getByFilters(date?: string, shift?: ReportShift, status?: ReportStatus): Promise<ReportRecord[]> {
    let q = query(this.coll);
    if (date) {
      q = query(q, where('date', '==', date));
    }
    if (shift && (shift as string) !== 'all') {
      q = query(q, where('shift', '==', shift));
    }
    if (status && (status as string) !== 'all') {
      q = query(q, where('status', '==', status));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(this.mapDocToReportRecord);
  }

  async create(data: Omit<ReportRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportRecord> {
    const now = Timestamp.now();
    const docRef = await addDoc(this.coll, {
      ...data,
      date: Timestamp.fromDate(new Date(data.date)), // Convert date string to Timestamp
      createdAt: now,
      updatedAt: now,
    });
    return this.mapDocToReportRecord(await getDoc(docRef));
  }

  async update(id: string, updates: Partial<ReportRecord>): Promise<ReportRecord | undefined> {
    const docRef = doc(this.db, COLLECTION, id);
    if (updates.date && typeof updates.date === 'string') {
      updates.date = Timestamp.fromDate(new Date(updates.date)) as any; // Convert date string to Timestamp
    }
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    const updatedSnap = await getDoc(docRef);
    return updatedSnap.exists() ? this.mapDocToReportRecord(updatedSnap) : undefined;
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(this.db, COLLECTION, id);
    await deleteDoc(docRef);
  }
}

export const reportRepo = new FirestoreReportRepository();