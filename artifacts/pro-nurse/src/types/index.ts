/**
 * Repository Contracts
 *
 * These interfaces define the DATA CONTRACT for all repositories.
 * Swapping backends (Firestore → PostgreSQL → Supabase → MongoDB)
 * requires only implementing a new class for each interface, then
 * updating lib/repositories/index.ts to export the new implementation.
 *
 * Components and Services NEVER import from Firebase directly —
 * they always depend on these interfaces.
 */
// ─── Dashboard & UI Types ────────────────────────────────────

export interface Alert {
  id: string;
  title: string;
  titleAr?: string;
  description: string;
  messageAr?: string;
  type: 'info' | 'warning' | 'destructive' | 'success';
  severity?: 'critical' | 'warning' | 'info';
  department?: string;
  timestamp?: string;
  createdAt: string;
  read?: boolean;
}

export interface Equipment {
  id: string;
  name: string;
  nameAr: string;
  serialNumber: string;
  category?: string;
  status: 'available' | 'in-use' | 'maintenance' | 'broken';
  department: string;
  location: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  assignedTo?: string;
  notes?: string;
}

export interface Handover {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  department: string;
  fromNurse: string;
  toNurse: string;
  shift: 'morning' | 'evening' | 'night';
  date: string;
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
  criticalAlerts: string[];
  pendingTasks: string[];
  status: 'pending' | 'acknowledged' | 'completed';
}
// ─── Shared Domain Types ────────────────────────────────────

export type PendingStatus = 'pending' | 'approved' | 'rejected'

// ─── Pending Users ──────────────────────────────────────────


export interface PendingUserRecord {
  id: string
  name: string
  email: string
  photoURL?: string
  requestedAt: string
  status: PendingStatus
  role?: string
  department?: string
  reviewedAt?: string
  reviewedBy?: string
}

// ─── User Preferences ───────────────────────────────────────


export interface UserPreferences {
  language: 'ar' | 'en';
  theme: 'light' | 'dark' | 'system';
}

export interface UserRecord {
  id: string
  // Firebase Auth UID
  uid?: string
  // Unique employee identifier (e.g. EMP001)
  employeeCode?: string
  name: string
  nameAr: string
  email: string
  roles: string[]               // array of role document IDs
  roleKeys?: string[]          // array of role keys (for security rules)
  departments: string[]         // array of department IDs
  customPermissions: string[]   // extra one-off permission keys
  mustChangePassword: boolean
  status: 'active' | 'inactive' | 'suspended'
  createdAt: string
  updatedAt: string
  lastLogin?: string
  photoURL?: string
  preferences?: UserPreferences;
}

// ─── Employee Credentials ───────────────────────────────────


export interface EmployeeCredentials {
  employeeId: string
  password: string              // hashed or plain for demo
  mustChange: boolean
}

export interface RoleRecord {
  id: string
  key?: string               // optional machine-readable role key (e.g. 'admin')
  name: string
  nameAr: string
  description?: string
  permissions: string[]         // permission keys
  isActive: boolean
  isDefault?: boolean
  createdAt: string
  updatedAt: string
  order?: number
}

// ─── Departments ────────────────────────────────────────────


export interface DepartmentRecord {
  id: string
  name: string
  nameAr: string
  code?: string
  parentId?: string             // for sub-departments
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ─── System Settings ────────────────────────────────────────


export interface SystemSettings {
  id: string                    // always 'global'
  hospitalName: string
  hospitalNameEn: string
  contactEmail: string
  contactPhone: string
  address: string
  language: string
  timezone: string
  notificationsEnabled: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  maintenanceMode: boolean
  updatedAt: string
}

// ─── Login Logs ─────────────────────────────────────────────


export interface LoginLogRecord {
  id: string
  userId: string
  userEmail: string
  method: 'employee_code' | 'google' | 'email'
  success: boolean
  ipAddress?: string
  userAgent?: string
  timestamp: string
}

// ─── Repository Interfaces ───────────────────────────────────

export interface IPendingUserRepository {
  getAll(): Promise<PendingUserRecord[]>
  getById(id: string): Promise<PendingUserRecord | undefined>
  upsert(user: Omit<PendingUserRecord, 'status' | 'requestedAt'> & { requestedAt?: string }): Promise<PendingUserRecord>
  update(id: string, updates: Partial<PendingUserRecord>): Promise<PendingUserRecord | undefined>
}

export interface IUserRepository {
  getAll(): Promise<UserRecord[]>
  getById(id: string): Promise<UserRecord | undefined>
  getByEmployeeCode(code: string): Promise<UserRecord | undefined>
  create(user: Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<UserRecord>
  update(id: string, updates: Partial<UserRecord>): Promise<UserRecord | undefined>
  delete(id: string): Promise<void>
}

export interface IEmployeeCredentialsRepository {
  get(employeeId: string): Promise<EmployeeCredentials | null>
  set(employeeId: string, password: string, mustChange: boolean): Promise<void>
}

export interface IRoleRepository {
  getAll(): Promise<RoleRecord[]>
  getById(id: string): Promise<RoleRecord | undefined>
  create(role: Omit<RoleRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<RoleRecord>
  update(id: string, updates: Partial<RoleRecord>): Promise<RoleRecord | undefined>
  delete(id: string): Promise<void>
}

export interface IDepartmentRepository {
  getAll(): Promise<DepartmentRecord[]>
  getById(id: string): Promise<DepartmentRecord | undefined>
  create(dept: Omit<DepartmentRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<DepartmentRecord>
  update(id: string, updates: Partial<DepartmentRecord>): Promise<DepartmentRecord | undefined>
  delete(id: string): Promise<void>
}

export interface ISettingsRepository {
  get(): Promise<SystemSettings | null>
  save(settings: Partial<SystemSettings>): Promise<void>
}

export interface ILoginLogRepository {
  add(entry: Omit<LoginLogRecord, 'id'>): Promise<void>
  getRecent(limit?: number): Promise<LoginLogRecord[]>
}

// ─── Patient Records ──────────────────────────────────────────

export interface PatientRecord {
  id: string
  name: string
  nameAr: string
  mrn: string // Medical Record Number — unique
  dateOfBirth: string
  gender: 'male' | 'female'
  phone?: string
  email?: string
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
  allergies?: string[]
  chronicConditions?: string[]
  insuranceProvider?: string
  insuranceNumber?: string
  department: string // department ID
  bedNumber?: string
  admissionDate: string
  admissionReason?: string
  diagnosis?: string
  isIsolation: boolean
  isolationType?: 'contact' | 'droplet' | 'airborne'
  attendingPhysician?: string // User ID
  attendingNurse?: string
  status: 'admitted' | 'discharged' | 'transferred' | 'deceased'
  dischargeDate?: string
  dischargeSummary?: string
  notes?: string
  photoURL?: string
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

export interface IPatientRepository {
  getAll(): Promise<PatientRecord[]>
  getById(id: string): Promise<PatientRecord | undefined>
  getByMrn(mrn: string): Promise<PatientRecord | undefined>
  getByDepartment(deptId: string): Promise<PatientRecord[]>
  getActive(): Promise<PatientRecord[]>
  create(patient: Omit<PatientRecord, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> & { id?: string }): Promise<PatientRecord>
  update(id: string, updates: Partial<PatientRecord>, updatedBy: string): Promise<PatientRecord | undefined>
  discharge(id: string, summary: string, updatedBy: string): Promise<PatientRecord | undefined>
  delete(id: string): Promise<void>
}

// ─── Inventory ──────────────────────────────────────────────

export interface InventoryItem {
  id: string
  name: string
  nameAr: string
  category: string
  unit: string
  currentStock: number
  minStock: number
  maxStock: number
  department: string
  lastRestocked?: string
  expiryDate?: string
  createdAt?: string
  updatedAt?: string
}
// ─── Notifications ──────────────────────────────────────────────

export type NotificationType = 'alert' | 'info' | 'warning' | 'success' | 'error' | 'emergency_code' | 'task_assigned' | 'handover_request'
export type NotificationStatus = 'unread' | 'read'

export interface NotificationRecord {
  id: string
  userId: string // Target user ID
  type: NotificationType
  title: string
  message: string
  link?: string // Optional link to relevant page
  status: NotificationStatus
  createdAt: string
}

export interface INotificationRepository {
  getByUser(userId: string): Promise<NotificationRecord[]>
  getUnreadByUser(userId: string): Promise<NotificationRecord[]>
  markAsRead(id: string): Promise<void>
  create(notification: Omit<NotificationRecord, 'id' | 'createdAt' | 'status'>): Promise<NotificationRecord>
  delete(id: string): Promise<void>
}

// ─── Maintenance ──────────────────────────────────────────────

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent'
export type MaintenanceStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'

export interface MaintenanceTicket {
  id: string
  reportedBy: string // User ID
  reportedByName: string
  department: string
  issue: string
  description: string
  location: string // e.g., "Room 305", "ICU - Bed 7"
  priority: MaintenancePriority
  status: MaintenanceStatus
  assignedTo?: string // User ID of technician/staff
  assignedToName?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  notes?: string
}

export interface IMaintenanceRepository {
  getAll(): Promise<MaintenanceTicket[]>
  getById(id: string): Promise<MaintenanceTicket | undefined>
  create(ticket: Omit<MaintenanceTicket, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<MaintenanceTicket>
  update(id: string, updates: Partial<MaintenanceTicket>): Promise<MaintenanceTicket | undefined>
  delete(id: string): Promise<void>
}

// ─── Incidents & Safety ──────────────────────────────────────

export type IncidentType = 'fall' | 'medication_error' | 'pressure_ulcer' | 'infection' | 'equipment_failure' | 'needle_stick' | 'patient_complaint' | 'other'
export type IncidentSeverity = 'near_miss' | 'minor' | 'moderate' | 'major' | 'catastrophic'
export type IncidentStatus = 'reported' | 'investigating' | 'resolved' | 'closed'

export interface IncidentReport {
  id: string
  type: IncidentType
  severity: IncidentSeverity
  department: string
  location: string
  dateTime: string
  reportedBy: string
  reportedById: string
  patientInvolved: boolean
  patientId?: string
  patientName?: string
  description: string
  immediateActions: string
  witnesses: string[]
  status: IncidentStatus
  rootCause?: string
  correctiveActions?: string
  createdAt?: string
  updatedAt?: string
}

export interface IIncidentRepository {
  getAll(): Promise<IncidentReport[]>
  getById(id: string): Promise<IncidentReport | undefined>
  create(incident: Omit<IncidentReport, 'id' | 'status' | 'dateTime'>): Promise<IncidentReport>
  update(id: string, updates: Partial<IncidentReport>): Promise<IncidentReport | undefined>
  delete(id: string): Promise<void>
}

// ─── Announcements ───────────────────────────────────────────

export type AnnouncementCategory = 'general' | 'urgent' | 'training' | 'policy' | 'event'
export type AnnouncementAudience = 'all' | 'ICU' | 'ER' | 'الباطنية' | 'الجراحة' | 'CN' | 'SN'

export interface AnnouncementRecord {
  id: string
  title: string
  content: string
  category: AnnouncementCategory
  audience: AnnouncementAudience
  pinned: boolean
  expiryDate?: string
  author: string
  createdAt: string
}

export interface IAnnouncementRepository {
  getAll(): Promise<AnnouncementRecord[]>
  getById(id: string): Promise<AnnouncementRecord | undefined>
  create(ann: Omit<AnnouncementRecord, 'id' | 'createdAt'>): Promise<AnnouncementRecord>
  update(id: string, updates: Partial<AnnouncementRecord>): Promise<AnnouncementRecord | undefined>
  delete(id: string): Promise<void>
}

// ─── Reports ─────────────────────────────────────────────────

export type ReportShift = 'morning' | 'evening' | 'night'
export type ReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

export interface ReportRecord {
  id: string
  date: string
  shift: ReportShift
  supervisor: string
  status: ReportStatus
  totalPatients: number
  totalStaff: number
  createdAt: string
  updatedAt: string
}

export interface IReportRepository {
  getAll(): Promise<ReportRecord[]>
  getById(id: string): Promise<ReportRecord | undefined>
  getByFilters(date?: string, shift?: ReportShift, status?: ReportStatus): Promise<ReportRecord[]>
  create(data: Omit<ReportRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportRecord>
  update(id: string, updates: Partial<ReportRecord>): Promise<ReportRecord | undefined>
  delete(id: string): Promise<void>
}

// ─── Policies & Procedures ────────────────────────────────────

export type PolicyCategory = 'clinical' | 'admin' | 'safety' | 'infection' | 'emergency' | 'hr'
export type PolicyStatus = 'active' | 'under_review' | 'archived'

export interface PolicyRecord {
  id: string
  policyNo: string
  title: string
  content: string
  category: PolicyCategory
  status: PolicyStatus
  version: string
  effectiveDate: string
  reviewDate: string
  author: string
  approvedBy: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface IPolicyRepository {
  getAll(): Promise<PolicyRecord[]>
  getById(id: string): Promise<PolicyRecord | undefined>
  create(policy: Omit<PolicyRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<PolicyRecord>
  update(id: string, updates: Partial<PolicyRecord>): Promise<PolicyRecord | undefined>
  delete(id: string): Promise<void>
}

// ─── Absence Records ─────────────────────────────────────────

export interface AbsenceRecord {
  id: string
  staffName: string
  staffCode: string
  unit: string
  title: string
  date: string
  shift: string
  status: 'present' | 'absent' | 'off' | 'late'
  reason?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface IAbsenceRepository {
  getAll(): Promise<AbsenceRecord[]>
  getById(id: string): Promise<AbsenceRecord | undefined>
  getByDateAndUnit(date: string, unit: string): Promise<AbsenceRecord[]>
  create(data: Omit<AbsenceRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<AbsenceRecord>
  update(id: string, updates: Partial<AbsenceRecord>): Promise<AbsenceRecord | undefined>
  delete(id: string): Promise<void>
}

// ─── Vacations ───────────────────────────────────────────────

export type VacationType = 'annual' | 'sick' | 'emergency' | 'unpaid' | 'maternity' | 'hajj'
export type VacationStatus = 'pending' | 'approved' | 'rejected'

export interface VacationRequest {
  id: string
  empId: string
  empName: string
  title: string
  unit: string
  type: VacationType
  startDate: string
  endDate: string
  days: number
  reason: string
  status: VacationStatus
  approvedBy?: string
  approvedAt?: string
  rejectedReason?: string
  createdAt: string
}

export interface IVacationRepository {
  getAll(): Promise<VacationRequest[]>
  getByEmp(empId: string): Promise<VacationRequest[]>
  create(request: Omit<VacationRequest, 'id' | 'createdAt'>): Promise<VacationRequest>
  update(id: string, updates: Partial<VacationRequest>): Promise<VacationRequest | undefined>
  delete(id: string): Promise<void>
}

// ─── Vital Signs ──────────────────────────────────────────────

export interface VitalSignsRecord {
  id: string
  patientId: string
  patientMrn?: string
  patientName?: string
  recordedBy: string // user ID
  recordedByName?: string
  timestamp: string
  temperature: number // °C
  bloodPressureSystolic: number // mmHg
  bloodPressureDiastolic: number // mmHg
  heartRate: number // bpm
  respiratoryRate: number // breaths/min
  oxygenSaturation: number // %
  painLevel: number // 0-10
  bloodGlucose?: number // mg/dL
  weight?: number // kg
  height?: number // cm
  notes?: string
  createdAt: string
}

export interface IVitalSignsRepository {
  getByPatient(patientId: string): Promise<VitalSignsRecord[]>
  getByPatientRange(patientId: string, startDate: string, endDate: string): Promise<VitalSignsRecord[]>
  getRecent(patientId: string, limit?: number): Promise<VitalSignsRecord[]>
  add(entry: Omit<VitalSignsRecord, 'id' | 'createdAt'>): Promise<VitalSignsRecord>
  update(id: string, updates: Partial<VitalSignsRecord>): Promise<VitalSignsRecord | undefined>
  delete(id: string): Promise<void>
}

// ─── Nursing Tasks ───────────────────────────────────────────

export interface NursingTaskRecord {
  id: string
  patientId: string
  patientName?: string
  patientMrn?: string
  department: string
  type: 'medication' | 'assessment' | 'procedure' | 'documentation' | 'communication' | 'hygiene' | 'nutrition' | 'other'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedTo: string // user ID
  assignedToName?: string
  assignedBy: string
  dueTime: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled'
  completedAt?: string
  completedBy?: string
  completedByName?: string
  notes?: string
  escalationLevel: number // 0 = none, 1 = supervisor, 2 = head nurse, 3 = admin
  createdAt: string
  updatedAt: string
}

export interface ITaskRepository {
  getAll(): Promise<NursingTaskRecord[]>
  getByPatient(patientId: string): Promise<NursingTaskRecord[]>
  getByAssignedTo(userId: string): Promise<NursingTaskRecord[]>
  getByDepartment(deptId: string): Promise<NursingTaskRecord[]>
  getOverdue(): Promise<NursingTaskRecord[]>
  getById(id: string): Promise<NursingTaskRecord | undefined>
  create(task: Omit<NursingTaskRecord, 'id' | 'createdAt' | 'updatedAt' | 'escalationLevel'> & { id?: string }): Promise<NursingTaskRecord>
  update(id: string, updates: Partial<NursingTaskRecord>): Promise<NursingTaskRecord | undefined>
  complete(id: string, completedBy: string, notes?: string): Promise<NursingTaskRecord | undefined>
  cancel(id: string): Promise<NursingTaskRecord | undefined>
  delete(id: string): Promise<void>
}

// ─── Audit Logs (Field-Level Change Tracking) ─────────────────

export interface AuditLogRecord {
  id: string
  userId: string
  userName: string
  userRole: string
  action: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'approve' | 'reject'
  collection: string // e.g. 'users', 'patients', 'roles'
  documentId: string
  changes?: Record<string, { oldValue: unknown; newValue: unknown }>
  ipAddress?: string
  userAgent?: string
  timestamp: string
  tenantId?: string
}

export interface IAuditLogRepository {
  add(entry: Omit<AuditLogRecord, 'id'>): Promise<void>
  getByUser(userId: string, limit?: number): Promise<AuditLogRecord[]>
  getByCollection(collection: string, limit?: number): Promise<AuditLogRecord[]>
  getRecent(limit?: number): Promise<AuditLogRecord[]>
  getByDateRange(start: string, end: string): Promise<AuditLogRecord[]>
}

// ─── Emergency Codes ─────────────────────────────────────────

export type EmergencyCodeType = 'blue' | 'red' | 'pink' | 'orange' | 'yellow' | 'black' | 'green'

export interface EmergencyCode {
  id: string
  type: EmergencyCodeType
  location: string
  department: string
  calledBy: string
  calledById: string
  status: 'active' | 'resolved' | 'cancelled'
  startTime: string
  endTime?: string
  responders: string[]
  notes?: string
  outcome?: string
}

// ─── Nursing Tasks (UI shape) ─────────────────────────────────

export interface NursingTask {
  id: string
  patientId?: string
  patientName?: string
  department: string
  type: 'medication' | 'assessment' | 'procedure' | 'documentation' | 'communication' | 'hygiene' | 'nutrition' | 'other'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedTo: string
  assignedToId?: string
  dueTime: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled'
  notes?: string
  completedAt?: string
  completedBy?: string
}

// ─── Training & Certifications ────────────────────────────────

export interface Training {
  id: string
  name: string
  nameAr: string
  type: 'mandatory' | 'specialized' | 'optional'
  duration: number
  validityPeriod: number
  provider: string
  description: string
}

export interface StaffCertification {
  id: string
  staffId: string
  staffName: string
  trainingId: string
  trainingName: string
  completedDate: string
  expiryDate: string
  status: 'valid' | 'expiring_soon' | 'expired'
}

// ─── Vital Signs (UI shape) ───────────────────────────────────

export interface VitalSigns {
  id: string
  patientId: string
  timestamp: string
  temperature: number
  bloodPressureSystolic: number
  bloodPressureDiastolic: number
  heartRate: number
  respiratoryRate: number
  oxygenSaturation: number
  painLevel: number
  bloodGlucose?: number
  weight?: number
  height?: number
  notes?: string
  recordedBy?: string
  recordedByName?: string
  patientName?: string
  patientMrn?: string
  createdAt?: string
}

// ─── Notifications (UI shape) ─────────────────────────────────

export interface Notification {
  id: string
  type: NotificationType
  title: string
  titleAr?: string
  message: string
  messageAr?: string
  priority?: 'urgent' | 'high' | 'normal' | 'low'
  read: boolean
  createdAt: string
  link?: string
  actionUrl?: string
  actionLabel?: string
  actionLabelAr?: string
  recipientId?: string
  senderName?: string
  data?: Record<string, unknown>
}

// ─── Activity Feed ────────────────────────────────────────────

export interface Activity {
  id: string
  type: string
  userId: string
  userName: string
  userRole?: string
  description?: string
  action?: string
  actionAr?: string
  target?: string
  department?: string
  timestamp: string
}

// ─── User Presence ────────────────────────────────────────────

export interface UserPresence {
  id: string
  userId?: string
  name: string
  nameAr?: string
  role: string
  isOnline?: boolean
  status: 'online' | 'away' | 'offline'
  lastSeen: string
  department?: string
}
