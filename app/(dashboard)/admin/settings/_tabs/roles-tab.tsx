'use client'

import * as React from 'react'
import {
  Shield, Plus, Edit, Trash2, Copy, ChevronDown, ChevronRight,
  Save, Loader2, Check, X, RefreshCw,
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
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useLang } from '@/contexts/lang-context'
import { useRealtimeOrderedCollection } from '@/lib/hooks/useRealtimeCollection'
import {
  createRole, updateRole, deleteRole, cloneRole, seedDefaultRoles,
  PERMISSION_GROUPS, PERMISSION_LABELS,
  type RoleRecord,
} from '@/lib/services/roles.service'

type RoleRow = RoleRecord & Record<string, unknown>

export function RolesTab() {
  const { isAr } = useLang()
  const { data: roles, loading, refresh } = useRealtimeOrderedCollection<RoleRow>('roles', 'order', 'asc')

  const [saving, setSaving] = React.useState(false)
  const [editTarget, setEditTarget] = React.useState<RoleRow | null>(null)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<RoleRow | null>(null)
  const [matrixRole, setMatrixRole] = React.useState<RoleRow | null>(null)
  const [matrixPerms, setMatrixPerms] = React.useState<string[]>([])
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({})
  const [form, setForm] = React.useState({ name: '', nameAr: '', description: '', permissions: [] as string[] })

  // Ensure default roles on first load
  React.useEffect(() => { seedDefaultRoles() }, [])

  const openCreate = () => {
    setEditTarget(null)
    setForm({ name: '', nameAr: '', description: '', permissions: [] })
    setIsDialogOpen(true)
  }

  const openEdit = (role: RoleRow) => {
    setEditTarget(role)
    setForm({ name: role.name, nameAr: role.nameAr, description: role.description ?? '', permissions: [...role.permissions] })
    setIsDialogOpen(true)
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
        await createRole({ key: form.name.toLowerCase().replace(/\s+/g, '_'), name: form.name, nameAr: form.nameAr, description: form.description, permissions: form.permissions, isActive: true, isDefault: false, order: roles.length + 1 })
        toast.success(isAr ? 'تم إنشاء الدور' : 'Role created')
      }
      setIsDialogOpen(false)
      refresh()
    } catch {
      toast.error(isAr ? 'حدث خطأ' : 'Error saving role')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (role: RoleRow) => {
    if (role.isDefault) {
      toast.error(isAr ? 'لا يمكن حذف الدور الافتراضي' : 'Cannot delete the default role')
      setDeleteTarget(null)
      return
    }
    await deleteRole(role.id)
    toast.success(isAr ? 'تم حذف الدور' : 'Role deleted')
    setDeleteTarget(null)
    refresh()
  }

  const handleClone = async (role: RoleRow) => {
    await cloneRole(role.id)
    toast.success(isAr ? 'تم نسخ الدور' : 'Role cloned')
    refresh()
  }

  const openMatrix = (role: RoleRow) => {
    setMatrixRole(role)
    setMatrixPerms([...role.permissions])
  }

  const togglePerm = (perm: string) => {
    setMatrixPerms((prev) => prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm])
  }

  const saveMatrix = async () => {
    if (!matrixRole) return
    setSaving(true)
    try {
      await updateRole(matrixRole.id, { permissions: matrixPerms })
      toast.success(isAr ? 'تم حفظ الصلاحيات' : 'Permissions saved')
      setMatrixRole(null)
      refresh()
    } catch {
      toast.error(isAr ? 'حدث خطأ' : 'Error saving permissions')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{isAr ? `${roles.length} أدوار مُعرَّفة` : `${roles.length} roles defined`}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh} className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" />{isAr ? 'تحديث' : 'Refresh'}</Button>
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700 gap-1.5" onClick={openCreate}><Plus className="h-3.5 w-3.5" />{isAr ? 'دور جديد' : 'New Role'}</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
      ) : (
        <div className="space-y-2">
          {roles.map((role) => (
            <Card key={role.id} className={!role.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{isAr ? role.nameAr : role.name}</span>
                        {role.isDefault && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{isAr ? 'افتراضي' : 'Default'}</Badge>}
                        {!role.isActive && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-red-600 border-red-300">{isAr ? 'معطّل' : 'Inactive'}</Badge>}
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{role.permissions.length} {isAr ? 'صلاحية' : 'permissions'}</Badge>
                      </div>
                      {role.description && <p className="text-xs text-muted-foreground truncate">{role.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-xs" onClick={() => openMatrix(role)}>
                      <Shield className="h-3 w-3" />{isAr ? 'الصلاحيات' : 'Permissions'}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEdit(role)}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleClone(role)}><Copy className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(role)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? (isAr ? 'تعديل الدور' : 'Edit Role') : (isAr ? 'دور جديد' : 'New Role')}</DialogTitle>
            <DialogDescription>{isAr ? 'أدخل بيانات الدور' : 'Enter role details'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{isAr ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label><Input value={form.nameAr} onChange={(e) => setForm((p) => ({ ...p, nameAr: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>{isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} dir="ltr" /></div>
            </div>
            <div className="space-y-1.5"><Label>{isAr ? 'الوصف' : 'Description'}</Label><Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isAr ? 'حفظ' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permission matrix dialog */}
      {matrixRole && (
        <Dialog open={!!matrixRole} onOpenChange={() => setMatrixRole(null)}>
          <DialogContent className="sm:max-w-lg max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-teal-600" />
                {isAr ? `صلاحيات: ${matrixRole.nameAr}` : `Permissions: ${matrixRole.name}`}
              </DialogTitle>
              <DialogDescription>
                {isAr ? `${matrixPerms.length} صلاحية مُفعَّلة` : `${matrixPerms.length} permissions enabled`}
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto max-h-96 space-y-2 py-2">
              {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => {
                const isExpanded = expanded[group] ?? true
                const groupChecked = perms.every((p) => matrixPerms.includes(p))
                return (
                  <div key={group} className="rounded-lg border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpanded((prev) => ({ ...prev, [group]: !(prev[group] ?? true) }))}
                      className="w-full flex items-center gap-2 p-2.5 bg-muted/40 hover:bg-muted/60 text-sm font-medium transition-colors"
                    >
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      <span className="flex-1 text-right">{group}</span>
                      <Switch
                        checked={groupChecked}
                        onCheckedChange={(v) => setMatrixPerms((prev) => {
                          const others = prev.filter((p) => !perms.includes(p as never))
                          return v ? [...others, ...perms] : others
                        })}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </button>
                    {isExpanded && (
                      <div className="p-2 space-y-1">
                        {perms.map((perm) => (
                          <label key={perm} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/40 cursor-pointer text-sm">
                            <input
                              type="checkbox"
                              checked={matrixPerms.includes(perm)}
                              onChange={() => togglePerm(perm)}
                              className="rounded"
                            />
                            <span className="flex-1">{PERMISSION_LABELS[perm as keyof typeof PERMISSION_LABELS] ?? perm}</span>
                            <code className="text-[10px] text-muted-foreground">{perm}</code>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMatrixRole(null)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
              <Button onClick={saveMatrix} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isAr ? 'حفظ الصلاحيات' : 'Save Permissions'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? 'تأكيد الحذف' : 'Confirm Delete'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr ? `هل تريد حذف "${deleteTarget?.nameAr}"؟ لا يمكن التراجع.` : `Delete "${deleteTarget?.name}"? This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && handleDelete(deleteTarget)} className="bg-destructive hover:bg-destructive/90">
              {isAr ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
