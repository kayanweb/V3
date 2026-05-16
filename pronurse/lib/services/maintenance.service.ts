import { maintenanceRepo } from '@/lib/repositories';
import type { MaintenanceTicket } from '@/lib/repositories';

export async function getAllMaintenanceTickets(): Promise<MaintenanceTicket[]> {
  return maintenanceRepo().getAll();
}

export async function getMaintenanceTicketById(id: string): Promise<MaintenanceTicket | undefined> {
  return maintenanceRepo().getById(id);
}

export async function createMaintenanceTicket(ticket: Omit<MaintenanceTicket, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<MaintenanceTicket> {
  return maintenanceRepo().create(ticket);
}

export async function updateMaintenanceTicket(id: string, updates: Partial<MaintenanceTicket>): Promise<MaintenanceTicket | undefined> {
  return maintenanceRepo().update(id, updates);
}

export async function deleteMaintenanceTicket(id: string): Promise<void> {
  return maintenanceRepo().delete(id);
}