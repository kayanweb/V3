

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Plus, Edit, Trash2, AlertTriangle, Shield, ClipboardList, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getAllIncidents,
  createIncident,
  updateIncident,
  deleteIncident,
} from '@/lib/services/incidents.service'
import type { 
  IncidentReport, 
  IncidentType, 
  IncidentSeverity, 
  IncidentStatus 
} from '@/lib/repositories'

const INCIDENT_TYPES: Record<IncidentType, string> = {
  fall: 'سقوط',
  medication_error: 'خطأ دوائي',
  pressure_ulcer: 'قرحة ضغط',
  infection: 'عدوى',
  equipment_failure: 'عطل جهاز',
  needle_stick: 'وخز إبرة',
  patient_complaint: 'شكوى مريض',
  other: 'أخرى',
}

const ACCIDENT_SEVERITY_LEVELS: Record<IncidentSeverity, { label: string; color: string }> = {
  catastrophic: { label: 'كارثي', color: 'bg-red-100 text-red-700' },
  near_miss:    { label: 'وشيك', color: 'bg-blue-100 text-blue-700' },
  minor:        { label: 'طفيف', color: 'bg-green-100 text-green-700' },
  moderate:     { label: 'متوسط', color: 'bg-amber-100 text-amber-700' },
  major:        { label: 'كبير', color: 'bg-orange-100 text-orange-700' },
}

const INCIDENT_STATUSES: Record<IncidentStatus, { label: string; color: string }> = {
  reported: { label: 'تم الإبلاغ', color: 'bg-gray-100 text-gray-700' },
  investigating: { label: 'قيد التحقيق', color: 'bg-blue-100 text-blue-700' },
  resolved: { label: 'تم الحل', color: 'bg-green-100 text-green-700' },
  closed: { label: 'مغلق', color: 'bg-purple-100 text-purple-700' },
}

const EMPTY_FORM: Omit<IncidentReport, 'id' | 'status' | 'dateTime' | 'createdAt' | 'updatedAt'> = {
  type: 'fall',
  severity: 'minor',
  department: 'ICU',
  location: '',
  reportedBy: 'User Name', // Should be dynamically set from auth context
  reportedById: 'user-id-123', // Should be dynamically set from auth context
  patientInvolved: false,
  description: '',
  immediateActions: '',
  witnesses: [],
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getAllIncidents()
      setIncidents(data)
    } catch (e) {
      toast.error('فشل في تحميل تقارير الحوادث')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = useMemo(() => {
    let list = [...incidents].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
    if (filterType !== 'all') list = list.filter(i => i.type === filterType)
    if (filterStatus !== 'all') list = list.filter(i => i.status === filterStatus)
    return list
  }, [incidents, filterType, filterStatus])

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setDialogOpen(true) }
  const openEdit = (incident: IncidentReport) => {
    setEditing(incident.id)
    setForm({
      type: incident.type,
      severity: incident.severity,
      department: incident.department,
      location: incident.location,
      reportedBy: incident.reportedBy,
      reportedById: incident.reportedById,
      patientInvolved: incident.patientInvolved,
      patientId: incident.patientId,
      patientName: incident.patientName,
      description: incident.description,
      immediateActions: incident.immediateActions,
      witnesses: incident.witnesses,
      rootCause: incident.rootCause,
      correctiveActions: incident.correctiveActions,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.type || !form.description || !form.reportedBy) { toast.error('يرجى ملء الحقول المطلوبة'); return }
    setIsSaving(true)
    try {
      if (editing) {
        await updateIncident(editing, form)
        toast.success('تم تحديث تقرير الحادث')
      } else {
        await createIncident(form)
        toast.success('تم إرسال تقرير الحادث')
      }
      await loadData()
      setDialogOpen(false)
    } catch (e) {
      toast.error('حدث خطأ أثناء حفظ التقرير')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await deleteIncident(deleteId)
    toast.success('تم حذف تقرير الحادث')
    loadData()
    setDeleteId(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-2xl font-bold">إدارة الحوادث والسلامة</h1><p className="text-sm text-muted-foreground">تسجيل وتتبع الحوادث لتعزيز السلامة</p></div>
        <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 ml-1"/>تقرير حادث جديد</Button>
      </div>

      {/* Filters */}
      <Card><CardContent className="pt-4 pb-3">
        <div className="flex flex-wrap gap-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40"><SelectValue placeholder="نوع الحادث"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              {Object.entries(INCIDENT_TYPES).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="الحالة"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              {Object.entries(INCIDENT_STATUSES).map(([k,v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      {/* Incidents Table */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">تقارير الحوادث — {filtered.length} تقرير</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <p className="text-muted-foreground">جاري مزامنة تقارير الحوادث...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {['#', 'التاريخ', 'النوع', 'الخطورة', 'القسم', 'الموقع', 'المبلغ', 'الحالة', 'إجراءات'].map(h => (
                      <TableHead key={h} className="text-xs">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">لا توجد تقارير حوادث</TableCell></TableRow>
                  ) : (
                    filtered.map((incident, i) => (
                      <TableRow key={incident.id}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="text-sm font-mono">{new Date(incident.dateTime).toLocaleDateString()}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{INCIDENT_TYPES[incident.type]}</Badge></TableCell>
                        <TableCell><Badge className={cn('text-xs', ACCIDENT_SEVERITY_LEVELS[incident.severity].color)}>{ACCIDENT_SEVERITY_LEVELS[incident.severity].label}</Badge></TableCell>
                        <TableCell className="text-sm">{incident.department}</TableCell>
                        <TableCell className="text-sm">{incident.location}</TableCell>
                        <TableCell className="text-sm">{incident.reportedBy}</TableCell>
                        <TableCell><Badge className={cn('text-xs', INCIDENT_STATUSES[incident.status].color)}>{INCIDENT_STATUSES[incident.status].label}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => openEdit(incident)}><Edit className="h-3 w-3"/></Button>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-destructive" onClick={() => setDeleteId(incident.id)}><Trash2 className="h-3 w-3"/></Button>
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
          <DialogHeader><DialogTitle>{editing ? 'تعديل تقرير الحادث' : 'تقرير حادث جديد'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1"><Label className="text-xs">نوع الحادث *</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({...p, type: v as IncidentType}))}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>{Object.entries(INCIDENT_TYPES).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">الخطورة</Label>
              <Select value={form.severity} onValueChange={v => setForm(p => ({...p, severity: v as any}))}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>{Object.entries(ACCIDENT_SEVERITY_LEVELS).map(([k,v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">القسم</Label>
              <Select value={form.department} onValueChange={v => setForm(p => ({...p, department: v}))}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>{['ICU', 'ER', 'الباطنية', 'الجراحة'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">الموقع المحدد</Label><Input value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))} placeholder="مثال: غرفة 305، سرير 2"/></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">وصف الحادث *</Label><Textarea rows={3} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="وصف تفصيلي لما حدث..."/></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">الإجراءات الفورية المتخذة</Label><Textarea rows={2} value={form.immediateActions} onChange={e => setForm(p => ({...p, immediateActions: e.target.value}))} placeholder="ماذا فعلت فور وقوع الحادث؟"/></div>
            <div className="col-span-2 space-y-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.patientInvolved} onChange={e => setForm(p => ({...p, patientInvolved: e.target.checked}))} className="rounded"/>
                <span className="text-sm">هل المريض متورط في الحادث؟</span>
              </label>
            </div>
            {form.patientInvolved && (
              <>
                <div className="space-y-1"><Label className="text-xs">اسم المريض</Label><Input value={form.patientName || ''} onChange={e => setForm(p => ({...p, patientName: e.target.value}))}/></div>
                <div className="space-y-1"><Label className="text-xs">رقم المريض (ID)</Label><Input value={form.patientId || ''} onChange={e => setForm(p => ({...p, patientId: e.target.value}))}/></div>
              </>
            )}
            <div className="col-span-2 space-y-1"><Label className="text-xs">المبلغ عن الحادث</Label><Input value={form.reportedBy} onChange={e => setForm(p => ({...p, reportedBy: e.target.value}))} placeholder="اسمك"/></div>
            {editing && (
              <>
                <div className="col-span-2 space-y-1"><Label className="text-xs">الحالة</Label>
                  <Select value={incidents.find(i => i.id === editing)?.status || 'reported'} onValueChange={v => updateIncident(editing, { status: v as IncidentStatus })}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{Object.entries(INCIDENT_STATUSES).map(([k,v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1"><Label className="text-xs">السبب الجذري (بعد التحقيق)</Label><Textarea rows={2} value={form.rootCause || ''} onChange={e => setForm(p => ({...p, rootCause: e.target.value}))}/></div>
                <div className="col-span-2 space-y-1"><Label className="text-xs">الإجراءات التصحيحية</Label><Textarea rows={2} value={form.correctiveActions || ''} onChange={e => setForm(p => ({...p, correctiveActions: e.target.value}))}/></div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {editing ? 'حفظ التعديلات' : 'إرسال التقرير'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>سيتم حذف تقرير الحادث هذا نهائياً.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction className="bg-destructive" onClick={handleDelete}>حذف</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}