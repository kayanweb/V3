'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
// UI Components
import { Button } from '@/components/ui/button'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, BookOpen, FileText, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getAllPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
} from '@/lib/services/policies.service'
import type { PolicyRecord, PolicyCategory, PolicyStatus } from '@/lib/repositories/contracts'

const POLICY_CATEGORIES: Record<PolicyCategory, { label: string; icon: React.ReactNode }> = {
  clinical: { label: 'سريرية', icon: <BookOpen className="h-3 w-3"/> },
  admin: { label: 'إدارية', icon: <FileText className="h-3 w-3"/> },
  safety: { label: 'سلامة', icon: <ShieldCheck className="h-3 w-3"/> },
  infection: { label: 'مكافحة العدوى', icon: <ShieldCheck className="h-3 w-3"/> },
  emergency: { label: 'طوارئ', icon: <AlertTriangle className="h-3 w-3"/> },
  hr: { label: 'موارد بشرية', icon: <FileText className="h-3 w-3"/> },
}

const POLICY_STATUSES: Record<PolicyStatus, { label: string; color: string }> = {
  active: { label: 'نشطة', color: 'bg-green-100 text-green-700' },
  under_review: { label: 'قيد المراجعة', color: 'bg-amber-100 text-amber-700' },
  archived: { label: 'مؤرشفة', color: 'bg-gray-100 text-gray-700' },
}

const EMPTY_FORM: Omit<PolicyRecord, 'id' | 'createdAt' | 'updatedAt'> = {
  policyNo: '',
  title: '',
  content: '',
  category: 'clinical',
  status: 'active',
  version: '1.0',
  effectiveDate: '',
  reviewDate: '',
  author: '',
  approvedBy: '',
  tags: [],
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<PolicyRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [viewItem, setViewItem] = useState<PolicyRecord | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getAllPolicies()
      setPolicies(data)
    } catch (e) {
      toast.error('فشل في تحميل السياسات والإجراءات')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = useMemo(() => {
    let list = [...policies].sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime())
    if (filterCategory !== 'all') list = list.filter(p => p.category === filterCategory)
    if (filterStatus !== 'all') list = list.filter(p => p.status === filterStatus)
    return list
  }, [policies, filterCategory, filterStatus])

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setDialogOpen(true) }
  const openEdit = (policy: PolicyRecord) => {
    setEditing(policy.id)
    setForm({
      policyNo: policy.policyNo,
      title: policy.title,
      content: policy.content,
      category: policy.category,
      status: policy.status,
      version: policy.version,
      effectiveDate: policy.effectiveDate,
      reviewDate: policy.reviewDate,
      author: policy.author,
      approvedBy: policy.approvedBy,
      tags: policy.tags,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.content || !form.policyNo) { toast.error('العنوان والمحتوى ورقم السياسة مطلوبان'); return }
    setIsSaving(true)
    try {
      if (editing) {
        await updatePolicy(editing, form)
        toast.success('تم تحديث السياسة')
      } else {
        await createPolicy(form)
        toast.success('تم إضافة السياسة')
      }
      await loadData()
      setDialogOpen(false)
    } catch (e) {
      toast.error('حدث خطأ أثناء حفظ السياسة')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await deletePolicy(deleteId)
    toast.success('تم حذف السياسة')
    loadData()
    setDeleteId(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-2xl font-bold">السياسات والإجراءات</h1><p className="text-sm text-muted-foreground">إدارة وتوثيق سياسات وإجراءات المستشفى</p></div>
        <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 ml-1"/>سياسة جديدة</Button>
      </div>

      {/* Filters */}
      <Card><CardContent className="pt-4 pb-3">
        <div className="flex flex-wrap gap-3">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40"><SelectValue placeholder="الفئة"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الفئات</SelectItem>
              {Object.entries(POLICY_CATEGORIES).map(([k,v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="الحالة"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              {Object.entries(POLICY_STATUSES).map(([k,v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      {/* Policies Table */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">السياسات — {filtered.length} سياسة</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <p className="text-muted-foreground">جاري مزامنة السياسات...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {['#', 'رقم السياسة', 'العنوان', 'الفئة', 'الإصدار', 'تاريخ النفاذ', 'الحالة', 'إجراءات'].map(h => (
                      <TableHead key={h} className="text-xs">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">لا توجد سياسات</TableCell></TableRow>
                  ) : (
                    filtered.map((policy, i) => (
                      <TableRow key={policy.id} onClick={() => setViewItem(policy)} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-semibold">{policy.policyNo}</TableCell>
                        <TableCell className="text-sm">{policy.title}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs flex items-center gap-1">{POLICY_CATEGORIES[policy.category].icon}{POLICY_CATEGORIES[policy.category].label}</Badge></TableCell>
                        <TableCell className="text-sm">{policy.version}</TableCell>
                        <TableCell className="text-sm font-mono">{policy.effectiveDate}</TableCell>
                        <TableCell><Badge className={cn('text-xs', POLICY_STATUSES[policy.status].color)}>{POLICY_STATUSES[policy.status].label}</Badge></TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => openEdit(policy)}><Edit className="h-3 w-3"/></Button>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-destructive" onClick={() => setDeleteId(policy.id)}><Trash2 className="h-3 w-3"/></Button>
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
          <DialogHeader><DialogTitle>{editing ? 'تعديل السياسة' : 'سياسة جديدة'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1"><Label className="text-xs">رقم السياسة *</Label><Input value={form.policyNo} onChange={e => setForm(p => ({...p, policyNo: e.target.value}))}/></div>
            <div className="space-y-1"><Label className="text-xs">الإصدار</Label><Input value={form.version} onChange={e => setForm(p => ({...p, version: e.target.value}))}/></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">عنوان السياسة *</Label><Input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))}/></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">محتوى السياسة *</Label><Textarea rows={5} value={form.content} onChange={e => setForm(p => ({...p, content: e.target.value}))} placeholder="اكتب محتوى السياسة هنا..."/></div>
            <div className="space-y-1"><Label className="text-xs">الفئة</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({...p, category: v as PolicyCategory}))}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>{Object.entries(POLICY_CATEGORIES).map(([k,v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">الحالة</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({...p, status: v as PolicyStatus}))}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>{Object.entries(POLICY_STATUSES).map(([k,v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">تاريخ النفاذ</Label><Input type="date" value={form.effectiveDate} onChange={e => setForm(p => ({...p, effectiveDate: e.target.value}))}/></div>
            <div className="space-y-1"><Label className="text-xs">تاريخ المراجعة</Label><Input type="date" value={form.reviewDate} onChange={e => setForm(p => ({...p, reviewDate: e.target.value}))}/></div>
            <div className="space-y-1"><Label className="text-xs">المؤلف</Label><Input value={form.author} onChange={e => setForm(p => ({...p, author: e.target.value}))}/></div>
            <div className="space-y-1"><Label className="text-xs">المعتمد من</Label><Input value={form.approvedBy} onChange={e => setForm(p => ({...p, approvedBy: e.target.value}))}/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {editing ? 'حفظ التعديلات' : 'إضافة السياسة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        {viewItem && (
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs flex items-center gap-1">{POLICY_CATEGORIES[viewItem.category].icon}{POLICY_CATEGORIES[viewItem.category].label}</Badge>
                <Badge className={cn('text-xs', POLICY_STATUSES[viewItem.status].color)}>{POLICY_STATUSES[viewItem.status].label}</Badge>
                <Badge variant="secondary" className="text-xs">الإصدار: {viewItem.version}</Badge>
              </div>
              <DialogTitle className="text-lg mt-1">{viewItem.title} <span className="text-muted-foreground text-sm">({viewItem.policyNo})</span></DialogTitle>
            </DialogHeader>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{viewItem.content}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground pt-2 border-t">
              <span>المؤلف: {viewItem.author}</span>
              <span>المعتمد من: {viewItem.approvedBy}</span>
              <span>تاريخ النفاذ: {viewItem.effectiveDate}</span>
              <span>تاريخ المراجعة: {viewItem.reviewDate}</span>
              <span>تاريخ الإنشاء: {new Date(viewItem.createdAt).toLocaleDateString()}</span>
              <span>آخر تحديث: {new Date(viewItem.updatedAt).toLocaleDateString()}</span>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewItem(null)}>إغلاق</Button>
              <Button onClick={() => { openEdit(viewItem); setViewItem(null) }}><Edit className="h-4 w-4 ml-1"/>تعديل</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>سيتم حذف هذه السياسة نهائياً.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction className="bg-destructive" onClick={handleDelete}>حذف</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}