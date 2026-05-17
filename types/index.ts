// types/index.ts

export interface Alert {
  id: string;
  type: 'over_capacity' | 'low_staff' | 'isolation' | string;
  message: string;
  messageAr: string;
  department: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  [key: string]: any; // تضمن قبول أي خصائص إضافية مخصصة للـ Alert
}

export type EmergencyCodeType = 'red' | 'blue' | 'black' | 'yellow' | 'white' | string;

export interface EmergencyCode {
  id: string;
  type: EmergencyCodeType;
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  location: string;
  status: 'active' | 'resolved' | 'dispatched' | string;
  timestamp?: string;
  department?: string;
  calledBy?: string;
  [key: string]: any; // الحل السحري: تقبل calledById, startTime, responders وأي شيء آخر بالصفحة!
}

export interface DepartmentData {
  name: string;
  nameAr: string;
  patients: number;
  beds: number;
  nurses: number;
  [key: string]: any;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | string;
  roomNumber: string;
  department: string;
  admissionDate: string;
  condition: string;
  status: 'stable' | 'critical' | 'serious' | string;
  [key: string]: any;
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'nurse' | 'senior_nurse' | 'supervisor' | string;
  department: string;
  status: 'active' | 'absent' | 'on_call' | string;
  [key: string]: any;
}
