

import * as React from 'react'
import {
  Plus, Edit, Trash2, Shield, Copy, ToggleLeft, ToggleRight,
  ChevronDown, ChevronRight, Save, RotateCcw, Check, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useLang } from '@/contexts/lang-context'
import {
  getAllRoles, createRole, updateRole, deleteRole, cloneRole,
  seedDefaultRoles,
  PERMISSION_GROUPS, PERMISSION_LABELS,
  type RoleRecord,
} from '@/lib/services/roles.service'

export default function RolesPage() {
  const { isAr } = useLang()
  const [roles, setRoles] = React.useState<RoleRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  // Dialog state
  const [editTarget, setEditTarget] = React.useState<RoleRecord | null>(null)
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<RoleRecord | null>(null)

  // Form state
  const [form, setForm] = React.useState({ name: '', nameAr: '', description: '', permissions: [] as string[] })

  // Permission matrix expanded groups
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({})
  // Which role is being edited in the matrix
  const [matrixRole, setMatrixRole] = React.useState<RoleRecord | null>(null)
  const [matrixPerms, setMatrixPerms] = React.useState<string[]>([])

  const load = React.useCallback(async () => {
    await seedDefaultRoles()
    const data = await getAllRoles()
    setRoles(data)
    setLoading(false)
  }, [])

  React.useEffect(() => { load() }, [load])

  const openCreate = () => {
    setForm({ name: '', nameAr: '', description: '', permissions: [] })
    setIsCreateOpen(true)
  }

  const openEdit = (role: RoleRecord) => {
    setEditTarget(role)
    setForm({ name: role.name, nameAr: role.nameAr, description: role.description ?? '', permissions: [...role.permissions] })
    setIsCreateOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.nameAr) {
      toast.error(isAr ? 'أدخل الاسم بالعربي والإنجليزي' : 'Enter name in Arabic and English')
      return
    }
    setSaving(true)
    try {
      if (editTarget) {
        await updateRole(editTarget.id, { name: form.name, nameAr: form.nameAr, description: form.description, permissions: form.permissions })
        toast.success(isAr ? 'تم تحديث الدور' : 'Role updated')
      } else {
        await createRole({ name: form.name, nameAr: form.nameAr, description: form.description, permissions: form.permissions, isActive: true })
        toast.success(isAr ? 'تم إنشاء الدور' : 'Role created')
      }
      setIsCreateOpen(false)
      setEditTarget(null)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (role: RoleRecord) => {
    await deleteRole(role.id)
    toast.success(isAr ? 'تم حذف الدور' : 'Role deleted')
    setDeleteTarget(null)
    await load()
  }

  const handleClone = async (role: RoleRecord) => {
    await cloneRole(role.id)
    toast.success(isAr ? 'تم نسخ الدور' : 'Role cloned')
    await load()
  }

  const toggleActive = async (role: RoleRecord) => {
    await updateRole(role.id, { isActive: !role.isActive })
    await load()
  }

  // Permission matrix
  const openMatrix = (role: RoleRecord) => {
    setMatrixRole(role)
    setMatrixPerms([...role.permissions])
  }

  const togglePerm = (key: string) => {
    setMatrixPerms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    )
  }

  const toggleGroup = (group: string) => {
    const keys = PERMISSION_GROUPS[group]
    const allOn = keys.every((k) => matrixPerms.includes(k))
    if (allOn) {
      setMatrixPerms((prev) => prev.filter((p) => !keys.includes(p as typeof keys[number])))
    } else {
      setMatrixPerms((prev) => [...new Set([...prev, ...keys])])
    }
  }

  const saveMatrix = async () => {
    if (!matrixRole) return
    setSaving(true)
    try {
      await updateRole(matrixRole.id, { permissions: matrixPerms })
      toast.success(isAr ? 'تم حفظ الصلاحيات' : 'Permissions saved')
      setMatrixRole(null)
      await load()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? 'الأدوار والصلاحيات' : 'Roles & Permissions'}</h1>
          <p className="text-muted-foreground text-sm">
            {isAr ? 'إدارة الأدوار والصلاحيات بشكل ديناميكي من لوحة التحكم' : 'Dynamically manage roles and permissions from the dashboard'}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {isAr ? 'إنشاء دور جديد' : 'New Role'}
        </Button>
      </div>

      {/* Roles Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id} className={`relative overflow-hidden ${!role.isActive ? 'opacity-60' : ''}`}>
            <div className={`h-1 w-full ${role.isActive ? 'bg-teal-500' : 'bg-slate-300'}`} />
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base">{isAr ? role.nameAr : role.name}</CardTitle>
                    {role.isDefault && (
                      <Badge variant="secondary" className="text-[10px]">
                        {isAr ? 'افتراضي' : 'Default'}
                      </Badge>
                    )}
                  </div>
                  {role.description && (
                    <CardDescription className="mt-1 text-xs line-clamp-2">{role.description}</CardDescription>
                  )}
                </div>
                <Switch checked={role.isActive} onCheckedChange={() => toggleActive(role)} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-3.5 w-3.5 shrink-0" />
                <span>{role.permissions.length} {isAr ? 'صلاحية' : 'permissions'}</span>
              </div>

              {/* Permission preview */}
              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 5).map((p) => (
                  <Badge key={p} variant="outline" className="text-[10px] px-1.5 py-0 bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-400 dark:border-teal-800">
                    {PERMISSION_LABELS[p as keyof typeof PERMISSION_LABELS] ?? p}
                  </Badge>
                ))}
                {role.permissions.length > 5 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">+{role.permissions.length - 5}</Badge>
                )}
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex gap-1 flex-wrap">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={() => openMatrix(role)}>
                  <Shield className="h-3 w-3" />
                  {isAr ? 'الصلاحيات' : 'Permissions'}
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={() => openEdit(role)}>
                  <Edit className="h-3 w-3" />
                  {isAr ? 'تعديل' : 'Edit'}
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={() => handleClone(role)}>
                  <Copy className="h-3 w-3" />
                  {isAr ? 'نسخ' : 'Clone'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs h-7 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setDeleteTarget(role)}
                >
                  <Trash2 className="h-3 w-3" />
                  {isAr ? 'حذف' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(o) => { setIsCreateOpen(o); if (!o) setEditTarget(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? (isAr ? 'تعديل الدور' : 'Edit Role') : (isAr ? 'إنشاء دور جديد' : 'Create New Role')}</DialogTitle>
            <DialogDescription>
              {isAr ? 'أدخل بيانات الدور والصلاحيات المطلوبة' : 'Enter role details and required permissions'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{isAr ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                <Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} placeholder="مدير النظام" />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="System Admin" dir="ltr" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'الوصف' : 'Description'}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={isAr ? 'وصف مختصر للدور...' : 'Brief role description...'}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'الصلاحيات' : 'Permissions'}</Label>
              <div className="border rounded-lg divide-y max-h-52 overflow-y-auto">
                {Object.entries(PERMISSION_GROUPS).map(([group, keys]) => {
                  const allOn = keys.every((k) => form.permissions.includes(k))
                  const someOn = keys.some((k) => form.permissions.includes(k))
                  return (
                    <div key={group}>
                      <button
                        type="button"
                        onClick={() => {
                          if (allOn) setForm({ ...form, permissions: form.permissions.filter((p) => !keys.includes(p as typeof keys[number])) })
                          else setForm({ ...form, permissions: [...new Set([...form.permissions, ...keys])] })
                        }}
                        className="flex items-center justify-between w-full px-3 py-2 hover:bg-muted/50 text-sm font-medium"
                      >
                        <span>{group}</span>
                        <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${allOn ? 'bg-teal-600 border-teal-600' : someOn ? 'bg-teal-200 border-teal-400' : 'border-input'}`}>
                          {(allOn || someOn) && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                      </button>
                      <div className="grid grid-cols-2 gap-1 px-3 pb-2">
                        {keys.map((key) => (
                          <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.permissions.includes(key)}
                              onChange={() => {
                                const p = form.permissions.includes(key)
                                  ? form.permissions.filter((x) => x !== key)
                                  : [...form.permissions, key]
                                setForm({ ...form, permissions: p })
                              }}
                              className="accent-teal-600"
                            />
                            <span className="text-muted-foreground">{PERMISSION_LABELS[key as keyof typeof PERMISSION_LABELS]}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setEditTarget(null) }}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
              {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
              {isAr ? 'حفظ' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permission Matrix Dialog */}
      <Dialog open={!!matrixRole} onOpenChange={(o) => { if (!o) setMatrixRole(null) }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-teal-600" />
              {isAr ? `مصفوفة الصلاحيات: ${matrixRole?.nameAr}` : `Permission Matrix: ${matrixRole?.name}`}
            </DialogTitle>
          </DialogHeader>
          <div className="divide-y border rounded-lg mt-2">
            {Object.entries(PERMISSION_GROUPS).map(([group, keys]) => {
              const allOn = keys.every((k) => matrixPerms.includes(k))
              const someOn = keys.some((k) => matrixPerms.includes(k))
              const isExp = expanded[group] ?? true
              return (
                <div key={group}>
                  <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 hover:bg-muted/50 cursor-pointer" onClick={() => setExpanded((p) => ({ ...p, [group]: !isExp }))}>
                    {isExp ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <span className="font-medium text-sm flex-1">{group}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleGroup(group) }}
                      className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${allOn ? 'bg-teal-600 border-teal-600' : someOn ? 'bg-teal-200 border-teal-400' : 'border-input bg-background'}`}
                    >
                      {(allOn || someOn) && <Check className={`h-3 w-3 ${allOn ? 'text-white' : 'text-teal-600'}`} />}
                    </button>
                  </div>
                  {isExp && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 px-4 py-3">
                      {keys.map((key) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer group">
                          <div
                            onClick={() => togglePerm(key)}
                            className={`h-4 w-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${matrixPerms.includes(key) ? 'bg-teal-600 border-teal-600' : 'border-input bg-background group-hover:border-teal-400'}`}
                          >
                            {matrixPerms.includes(key) && <Check className="h-2.5 w-2.5 text-white" />}
                          </div>
                          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                            {PERMISSION_LABELS[key as keyof typeof PERMISSION_LABELS]}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setMatrixRole(null)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={saveMatrix} disabled={saving} className="bg-teal-600 hover:bg-teal-700 gap-2">
              {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
              {isAr ? 'حفظ الصلاحيات' : 'Save Permissions'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? 'حذف الدور' : 'Delete Role'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? `هل أنت متأكد من حذف دور "${deleteTarget?.nameAr}"؟ هذا الإجراء لا يمكن التراجع عنه.`
                : `Are you sure you want to delete the role "${deleteTarget?.name}"? This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              {isAr ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
