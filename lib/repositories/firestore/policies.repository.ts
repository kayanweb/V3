import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import { IPolicyRepository, PolicyRecord } from '../contracts';

const COLLECTION = 'policies';

export class FirestorePolicyRepository implements IPolicyRepository {
  private db = getFirestoreDb();
  private coll = collection(this.db, COLLECTION);

  private mapDoc(docSnap: any): PolicyRecord {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate().toISOString(),
      updatedAt: data.updatedAt?.toDate().toISOString(),
    } as PolicyRecord;
  }

  async getAll(): Promise<PolicyRecord[]> {
    const snapshot = await getDocs(this.coll);
    return snapshot.docs.map(this.mapDoc);
  }

  async getById(id: string): Promise<PolicyRecord | undefined> {
    const docRef = doc(this.db, COLLECTION, id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? this.mapDoc(snapshot) : undefined;
  }

  async create(policy: Omit<PolicyRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<PolicyRecord> {
    const now = Timestamp.now();
    const docRef = await addDoc(this.coll, {
      ...policy,
      createdAt: now,
      updatedAt: now,
    });
    const snap = await getDoc(docRef);
    return this.mapDoc(snap);
  }

  async update(id: string, updates: Partial<PolicyRecord>): Promise<PolicyRecord | undefined> {
    const docRef = doc(this.db, COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    const snap = await getDoc(docRef);
    return snap.exists() ? this.mapDoc(snap) : undefined;
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.db, COLLECTION, id));
  }
}

export const policyRepo = new FirestorePolicyRepository();