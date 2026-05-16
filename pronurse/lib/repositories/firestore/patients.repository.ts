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
import { IPatientRepository, PatientRecord } from '../contracts';

const COLLECTION = 'patients';

export class FirestorePatientRepository implements IPatientRepository {
  private db = getFirestoreDb();
  private coll = collection(this.db, COLLECTION);

  private mapDocToPatientRecord(docSnap: any): PatientRecord {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate().toISOString(),
      updatedAt: data.updatedAt?.toDate().toISOString(),
      admissionDate: data.admissionDate?.toDate().toISOString().split('T')[0], // Assuming date string
      dateOfBirth: data.dateOfBirth?.toDate().toISOString().split('T')[0], // Assuming date string
      dischargeDate: data.dischargeDate ? data.dischargeDate.toDate().toISOString().split('T')[0] : undefined,
    } as PatientRecord;
  }

  async getAll(): Promise<PatientRecord[]> {
    const snapshot = await getDocs(this.coll);
    return snapshot.docs.map(this.mapDocToPatientRecord);
  }

  async getById(id: string): Promise<PatientRecord | undefined> {
    const docRef = doc(this.db, COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return undefined;
    return this.mapDocToPatientRecord(snapshot);
  }

  async getByMrn(mrn: string): Promise<PatientRecord | undefined> {
    const q = query(this.coll, where('mrn', '==', mrn));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return undefined;
    return this.mapDocToPatientRecord(snapshot.docs[0]);
  }

  async getByDepartment(deptId: string): Promise<PatientRecord[]> {
    const q = query(this.coll, where('department', '==', deptId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(this.mapDocToPatientRecord);
  }

  async getActive(): Promise<PatientRecord[]> {
    const q = query(this.coll, where('status', '==', 'admitted'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(this.mapDocToPatientRecord);
  }

  async create(patient: Omit<PatientRecord, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> & { id?: string }): Promise<PatientRecord> {
    const now = Timestamp.now();
    const { id: suppliedId, ...rest } = patient;
    const data = {
      ...rest,
      createdAt: now,
      updatedAt: now,
      admissionDate: Timestamp.fromDate(new Date(patient.admissionDate)),
      dateOfBirth: Timestamp.fromDate(new Date(patient.dateOfBirth)),
    };

    if (suppliedId) {
      const docRef = doc(this.db, COLLECTION, suppliedId);
      await updateDoc(docRef, data); // Use updateDoc if ID is supplied, assuming it's an existing record or upsert
      return this.mapDocToPatientRecord(await getDoc(docRef));
    } else {
      const docRef = await addDoc(this.coll, data);
      return this.mapDocToPatientRecord(await getDoc(docRef));
    }
  }

  async update(id: string, updates: Partial<PatientRecord>, updatedBy: string): Promise<PatientRecord | undefined> {
    const docRef = doc(this.db, COLLECTION, id);
    await updateDoc(docRef, { ...updates, updatedAt: Timestamp.now(), updatedBy });
    return this.mapDocToPatientRecord(await getDoc(docRef));
  }

  async discharge(id: string, summary: string, updatedBy: string): Promise<PatientRecord | undefined> {
    const docRef = doc(this.db, COLLECTION, id);
    await updateDoc(docRef, { status: 'discharged', dischargeDate: Timestamp.now(), dischargeSummary: summary, updatedAt: Timestamp.now(), updatedBy });
    return this.mapDocToPatientRecord(await getDoc(docRef));
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(this.db, COLLECTION, id);
    await deleteDoc(docRef);
  }
}

export const patientRepo = new FirestorePatientRepository();