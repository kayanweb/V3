// types/index.ts

// 1. التنبيهات
export interface Alert {
  id: string;
  type?: string;
  message?: string;
  messageAr?: string;
  department?: string;
  severity?: 'critical' | 'warning' | 'info' | string;
  timestamp?: string;
  [key: string]: any;
}

// 2. أكواد الطوارئ
export type EmergencyCodeType = 'red' | 'blue' | 'black' | 'yellow' | 'white' | string;

export interface EmergencyCode {
  id: string;
  type?: EmergencyCodeType | string;
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  location?: string;
  status?: string;
  timestamp?: string;
  department?: string;
  calledBy?: string;
  [key: string]: any;
}

// 3. الأقسام
export interface DepartmentData {
  name: string;
  nameAr?: string;
  patients?: number;
  beds?: number;
  nurses?: number;
  [key: string]: any;
}

// 4. المرضى
export interface Patient {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  roomNumber?: string;
  department?: string;
  admissionDate?: string;
  condition?: string;
  status?: string;
  [key: string]: any;
}

// 5. الطاقم الطبي
export interface StaffMember {
  id: string;
  name: string;
  role?: string;
  department?: string;
  status?: string;
  [key: string]: any;
}

// 6. المعدات الطبية (التي أوقفت الـ Build الأخير)
export type EquipmentStatus = 'available' | 'in_use' | 'maintenance' | 'out_of_service' | string;

export interface Equipment {
  id: string;
  name: string;
  nameAr?: string;
  type?: string;
  status?: EquipmentStatus | string;
  location?: string;
  department?: string;
  [key: string]: any;
}

// 7. صمامات أمان إضافية لأي صفحات أخرى قد تطلب هذه الأنواع مستقبلاً
export interface Task { id: string; [key: string]: any; }
export interface Schedule { id: string; [key: string]: any; }
export interface Report { id: string; [key: string]: any; }
export interface User { id: string; [key: string]: any; }
export interface Setting { [key: string]: any; }
