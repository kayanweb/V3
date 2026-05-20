/**
 * Absence Service
 * Business logic for absence management.
 */
import { absenceRepo } from '@/lib/repositories';
import type { AbsenceRecord } from '@/lib/repositories';

export type { AbsenceRecord };

export async function getAllAbsenceRecords(): Promise<AbsenceRecord[]> {
  return absenceRepo().getAll();
}

export async function getAbsenceRecordById(id: string): Promise<AbsenceRecord | undefined> {
  return absenceRepo().getById(id);
}

export async function getAbsenceRecordsByDateAndUnit(date: string, unit: string): Promise<AbsenceRecord[]> {
  return absenceRepo().getByDateAndUnit(date, unit);
}

export async function createAbsenceRecord(
  record: Omit<AbsenceRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<AbsenceRecord> {
  // Add any business logic/validation here before creating
  return absenceRepo().create(record);
}

export async function updateAbsenceRecord(
  id: string,
  updates: Partial<AbsenceRecord>
): Promise<AbsenceRecord | undefined> {
  // Add any business logic/validation here before updating
  return absenceRepo().update(id, updates);
}

export async function deleteAbsenceRecord(id: string): Promise<void> {
  // Add any business logic/validation here before deleting
  return absenceRepo().delete(id);
}