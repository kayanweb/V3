'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Hospital, Clock, CheckCircle2, XCircle, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useLang } from '@/contexts/lang-context'
import { isFirebaseConfigured, getFirestoreDb, getFirebaseAuth } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { getUserById } from '@/lib/services/users.service'
import { getAllRoles, resolveUserPermissions } from '@/lib/services/roles.service'

export default function PendingApprovalPage() {
  const router = useRouter()
  const { user, pendingEntry, logout, login, isAuthenticated, isLoading } = useAuth()
  const { lang, toggleLang } = useLang()
  const isAr = lang === 'ar'

  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [rejectionReason, setRejectionReason] = useState('')

  // ── Guard: already authenticated active user → skip this page ────────────
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, user, isLoading, router])

  // ── Real-time listener ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isFirebaseConfigured()) { router.push('/login'); return }

    // Resolve uid: prefer active user, fall back to pendingEntry, fall back to Firebase Auth
    const uid = user?.id ?? pendingEntry?.id

    if (uid) {
      return attachSnapshot(uid)
    }

    // uid not yet in context (session still loading) — wait for Firebase Auth
    const unsub = onAuthStateChanged(getFirebaseAuth(), (fbUser) => {
      if (fbUser) {
        attachSnapshot(fbUser.uid)
      } else {
        router.replace('/login')
      }
    })
    return unsub

    function attachSnapshot(targetUid: string) {
      const ref = doc(getFirestoreDb(), 'pendingUsers', targetUid)
      const unsubscribe = onSnapshot(ref, async (snap) => {
        if (!snap.exists()) {
          const userRecord = await getUserById(targetUid)
          if (userRecord && userRecord.status === 'active') {
            await handleApproved(targetUid)
          } else {
            router.replace('/login')
          }
          return
        }
        const entry = snap.data() as { status: 'pending' | 'approved' | 'rejected'; rejectionReason?: string }
        if (entry.status === 'approved') {
          await handleApproved(targetUid)
        } else if (entry.status === 'rejected') {
          setRejectionReason(entry.rejectionReason || '')
          setStatus('rejected')
          setTimeout(() => logout(), 4000)
        } else {
          setStatus('pending')
        }
      })
      return unsubscribe
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, pendingEntry?.id])

  async function handleApproved(uid: string) {
    const userRecord = await getUserById(uid)
    if (!userRecord || userRecord.status !== 'active') return
    const roles = await getAllRoles()
    const permissions = resolveUserPermissions(
      roles.filter((r) => userRecord.roles.includes(r.id) && r.isActive),
      userRecord.customPermissions,
    )
    const primaryRole = roles.find((r) => userRecord.roles.includes(r.id))
    login({
      id: userRecord.id,
      name: userRecord.name,
      nameAr: userRecord.nameAr,
      email: userRecord.email,
      role: primaryRole?.nameAr ?? userRecord.roles[0] ?? 'staff',
      roles: userRecord.roles,
      department: userRecord.departments[0] ?? '',
      departments: userRecord.departments,
      permissions,
      mustChangePassword: userRecord.mustChangePassword,
      employeeCode: userRecord.employeeCode,
      photoURL: userRecord.photoURL,
    })
    setStatus('approved')
    setTimeout(() => router.replace('/dashboard'), 1200)
  }

  // Don't render if user is active (prevents flash)
  if (!isLoading && isAuthenticated && user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <button
        onClick={toggleLang}
        className="fixed top-4 left-4 px-3 py-1.5 rounded-full border border-teal-300 bg-white/80 text-xs font-bold text-teal-700 hover:bg-teal-50 z-50 shadow-sm"
      >
        {isAr ? 'EN' : 'ع'}
      </button>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 shadow-lg">
              <Hospital className="h-9 w-9 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-teal-700 dark:text-teal-400">PRO Nurse</h1>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
          <div className={`h-1.5 w-full ${status === 'approved' ? 'bg-green-500' : status === 'rejected' ? 'bg-red-500' : 'bg-amber-400'}`} />
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-5">
            {status === 'pending' && <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950 animate-pulse"><Clock className="h-10 w-10 text-amber-500" /></div>}
            {status === 'approved' && <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50 dark:bg-green-950"><CheckCircle2 className="h-10 w-10 text-green-500" /></div>}
            {status === 'rejected' && <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 dark:bg-red-950"><XCircle className="h-10 w-10 text-red-500" /></div>}

            {status === 'pending' && (
              <>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">{isAr ? 'في انتظار الموافقة' : 'Awaiting Approval'}</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                    {isAr ? 'تم تسجيل طلبك بنجاح. سيتم إعلامك فور مراجعة المدير لطلبك.' : "Your request has been submitted. You'll be notified once an admin reviews it."}
                  </p>
                </div>
                <div className="w-full space-y-2 text-sm">
                  {[
                    { done: true,  ar: 'إنشاء الحساب / تسجيل الدخول', en: 'Account created / signed in' },
                    { done: true,  ar: 'إرسال طلب الوصول',             en: 'Access request submitted' },
                    { done: false, ar: 'مراجعة الطلب من المدير',        en: 'Admin review in progress' },
                    { done: false, ar: 'تفعيل الحساب ومنح الصلاحية',  en: 'Account activation' },
                  ].map((step, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${step.done ? 'bg-green-50 dark:bg-green-950/40' : 'bg-muted/50'}`}>
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${step.done ? 'bg-green-500 text-white' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                        {step.done ? '✓' : i + 1}
                      </div>
                      <span className={step.done ? 'text-green-700 dark:text-green-400 font-medium' : 'text-muted-foreground'}>{isAr ? step.ar : step.en}</span>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="gap-2 text-muted-foreground" onClick={logout}>
                  <LogOut className="h-4 w-4" />{isAr ? 'خروج' : 'Logout'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {isAr ? '🔴 هذه الصفحة تتحدث لحظياً' : '🔴 This page updates in real-time'}
                </p>
              </>
            )}

            {status === 'approved' && (
              <>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-green-700 dark:text-green-400">{isAr ? 'تمت الموافقة! 🎉' : 'Approved! 🎉'}</h2>
                  <p className="text-muted-foreground text-sm">{isAr ? 'تمت الموافقة على حسابك. جاري توجيهك...' : 'Your account has been approved. Redirecting...'}</p>
                </div>
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
              </>
            )}

            {status === 'rejected' && (
              <>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-red-600 dark:text-red-400">{isAr ? 'تم رفض الطلب' : 'Request Rejected'}</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                    {rejectionReason || (isAr ? 'تم رفض طلب وصولك. يرجى التواصل مع مدير النظام.' : 'Your access request was rejected. Please contact the system administrator.')}
                  </p>
                  <p className="text-xs text-muted-foreground">{isAr ? 'سيتم تسجيل خروجك تلقائياً...' : 'You will be signed out automatically...'}</p>
                </div>
                <Button onClick={logout} variant="destructive" className="gap-2">
                  <LogOut className="h-4 w-4" />{isAr ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
