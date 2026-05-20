import { policyRepo } from '@/lib/repositories';
import type { PolicyRecord } from '@/lib/repositories';

export async function getAllPolicies(): Promise<PolicyRecord[]> {
  return policyRepo().getAll();
}

export async function getPolicyById(id: string): Promise<PolicyRecord | undefined> {
  return policyRepo().getById(id);
}

export async function createPolicy(policy: Omit<PolicyRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<PolicyRecord> {
  return policyRepo().create(policy);
}

export async function updatePolicy(id: string, updates: Partial<PolicyRecord>): Promise<PolicyRecord | undefined> {
  return policyRepo().update(id, updates);
}

export async function deletePolicy(id: string): Promise<void> {
  return policyRepo().delete(id);
}