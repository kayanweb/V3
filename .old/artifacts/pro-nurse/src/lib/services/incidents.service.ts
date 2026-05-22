import { incidentRepo } from '@/lib/repositories';
import type { IncidentReport } from '@/lib/repositories';

export async function getAllIncidents(): Promise<IncidentReport[]> {
  return incidentRepo().getAll();
}

export async function createIncident(incident: Omit<IncidentReport, 'id' | 'status' | 'dateTime'>): Promise<IncidentReport> {
  return incidentRepo().create(incident);
}

export async function updateIncident(id: string, updates: Partial<IncidentReport>): Promise<IncidentReport | undefined> {
  return incidentRepo().update(id, updates);
}

export async function deleteIncident(id: string): Promise<void> {
  return incidentRepo().delete(id);
}