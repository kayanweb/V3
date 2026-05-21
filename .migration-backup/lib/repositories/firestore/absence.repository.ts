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
import { IAbsenceRepository, AbsenceRecord } from '../contracts';

const COLLECTION = 'absenceRecords';

export class FirestoreAbsenceRepository implements IAbsenceRepository {
  private db = getFirestoreDb();
  private coll = collection(this.db, COLLECTION);

  private mapDocToAbsenceRecord(docSnap: any): AbsenceRecord {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate().toISOString(),
      updatedAt: data.updatedAt?.toDate().toISOString(),
    } as AbsenceRecord;
  }

  async getAll(): Promise<AbsenceRecord[]> {
    const snapshot = await getDocs(this.coll);
    return snapshot.docs.map(this.mapDocToAbsenceRecord);
  }

  async getById(id: string): Promise<AbsenceRecord | undefined> {
    const docRef = doc(this.db, COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return undefined;
    return this.mapDocToAbsenceRecord(snapshot);
  }

  async getByDateAndUnit(date: string, unit: string): Promise<AbsenceRecord[]> {
    const q = query(
      this.coll,
      where('date', '==', date),
      where('unit', '==', unit)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(this.mapDocToAbsenceRecord);
  }

  async create(data: Omit<AbsenceRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<AbsenceRecord> {
    const now = Timestamp.now();
    const docRef = await addDoc(this.coll, {
      ...data,
      date: Timestamp.fromDate(new Date(data.date)), // Convert date string to Timestamp
      createdAt: now,
      updatedAt: now,
    });
    return this.mapDocToAbsenceRecord(await getDoc(docRef));
  }

  async update(id: string, updates: Partial<AbsenceRecord>): Promise<AbsenceRecord | undefined> {
    const docRef = doc(this.db, COLLECTION, id);
    if (updates.date && typeof updates.date === 'string') {
      updates.date = Timestamp.fromDate(new Date(updates.date)) as any; // Convert date string to Timestamp
    }
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    const updatedSnap = await getDoc(docRef);
    return updatedSnap.exists() ? this.mapDocToAbsenceRecord(updatedSnap) : undefined;
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(this.db, COLLECTION, id);
    await deleteDoc(docRef);
  }
}

export const absenceRepo = new FirestoreAbsenceRepository();