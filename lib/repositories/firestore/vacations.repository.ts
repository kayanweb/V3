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
import { IVacationRepository, VacationRequest } from '../contracts';

const COLLECTION = 'vacations';

export class FirestoreVacationRepository implements IVacationRepository {
  private db = getFirestoreDb();
  private coll = collection(this.db, COLLECTION);

  private mapDoc(docSnap: any): VacationRequest {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate().toISOString(),
    } as VacationRequest;
  }

  async getAll(): Promise<VacationRequest[]> {
    const snapshot = await getDocs(this.coll);
    return snapshot.docs.map(this.mapDoc);
  }

  async getByEmp(empId: string): Promise<VacationRequest[]> {
    const q = query(this.coll, where('empId', '==', empId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(this.mapDoc);
  }

  async create(request: Omit<VacationRequest, 'id' | 'createdAt'>): Promise<VacationRequest> {
    const now = Timestamp.now();
    const docRef = await addDoc(this.coll, {
      ...request,
      createdAt: now,
    });
    const snap = await getDoc(docRef);
    return this.mapDoc(snap);
  }

  async update(id: string, updates: Partial<VacationRequest>): Promise<VacationRequest | undefined> {
    const docRef = doc(this.db, COLLECTION, id);
    await updateDoc(docRef, { ...updates });
    const snap = await getDoc(docRef);
    return snap.exists() ? this.mapDoc(snap) : undefined;
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.db, COLLECTION, id));
  }
}

export const vacationRepo = new FirestoreVacationRepository();