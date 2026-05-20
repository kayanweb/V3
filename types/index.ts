// ==========================================
// 1. أنواع وتنبيهات لوحة التحكم (Dashboard & Alerts)
// ==========================================
export interface Alert {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'destructive' | 'success';
  createdAt: string;
  read?: boolean;
}

// ==========================================
// 2. نظام حالات الطوارئ والأكواد الطبية (Emergency Codes)
// ==========================================
export type EmergencyCodeType = 'blue' | 'red' | 'pink' | 'orange' | 'yellow' | 'black' | 'green';

export interface EmergencyCode {
  id: string;
  type: EmergencyCodeType;
  location: string;
  department: string;
  calledBy: string;
  calledById: string;
  status: 'active' | 'resolved' | 'cancelled';
  startTime: string;
  endTime?: string;
  responders: string[];
  notes?: string;
  outcome?: string;
}

// ==========================================
// 3. إدارة الأجهزة والمعدات الطبية (Equipment)
// ==========================================
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

// ==========================================
// 4. الموظفين (Employees / Staff)
// ==========================================
export interface Employee {
  id: string;
  name: string;
  nameAr: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hireDate: string;
  status: 'active' | 'on-leave' | 'terminated';
  shift?: 'morning' | 'evening' | 'night';
}

// ==========================================
// 5. الجداول والمناوبات (Rosters / Shifts)
// ==========================================
export interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'morning' | 'evening' | 'night';
  date: string;
  department: string;
  status: 'assigned' | 'completed' | 'absent';
}

export interface Roster {
  id: string;
  department: string;
  month: string;
  shifts: Shift[];
  createdBy: string;
  createdAt: string;
}

// ==========================================
// 6. الإجازات والغياب (Leave & Absence)
// ==========================================
export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'annual' | 'sick' | 'emergency' | 'unpaid';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  createdAt: string;
}

export interface Absence {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  shift: 'morning' | 'evening' | 'night';
  reason: string;
  status: 'excused' | 'unexcused';
}

// ==========================================
// 7. المهام (Tasks)
// ==========================================
export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  assignedToName: string;
  department: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  createdAt: string;
}

// ==========================================
// 8. التقارير (Reports)
// ==========================================
export interface Report {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  department: string;
  generatedBy: string;
  generatedAt: string;
  data: any;
  format: 'pdf' | 'excel' | 'csv';
}

// ==========================================
// 9. التدريب (Training)
// ==========================================
export interface Training {
  id: string;
  title: string;
  description: string;
  department: string;
  date: string;
  duration: number;
  instructor: string;
  attendees: string[];
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

// ==========================================
// 10. المخزون (Inventory)
// ==========================================
export interface InventoryItem {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  currentStock: number;
  unit: string;
  minStock: number;
  maxStock: number;
  location: string;
  expiryDate?: string;
  supplier?: string;
  lastUpdated: string;
  lastRestocked?: string;
}
// ==========================================
// 11. الصيانة (Maintenance)
// ==========================================
export interface MaintenanceRequest {
  id: string;
  equipmentId: string;
  equipmentName: string;
  type: 'preventive' | 'corrective' | 'emergency';
  priority: 'low' | 'medium' | 'high';
  description: string;
  requestedBy: string;
  requestedAt: string;
  assignedTo?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  completedAt?: string;
  cost?: number;
}

// ==========================================
// 12. تسليم المناوبة (Handover) - SBAR
// ==========================================
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

// ==========================================
// 13. الإشعارات والإعلانات (Notifications & Announcements)
// ==========================================
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  targetDepartments?: string[];
  targetRoles?: string[];
  createdBy: string;
  createdAt: string;
  readBy: string[];
}

export interface Announcement extends Notification {
  pinned: boolean;
  expiryDate?: string;
}

// ==========================================
// 14. الرواتب (Payroll)
// ==========================================
export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  bonuses: number;
  netSalary: number;
  status: 'draft' | 'approved' | 'paid';
  approvedBy?: string;
  paidAt?: string;
}

// ==========================================
// 15. المرضى (Patients)
// ==========================================
export interface Patient {
  id: string;
  name: string;
  nameAr: string;
  medicalId: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  bloodType?: string;
  department: string;
  roomNumber: string;
  bedNumber: string;
  admissionDate: string;
  dischargeDate?: string;
  status: 'active' | 'discharged' | 'transferred';
  primaryDoctor: string;
  primaryNurse: string;
}

// ==========================================
// 16. العلامات الحيوية (Vitals)
// ==========================================
export interface Vitals {
  id: string;
  patientId: string;
  patientName: string;
  timestamp: string;
  temperature?: number;
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  recordedBy: string;
}

// ==========================================
// 17. الوجبات (Meals)
// ==========================================
export interface Meal {
  id: string;
  patientId: string;
  patientName: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  diet: 'regular' | 'diabetic' | 'low-sodium' | 'soft' | 'liquid';
  status: 'pending' | 'prepared' | 'delivered' | 'cancelled';
  orderedAt: string;
  deliveredAt?: string;
}

// ==========================================
// 18. الحوادث (Incidents)
// ==========================================
export interface Incident {
  id: string;
  type: 'fall' | 'medication-error' | 'equipment-failure' | 'violence' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  department: string;
  reportedBy: string;
  reportedAt: string;
  resolvedAt?: string;
  resolution?: string;
  status: 'reported' | 'investigating' | 'resolved' | 'closed';
}

// ==========================================
// 19. تقييم الأداء (Appraisals)
// ==========================================
export interface Appraisal {
  id: string;
  employeeId: string;
  employeeName: string;
  reviewerId: string;
  reviewerName: string;
  period: string;
  overallRating: number;
  strengths: string;
  improvements: string;
  goals: string;
  status: 'pending' | 'completed' | 'acknowledged';
  createdAt: string;
  completedAt?: string;
}

// ==========================================
// 20. الرسائل (Messages)
// ==========================================
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  subject: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

// ==========================================
// 21. الإعدادات والتفضيلات (Preferences)
// ==========================================
export interface UserPreferences {
  userId: string;
  language: 'ar' | 'en';
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  dashboardLayout?: any;
}

// ==========================================
// 22. الجودة (Quality)
// ==========================================
export interface QualityMetric {
  id: string;
  name: string;
  category: string;
  target: number;
  current: number;
  unit: string;
  department: string;
  updatedAt: string;
}

// ==========================================
// 23. سير العمل (Workflows)
// ==========================================
export interface Workflow {
  id: string;
  name: string;
  department: string;
  steps: WorkflowStep[];
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  order: number;
  assignedTo: string;
  estimatedDuration: number;
  dependencies?: string[];
}

// ==========================================
// 24. التحليلات (Analytics)
// ==========================================
export interface AnalyticsData {
  id: string;
  type: string;
  department: string;
  period: string;
  metrics: Record<string, number>;
  charts: any;
  generatedAt: string;
}

// ==========================================
// 25. الأرشفة (Archive)
// ==========================================
export interface ArchivedRecord {
  id: string;
  originalId: string;
  type: string;
  data: any;
  archivedBy: string;
  archivedAt: string;
  retentionUntil?: string;
}

// ==========================================
// 26. جهات الاتصال (Contact)
// ==========================================
export interface Contact {
  id: string;
  name: string;
  nameAr: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  extension?: string;
  isEmergency: boolean;
}

// ==========================================
// 27. الطاقم التمريضي (Nurses)
// ==========================================
export interface Nurse {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'head-nurse' | 'nurse';
  department: string;
  status: 'active' | 'on-leave' | 'inactive';
  shift: 'morning' | 'evening' | 'night';
  joinDate: string;
}

// ==========================================
// 28. المستخدمين (Users)
// ==========================================
export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'head-nurse' | 'nurse';
  department?: string;
  createdAt: string;
}

// ==========================================
// 29. الإدارات (Departments)
// ==========================================
export interface Department {
  id: string;
  name: string;
  nameAr: string;
  headOfDepartment: string;
  staffCount: number;
  bedCount?: number;
  location: string;
  phone: string;
}

// ==========================================
// 30. المكتبة والوثائق (Archive/Documents)
// ==========================================
export interface Document {
  id: string;
  title: string;
  titleAr: string;
  type: 'policy' | 'procedure' | 'form' | 'report';
  category: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  version: number;
  department: string;
}

// ==========================================
// 31. إعدادات النظام (Settings)
// ==========================================
export interface SystemSettings {
  id: string;
  key: string;
  value: any;
  description?: string;
  updatedBy: string;
  updatedAt: string;
}

// ==========================================
// 32. سجل النشاطات (Activity Log)
// ==========================================
export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: any;
  ipAddress?: string;
  createdAt: string;
}

// ==========================================
// 33. التقويم (Calendar)
// ==========================================
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  type: 'shift' | 'meeting' | 'training' | 'holiday' | 'other';
  department?: string;
  createdBy: string;
  color?: string;
}

// ==========================================
// 34. الأدوية (Medications)
// ==========================================
export interface Medication {
  id: string;
  name: string;
  nameAr: string;
  dosage: string;
  unit: string;
  stock: number;
  minStock: number;
  expiryDate: string;
  manufacturer: string;
  location: string;
}

// ==========================================
// 35. المرضى المنومين (Admissions)
// ==========================================
export interface Admission {
  id: string;
  patientId: string;
  patientName: string;
  admissionDate: string;
  dischargeDate?: string;
  department: string;
  room: string;
  bed: string;
  primaryDoctor: string;
  primaryNurse: string;
  diagnosis?: string;
  status: 'active' | 'discharged' | 'transferred';
}

// ==========================================
// 36. الإحصائيات (Statistics)
// ==========================================
export interface Statistics {
  id: string;
  department: string;
  date: string;
  patientCount: number;
  occupancyRate: number;
  nurseToPatientRatio: number;
  admissionsToday: number;
  dischargesToday: number;
  criticalPatients: number;
}
