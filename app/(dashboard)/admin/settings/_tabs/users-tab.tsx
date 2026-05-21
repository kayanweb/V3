'use client'

import * as React from 'react'
import {
  Users, UserCog, Shield, Search, Loader2, RefreshCw, CheckCircle2, XCircle, Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useLang } from '@/contexts/lang-context'
import { useAuth } from '@/contexts/auth-context'
import { useRealtimeCollection } from '@/lib/hooks/useRealtimeCollection'
import { getAllRoles, seedDefaultRoles, type RoleRecord } from '@/lib/services/roles.service'
import { updateUserProfile, type UserRecord } from '@/lib/services/users.service'
import { getAllDepartments, type DepartmentRecord } from '@/lib/services/departments.service'

const STATUS_CONFIG = {
  active:   { label: 'نشط',    labelEn: 'Active',   className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' },
  inactive: { label: 'غير نشط', labelEn: 'Inactive', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  pending:  { label: 'معلّق',  labelEn: 'Pending',  className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
  rejected: { label: 'مرفوض', labelEn: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' },
}

type UserRow = UserRecord & Record<string, unknown>

export function UsersTab() {
  const { isAr } = useLang()
  const { user: currentUser } = useAuth()
  const { data: users, loading, refresh } = useRealtimeCollection<UserRow>('users')

  const [roles, setRoles] = React.useState<RoleRecord[]>([])
  const [departments, setDepartments] = React.useState<DepartmentRecord[]>([])
  const [search, setSearch] = React.useState('')
  const [savingId, setSavingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const load = async () => {
      await seedDefaultRoles()
      const [r, d] = await Promise.all([getAllRoles(), getAllDepartments()])
      setRoles(r)
      setDepartments(d)
    }
    load()
  }, [])

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase()
    return users.filter((u) =>
      !q ||
      (u.name ?? '').toLowerCase().includes(q) ||
      (u.nameAr ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q) ||
      (u.employeeCode ?? '').toLowerCase().includes(q),
    )
  }, [users, search])

  const handleRoleChange = async (userId: string, roleId: string) => {
    if (userId === currentUser?.id) {
      toast.error(isAr ? 'لا يمكنك تغيير دورك بنفسك' : 'You cannot change your own role')
      return
    }
    setSavingId(userId)
    try {
      await updateUserProfile(userId, { roles: [roleId] })
      toast.success(isAr ? 'تم تحديث الدور بنجاح' : 'Role updated successfully')
    } catch {
      toast.error(isAr ? 'حدث خطأ أثناء التحديث' : 'Error updating role')
    } finally {
      setSavingId(null)
    }
  }

  const handleStatusChange = async (userId: string, status: 'active' | 'inactive') => {
    if (userId === currentUser?.id) {
      toast.error(isAr ? 'لا يمكنك تغيير حالتك بنفسك' : 'You cannot change your own status')
      return
    }
    setSavingId(userId)
    try {
      await updateUserProfile(userId, { status })
      toast.success(isAr ? 'تم تحديث الحالة' : 'Status updated')
    } catch {
      toast.error(isAr ? 'حدث خطأ' : 'Error updating status')
    } finally {
      setSavingId(null)
    }
  }

  const activeCount  = users.filter((u) => u.status === 'active').length
  const pendingCount = users.filter((u) => u.status === 'pending').length
  const inactiveCount = users.filter((u) => u.status === 'inactive').length

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: isAr ? 'نشط' : 'Active', value: activeCount, icon: CheckCircle2, color: 'text-green-600' },
          { label: isAr ? 'معلّق' : 'Pending', value: pendingCount, icon: Clock, color: 'text-amber-600' },
          { label: isAr ? 'غير نشط' : 'Inactive', value: inactiveCount, icon: XCircle, color: 'text-slate-500' },
        ].map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="text-center py-3">
              <Icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </Card>
          )
        })}
      </div>

      {/* Search + refresh */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? 'بحث بالاسم أو الإيميل أو الكود...' : 'Search by name, email, or code...'}
            className="pr-9"
          />
        </div>
        <Button variant="outline" size="icon" onClick={refresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-teal-600" />
            {isAr ? 'المستخدمون' : 'Users'}
            <Badge variant="secondary" className="mr-auto">{filtered.length}</Badge>
          </CardTitle>
          <CardDescription className="flex items-center gap-1 text-xs text-teal-600">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
            {isAr ? 'يتحدث تلقائياً (Real-time)' : 'Live real-time updates'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
          ) : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">{isAr ? 'لا يوجد مستخدمون' : 'No users found'}</p>
              ) : (
                filtered.map((u) => {
                  const statusCfg = STATUS_CONFIG[u.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.inactive
                  const primaryRoleId = u.roles?.[0] ?? ''
                  const isSaving = savingId === u.id
                  return (
                    <div key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                      {/* Avatar + info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-9 w-9 shrink-0">
                          {u.photoURL && <AvatarImage src={u.photoURL as string} />}
                          <AvatarFallback className="bg-teal-100 text-teal-700 font-bold text-sm">
                            {(u.nameAr || u.name || '?').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{isAr ? (u.nameAr || u.name) : (u.name || u.nameAr)}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          {u.employeeCode && <p className="text-[10px] text-muted-foreground">{u.employeeCode as string}</p>}
                        </div>
                        <Badge className={`text-[10px] px-1.5 py-0 ${statusCfg.className} shrink-0`}>
                          {isAr ? statusCfg.label : statusCfg.labelEn}
                        </Badge>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Role selector */}
                        <Select
                          value={primaryRoleId}
                          onValueChange={(v) => handleRoleChange(u.id, v)}
                          disabled={isSaving}
                        >
                          <SelectTrigger className="h-7 w-36 text-xs gap-1">
                            <Shield className="h-3 w-3 shrink-0" />
                            <SelectValue placeholder={isAr ? 'اختر الدور' : 'Select role'} />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((r) => (
                              <SelectItem key={r.id} value={r.id} className="text-xs">
                                {isAr ? r.nameAr : r.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Toggle active/inactive */}
                        {u.status === 'active' ? (
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-amber-600 hover:text-amber-700 px-2 gap-1" disabled={isSaving} onClick={() => handleStatusChange(u.id, 'inactive')}>
                            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                            {isAr ? 'إيقاف' : 'Deactivate'}
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-green-600 hover:text-green-700 px-2 gap-1" disabled={isSaving} onClick={() => handleStatusChange(u.id, 'active')}>
                            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                            {isAr ? 'تفعيل' : 'Activate'}
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
