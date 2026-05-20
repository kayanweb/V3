// ==========================================
// 1. أنواع وتنبيهات لوحة التحكم (Dashboard & Alerts)
// ==========================================
export interface Alert {
  id: string;
  type: string;
  message: string;
  messageAr: string;
  department: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
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
export type EquipmentStatus = 'available' | 'in_use' | 'maintenance' | 'broken' | 'retired';

export interface Equipment {
  id: string;
  name: string;
  nameAr: string;
  serialNumber: string;
  category?: string;
  status: EquipmentStatus;
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
// 4. إدارة الطاقم التمريضي والمستخدمين (Users & Nurses)
// ==========================================
export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'head-nurse' | 'nurse';
  department?: string;
  createdAt: string;
}

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
// 5. الجداول والمناوبات (Shifts & Schedules)
// ==========================================
export interface Shift {
  id: string;
  nurseId: string;
  nurseName: string;
  type: 'morning' | 'evening' | 'night';
  date: string;
  department: string;
  status: 'assigned' | 'completed' | 'absent';
}

// ==========================================
// 6. التقارير والمهام اليومية (Tasks & Reports)
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
}

// ==========================================
// 7. المهام التمريضية (Nursing Tasks)
// ==========================================
export interface NursingTask {
  id: string;
  patientId?: string;
  patientName?: string;
  department: string;
  type: 'medication' | 'assessment' | 'procedure' | 'documentation' | 'communication' | 'other';
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string;
  assignedToId: string;
  dueTime: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

// ==========================================
// 8. العلامات الحيوية (Vital Signs)
// ==========================================
export interface VitalSigns {
  id: string;
  patientId: string;
  timestamp: string;
  temperature: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  heartRate: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  painLevel: number;
  bloodGlucose?: number;
  weight?: number;
  height?: number;
  recordedBy: string;
  notes?: string;
}

// ==========================================
// 9. التدريب والشهادات (Training & Certifications)
// ==========================================
export interface Training {
  id: string;
  name: string;
  nameAr: string;
  type: 'mandatory' | 'specialized' | 'optional';
  duration: number;
  validityPeriod: number;
  provider: string;
  description?: string;
}

export interface StaffCertification {
  id: string;
  staffId: string;
  staffName: string;
  trainingId: string;
  trainingName: string;
  completedDate: string;
  expiryDate: string;
  status: 'valid' | 'expiring_soon' | 'expired';
  certificateUrl?: string;
}

// ==========================================
// 10. تسليم المناوبات (Handover)
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
// 11. المخزون (Inventory)
// ==========================================
export interface InventoryItem {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  department: string;
  lastRestocked?: string;
  expiryDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// 12. الإشعارات والحضور (Notifications & Presence)
// ==========================================
export interface Notification {
  id: string;
  type: string;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
  actionLabelAr?: string;
  recipientId?: string;
  senderName?: string;
  data?: Record<string, string>;
}

export interface Activity {
  id: string;
  type: string;
  userId: string;
  userName: string;
  action: string;
  actionAr: string;
  target?: string;
  department?: string;
  timestamp: string;
}

export interface UserPresence {
  id: string;
  name: string;
  role: string;
  department: string;
  isOnline: boolean;
  lastSeen: string;
  avatar?: string;
}
