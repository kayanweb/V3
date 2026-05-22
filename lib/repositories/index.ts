/**
 * Repository Registry
 *
 * This is the ONLY file that imports concrete implementations.
 * To switch from Firestore to another backend:
 *   1. Create a new implementation folder (e.g. lib/repositories/supabase/)
 *   2. Implement each interface from contracts.ts
 *   3. Replace the imports below — nothing else in the app changes.
 */

import { FirestorePendingUserRepository }      from './firestore/pending-users.repository'
import { FirestoreUserRepository }             from './firestore/users.repository'
import { FirestoreEmployeeCredentialsRepository } from './firestore/employee-credentials.repository'
import { FirestoreRoleRepository }             from './firestore/roles.repository'
import { FirestoreDepartmentRepository }       from './firestore/departments.repository'
import { FirestoreSettingsRepository }         from './firestore/settings.repository'
import { FirestoreLoginLogRepository }         from './firestore/login-log.repository'
import { FirestorePatientRepository }          from './firestore/patients.repository'
import { FirestoreVitalSignsRepository }       from './firestore/vital-signs.repository'
import { FirestoreTaskRepository }             from './firestore/tasks.repository'
import { FirestoreAuditLogRepository }         from './firestore/audit-log.repository'
import { FirestoreInventoryRepository }        from './firestore/inventory.repository'
import { FirestoreAbsenceRepository }          from './firestore/absence.repository'
import { FirestoreReportRepository }           from './firestore/reports.repository'
import { FirestoreAnnouncementRepository }     from './firestore/announcements.repository'
import { FirestorePolicyRepository }           from './firestore/policies.repository'
import { FirestoreVacationRepository }         from './firestore/vacations.repository'
import { FirestoreNotificationRepository }     from './firestore/notifications.repository'
import { FirestoreMaintenanceRepository }      from './firestore/maintenance.repository'
import { FirestoreIncidentRepository }         from './firestore/incidents.repository'

export type {
  IPendingUserRepository,
  IUserRepository,
  IEmployeeCredentialsRepository,
  IRoleRepository,
  IIncidentRepository,
  IDepartmentRepository,
  ISettingsRepository,
  ILoginLogRepository,
  IPatientRepository,
  IVitalSignsRepository,
  ITaskRepository,
  IAnnouncementRepository,
  IPolicyRepository,
  INotificationRepository,
  IMaintenanceRepository,
  IVacationRepository,
  IAuditLogRepository,
  PendingUserRecord,
  UserRecord,
  EmployeeCredentials,
  RoleRecord,
  DepartmentRecord,
  SystemSettings,
  LoginLogRecord,
  PatientRecord,
  VitalSignsRecord,
  NursingTaskRecord,
  AnnouncementRecord,
  InventoryItem,
  PolicyRecord,
  VacationRequest,
  NotificationRecord,
  MaintenanceTicket,
  AbsenceRecord,
  ReportRecord,
  IncidentReport,
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
  AuditLogRecord,
  PendingStatus,
  UserPreferences,
} from './contracts'

// Singleton instances — lazily created
let _pendingUsers: FirestorePendingUserRepository | null = null
let _users: FirestoreUserRepository | null = null
let _credentials: FirestoreEmployeeCredentialsRepository | null = null
let _roles: FirestoreRoleRepository | null = null
let _departments: FirestoreDepartmentRepository | null = null
let _settings: FirestoreSettingsRepository | null = null
let _loginLog: FirestoreLoginLogRepository | null = null
let _patients: FirestorePatientRepository | null = null
let _vitalSigns: FirestoreVitalSignsRepository | null = null
let _tasks: FirestoreTaskRepository | null = null
let _inventory: FirestoreInventoryRepository | null = null
let _absence: FirestoreAbsenceRepository | null = null
let _reports: FirestoreReportRepository | null = null
let _announcements: FirestoreAnnouncementRepository | null = null
let _policies: FirestorePolicyRepository | null = null
let _vacations: FirestoreVacationRepository | null = null
let _notifications: FirestoreNotificationRepository | null = null
let _maintenance: FirestoreMaintenanceRepository | null = null
let _incidents: FirestoreIncidentRepository | null = null
let _auditLogs: FirestoreAuditLogRepository | null = null

export const pendingUserRepo = () => (_pendingUsers ??= new FirestorePendingUserRepository())
export const userRepo        = () => (_users        ??= new FirestoreUserRepository())
export const credentialsRepo = () => (_credentials  ??= new FirestoreEmployeeCredentialsRepository())
export const roleRepo        = () => (_roles         ??= new FirestoreRoleRepository())
export const departmentRepo  = () => (_departments   ??= new FirestoreDepartmentRepository())
export const settingsRepo    = () => (_settings      ??= new FirestoreSettingsRepository())
export const loginLogRepo    = () => (_loginLog      ??= new FirestoreLoginLogRepository())
export const patientRepo     = () => (_patients      ??= new FirestorePatientRepository())
export const vitalSignsRepo  = () => (_vitalSigns    ??= new FirestoreVitalSignsRepository())
export const taskRepo        = () => (_tasks         ??= new FirestoreTaskRepository())
export const inventoryRepo   = () => (_inventory     ??= new FirestoreInventoryRepository())
export const absenceRepo     = () => (_absence       ??= new FirestoreAbsenceRepository())
export const reportRepo      = () => (_reports       ??= new FirestoreReportRepository())
export const announcementRepo = () => (_announcements ??= new FirestoreAnnouncementRepository())
export const policyRepo      = () => (_policies      ??= new FirestorePolicyRepository())
export const vacationRepo    = () => (_vacations     ??= new FirestoreVacationRepository())
export const notificationRepo = () => (_notifications ??= new FirestoreNotificationRepository())
export const maintenanceRepo = () => (_maintenance   ??= new FirestoreMaintenanceRepository())
export const incidentRepo    = () => (_incidents     ??= new FirestoreIncidentRepository())
export const auditLogRepo    = () => (_auditLogs     ??= new FirestoreAuditLogRepository())
