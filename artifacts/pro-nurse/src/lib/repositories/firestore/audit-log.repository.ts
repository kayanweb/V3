import {
  collection, doc, getDoc, getDocs, addDoc,
  query, where, orderBy, limit,
} from 'firebase/firestore'
import { getFirestoreDb } from '@/lib/firebase'
import type { IAuditLogRepository, AuditLogRecord } from '../contracts'

const COL = 'audit_logs'

export class FirestoreAuditLogRepository implements IAuditLogRepository {
  async add(entry: Omit<AuditLogRecord, 'id'>): Promise<void> {
    try {
      await addDoc(collection(getFirestoreDb(), COL), {
        ...entry,
        timestamp: new Date().toISOString(),
      })
    } catch { /* silent fail — audit logs should never crash the main flow */ }
  }

  async getByUser(userId: string, limitCount = 100): Promise<AuditLogRecord[]> {
    try {
      const q = query(
        collection(getFirestoreDb(), COL),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLogRecord))
    } catch { return [] }
  }

  async getByCollection(collectionName: string, limitCount = 100): Promise<AuditLogRecord[]> {
    try {
      const q = query(
        collection(getFirestoreDb(), COL),
        where('collection', '==', collectionName),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLogRecord))
    } catch { return [] }
  }

  async getRecent(limitCount = 200): Promise<AuditLogRecord[]> {
    try {
      const q = query(
        collection(getFirestoreDb(), COL),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLogRecord))
    } catch { return [] }
  }

  async getByDateRange(start: string, end: string): Promise<AuditLogRecord[]> {
    try {
      const q = query(
        collection(getFirestoreDb(), COL),
        where('timestamp', '>=', start),
        where('timestamp', '<=', end),
        orderBy('timestamp', 'desc')
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLogRecord))
    } catch { return [] }
  }
}
