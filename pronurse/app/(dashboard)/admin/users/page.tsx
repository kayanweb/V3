'use client'

import * as React from 'react'
import {
  Plus, MoreHorizontal, Trash2, Shield, UserCog,
  CheckCircle2, XCircle, Clock, Users, UserCheck, UserX, Loader2, Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DataTable, Column } from '@/components/ui/data-table'
import { toast } from 'sonner'
import { useLang } from '@/contexts/lang-context'
import { useAuth } from '@/contexts/auth-context'
import {
  getPendingUsers, updatePendingUser,
  type PendingUserRecord,
} from '@/lib/services/pending-users.service'
import {
  getAllUsers, deleteUser, updateUserProfile, saveUserProfile,
  approveUser, generateEmployeeCode,
  type UserRecord,
} from '@/lib/services/users.service'
import { getAllRoles, seedDefaultRoles, type RoleRecord } from '@/lib/services/roles.service'
import { getAllDepartments, type DepartmentRecord } from '@/lib/services/departments.service'

interface DisplayUser extends UserRecord, Record<string, unknown> {}

/* ─── Approve dialog ─── */
function ApproveDialog({
  entry, isAr, roles, departments, currentUser, onDone,
}: {
  entry: PendingUserRecord | null
  isAr: boolean
  roles: RoleRecord[]
  departments: DepartmentRecord[]
  currentUser: ReturnType<typeof useAuth>['user']
  onDone: () => void
}) {
  const [roleId, setRoleId] = React.useState('')
  const [dept, setDept] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (entry) {
      setOpen(true)
      setRoleId(roles[0]?.id ?? '')
      setDept(departments[0]?.nameAr ?? '')
    }
  }, [entry, roles, departments])

  const approve = async () => {
    if (!entry || !roleId) return
    setLoading(true)
    try {
      await approveUser(entry.id, roleId, dept, currentUser?.nameAr || 'Admin')
      toast.success(isAr ? `تمت الموافقة على ${entry.name}` : `${entry.name} approved`)
      setOpen(false)
      onDone()
    } catch {
      toast.error(isAr ? 'حدث خطأ' : 'Error approving user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isAr ? 'الموافقة على الطلب وتحديد الصلاحية' : 'Approve Request & Assign Role'}</DialogTitle>
          <DialogDescription>{isAr ? 'حدد الدور والقسم للمستخدم الجديد' : 'Set the role and department for the new user'}</DialogDescription>
        </DialogHeader>
        {entry && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Avatar className="h-10 w-10">
                {entry.photoURL && <AvatarImage src={entry.photoURL} />}
                <AvatarFallback className="bg-teal-100 text-teal-700 font-bold">{entry.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{entry.name}</p>
                <p className="text-xs text-muted-foreground">{entry.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'الدور / الصلاحية' : 'Role'}</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                <SelectTrigger><SelectValue /></SelectTrigger>
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
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
          <Button onClick={approve} disabled={loading} className="bg-green-600 hover:bg-green-700 gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {isAr ? 'موافقة وتفعيل' : 'Approve & Activate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ═══════════════════════════════════════════════════════════ */
export default function UsersPage() {
  const { lang } = useLang()
  const { user: currentUser } = useAuth()
  const isAr = lang === 'ar'

  const [systemUsers, setSystemUsers] = React.useState<DisplayUser[]>([])
  const [pendingList, setPendingList] = React.useState<PendingUserRecord[]>([])
  const [roles, setRoles] = React.useState<RoleRecord[]>([])
  const [departments, setDepartments] = React.useState<DepartmentRecord[]>([])
  const [roleFilter, setRoleFilter] = React.useState('all')
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [loadingUsers, setLoadingUsers] = React.useState(true)
  const [rejectTarget, setRejectTarget] = React.useState<PendingUserRecord | null>(null)
  const [approveTarget, setApproveTarget] = React.useState<PendingUserRecord | null>(null)
  const [newUser, setNewUser] = React.useState({ name: '', nameAr: '', email: '', roleId: '', department: '' })

  const loadAll = React.useCallback(async () => {
    await seedDefaultRoles()
    const [users, pending, rolesData, depts] = await Promise.all([
      getAllUsers(),
      getPendingUsers(),
      getAllRoles(),
      getAllDepartments(),
    ])
    setSystemUsers(users as DisplayUser[])
    setPendingList(pending.filter((u) => u.status === 'pending'))
    setRoles(rolesData)
    setDepartments(depts)
    setLoadingUsers(false)
  }, [])

  React.useEffect(() => {
    loadAll()
    const interval = setInterval(() => {
      getPendingUsers().then((all) => setPendingList(all.filter((u) => u.status === 'pending')))
    }, 10000)
    return () => clearInterval(interval)
  }, [loadAll])

  const rejectUser = async (entry: PendingUserRecord) => {
    await updatePendingUser(entry.id, { status: 'rejected', reviewedAt: new Date().toISOString(), reviewedBy: currentUser?.nameAr || 'Admin' })
    toast.error(isAr ? `تم رفض ${entry.name}` : `${entry.name} rejected`)
    await loadAll()
    setRejectTarget(null)
  }

  const addUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast.error(isAr ? 'أدخل الاسم والبريد الإلكتروني' : 'Enter name and email')
      return
    }
    const code = await generateEmployeeCode()
    const user = await saveUserProfile({
      id: `manual_${Date.now()}`,
      name: newUser.name,
      nameAr: newUser.nameAr || newUser.name,
      email: newUser.email,
      employeeCode: code,
      roles: newUser.roleId ? [newUser.roleId] : [],
      departments: newUser.department ? [newUser.department] : [],
      customPermissions: [],
      mustChangePassword: true,
      status: 'active',
    })
    toast.success(isAr ? `تمت الإضافة — كود الموظف: ${code}` : `User added — Employee Code: ${code}`)
    setIsAddOpen(false)
    setNewUser({ name: '', nameAr: '', email: '', roleId: '', department: '' })
    await loadAll()
  }

  const toggleStatus = async (u: DisplayUser) => {
    const newStatus = u.status === 'active' ? 'inactive' : 'active'
    await updateUserProfile(u.id, { status: newStatus })
    setSystemUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, status: newStatus } : x))
  }

  const removeUser = async (id: string) => {
    await deleteUser(id)
    setSystemUsers((prev) => prev.filter((u) => u.id !== id))
    toast.success(isAr ? 'تم حذف المستخدم' : 'User deleted')
  }

  const filteredUsers = systemUsers.filter((u) =>
    roleFilter === 'all' || (u.roles ?? []).includes(roleFilter)
  )

  const getRoleLabel = (u: DisplayUser) => {
    const roleId = (u.roles ?? [])[0]
    const role = roles.find((r) => r.id === roleId)
    return role ? (isAr ? role.nameAr : role.name) : roleId ?? '—'
  }

  const userColumns: Column<DisplayUser>[] = [
    {
      key: 'nameAr',
      header: isAr ? 'المستخدم' : 'User',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {row.photoURL && <AvatarImage src={row.photoURL as string} />}
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
              {(row.nameAr as string).charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{row.nameAr as string}</p>
            <p className="text-xs text-muted-foreground">{row.email as string}</p>
            {row.employeeCode && <p className="text-[10px] text-muted-foreground font-mono">{row.employeeCode as string}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'roles',
      header: isAr ? 'الدور' : 'Role',
      cell: (row) => (
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
          {getRoleLabel(row)}
        </Badge>
      ),
    },
    {
      key: 'departments',
      header: isAr ? 'القسم' : 'Department',
      cell: (row) => <span className="text-sm text-muted-foreground">{(row.departments as string[])?.[0] ?? '—'}</span>,
    },
    {
      key: 'status',
      header: isAr ? 'الحالة' : 'Status',
      cell: (row) => (
        <Badge variant="outline" className={row.status === 'active'
          ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400'
          : 'bg-slate-100 text-slate-500'}>
          {row.status === 'active' ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معطّل' : 'Inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: isAr ? 'الإجراءات' : 'Actions',
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toggleStatus(row)}>
              {row.status === 'active'
                ? <><UserX className="h-4 w-4 ml-2" />{isAr ? 'تعطيل' : 'Deactivate'}</>
                : <><UserCheck className="h-4 w-4 ml-2" />{isAr ? 'تفعيل' : 'Activate'}</>}
            </DropdownMenuItem>
            {row.employeeCode && (
              <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(row.employeeCode as string); toast.success(isAr ? 'تم النسخ' : 'Copied') }}>
                <Copy className="h-4 w-4 ml-2" />
                {isAr ? 'نسخ كود الموظف' : 'Copy Employee Code'}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => removeUser(row.id as string)}>
              <Trash2 className="h-4 w-4 ml-2" />
              {isAr ? 'حذف' : 'Delete'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? 'إدارة المستخدمين' : 'User Management'}</h1>
          <p className="text-muted-foreground text-sm">{isAr ? 'إدارة حسابات وصلاحيات مستخدمي النظام — Firestore' : 'Manage system user accounts — Firestore'}</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />{isAr ? 'إضافة مستخدم' : 'Add User'}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{isAr ? 'إضافة مستخدم جديد' : 'Add New User'}</DialogTitle>
              <DialogDescription>{isAr ? 'سيتم توليد كود الموظف تلقائياً' : 'Employee code will be auto-generated'}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{isAr ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                  <Input value={newUser.nameAr} onChange={(e) => setNewUser({ ...newUser, nameAr: e.target.value })} placeholder="أحمد محمد" />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}</Label>
                  <Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Ahmed Mohammed" dir="ltr" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'البريد الإلكتروني' : 'Email'}</Label>
                <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="user@hospital.com" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'الدور' : 'Role'}</Label>
                <Select value={newUser.roleId} onValueChange={(v) => setNewUser({ ...newUser, roleId: v })}>
                  <SelectTrigger><SelectValue placeholder={isAr ? 'اختر دور' : 'Select role'} /></SelectTrigger>
                  <SelectContent>{roles.map((r) => <SelectItem key={r.id} value={r.id}>{isAr ? r.nameAr : r.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'القسم' : 'Department'}</Label>
                <Select value={newUser.department} onValueChange={(v) => setNewUser({ ...newUser, department: v })}>
                  <SelectTrigger><SelectValue placeholder={isAr ? 'اختر قسم' : 'Select department'} /></SelectTrigger>
                  <SelectContent>{departments.filter((d) => d.isActive).map((d) => <SelectItem key={d.id} value={d.nameAr}>{d.nameAr}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
              <Button onClick={addUser}>{isAr ? 'إضافة' : 'Add'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: isAr ? 'إجمالي المستخدمين' : 'Total Users', val: systemUsers.length, icon: UserCog, bg: 'bg-primary/10', ic: 'text-primary' },
          { label: isAr ? 'نشط' : 'Active', val: systemUsers.filter((u) => u.status === 'active').length, icon: UserCheck, bg: 'bg-green-100 dark:bg-green-950', ic: 'text-green-600' },
          { label: isAr ? 'بانتظار الموافقة' : 'Pending', val: pendingList.length, icon: Clock, bg: 'bg-amber-100 dark:bg-amber-950', ic: 'text-amber-600' },
          { label: isAr ? 'الأدوار' : 'Roles', val: roles.length, icon: Shield, bg: 'bg-red-100 dark:bg-red-950', ic: 'text-red-600' },
        ].map(({ label, val, icon: Icon, bg, ic }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${ic}`} />
                </div>
                <div><p className="text-2xl font-bold">{val}</p><p className="text-xs text-muted-foreground">{label}</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users">
        <TabsList className="mb-2">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />{isAr ? 'المستخدمون' : 'Users'}
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{systemUsers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />{isAr ? 'طلبات الموافقة' : 'Pending'}
            {pendingList.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs animate-pulse">{pendingList.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardContent className="pt-5">
              <div className="flex gap-3 mb-4">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={isAr ? 'جميع الأدوار' : 'All roles'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? 'جميع الأدوار' : 'All roles'}</SelectItem>
                    {roles.map((r) => <SelectItem key={r.id} value={r.id}>{isAr ? r.nameAr : r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => setRoleFilter('all')}>{isAr ? 'مسح' : 'Reset'}</Button>
              </div>
              {loadingUsers ? (
                <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
              ) : (
                <DataTable
                  columns={userColumns}
                  data={filteredUsers}
                  searchKey="nameAr"
                  searchPlaceholder={isAr ? 'بحث بالاسم...' : 'Search by name...'}
                  emptyMessage={isAr ? 'لا يوجد مستخدمون' : 'No users found'}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          {pendingList.length === 0 ? (
            <Card>
              <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <p className="font-semibold">{isAr ? 'لا توجد طلبات معلقة' : 'No pending requests'}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingList.map((entry) => (
                <Card key={entry.id} className="border-amber-200 dark:border-amber-800">
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-11 w-11 shrink-0">
                          {entry.photoURL && <img src={entry.photoURL} alt="" className="rounded-full" />}
                          <AvatarFallback className="bg-teal-100 text-teal-700 font-bold">{entry.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">{entry.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{entry.email}</p>
                          <p className="text-xs text-muted-foreground">{isAr ? 'طلب في:' : 'Requested:'} {new Date(entry.requestedAt).toLocaleString(isAr ? 'ar-EG' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-1.5" onClick={() => setApproveTarget(entry)}>
                          <CheckCircle2 className="h-4 w-4" />{isAr ? 'موافقة' : 'Approve'}
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 gap-1.5" onClick={() => setRejectTarget(entry)}>
                          <XCircle className="h-4 w-4" />{isAr ? 'رفض' : 'Reject'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ApproveDialog
        entry={approveTarget} isAr={isAr} roles={roles} departments={departments}
        currentUser={currentUser}
        onDone={() => { setApproveTarget(null); loadAll() }}
      />

      <AlertDialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? 'رفض الطلب' : 'Reject Request'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr ? `هل أنت متأكد من رفض طلب ${rejectTarget?.name}؟` : `Reject ${rejectTarget?.name}'s request?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => rejectTarget && rejectUser(rejectTarget)}>
              {isAr ? 'رفض' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
