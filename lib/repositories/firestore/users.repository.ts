import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc,
  query, where, Timestamp, serverTimestamp,
} from 'firebase/firestore'
import { getFirestoreDb } from '@/lib/firebase'
import type { IUserRepository, UserRecord } from '../contracts'

const COL = 'users'

/**
 * Safely convert a Firestore field to an ISO string.
 * Handles: Firestore Timestamp, plain Date, ISO string, undefined/null.
 */
function toISO(val: unknown): string | undefined {
  if (!val) return undefined
  if (typeof val === 'string') return val
  if (val instanceof Date) return val.toISOString()
  // Firestore Timestamp (has .toDate())
  if (typeof (val as any).toDate === 'function') return (val as any).toDate().toISOString()
  return undefined
}

function mapDoc(id: string, data: Record<string, unknown>): UserRecord {
  return {
    ...(data as UserRecord),
    id,
    createdAt: toISO(data.createdAt),
    updatedAt: toISO(data.updatedAt),
    lastLogin: toISO(data.lastLogin),
  } as UserRecord
}

export class FirestoreUserRepository implements IUserRepository {
  async getAll(): Promise<UserRecord[]> {
    const snap = await getDocs(collection(getFirestoreDb(), COL))
    return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
  }

  async getById(id: string): Promise<UserRecord | undefined> {
    const snap = await getDoc(doc(getFirestoreDb(), COL, id))
    if (!snap.exists()) return undefined
    return mapDoc(snap.id, snap.data() as Record<string, unknown>)
  }

  async getByEmployeeCode(code: string): Promise<UserRecord | undefined> {
    const q = query(collection(getFirestoreDb(), COL), where('employeeCode', '==', code.toUpperCase()))
    const snap = await getDocs(q)
    if (snap.empty) return undefined
    const d = snap.docs[0]
    return mapDoc(d.id, d.data() as Record<string, unknown>)
  }

  async create(user: Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<UserRecord> {
    const { id: suppliedId, ...rest } = user as { id?: string } & typeof user
    const now = new Date().toISOString()
    const data = { ...rest, createdAt: now, updatedAt: now }

    if (suppliedId) {
      const ref = doc(getFirestoreDb(), COL, suppliedId)
      await setDoc(ref, data, { merge: true })
      const result = await this.getById(suppliedId)
      return result as UserRecord
    }
    const ref = await addDoc(collection(getFirestoreDb(), COL), data)
    const result = await this.getById(ref.id)
    return result as UserRecord
  }

  async update(id: string, updates: Partial<UserRecord>): Promise<UserRecord | undefined> {
    const ref = doc(getFirestoreDb(), COL, id)
    // Always store updatedAt as ISO string (consistent with create)
    const payload = { ...updates, updatedAt: new Date().toISOString() }
    await updateDoc(ref, payload as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    return this.getById(id)
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(getFirestoreDb(), COL, id))
  }
}
