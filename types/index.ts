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
  type: EmergencyCodeType; // إجباري لمنع أخطاء التصفية والـ Build
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
  nameAr: string;        // إجباري لإصلاح خطأ صفحة المعدات بالكامل
  serialNumber: string;  // إجباري لمنع خطأ الـ undefined أثناء البحث
  category?: string;     // الفئة (أجهزة تنفسية، مضخات، الخ)
  status: 'available' | 'in-use' | 'maintenance' | 'broken';
  department: string;
  location: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  purchaseDate?: string;     // تاريخ الشراء
  warrantyExpiry?: string;   // انتهاء الضمان
  assignedTo?: string;       // مخصص لـ (مريض أو قسم)
  notes?: string;            // ملاحظات
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
  date: string; // YYYY-MM-DD
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
  assignedTo: string; // Nurse ID
  assignedToName: string;
  department: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
}
