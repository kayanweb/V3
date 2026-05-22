

import { useState, useMemo, useEffect, useCallback } from 'react'
// Reorganized UI imports
import { 
  Card, 
  CardContent,
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Wrench, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getAllMaintenanceTickets,
  createMaintenanceTicket,
  updateMaintenanceTicket,
  deleteMaintenanceTicket,
} from '@/lib/services/maintenance.service'
import type { MaintenanceTicket, MaintenancePriority, MaintenanceStatus } from '@/lib/repositories/contracts'

const MAINTENANCE_PRIORITIES: Record<MaintenancePriority, { label: string; color: string }> = {
  low: { label: 'منخفضة', color: 'bg-blue-100 text-blue-700' },
  medium: { label: 'متوسطة', color: 'bg-green-100 text-green-700' },
  high: { label: 'عالية', color: 'bg-amber-100 text-amber-700' },
  urgent: { label: 'عاجلة', color: 'bg-red-100 text-red-700' },
}

const MAINTENANCE_STATUSES: Record<MaintenanceStatus, { label: string; color: string }> = {
  open: { label: 'مفتوحة', color: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'قيد التنفيذ', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'مكتملة', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'ملغاة', color: 'bg-red-100 text-red-700' },
}

const EMPTY_FORM: Omit<MaintenanceTicket, 'id' | 'createdAt' | 'updatedAt' | 'status'> = {
  reportedBy: 'User ID', // Should be dynamically set from auth context
  reportedByName: 'User Name', // Should be dynamically set from auth context
  department: 'ICU',
  issue: '',
  description: '',
  location: '',
  priority: 'medium',
}

export default function MaintenancePage() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getAllMaintenanceTickets()
      setTickets(data)
    } catch (e) {
      toast.error('فشل في تحميل تذاكر الصيانة')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = useMemo(() => {
    let list = [...tickets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    if (filterPriority !== 'all') list = list.filter(t => t.priority === filterPriority)
    if (filterStatus !== 'all') list = list.filter(t => t.status === filterStatus)
    return list
  }, [tickets, filterPriority, filterStatus])

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setDialogOpen(true) }
  const openEdit = (ticket: MaintenanceTicket) => {
    setEditing(ticket.id)
    setForm({
      reportedBy: ticket.reportedBy,
      reportedByName: ticket.reportedByName,
      department: ticket.department,
      issue: ticket.issue,
      description: ticket.description,
      location: ticket.location,
      priority: ticket.priority,
      assignedTo: ticket.assignedTo,
      assignedToName: ticket.assignedToName,
      notes: ticket.notes,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.issue || !form.description || !form.location) { toast.error('يرجى ملء الحقول المطلوبة'); return }
    setIsSaving(true)
    try {
      if (editing) {
        await updateMaintenanceTicket(editing, form)
        toast.success('تم تحديث تذكرة الصيانة')
      } else {
        await createMaintenanceTicket(form)
        toast.success('تم إنشاء تذكرة صيانة جديدة')
      }
      await loadData()
      setDialogOpen(false)
    } catch (e) {
      toast.error('حدث خطأ أثناء حفظ التذكرة')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await deleteMaintenanceTicket(deleteId)
    toast.success('تم حذف تذكرة الصيانة')
    loadData()
    setDeleteId(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-2xl font-bold">إدارة الصيانة</h1><p className="text-sm text-muted-foreground">تسجيل وتتبع طلبات الصيانة للمعدات والمرافق</p></div>
        <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 ml-1"/>طلب صيانة جديد</Button>
      </div>

      {/* Filters */}
      <Card><CardContent className="pt-4 pb-3">
        <div className="flex flex-wrap gap-3">
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-40"><SelectValue placeholder="الأولوية"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأولويات</SelectItem>
              {Object.entries(MAINTENANCE_PRIORITIES).map(([k,v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="الحالة"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              {Object.entries(MAINTENANCE_STATUSES).map(([k,v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      {/* Maintenance Tickets Table */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">تذاكر الصيانة — {filtered.length} تذكرة</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <p className="text-muted-foreground">جاري مزامنة تذاكر الصيانة...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {['#', 'التاريخ', 'المشكلة', 'الموقع', 'الأولوية', 'المبلغ', 'الحالة', 'إجراءات'].map(h => (
                      <TableHead key={h} className="text-xs">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">لا توجد تذاكر صيانة</TableCell></TableRow>
                  ) : (
                    filtered.map((ticket, i) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="text-sm font-mono">{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="font-semibold">{ticket.issue}</TableCell>
                        <TableCell className="text-sm">{ticket.location}</TableCell>
                        <TableCell><Badge className={cn('text-xs', MAINTENANCE_PRIORITIES[ticket.priority].color)}>{MAINTENANCE_PRIORITIES[ticket.priority].label}</Badge></TableCell>
                        <TableCell className="text-sm">{ticket.reportedByName}</TableCell>
                        <TableCell><Badge className={cn('text-xs', MAINTENANCE_STATUSES[ticket.status].color)}>{MAINTENANCE_STATUSES[ticket.status].label}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => openEdit(ticket)}><Edit className="h-3 w-3"/></Button>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-destructive" onClick={() => setDeleteId(ticket.id)}><Trash2 className="h-3 w-3"/></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'تعديل تذكرة الصيانة' : 'طلب صيانة جديد'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1"><Label className="text-xs">المشكلة *</Label><Input value={form.issue} onChange={e => setForm(p => ({...p, issue: e.target.value}))} placeholder="مثال: عطل في جهاز قياس الضغط"/></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">الوصف *</Label><Textarea rows={3} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="وصف تفصيلي للمشكلة..."/></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">الموقع المحدد *</Label><Input value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))} placeholder="مثال: غرفة 305، سرير 2"/></div>
            <div className="space-y-1"><Label className="text-xs">القسم</Label>
              <Select value={form.department} onValueChange={v => setForm(p => ({...p, department: v}))}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>{['ICU', 'ER', 'الباطنية', 'الجراحة', 'الصيانة'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">الأولوية</Label>
              <Select value={form.priority} onValueChange={v => setForm(p => ({...p, priority: v as MaintenancePriority}))}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>{Object.entries(MAINTENANCE_PRIORITIES).map(([k,v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {editing && (
              <>
                <div className="col-span-2 space-y-1"><Label className="text-xs">الحالة</Label>
                  <Select value={tickets.find(t => t.id === editing)?.status || 'open'} onValueChange={v => updateMaintenanceTicket(editing, { status: v as MaintenanceStatus })}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{Object.entries(MAINTENANCE_STATUSES).map(([k,v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1"><Label className="text-xs">ملاحظات</Label><Textarea rows={2} value={form.notes || ''} onChange={e => setForm(p => ({...p, notes: e.target.value}))}/></div>
                <div className="col-span-2 space-y-1"><Label className="text-xs">المسؤول عن الصيانة</Label><Input value={form.assignedToName || ''} onChange={e => setForm(p => ({...p, assignedToName: e.target.value}))} placeholder="اسم الفني"/></div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {editing ? 'حفظ التعديلات' : 'إرسال الطلب'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>سيتم حذف تذكرة الصيانة هذه نهائياً.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction className="bg-destructive" onClick={handleDelete}>حذف</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}