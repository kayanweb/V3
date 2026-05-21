import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc,
  query, where, Timestamp,
} from 'firebase/firestore'
import { getFirestoreDb } from '@/lib/firebase'
import type { IUserRepository, UserRecord } from '../contracts'

const COL = 'users'

export class FirestoreUserRepository implements IUserRepository {
  async getAll(): Promise<UserRecord[]> {
    const snap = await getDocs(collection(getFirestoreDb(), COL))
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate().toISOString(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString(),
        lastLogin: (data.lastLogin as Timestamp)?.toDate().toISOString(),
      } as UserRecord;
    });
  }

  async getById(id: string): Promise<UserRecord | undefined> {
    const snap = await getDoc(doc(getFirestoreDb(), COL, id))
    if (!snap.exists()) return undefined;
    const data = snap.data();
    return {
      id: snap.id, ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate().toISOString(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString(),
      lastLogin: (data.lastLogin as Timestamp)?.toDate().toISOString(),
    } as UserRecord;
  }

  async getByEmployeeCode(code: string): Promise<UserRecord | undefined> {
    const q = query(collection(getFirestoreDb(), COL), where('employeeCode', '==', code.toUpperCase()))
    const snap = await getDocs(q)
    if (snap.empty) return undefined
    const d = snap.docs[0]
    const data = d.data();
    return {
      id: d.id, ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate().toISOString(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString(),
      lastLogin: (data.lastLogin as Timestamp)?.toDate().toISOString(),
    } as UserRecord;
  }

  async create(user: Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<UserRecord> {
    const now = Timestamp.now()
    const { id: suppliedId, ...rest } = user as { id?: string } & typeof user
    const data: Omit<UserRecord, 'id'> = { ...rest, createdAt: now.toDate().toISOString(), updatedAt: now.toDate().toISOString() }
    if (suppliedId) {
      // If caller supplied an id (e.g. Firebase UID), use setDoc
      const ref = doc(getFirestoreDb(), COL, suppliedId)
      await setDoc(ref, data, { merge: true })
      const snap = await getDoc(ref);
      return this.getById(suppliedId) as Promise<UserRecord>; // Re-fetch to ensure proper timestamp conversion
    }
    const ref = await addDoc(collection(getFirestoreDb(), COL), data)
    return this.getById(ref.id) as Promise<UserRecord>; // Re-fetch to ensure proper timestamp conversion
  }

  async update(id: string, updates: Partial<UserRecord>): Promise<UserRecord | undefined> {
    const ref = doc(getFirestoreDb(), COL, id)
    const payload = { ...updates, updatedAt: Timestamp.now() }
    // Convert string dates in updates to Timestamps if necessary, e.g., lastLogin
    if (typeof payload.lastLogin === 'string') {
      payload.lastLogin = Timestamp.fromDate(new Date(payload.lastLogin as string)) as unknown as string;
    }
    await updateDoc(ref, payload as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    return this.getById(id); // Re-fetch to ensure proper timestamp conversion
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(getFirestoreDb(), COL, id))
  }
}
