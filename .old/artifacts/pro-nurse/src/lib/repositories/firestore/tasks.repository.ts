import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit,
} from 'firebase/firestore'
import { getFirestoreDb } from '@/lib/firebase'
import type { ITaskRepository, NursingTaskRecord } from '../contracts'

const COL = 'tasks'

export class FirestoreTaskRepository implements ITaskRepository {
  async getAll(): Promise<NursingTaskRecord[]> {
    try {
      const snap = await getDocs(collection(getFirestoreDb(), COL))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as NursingTaskRecord))
    } catch { return [] }
  }

  async getByPatient(patientId: string): Promise<NursingTaskRecord[]> {
    try {
      const q = query(
        collection(getFirestoreDb(), COL),
        where('patientId', '==', patientId),
        orderBy('dueTime', 'desc')
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as NursingTaskRecord))
    } catch { return [] }
  }

  async getByAssignedTo(userId: string): Promise<NursingTaskRecord[]> {
    try {
      const q = query(
        collection(getFirestoreDb(), COL),
        where('assignedTo', '==', userId),
        orderBy('dueTime', 'asc')
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as NursingTaskRecord))
    } catch { return [] }
  }

  async getByDepartment(deptId: string): Promise<NursingTaskRecord[]> {
    try {
      const q = query(
        collection(getFirestoreDb(), COL),
        where('department', '==', deptId),
        orderBy('dueTime', 'asc')
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as NursingTaskRecord))
    } catch { return [] }
  }

  async getOverdue(): Promise<NursingTaskRecord[]> {
    try {
      const now = new Date().toISOString()
      const q = query(
        collection(getFirestoreDb(), COL),
        where('status', '==', 'in_progress'),
        where('dueTime', '<', now),
        orderBy('dueTime', 'asc')
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as NursingTaskRecord))
    } catch { return [] }
  }

  async getById(id: string): Promise<NursingTaskRecord | undefined> {
    try {
      const snap = await getDoc(doc(getFirestoreDb(), COL, id))
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as NursingTaskRecord) : undefined
    } catch { return undefined }
  }

  async create(task: Omit<NursingTaskRecord, 'id' | 'createdAt' | 'updatedAt' | 'escalationLevel'> & { id?: string }): Promise<NursingTaskRecord> {
    const now = new Date().toISOString()
    const { id: suppliedId, ...rest } = task as { id?: string } & typeof task
    const data: Omit<NursingTaskRecord, 'id'> = {
      ...rest,
      escalationLevel: 0,
      createdAt: now,
      updatedAt: now,
    }
    if (suppliedId) {
      await setDoc(doc(getFirestoreDb(), COL, suppliedId), data, { merge: true })
      return { id: suppliedId, ...data }
    }
    const ref = await addDoc(collection(getFirestoreDb(), COL), data)
    return { id: ref.id, ...data }
  }

  async update(id: string, updates: Partial<NursingTaskRecord>): Promise<NursingTaskRecord | undefined> {
    try {
      const ref = doc(getFirestoreDb(), COL, id)
      const payload = { ...updates, updatedAt: new Date().toISOString() }
      await updateDoc(ref, payload as any)
      const snap = await getDoc(ref)
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as NursingTaskRecord) : undefined
    } catch { return undefined }
  }

  async complete(id: string, completedBy: string, notes?: string): Promise<NursingTaskRecord | undefined> {
    return this.update(id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      completedBy,
      notes: notes ? `${notes}` : undefined,
    })
  }

  async cancel(id: string): Promise<NursingTaskRecord | undefined> {
    return this.update(id, { status: 'cancelled' })
  }

  async delete(id: string): Promise<void> {
    try { await deleteDoc(doc(getFirestoreDb(), COL, id)) } catch { /* ignore */ }
  }
}
