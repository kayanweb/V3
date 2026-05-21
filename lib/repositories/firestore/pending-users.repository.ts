import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
} from 'firebase/firestore'
import { getFirestoreDb } from '@/lib/firebase'
import type { IPendingUserRepository, PendingUserRecord } from '../contracts'

const COL = 'pendingUsers'

export class FirestorePendingUserRepository implements IPendingUserRepository {
  async getAll(): Promise<PendingUserRecord[]> {
    try {
      const snap = await getDocs(collection(getFirestoreDb(), COL))
      return snap.docs.map((d) => ({ ...d.data(), id: d.id } as PendingUserRecord))
    } catch { return [] }
  }

  async getById(id: string): Promise<PendingUserRecord | undefined> {
    try {
      const snap = await getDoc(doc(getFirestoreDb(), COL, id))
      return snap.exists() ? ({ ...snap.data(), id: snap.id } as PendingUserRecord) : undefined
    } catch { return undefined }
  }

  async upsert(
    user: Omit<PendingUserRecord, 'status' | 'requestedAt'> & { requestedAt?: string }
  ): Promise<PendingUserRecord> {
    const ref = doc(getFirestoreDb(), COL, user.id)
    const existing = await getDoc(ref)
    if (existing.exists()) {
      const existingData = existing.data() as PendingUserRecord
      // Allow re-registration only if previously rejected
      if (existingData.status !== 'rejected') {
        return { ...existingData, id: existing.id }
      }
    }
    const entry: PendingUserRecord = {
      ...user,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    }
    await setDoc(ref, entry)
    return entry
  }

  async update(id: string, updates: Partial<PendingUserRecord>): Promise<PendingUserRecord | undefined> {
    try {
      const ref = doc(getFirestoreDb(), COL, id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateDoc(ref, updates as any)
      const snap = await getDoc(ref)
      return snap.exists() ? ({ ...snap.data(), id: snap.id } as PendingUserRecord) : undefined
    } catch { return undefined }
  }
}
