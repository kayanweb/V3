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
import { IMaintenanceRepository, MaintenanceTicket } from '../contracts';

const COLLECTION = 'maintenanceTickets';

export class FirestoreMaintenanceRepository implements IMaintenanceRepository {
  private db = getFirestoreDb();
  private coll = collection(this.db, COLLECTION);

  private mapDoc(docSnap: any): MaintenanceTicket {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate().toISOString(),
      updatedAt: data.updatedAt?.toDate().toISOString(),
      completedAt: data.completedAt?.toDate().toISOString(),
    } as MaintenanceTicket;
  }

  async getAll(): Promise<MaintenanceTicket[]> {
    const q = query(this.coll, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(this.mapDoc);
  }

  async getById(id: string): Promise<MaintenanceTicket | undefined> {
    const docRef = doc(this.db, COLLECTION, id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? this.mapDoc(snapshot) : undefined;
  }

  async create(ticket: Omit<MaintenanceTicket, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<MaintenanceTicket> {
    const now = Timestamp.now();
    const docRef = await addDoc(this.coll, {
      ...ticket,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    });
    const snap = await getDoc(docRef);
    return this.mapDoc(snap);
  }

  async update(id: string, updates: Partial<MaintenanceTicket>): Promise<MaintenanceTicket | undefined> {
    const docRef = doc(this.db, COLLECTION, id);
    await updateDoc(docRef, { ...updates, updatedAt: Timestamp.now() });
    const snap = await getDoc(docRef);
    return snap.exists() ? this.mapDoc(snap) : undefined;
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.db, COLLECTION, id));
  }
}