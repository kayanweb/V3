/**
 * Tasks Service
 * Business logic for nursing task management.
 */
import { taskRepo, auditLogRepo } from '@/lib/repositories'

export async function getMyTasks(
  userId: string
): Promise<import('@/lib/repositories').NursingTaskRecord[]> {
  return taskRepo().getByAssignedTo(userId)
}

export async function getOverdueTasks(): Promise<import('@/lib/repositories').NursingTaskRecord[]> {
  return taskRepo().getOverdue()
}

export async function getPatientTasks(
  patientId: string
): Promise<import('@/lib/repositories').NursingTaskRecord[]> {
  return taskRepo().getByPatient(patientId)
}

export async function getDepartmentTasks(
  deptId: string
): Promise<import('@/lib/repositories').NursingTaskRecord[]> {
  return taskRepo().getByDepartment(deptId)
}

export async function createTask(
  task: Omit<import('@/lib/repositories').NursingTaskRecord, 'id' | 'createdAt' | 'updatedAt' | 'escalationLevel'> & { id?: string },
  auditParams: { userId: string; userName: string; userRole: string }
): Promise<import('@/lib/repositories').NursingTaskRecord> {
  const created = await taskRepo().create(task)
  auditLogRepo().add({
    userId: auditParams.userId,
    userName: auditParams.userName,
    userRole: auditParams.userRole,
    action: 'create',
    collection: 'tasks',
    documentId: created.id,
    changes: {
      title: { oldValue: null, newValue: task.title },
      assignedTo: { oldValue: null, newValue: task.assignedTo },
      priority: { oldValue: null, newValue: task.priority },
    },
  }).catch(() => {})
  return created
}

export async function completeTask(
  id: string,
  completedBy: string,
  notes?: string,
  auditParams?: { userId: string; userName: string; userRole: string }
): Promise<import('@/lib/repositories').NursingTaskRecord | undefined> {
  const before = await taskRepo().getById(id)
  const completed = await taskRepo().complete(id, completedBy, notes)
  if (completed && auditParams) {
    auditLogRepo().add({
      userId: auditParams.userId,
      userName: auditParams.userName,
      userRole: auditParams.userRole,
      action: 'update',
      collection: 'tasks',
      documentId: id,
      changes: { status: { oldValue: before?.status ?? 'unknown', newValue: 'completed' } },
    }).catch(() => {})
  }
  return completed
}

export async function cancelTask(
  id: string,
  auditParams: { userId: string; userName: string; userRole: string }
): Promise<import('@/lib/repositories').NursingTaskRecord | undefined> {
  const before = await taskRepo().getById(id)
  const cancelled = await taskRepo().cancel(id)
  if (cancelled && auditParams) {
    auditLogRepo().add({
      userId: auditParams.userId,
      userName: auditParams.userName,
      userRole: auditParams.userRole,
      action: 'update',
      collection: 'tasks',
      documentId: id,
      changes: { status: { oldValue: before?.status ?? 'unknown', newValue: 'cancelled' } },
    }).catch(() => {})
  }
  return cancelled
}

export async function updateTaskPriority(
  id: string,
  priority: import('@/lib/repositories').NursingTaskRecord['priority'],
  auditParams: { userId: string; userName: string; userRole: string }
): Promise<import('@/lib/repositories').NursingTaskRecord | undefined> {
  const before = await taskRepo().getById(id)
  const updated = await taskRepo().update(id, { priority })
  if (updated && auditParams) {
    auditLogRepo().add({
      userId: auditParams.userId,
      userName: auditParams.userName,
      userRole: auditParams.userRole,
      action: 'update',
      collection: 'tasks',
      documentId: id,
      changes: { priority: { oldValue: before?.priority ?? 'unknown', newValue: priority } },
    }).catch(() => {})
  }
  return updated
}
