'use client'

import * as React from 'react'
import {
  Download, Database, CheckCircle2, Loader2, AlertCircle, FileJson, Shield, Users, Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useLang } from '@/contexts/lang-context'
import { getFirestoreDb, isFirebaseConfigured } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

interface ExportItem {
  id: string
  collection: string
  collectionAr: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  descriptionAr: string
}

const EXPORT_COLLECTIONS: ExportItem[] = [
  { id: 'users', collection: 'users', collectionAr: 'المستخدمون', icon: Users, description: 'All system user profiles', descriptionAr: 'جميع ملفات تعريف مستخدمي النظام' },
  { id: 'roles', collection: 'roles', collectionAr: 'الأدوار', icon: Shield, description: 'Roles and permissions configuration', descriptionAr: 'إعداد الأدوار والصلاحيات' },
  { id: 'settings', collection: 'settings', collectionAr: 'الإعدادات', icon: Settings, description: 'System settings and configuration', descriptionAr: 'إعدادات وتهيئة النظام' },
  { id: 'departments', collection: 'departments', collectionAr: 'الأقسام', icon: Database, description: 'Hospital departments', descriptionAr: 'أقسام المستشفى' },
  { id: 'loginLogs', collection: 'loginLogs', collectionAr: 'سجل الدخول', icon: FileJson, description: 'Login audit logs', descriptionAr: 'سجلات تدقيق الدخول' },
]

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function BackupTab() {
  const { isAr } = useLang()
  const [exporting, setExporting] = React.useState<string | null>(null)
  const [exportAll, setExportAll] = React.useState(false)
  const [stats, setStats] = React.useState<Record<string, number>>({})

  const fetchCollectionCount = React.useCallback(async (col: string) => {
    if (!isFirebaseConfigured()) return 0
    try {
      const db = getFirestoreDb()
      const snap = await getDocs(collection(db, col))
      return snap.size
    } catch {
      return 0
    }
  }, [])

  React.useEffect(() => {
    if (!isFirebaseConfigured()) return
    const load = async () => {
      const results: Record<string, number> = {}
      await Promise.all(
        EXPORT_COLLECTIONS.map(async (item) => {
          results[item.id] = await fetchCollectionCount(item.collection)
        }),
      )
      setStats(results)
    }
    load()
  }, [fetchCollectionCount])

  const handleExport = async (item: ExportItem) => {
    if (!isFirebaseConfigured()) {
      toast.error(isAr ? 'Firebase غير مهيأ' : 'Firebase not configured')
      return
    }
    setExporting(item.id)
    try {
      const db = getFirestoreDb()
      const snap = await getDocs(collection(db, item.collection))
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      const timestamp = new Date().toISOString().split('T')[0]
      downloadJson({ collection: item.collection, exportedAt: new Date().toISOString(), count: data.length, data }, `${item.collection}-${timestamp}.json`)
      toast.success(isAr ? `تم تصدير ${data.length} سجل من ${item.collectionAr}` : `Exported ${data.length} records from ${item.collection}`)
    } catch (err) {
      toast.error(isAr ? 'حدث خطأ أثناء التصدير' : 'Export failed')
      console.error(err)
    } finally {
      setExporting(null)
    }
  }

  const handleExportAll = async () => {
    if (!isFirebaseConfigured()) {
      toast.error(isAr ? 'Firebase غير مهيأ' : 'Firebase not configured')
      return
    }
    setExportAll(true)
    try {
      const db = getFirestoreDb()
      const backup: Record<string, unknown[]> = {}
      await Promise.all(
        EXPORT_COLLECTIONS.map(async (item) => {
          const snap = await getDocs(collection(db, item.collection))
          backup[item.collection] = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        }),
      )
      const timestamp = new Date().toISOString().split('T')[0]
      downloadJson({ exportedAt: new Date().toISOString(), collections: backup }, `pronurse-full-backup-${timestamp}.json`)
      toast.success(isAr ? 'تم تصدير النسخة الاحتياطية الكاملة' : 'Full backup exported successfully')
    } catch (err) {
      toast.error(isAr ? 'حدث خطأ أثناء تصدير النسخة الاحتياطية' : 'Backup export failed')
      console.error(err)
    } finally {
      setExportAll(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Full backup card */}
      <Card className="border-teal-200 bg-teal-50/50 dark:bg-teal-950/20 dark:border-teal-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
            <Database className="h-5 w-5" />
            {isAr ? 'نسخة احتياطية كاملة' : 'Full System Backup'}
          </CardTitle>
          <CardDescription>{isAr ? 'تصدير جميع بيانات النظام في ملف JSON واحد' : 'Export all system data into a single JSON file'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExportAll} disabled={exportAll} className="bg-teal-600 hover:bg-teal-700 gap-2">
            {exportAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {isAr ? 'تصدير نسخة احتياطية كاملة' : 'Export Full Backup'}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          {isAr ? 'تصدير مجموعة محددة' : 'Export Individual Collections'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EXPORT_COLLECTIONS.map((item) => {
            const Icon = item.icon
            const count = stats[item.id]
            const isExporting = exporting === item.id
            return (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{isAr ? item.collectionAr : item.collection}</span>
                    {count !== undefined && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{count} {isAr ? 'سجل' : 'records'}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{isAr ? item.descriptionAr : item.description}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleExport(item)} disabled={isExporting} className="shrink-0 gap-1.5">
                  {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  {isAr ? 'تصدير' : 'Export'}
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">{isAr ? 'ملاحظة مهمة' : 'Important Note'}</p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
                {isAr
                  ? 'ملفات JSON المُصدَّرة للقراءة فقط. لاستعادة البيانات، يجب رفعها يدوياً إلى Firebase Console أو عبر Firebase Admin SDK.'
                  : 'Exported JSON files are read-only. To restore data, you must manually upload them to Firebase Console or via the Firebase Admin SDK.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
        {isAr ? 'تُنزَّل الملفات مباشرة على جهازك — لا يتم إرسال أي بيانات لخوادم خارجية.' : 'Files download directly to your device — no data is sent to external servers.'}
      </div>
    </div>
  )
}
