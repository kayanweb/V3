// تعديل نوع الأكواد الطبية
export type EmergencyCodeType = 'blue' | 'red' | 'pink' | 'orange' | 'yellow' | 'black' | 'green';

export interface EmergencyCode {
  id: string;
  type: EmergencyCodeType; // تأكد أنه بدون علامة استفهام ?
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

// تعديل نوع المعدات والأجهزة (Equipment)
export interface Equipment {
  id: string;
  name: string;
  nameAr: string; // تأكد أنه بدون علامة استفهام ? لإصلاح خطأ صفحة المعدات جذرياً
  serialNumber: string; // تأكد أنه بدون علامة استفهام ?
  status: 'available' | 'in-use' | 'maintenance' | 'broken';
  department: string;
  location: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
}
