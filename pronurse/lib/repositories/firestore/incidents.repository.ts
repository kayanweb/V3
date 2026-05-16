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
import { IIncidentRepository, IncidentReport } from '../contracts';

const COLLECTION = 'incidents';

export class FirestoreIncidentRepository implements IIncidentRepository {
  private db = getFirestoreDb();
  private coll = collection(this.db, COLLECTION);

  private mapDoc(docSnap: any): IncidentReport {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      dateTime: data.dateTime?.toDate().toISOString(),
      createdAt: data.createdAt?.toDate().toISOString(),
    } as IncidentReport;
  }

  async getAll(): Promise<IncidentReport[]> {
    const q = query(this.coll, orderBy('dateTime', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(this.mapDoc);
  }

  async getById(id: string): Promise<IncidentReport | undefined> {
    const docRef = doc(this.db, COLLECTION, id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? this.mapDoc(snapshot) : undefined;
  }

  async create(incident: Omit<IncidentReport, 'id' | 'status' | 'dateTime'>): Promise<IncidentReport> {
    const now = Timestamp.now();
    const docRef = await addDoc(this.coll, {
      ...incident,
      status: 'reported',
      dateTime: now,
      createdAt: now,
    });
    const snap = await getDoc(docRef);
    return this.mapDoc(snap);
  }

  async update(id: string, updates: Partial<IncidentReport>): Promise<IncidentReport | undefined> {
    const docRef = doc(this.db, COLLECTION, id);
    await updateDoc(docRef, { ...updates, updatedAt: Timestamp.now() });
    const snap = await getDoc(docRef);
    return snap.exists() ? this.mapDoc(snap) : undefined;
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.db, COLLECTION, id));
  }
}