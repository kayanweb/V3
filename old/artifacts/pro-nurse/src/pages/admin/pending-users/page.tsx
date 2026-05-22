

import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'wouter'
import { Clock, CheckCircle2, XCircle, Loader2, Users, UserCheck, RefreshCw, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { useLang } from '@/contexts/lang-context'
import { isFirebaseConfigured, getFirestoreDb } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import {
  updatePendingUser, type PendingUserRecord,
} from '@/lib/services/pending-users.service'
import { approveUser } from '@/lib/services/users.service'
import { getAllRoles, seedDefaultRoles, type RoleRecord } from '@/lib/services/roles.service'
import { getAllDepartments, type DepartmentRecord } from '@/lib/services/departments.service'

export default function PendingUsersPage() {
  const [, navigate] = useLocation()
  const { user: currentUser, can } = useAuth()
  const { lang } = useLang()
  const isAr = lang === 'ar'

  const [pendingList, setPendingList]   = useState<PendingUserRecord[]>([])
  const [roles, setRoles]               = useState<RoleRecord[]>([])
  const [departments, setDepartments]   = useState<DepartmentRecord[]>([])
  const [loading, setLoading]           = useState(true)
  const [approveTarget, setApproveTarget] = useState<PendingUserRecord | null>(null)
  const [rejectTarget, setRejectTarget]   = useState<PendingUserRecord | null>(null)
  const [roleId, setRoleId]             = useState('')
  const [dept, setDept]                 = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const unsubRef = useRef<(() => void) | null>(null)

  // ── Access guard ─────────────────────────────────────────────
  useEffect(() => {
    if (!can('users.approve') && !can('users.edit')) {
      navigate('/dashboard')
    }
  }, [can, navigate])

  // ── Load roles + departments once ────────────────────────────
  useEffect(() => {
    seedDefaultRoles()
      .then(() => Promise.all([getAllRoles(), getAllDepartments()]))
      .then(([r, d]) => { setRoles(r); setDepartments(d) })
  }, [])

  // ── Real-time listener on pendingUsers collection ─────────────
  useEffect(() => {
    if (!isFirebaseConfigured()) return

    const q = query(
      collection(getFirestoreDb(), 'pendingUsers'),
      where('status', '==', 'pending'),
    )

    unsubRef.current = onSnapshot(
      q,
      (snap: import('firebase/firestore').QuerySnapshot) => {
        const list: PendingUserRecord[] = snap.docs.map(
          (d: import('firebase/firestore').QueryDocumentSnapshot) =>
            ({ ...d.data(), id: d.id } as PendingUserRecord),
        )
        list.sort((a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime())
        setPendingList(list)
        setLoading(false)
      },
      () => setLoading(false),
    )

    return () => { unsubRef.current?.() }
  }, [])

  // ── Approve ───────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!approveTarget || !roleId) {
      toast.error(isAr ? 'اختر الدور أولاً' : 'Please select a role first')
      return
    }
    setActionLoading(true)
    try {
      await approveUser(
        approveTarget.id,
        roleId,
        dept || (departments[0]?.nameAr ?? ''),
        currentUser?.nameAr || 'Admin',
      )
      toast.success(isAr ? `✅ تمت الموافقة على ${approveTarget.name}` : `✅ ${approveTarget.name} approved`)
      setApproveTarget(null)
    } catch {
      toast.error(isAr ? 'حدث خطأ أثناء الموافقة' : 'Error approving user')
    } finally {
      setActionLoading(false)
    }
  }

  // ── Reject ────────────────────────────────────────────────────
  const handleReject = async () => {
    if (!rejectTarget) return
    setActionLoading(true)
    try {
      await updatePendingUser(rejectTarget.id, {
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        reviewedBy: currentUser?.nameAr || 'Admin',
      })
      toast.error(isAr ? `تم رفض ${rejectTarget.name}` : `${rejectTarget.name} rejected`)
      setRejectTarget(null)
    } catch {
      toast.error(isAr ? 'حدث خطأ' : 'Error')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-amber-500" />
            {isAr ? 'طلبات الانضمام' : 'Pending User Requests'}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isAr ? 'يتحدث هذا الجدول فورياً عند وصول طلبات جديدة' : 'This table updates in real-time as new requests arrive'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
            {isAr ? `${pendingList.length} طلب معلق` : `${pendingList.length} pending`}
          </Badge>
        </div>
      </div>

      {/* Empty state */}
      {!loading && pendingList.length === 0 && (
        <Card>
          <CardContent className="py-20 flex flex-col items-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <div>
              <p className="text-lg font-semibold">{isAr ? 'لا توجد طلبات معلقة' : 'No pending requests'}</p>
              <p className="text-muted-foreground text-sm mt-1">
                {isAr ? 'سيظهر هنا الطلبات الجديدة فور وصولها تلقائياً' : 'New requests will appear here automatically'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-teal-600" />
        </div>
      )}

      {/* Request cards */}
      {!loading && pendingList.length > 0 && (
        <div className="space-y-3">
          {pendingList.map((entry, idx) => (
            <Card key={entry.id} className="border-amber-200 dark:border-amber-800 hover:shadow-md transition-shadow">
              <CardContent className="py-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                  {/* Index + avatar + info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-xs font-bold">
                      {idx + 1}
                    </div>
                    <Avatar className="h-12 w-12 shrink-0">
                      {entry.photoURL && <AvatarImage src={entry.photoURL} />}
                      <AvatarFallback className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 font-bold text-base">
                        {entry.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{entry.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{entry.email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.requestedAt).toLocaleString(isAr ? 'ar-EG' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 gap-1.5"
                      onClick={() => { setApproveTarget(entry); setRoleId(roles[0]?.id ?? ''); setDept(departments[0]?.nameAr ?? '') }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {isAr ? 'موافقة' : 'Approve'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 gap-1.5"
                      onClick={() => setRejectTarget(entry)}
                    >
                      <XCircle className="h-4 w-4" />
                      {isAr ? 'رفض' : 'Reject'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Approve Dialog ─── */}
      <Dialog open={!!approveTarget} onOpenChange={(o) => !o && setApproveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isAr ? 'تحديد الدور والقسم' : 'Assign Role & Department'}</DialogTitle>
            <DialogDescription>{isAr ? 'حدد دور وقسم المستخدم الجديد قبل الموافقة' : 'Set the role and department for the new user before approving'}</DialogDescription>
          </DialogHeader>
          {approveTarget && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar className="h-10 w-10">
                  {approveTarget.photoURL && <AvatarImage src={approveTarget.photoURL} />}
                  <AvatarFallback className="bg-teal-100 text-teal-700 font-bold">
                    {approveTarget.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{approveTarget.name}</p>
                  <p className="text-xs text-muted-foreground">{approveTarget.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'الدور' : 'Role'} *</Label>
                <Select value={roleId} onValueChange={setRoleId}>
                  <SelectTrigger><SelectValue placeholder={isAr ? 'اختر دور...' : 'Select role...'} /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{isAr ? r.nameAr : r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'القسم' : 'Department'}</Label>
                <Select value={dept} onValueChange={setDept}>
                  <SelectTrigger><SelectValue placeholder={isAr ? 'اختر قسم...' : 'Select department...'} /></SelectTrigger>
                  <SelectContent>
                    {departments.filter((d) => d.isActive).map((d) => (
                      <SelectItem key={d.id} value={d.nameAr}>{d.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveTarget(null)} disabled={actionLoading}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleApprove} disabled={actionLoading || !roleId} className="bg-green-600 hover:bg-green-700 gap-2">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {isAr ? 'موافقة وتفعيل' : 'Approve & Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject Confirm ─── */}
      <AlertDialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? 'رفض الطلب' : 'Reject Request'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? `هل أنت متأكد من رفض طلب "${rejectTarget?.name}"؟ لن يتمكن من الدخول للنظام.`
                : `Reject "${rejectTarget?.name}"'s request? They won't be able to access the system.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleReject}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              {isAr ? 'رفض' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
