import { collection, getDocs, doc, getDoc, addDoc, query, where, orderBy, limit, Timestamp, updateDoc, deleteDoc } from 'firebase/firestore'
import { getFirestoreDb } from '@/lib/firebase'
import { IVitalSignsRepository, VitalSignsRecord } from '../contracts'

const COL = 'vitalSigns'

export class FirestoreVitalSignsRepository implements IVitalSignsRepository {
  private db = getFirestoreDb()

  private map(d: any): VitalSignsRecord {
    const data = d.data()
    return { id: d.id, ...data, timestamp: data.timestamp?.toDate().toISOString(), createdAt: data.createdAt?.toDate().toISOString() } as VitalSignsRecord
  }

  async getByPatient(patientId: string): Promise<VitalSignsRecord[]> {
    const q = query(collection(this.db, COL), where('patientId', '==', patientId), orderBy('timestamp', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(this.map)
  }

  async getByPatientRange(patientId: string, start: string, end: string): Promise<VitalSignsRecord[]> {
    const q = query(collection(this.db, COL), where('patientId', '==', patientId), where('timestamp', '>=', Timestamp.fromDate(new Date(start))), where('timestamp', '<=', Timestamp.fromDate(new Date(end))))
    const snap = await getDocs(q)
    return snap.docs.map(this.map)
  }

  async getRecent(patientId: string, count: number = 5): Promise<VitalSignsRecord[]> {
    const q = query(collection(this.db, COL), where('patientId', '==', patientId), orderBy('timestamp', 'desc'), limit(count))
    const snap = await getDocs(q)
    return snap.docs.map(this.map)
  }

  async add(entry: Omit<VitalSignsRecord, 'id' | 'createdAt'>): Promise<VitalSignsRecord> {
    const data = { ...entry, timestamp: Timestamp.fromDate(new Date(entry.timestamp)), createdAt: Timestamp.now() }
    const ref = await addDoc(collection(this.db, COL), data)
    const snap = await getDoc(ref)
    return this.map(snap)
  }

  async update(id: string, updates: Partial<VitalSignsRecord>): Promise<VitalSignsRecord | undefined> {
    const ref = doc(this.db, COL, id)
    await updateDoc(ref, { ...updates })
    const snap = await getDoc(ref)
    return snap.exists() ? this.map(snap) : undefined
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.db, COL, id))
  }
}