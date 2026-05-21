import { useState } from 'react'
import { useLocation } from 'wouter'
import { Shield, CheckCircle2, XCircle, Loader2, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLang } from '@/contexts/lang-context'
import { initializeApp, getApps, deleteApp, FirebaseApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  getFirestore,
  doc, setDoc, collection, addDoc, getDocs, query, where,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        import.meta.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const DEFAULT_ROLES = [
  {
    key: 'admin', name: 'System Admin', nameAr: 'مدير النظام',
    description: 'صلاحية كاملة على جميع أقسام النظام',
    permissions: [
      'dashboard.view','reports.view','reports.create','reports.approve','reports.export',
      'staff.view','staff.create','staff.edit','staff.delete',
      'departments.view','departments.manage',
      'patients.view','patients.create','patients.edit',
      'inventory.view','inventory.manage','equipment.view','equipment.manage',
      'emergency.view','emergency.activate',
      'users.view','users.create','users.edit','users.delete','users.approve',
      'roles.view','roles.manage','settings.view','settings.manage',
      'analytics.view','logs.view','notifications.send',
    ],
    isActive: true, isDefault: false, order: 1,
  },
  {
    key: 'it_admin', name: 'IT Admin', nameAr: 'مسؤول تقنية المعلومات',
    description: 'إدارة النظام والمستخدمين والإعدادات التقنية',
    permissions: [
      'dashboard.view','users.view','users.create','users.edit','users.delete','users.approve',
      'roles.view','roles.manage','settings.view','settings.manage',
      'logs.view','analytics.view','departments.view','departments.manage',
    ],
    isActive: true, isDefault: false, order: 2,
  },
  {
    key: 'head_nurse', name: 'Head Nurse', nameAr: 'رئيس التمريض',
    description: 'إدارة الكادر والأقسام وإنشاء التقارير',
    permissions: [
      'dashboard.view','reports.view','reports.create','reports.approve','reports.export',
      'staff.view','staff.create','staff.edit','departments.view','departments.manage',
      'patients.view','patients.create','patients.edit',
      'inventory.view','equipment.view','emergency.view','users.view','users.approve',
      'analytics.view','logs.view',
    ],
    isActive: true, isDefault: false, order: 3,
  },
  {
    key: 'supervisor', name: 'Supervisor', nameAr: 'مشرف',
    description: 'إشراف على الكادر والأقسام',
    permissions: [
      'dashboard.view','reports.view','reports.create','staff.view','staff.edit',
      'departments.view','patients.view','patients.create','patients.edit',
      'inventory.view','equipment.view','emergency.view',
    ],
    isActive: true, isDefault: false, order: 4,
  },
  {
    key: 'nurse', name: 'Nurse', nameAr: 'ممرضة',
    description: 'وصول للوحة التحكم ومهام التمريض',
    permissions: ['dashboard.view','patients.view','patients.create','patients.edit','inventory.view','equipment.view','emergency.view'],
    isActive: true, isDefault: true, order: 5,
  },
]

type SetupResult = Record<string, string>

/** Create a user in a temporary secondary Firebase app (no effect on main Auth session) */
async function createOrSignInTemp(email: string, password: string): Promise<{ uid: string; app: FirebaseApp }> {
  const appName = `setup-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const secondaryApp = initializeApp(firebaseConfig, appName)
  const secondaryAuth = getAuth(secondaryApp)
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password)
    await signOut(secondaryAuth)
    return { uid: cred.user.uid, app: secondaryApp }
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') {
      const cred2 = await signInWithEmailAndPassword(secondaryAuth, email, password)
      const uid = cred2.user.uid
      await signOut(secondaryAuth)
      return { uid, app: secondaryApp }
    }
    await deleteApp(secondaryApp).catch(() => {})
    throw err
  }
}

export default function SetupPage() {
  const [, navigate] = useLocation()
  const { lang } = useLang()
  const isAr = lang === 'ar'

  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<SetupResult | null>(null)
  const [log, setLog] = useState<string[]>([])

  const addLog = (msg: string) => setLog(prev => [...prev, msg])

  const runSetup = async () => {
    setLoading(true)
    setError('')
    setResults(null)
    setLog([])
    const tempApps: FirebaseApp[] = []

    try {
      if (!firebaseConfig.apiKey) {
        throw new Error('بيانات Firebase غير موجودة — تأكد من إضافة NEXT_PUBLIC_FIREBASE_* في الإعدادات')
      }

      const now = new Date().toISOString()
      const res: SetupResult = {}

      // ── Use main Firebase app ─────────────────────────────────
      const mainApp = getApps().find(a => a.name === '[DEFAULT]')
      if (!mainApp) throw new Error('Firebase app غير مهيأ')

      // ── 1. Create Admin in secondary app to get UID ────────────
      addLog('🔄 إنشاء حساب Admin في Firebase Auth...')
      const adminEmail = 'admin@pronurse.local'
      const adminPass  = 'ADMIN001'
      const adminEmpCode = 'ADMIN001'
      const { uid: adminUid, app: adminTempApp } = await createOrSignInTemp(adminEmail, adminPass)
      tempApps.push(adminTempApp)
      res['admin.auth'] = `✅ Firebase Auth (${adminUid})`
      addLog(`✅ Admin UID: ${adminUid}`)

      // ── 2. Sign in to MAIN auth as admin (so Firestore rules allow writes) ──
      addLog('🔄 تسجيل الدخول في Firestore...')
      const mainAuth = getAuth(mainApp)
      try {
        await signInWithEmailAndPassword(mainAuth, adminEmail, adminPass)
      } catch {
        // Already signed in or rules are open — continue
      }
      const db = getFirestore(mainApp)

      // ── 3. Seed roles ─────────────────────────────────────────
      addLog('🔄 إنشاء الأدوار...')
      const roleIdMap: Record<string, string> = {}
      for (const role of DEFAULT_ROLES) {
        const q = query(collection(db, 'roles'), where('key', '==', role.key))
        const snap = await getDocs(q)
        if (snap.empty) {
          const ref = await addDoc(collection(db, 'roles'), { ...role, createdAt: now, updatedAt: now })
          roleIdMap[role.key] = ref.id
          res[`role.${role.key}`] = `✅ تم إنشاؤه`
        } else {
          roleIdMap[role.key] = snap.docs[0].id
          res[`role.${role.key}`] = `⏭ موجود مسبقاً`
        }
      }
      addLog(`✅ الأدوار: ${Object.keys(roleIdMap).join(', ')}`)

      // ── 4. Write Admin Firestore doc ──────────────────────────
      addLog('🔄 حفظ بيانات Admin في Firestore...')
      await setDoc(doc(db, 'users', adminUid), {
        id: adminUid, name: 'System Admin', nameAr: 'مدير النظام',
        email: adminEmail, employeeCode: adminEmpCode,
        roles: [roleIdMap['admin']], roleKeys: ['admin'],
        departments: ['الإدارة'], status: 'active',
        mustChangePassword: true, createdAt: now, updatedAt: now,
      }, { merge: true })
      await setDoc(doc(db, 'employeeCredentials', adminUid), {
        userId: adminUid, password: adminEmpCode, mustChange: true, updatedAt: now,
      }, { merge: true })
      res['admin.firestore'] = '✅ تم الحفظ'
      res['admin.credentials'] = `✅ كلمة المرور الافتراضية: ${adminEmpCode}`
      addLog('✅ Admin جاهز')

      // ── 5. Create IT Admin ────────────────────────────────────
      addLog('🔄 إنشاء حساب IT Admin...')
      const itEmail = 'itadmin@pronurse.local'
      const itPass  = 'ITADM001'
      const itEmpCode = 'ITADM001'
      const { uid: itUid, app: itTempApp } = await createOrSignInTemp(itEmail, itPass)
      tempApps.push(itTempApp)
      res['it_admin.auth'] = `✅ Firebase Auth (${itUid})`

      await setDoc(doc(db, 'users', itUid), {
        id: itUid, name: 'IT Admin', nameAr: 'مسؤول تقنية المعلومات',
        email: itEmail, employeeCode: itEmpCode,
        roles: [roleIdMap['it_admin']], roleKeys: ['it_admin'],
        departments: ['تقنية المعلومات'], status: 'active',
        mustChangePassword: true, createdAt: now, updatedAt: now,
      }, { merge: true })
      await setDoc(doc(db, 'employeeCredentials', itUid), {
        userId: itUid, password: itEmpCode, mustChange: true, updatedAt: now,
      }, { merge: true })
      res['it_admin.firestore'] = '✅ تم الحفظ'
      res['it_admin.credentials'] = `✅ كلمة المرور الافتراضية: ${itEmpCode}`
      addLog('✅ IT Admin جاهز')

      // ── 6. Sign out from main auth (setup done) ───────────────
      await signOut(mainAuth).catch(() => {})

      setResults(res)
      setDone(true)
      addLog('🎉 اكتمل الإعداد! يمكنك الآن تسجيل الدخول.')
    } catch (e: any) {
      const msg = e?.message || 'حدث خطأ غير متوقع'
      setError(msg)
      addLog(`❌ ${msg}`)
    } finally {
      // Clean up temp apps
      for (const app of tempApps) {
        await deleteApp(app).catch(() => {})
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 shadow-lg">
              <Shield className="h-9 w-9 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-teal-700 dark:text-teal-400">
            {isAr ? 'إعداد أول تشغيل' : 'First-Run Setup'}
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {isAr
              ? 'ينشئ الأدوار الافتراضية + حسابي Admin و IT Admin مباشرةً من المتصفح.'
              : 'Creates default roles + Admin & IT Admin accounts directly in your browser.'}
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Terminal className="h-4 w-4 text-teal-600" />
              {isAr ? 'تشغيل الإعداد' : 'Run Setup'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isAr
                ? 'لا يحتاج أي إعداد إضافي — فقط اضغط الزر.'
                : 'No extra configuration needed — just click the button.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400">
                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="font-mono text-xs break-all">{error}</span>
              </div>
            )}

            {/* Live log */}
            {log.length > 0 && (
              <div className="rounded-lg bg-slate-950 p-3 space-y-1 max-h-40 overflow-y-auto">
                {log.map((l, i) => (
                  <p key={i} className="text-xs font-mono text-green-400">{l}</p>
                ))}
              </div>
            )}

            {!done ? (
              <Button
                className="w-full bg-teal-600 hover:bg-teal-700 gap-2 h-11 text-base"
                onClick={runSetup}
                disabled={loading}
              >
                {loading
                  ? <><Loader2 className="h-5 w-5 animate-spin" /> {isAr ? 'جاري الإعداد...' : 'Running setup...'}</>
                  : <><Terminal className="h-5 w-5" /> {isAr ? 'تشغيل الإعداد الآن' : 'Run Setup Now'}</>
                }
              </Button>
            ) : (
              <Button className="w-full gap-2 h-11" variant="outline" onClick={() => navigate('/login')}>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                {isAr ? 'الذهاب لتسجيل الدخول' : 'Go to Login'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <Card className="shadow border-0 bg-white/80 dark:bg-slate-900/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                {isAr ? 'تم الإعداد بنجاح ✅' : 'Setup completed ✅'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(results).map(([key, value]) => (
                <div key={key} className="flex items-start gap-2 text-xs font-mono">
                  <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">{key}</Badge>
                  <span className="text-muted-foreground">{value}</span>
                </div>
              ))}

              <div className="mt-4 p-3 rounded-lg bg-teal-50 dark:bg-teal-950 space-y-2 text-xs text-teal-800 dark:text-teal-300">
                <p className="font-bold text-sm">🔑 {isAr ? 'بيانات الدخول:' : 'Login credentials:'}</p>
                <div className="bg-white/70 dark:bg-black/30 rounded p-2 font-mono space-y-1">
                  <p>👤 Admin &nbsp;&nbsp;— كود: <strong>ADMIN001</strong> &nbsp;· كلمة مرور: <strong>ADMIN001</strong></p>
                  <p>👤 IT Admin — كود: <strong>ITADM001</strong> · كلمة مرور: <strong>ITADM001</strong></p>
                </div>
                <p className="text-[11px] opacity-75">
                  {isAr
                    ? '* ستُطلب تغيير كلمة المرور عند أول دخول.'
                    : '* You will be prompted to change your password on first login.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
