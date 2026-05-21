/**
 * Patients Service
 * Business logic for patient management.
 */
import { patientRepo } from '@/lib/repositories';
import type { PatientRecord } from '@/lib/repositories/contracts';

export type { PatientRecord };

export async function getAllPatients(): Promise<PatientRecord[]> {
  return patientRepo().getAll();
}

export async function getPatientById(id: string): Promise<PatientRecord | undefined> {
  return patientRepo().getById(id);
}

export async function getPatientByMrn(mrn: string): Promise<PatientRecord | undefined> {
  return patientRepo().getByMrn(mrn);
}

export async function getPatientsByDepartment(deptId: string): Promise<PatientRecord[]> {
  return patientRepo().getByDepartment(deptId);
}

export async function getActivePatients(): Promise<PatientRecord[]> {
  return patientRepo().getActive();
}

export async function createPatient(
  patient: Omit<PatientRecord, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> & { id?: string }
): Promise<PatientRecord> {
  // Add any business logic/validation here before creating
  return patientRepo().create(patient);
}

export async function updatePatient(
  id: string,
  updates: Partial<PatientRecord>,
  updatedBy: string
): Promise<PatientRecord | undefined> {
  // Add any business logic/validation here before updating
  return patientRepo().update(id, updates, updatedBy);
}

export async function dischargePatient(id: string, summary: string, updatedBy: string): Promise<PatientRecord | undefined> {
  return patientRepo().discharge(id, summary, updatedBy);
}

export async function deletePatient(id: string): Promise<void> {
  return patientRepo().delete(id);
}