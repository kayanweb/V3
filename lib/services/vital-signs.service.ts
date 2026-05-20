/**
 * Vital Signs Service
 * Business logic for patient vital signs recordings.
 */
import { vitalSignsRepo, auditLogRepo } from '@/lib/repositories'

export async function recordVitalSigns(
  entry: Omit<import('@/lib/repositories').VitalSignsRecord, 'id' | 'createdAt'>,
  auditParams: { userId: string; userName: string; userRole: string }
): Promise<import('@/lib/repositories').VitalSignsRecord> {
  const created = await vitalSignsRepo().add(entry)

  // Detect abnormal vitals and create audit flag
  const flags: string[] = []
  if (entry.temperature > 38) flags.push(`High temperature: ${entry.temperature}°C`)
  if (entry.temperature < 35) flags.push(`Low temperature: ${entry.temperature}°C`)
  if (entry.heartRate > 120) flags.push(`High heart rate: ${entry.heartRate} bpm`)
  if (entry.heartRate < 50) flags.push(`Low heart rate: ${entry.heartRate} bpm`)
  if (entry.bloodPressureSystolic > 180) flags.push(`High systolic BP: ${entry.bloodPressureSystolic}`)
  if (entry.bloodPressureDiastolic > 120) flags.push(`High diastolic BP: ${entry.bloodPressureDiastolic}`)
  if (entry.oxygenSaturation < 92) flags.push(`Low SpO2: ${entry.oxygenSaturation}%`)
  if (entry.painLevel >= 7) flags.push(`High pain level: ${entry.painLevel}/10`)

  if (flags.length > 0) {
    auditLogRepo().add({
      userId: auditParams.userId,
      userName: auditParams.userName,
      userRole: auditParams.userRole,
      action: 'create',
      collection: 'vital_signs',
      documentId: created.id,
      changes: {
        patientId: { oldValue: null, newValue: entry.patientId },
        flags: { oldValue: null, newValue: flags },
      },
    }).catch(() => {})
  }

  return created
}

export async function getPatientVitalHistory(
  patientId: string,
  limitCount = 20
): Promise<import('@/lib/repositories').VitalSignsRecord[]> {
  return vitalSignsRepo().getRecent(patientId, limitCount)
}

export async function getLatestVitals(patientId: string): Promise<import('@/lib/repositories').VitalSignsRecord | undefined> {
  const list = await vitalSignsRepo().getRecent(patientId, 1)
  return list[0]
}
