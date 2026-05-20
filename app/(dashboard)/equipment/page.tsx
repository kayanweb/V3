'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Equipment } from '@/types'
import {
  Wrench,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Settings,
  MapPin,
  Calendar,
  BarChart3,
  Filter,
  Download,
  QrCode,
  Edit,
  Trash2,
} from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// تعريف نوع الحالة - مطابق لـ Equipment.status
type EquipmentStatus = 'available' | 'in-use' | 'maintenance' | 'broken'

const statusConfig: Record<EquipmentStatus, {
  label: string
  color: string
  bgColor: string
}> = {
  available: { label: 'متاح', color: 'text-green-600', bgColor: 'bg-green-100' },
  'in-use': { label: 'قيد الاستخدام', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  maintenance: { label: 'صيانة', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  broken: { label: 'معطل', color: 'text-red-600', bgColor: 'bg-red-100' },
}

// Sample data
const sampleEquipment: Equipment[] = [
  {
    id: '1',
    name: 'Ventilator',
    nameAr: 'جهاز تنفس صناعي',
    serialNumber: 'VNT-2024-001',
    category: 'أجهزة تنفسية',
    department: 'ICU',
    location: 'غرفة 301',
    status: 'in-use',
    lastMaintenance: '2024-01-01',
    nextMaintenance: '2024-04-01',
    purchaseDate: '2022-06-15',
    warrantyExpiry: '2025-06-15',
    assignedTo: 'المريض أحمد محمد',
  },
  {
    id: '2',
    name: 'Infusion Pump',
    nameAr: 'مضخة تسريب',
    serialNumber: 'INF-2024-015',
    category: 'مضخات',
    department: 'الجراحة',
    location: 'غرفة 205',
    status: 'available',
    lastMaintenance: '2023-12-15',
    nextMaintenance: '2024-03-15',
    purchaseDate: '2023-01-20',
    warrantyExpiry: '2026-01-20',
  },
  {
    id: '3',
    name: 'Patient Monitor',
    nameAr: 'جهاز مراقبة المريض',
    serialNumber: 'MON-2024-008',
    category: 'أجهزة مراقبة',
    department: 'الطوارئ',
    location: 'غرفة الإنعاش',
    status: 'maintenance',
    lastMaintenance: '2024-01-10',
    nextMaintenance: '2024-01-25',
    purchaseDate: '2021-08-10',
    warrantyExpiry: '2024-08-10',
    notes: 'في انتظار قطع غيار',
  },
  {
    id: '4',
    name: 'Defibrillator',
    nameAr: 'جهاز صدمات القلب',
    serialNumber: 'DEF-2024-003',
    category
