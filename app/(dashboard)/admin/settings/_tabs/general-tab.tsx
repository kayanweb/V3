'use client'

import * as React from 'react'
import {
  Settings, Bell, Shield, Database, Palette, Globe, Save,
  Building2, Phone, Mail, MapPin, Clock, AlertTriangle,
  CheckCircle2, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useLang } from '@/contexts/lang-context'
import { getSettings, saveSettings, type SystemSettings } from '@/lib/services/settings.service'
import {
  seedDefaultDepartments, getAllDepartments,
  createDepartment, updateDepartment, deleteDepartment,
  type DepartmentRecord,
} from '@/lib/services/departments.service'

export function GeneralTab() {
  const { isAr } = useLang()
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [settings, setSettings] = React.useState<SystemSettings | null>(null)
  const [departments, setDepartments] = React.useState<DepartmentRecord[]>([])
  const [newDeptName, setNewDeptName] = React.useState('')
  const [newDeptNameAr, setNewDeptNameAr] = React.useState('')
  const [newDeptCode, setNewDeptCode] = React.useState('')

  React.useEffect(() => {
    const load = async () => {
      const [s, deps] = await Promise.all([
        getSettings(),
        (async () => { await seedDefaultDepartments(); return getAllDepartments() })(),
      ])
      setSettings(s)
      setDepartments(deps)
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    try {
      await saveSettings(settings)
      toast.success(isAr ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully')
    } catch {
      toast.error(isAr ? 'حدث خطأ أثناء الحفظ' : 'Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  const set = (key: keyof SystemSettings, value: unknown) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const addDepartment = async () => {
    if (!newDeptNameAr || !newDeptName) {
      toast.error(isAr ? 'أدخل الاسم بالعربي والإنجليزي' : 'Enter name in Arabic and English')
      return
    }
    const dept = await createDepartment({ name: newDeptName, nameAr: newDeptNameAr, code: newDeptCode.toUpperCase(), isActive: true })
    setDepartments((prev) => [...prev, dept])
    setNewDeptName(''); setNewDeptNameAr(''); setNewDeptCode('')
    toast.success(isAr ? 'تمت إضافة القسم' : 'Department added')
  }

  const toggleDept = async (dept: DepartmentRecord) => {
    await updateDepartment(dept.id, { isActive: !dept.isActive })
    setDepartments((prev) => prev.map((d) => d.id === dept.id ? { ...d, isActive: !d.isActive } : d))
  }

  const removeDept = async (id: string) => {
    await deleteDepartment(id)
    setDepartments((prev) => prev.filter((d) => d.id !== id))
    toast.success(isAr ? 'تم حذف القسم' : 'Department removed')
  }

  if (loading) return (
    <div className="flex h-48 items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-teal-600" />
    </div>
  )
  if (!settings) return null

  return (
    <div className="space-y-4">
      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700 gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isAr ? 'حفظ الإعدادات' : 'Save Settings'}
        </Button>
      </div>

      <Tabs defaultValue="hospital">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="hospital" className="gap-1.5"><Building2 className="h-4 w-4" />{isAr ? 'المستشفى' : 'Hospital'}</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5"><Bell className="h-4 w-4" />{isAr ? 'الإشعارات' : 'Notifications'}</TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5"><Shield className="h-4 w-4" />{isAr ? 'الأمان' : 'Security'}</TabsTrigger>
          <TabsTrigger value="departments" className="gap-1.5"><Database className="h-4 w-4" />{isAr ? 'الأقسام' : 'Departments'}</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5"><Palette className="h-4 w-4" />{isAr ? 'المظهر' : 'Appearance'}</TabsTrigger>
        </TabsList>

        <TabsContent value="hospital">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-teal-600" />{isAr ? 'معلومات المستشفى' : 'Hospital Information'}</CardTitle>
              <CardDescription>{isAr ? 'البيانات الأساسية للمستشفى' : 'Basic hospital details'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{isAr ? 'اسم المستشفى (عربي)' : 'Hospital Name (Arabic)'}</Label><Input value={settings.hospitalName} onChange={(e) => set('hospitalName', e.target.value)} /></div>
                <div className="space-y-2"><Label>{isAr ? 'اسم المستشفى (إنجليزي)' : 'Hospital Name (English)'}</Label><Input value={settings.hospitalNameEn} onChange={(e) => set('hospitalNameEn', e.target.value)} dir="ltr" /></div>
                <div className="space-y-2"><Label className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{isAr ? 'البريد الإلكتروني' : 'Email'}</Label><Input type="email" value={settings.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} dir="ltr" /></div>
                <div className="space-y-2"><Label className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{isAr ? 'رقم الهاتف' : 'Phone'}</Label><Input value={settings.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} dir="ltr" /></div>
                <div className="space-y-2 sm:col-span-2"><Label className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{isAr ? 'العنوان' : 'Address'}</Label><Input value={settings.address} onChange={(e) => set('address', e.target.value)} /></div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="flex items-center gap-2"><Globe className="h-3.5 w-3.5" />{isAr ? 'اللغة الافتراضية' : 'Default Language'}</Label>
                  <Select value={settings.language} onValueChange={(v) => set('language', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ar">العربية</SelectItem><SelectItem value="en">English</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-2"><Label className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" />{isAr ? 'المنطقة الزمنية' : 'Timezone'}</Label>
                  <Select value={settings.timezone} onValueChange={(v) => set('timezone', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Asia/Riyadh">Asia/Riyadh (GMT+3)</SelectItem><SelectItem value="Asia/Dubai">Asia/Dubai (GMT+4)</SelectItem><SelectItem value="Africa/Cairo">Africa/Cairo (GMT+2)</SelectItem><SelectItem value="UTC">UTC</SelectItem></SelectContent></Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-teal-600" />{isAr ? 'إعدادات الإشعارات' : 'Notification Settings'}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {([
                { key: 'notificationsEnabled' as const, label: isAr ? 'تفعيل الإشعارات' : 'Enable Notifications', desc: isAr ? 'تفعيل نظام الإشعارات بالكامل' : 'Enable the entire notification system' },
                { key: 'emailNotifications' as const, label: isAr ? 'إشعارات البريد الإلكتروني' : 'Email Notifications', desc: isAr ? 'إرسال إشعارات عبر البريد الإلكتروني' : 'Send notifications via email' },
                { key: 'pushNotifications' as const, label: isAr ? 'الإشعارات الفورية' : 'Push Notifications', desc: isAr ? 'إشعارات الجهاز الفورية' : 'Device push notifications' },
              ] as const).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between gap-4 p-3 rounded-lg border">
                  <div><p className="font-medium text-sm">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
                  <Switch checked={settings[key] as boolean} onCheckedChange={(v) => set(key, v)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-teal-600" />{isAr ? 'إعدادات الأمان' : 'Security Settings'}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4 p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                  <div><p className="font-medium text-sm text-red-700 dark:text-red-400">{isAr ? 'وضع الصيانة' : 'Maintenance Mode'}</p><p className="text-xs text-red-600/80">{isAr ? 'يمنع جميع المستخدمين من الدخول عدا المدراء' : 'Blocks all users except admins'}</p></div>
                </div>
                <Switch checked={settings.maintenanceMode} onCheckedChange={(v) => set('maintenanceMode', v)} />
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
                <p className="text-sm font-medium">{isAr ? 'متطلبات كلمة المرور' : 'Password Requirements'}</p>
                {[isAr ? '6 أحرف على الأقل' : 'Minimum 6 characters', isAr ? 'تغيير إلزامي عند أول دخول' : 'Mandatory change on first login', isAr ? 'عدم تكرار كود الموظف ككلمة مرور' : 'Employee code cannot be used as password'].map((r) => (
                  <div key={r} className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />{r}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-teal-600" />{isAr ? 'إدارة الأقسام' : 'Department Management'}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Input value={newDeptNameAr} onChange={(e) => setNewDeptNameAr(e.target.value)} placeholder={isAr ? 'الاسم (عربي)' : 'Name (Arabic)'} />
                <Input value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} placeholder={isAr ? 'الاسم (إنجليزي)' : 'Name (English)'} dir="ltr" />
                <Input value={newDeptCode} onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())} placeholder="CODE" maxLength={6} dir="ltr" className="uppercase" />
                <Button onClick={addDepartment} className="bg-teal-600 hover:bg-teal-700">{isAr ? 'إضافة' : 'Add'}</Button>
              </div>
              <Separator />
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {departments.map((dept) => (
                  <div key={dept.id} className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{dept.nameAr}</span>
                        {dept.code && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{dept.code}</Badge>}
                        {!dept.isActive && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{isAr ? 'معطّل' : 'Inactive'}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{dept.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch checked={dept.isActive} onCheckedChange={() => toggleDept(dept)} />
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => removeDept(dept.id)}>×</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-teal-600" />{isAr ? 'إعدادات المظهر' : 'Appearance Settings'}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[{ label: isAr ? 'فاتح' : 'Light', value: 'light', bg: 'bg-white', border: 'border-slate-200' }, { label: isAr ? 'داكن' : 'Dark', value: 'dark', bg: 'bg-slate-900', border: 'border-slate-700' }, { label: isAr ? 'تلقائي' : 'System', value: 'system', bg: 'bg-gradient-to-br from-white to-slate-900', border: 'border-slate-400' }].map((theme) => (
                  <button key={theme.value} type="button" className={`p-3 rounded-lg border-2 text-center transition-all ${theme.bg} ${theme.border} hover:ring-2 hover:ring-teal-500`}>
                    <div className="h-8 w-full rounded mb-2 bg-teal-500/20" />
                    <span className={`text-sm font-medium ${theme.value === 'dark' ? 'text-white' : 'text-slate-800'}`}>{theme.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{isAr ? 'يمكن تغيير المظهر من شريط التنقل العلوي أيضاً.' : 'Theme can also be changed from the top navigation bar.'}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
