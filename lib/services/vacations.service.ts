import { vacationRepo } from '@/lib/repositories';
import type { VacationRequest } from '@/lib/repositories';

export async function getAllVacations(): Promise<VacationRequest[]> {
  return vacationRepo().getAll();
}

export async function getVacationsByEmp(empId: string): Promise<VacationRequest[]> {
  return vacationRepo().getByEmp(empId);
}

export async function createVacationRequest(request: Omit<VacationRequest, 'id' | 'createdAt'>): Promise<VacationRequest> {
  return vacationRepo().create(request);
}

export async function updateVacationStatus(id: string, updates: Partial<VacationRequest>): Promise<VacationRequest | undefined> {
  return vacationRepo().update(id, updates);
}

export async function deleteVacationRequest(id: string): Promise<void> {
  return vacationRepo().delete(id);
}