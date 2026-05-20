/**
 * Reports Service
 * Business logic for reports management.
 */
import { reportRepo } from '@/lib/repositories';
import type { ReportRecord, ReportShift, ReportStatus } from '@/lib/repositories/contracts'; // Assuming contracts.ts defines ReportRecord

export type { ReportRecord, ReportShift, ReportStatus };

export async function getAllReports(): Promise<ReportRecord[]> {
  return reportRepo().getAll();
}

export async function getReportById(id: string): Promise<ReportRecord | undefined> {
  return reportRepo().getById(id);
}

export async function getReportsByFilters(
  date?: string,
  shift?: ReportShift,
  status?: ReportStatus
): Promise<ReportRecord[]> {
  return reportRepo().getByFilters(date, shift, status);
}

export async function createReport(
  report: Omit<ReportRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ReportRecord> {
  // Add any business logic/validation here before creating
  return reportRepo().create(report);
}

export async function updateReport(
  id: string,
  updates: Partial<ReportRecord>
): Promise<ReportRecord | undefined> {
  // Add any business logic/validation here before updating
  return reportRepo().update(id, updates);
}