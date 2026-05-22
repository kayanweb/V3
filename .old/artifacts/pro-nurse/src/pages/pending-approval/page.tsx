

import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'wouter'
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
  const [, navigate] = useLocation()
  const { user, pendingEntry, logout, login, isAuthenticated, isLoading } = useAuth()
  const { lang, toggleLang } = useLang()
  const isAr = lang === 'ar'

  const [status, setStatus]                     = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [rejectionReason, setRejectionReason]   = useState('')
  const pendingUnsubRef = useRef<(() => void) | null>(null)
  const usersUnsubRef   = useRef<(() => void) | null>(null)
  const handledRef      = useRef(false) // prevent double-handling

  // ── Guard: active user → dashboard ───────────────────────────
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) navigate('/dashboard')
  }, [isAuthenticated, user, isLoading, navigate])

  // ── Dual real-time listeners ──────────────────────────────────
  useEffect(() => {
    if (!isFirebaseConfigured()) { navigate('/login'); return }

    function attachListeners(uid: string) {
      // Clean up any previous listeners
      pendingUnsubRef.current?.()
      usersUnsubRef.current?.()
      handledRef.current = false

      const db = getFirestoreDb()

      // ── Listener 1: pendingUsers/{uid} ───────────────────────
      // Fires when admin updates status to 'approved' or 'rejected'
      pendingUnsubRef.current = onSnapshot(doc(db, 'pendingUsers', uid), async (snap) => {
        if (handledRef.current) return

        if (!snap.exists()) {
          // Doc deleted (manual Firebase Console move) — check users collection
          const userRecord = await getUserById(uid)
          if (userRecord?.status === 'active') {
            handledRef.current = true
            await handleApproved(uid)
          }
          // If no users record either, just wait (users listener will catch it)
          return
        }

        const data = snap.data() as {
          status: 'pending' | 'approved' | 'rejected'
          rejectionReason?: string
        }

        if (data.status === 'approved') {
          handledRef.current = true
          await handleApproved(uid)
        } else if (data.status === 'rejected') {
          setRejectionReason(data.rejectionReason || '')
          setStatus('rejected')
          setTimeout(() => logout(), 4000)
        } else {
          setStatus('pending')
        }
      })

      // ── Listener 2: users/{uid} ──────────────────────────────
      // Fires when admin creates/activates the user directly in users collection
      usersUnsubRef.current = onSnapshot(doc(db, 'users', uid), async (snap) => {
        if (handledRef.current) return
        if (!snap.exists()) return // User record not created yet — keep waiting

        const data = snap.data() as { status?: string }
        if (data.status === 'active') {
          handledRef.current = true
          await handleApproved(uid)
        }
      })
    }

    // 1. Synchronous Firebase Auth (immediate — available right after signup)
    const currentUser = getFirebaseAuth().currentUser
    if (currentUser) {
      attachListeners(currentUser.uid)
      return () => { pendingUnsubRef.current?.(); usersUnsubRef.current?.() }
    }

    // 2. Context values (set by auth-context onAuthStateChanged)
    const ctxUid = user?.id ?? pendingEntry?.id
    if (ctxUid) {
      attachListeners(ctxUid)
      return () => { pendingUnsubRef.current?.(); usersUnsubRef.current?.() }
    }

    // 3. Wait for Firebase Auth (cold page load / hard refresh)
    let started = false
    const authUnsub = onAuthStateChanged(getFirebaseAuth(), (fbUser) => {
      if (fbUser && !started) {
        started = true
        authUnsub()
        attachListeners(fbUser.uid)
      } else if (!fbUser && !isLoading) {
        navigate('/login')
      }
    })

    return () => {
      authUnsub()
      pendingUnsubRef.current?.()
      usersUnsubRef.current?.()
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
    setTimeout(() => navigate('/dashboard'), 1200)
  }

  if (!isLoading && isAuthenticated && user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <button onClick={toggleLang} className="fixed top-4 left-4 px-3 py-1.5 rounded-full border border-teal-300 bg-white/80 text-xs font-bold text-teal-700 hover:bg-teal-50 z-50 shadow-sm">
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
            {status === 'pending'  && <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50  dark:bg-amber-950  animate-pulse"><Clock        className="h-10 w-10 text-amber-500"  /></div>}
            {status === 'approved' && <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50  dark:bg-green-950" ><CheckCircle2 className="h-10 w-10 text-green-500"  /></div>}
            {status === 'rejected' && <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50    dark:bg-red-950"  ><XCircle      className="h-10 w-10 text-red-500"    /></div>}

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
                  {isAr ? '🔴 هذه الصفحة تتحدث لحظياً — لا حاجة لتحديث يدوي' : '🔴 This page updates in real-time — no manual refresh needed'}
                </p>
              </>
            )}

            {status === 'approved' && (
              <>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-green-700 dark:text-green-400">{isAr ? 'تمت الموافقة! 🎉' : 'Approved! 🎉'}</h2>
                  <p className="text-muted-foreground text-sm">{isAr ? 'تمت الموافقة على حسابك. جاري توجيهك للوحة التحكم...' : 'Your account has been approved. Redirecting to dashboard...'}</p>
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
