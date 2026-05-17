export interface Alert { id: string; type: string; message: string; messageAr: string; department: string; severity: 'critical' | 'warning' | 'info'; timestamp: string; }
