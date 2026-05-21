'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  User as FirebaseUser,
} from 'firebase/auth'
import { isFirebaseConfigured, getFirebaseAuth } from '@/lib/firebase'
import {
  getUserById,
  saveUserProfile,
  getEmployeeCredentials,
  setEmployeeCredentials,
} from '@/lib/services/users.service'
import {
  upsertPendingUser,
  getPendingUserById,
} from '@/lib/services/pending-users.service'
import { getAllRoles, seedDefaultRoles, resolveUserPermissions } from '@/lib/services/roles.service'
import { logLoginAttempt } from '@/lib/services/auth.service'
import type { UserRecord } from '@/lib/repositories'
import type { RoleRecord } from '@/lib/services/roles.service'
import type { PendingUserRecord } from '@/lib/services/pending-users.service'

function safeToDate(value: any): Date {
  if (!value) return new Date()
  if (typeof value.toDate === 'function') return value.toDate()
  if (typeof value === 'string') return new Date(value)
  if (typeof value === 'number') return new Date(value)
  return new Date()
}

export type UserRole = 'admin' | 'head_nurse' | 'supervisor' | 'staff' | 'it_admin'

export interface AppUser {
  id: string
  name: string
  nameAr: string
  email: string
  role: string
  roles: string[]
  department: string
  departments: string[]
  permissions: string[]
  mustChangePassword: boolean
  employeeCode?: string
  photoURL?: string
}

interface AuthContextType {
  user: AppUser | null
  pendingEntry: PendingUserRecord | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: AppUser) => void
  loginWithGoogle: () => Promise<void>
  loginWithEmployeeCode: (
    employeeId: string,
    password: string,
  ) => Promise<{ success: boolean; mustChangePassword?: boolean; error?: string }>
  loginWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>
  signUpWithEmail: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>
  sendPasswordReset: (email: string) => Promise<void>
  changePassword: (employeeId: string, newPassword: string) => Promise<void>
  logout: () => void
  can: (permission: string) => boolean
  hasRole: (role: string) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

async function buildAppUser(record: UserRecord, allRoles: RoleRecord[]): Promise<AppUser> {
  const userRoles = allRoles.filter((r) => record.roles.includes(r.id) && r.isActive)
  const permissions = resolveUserPermissions(userRoles, record.customPermissions)
  const primaryRole = userRoles[0]
  return {
    id: record.id,
    name: record.name,
    nameAr: record.nameAr,
    email: record.email,
    role: primaryRole?.nameAr ?? record.roles[0] ?? 'staff',
    roles: record.roles,
    department: record.departments[0] ?? '',
    departments: record.departments,
    permissions,
    mustChangePassword: record.mustChangePassword,
    employeeCode: record.employeeCode,
    photoURL: record.photoURL,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]                = useState<AppUser | null>(null)
  const [pendingEntry, setPendingEntry] = useState<PendingUserRecord | null>(null)
  const [isLoading, setIsLoading]      = useState(true)
  const router = useRouter()
  const rolesCache = useRef<RoleRecord[]>([])

  const loadRoles = async () => {
    if (rolesCache.current.length === 0) {
      await seedDefaultRoles()
      rolesCache.current = await getAllRoles()
    }
    return rolesCache.current
  }

  useEffect(() => {
    if (!isFirebaseConfigured()) { setIsLoading(false); return }
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (fbUser: FirebaseUser | null) => {
      try {
        if (fbUser) {
          const record = await getUserById(fbUser.uid)
          if (record && record.status === 'active') {
            const roles = await loadRoles()
            setUser(await buildAppUser(record, roles))
            setPendingEntry(null)
            if (record.mustChangePassword) router.push('/change-password')
          } else {
            const entry = await getPendingUserById(fbUser.uid)
            if (entry?.status === 'approved') {
              const roles = await loadRoles()
              const updatedRecord = await getUserById(fbUser.uid)
              if (updatedRecord) setUser(await buildAppUser(updatedRecord, roles))
            } else if (entry?.status === 'rejected') {
              await signOut(getFirebaseAuth())
            } else if (entry) {
              setPendingEntry(entry)
            }
          }
        } else {
          setUser(null)
          setPendingEntry(null)
        }
      } finally {
        setIsLoading(false)
      }
    })
    return () => unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback((userData: AppUser) => { setUser(userData) }, [])

  const loginWithGoogle = useCallback(async () => {
    if (!isFirebaseConfigured()) throw new Error('Firebase is not configured.')
    const provider = new GoogleAuthProvider()
    const result   = await signInWithPopup(getFirebaseAuth(), provider)
    const fbUser   = result.user
    await logLoginAttempt({ userId: fbUser.uid, userEmail: fbUser.email || '', method: 'google', success: true, timestamp: new Date().toISOString() })
    const record = await getUserById(fbUser.uid)
    if (record && record.status === 'active') {
      setUser(await buildAppUser(record, await loadRoles()))
      router.push('/dashboard')
      return
    }
    const existing = await getPendingUserById(fbUser.uid)
    if (existing?.status === 'rejected') {
      await signOut(getFirebaseAuth())
      throw new Error('تم رفض طلبك من قِبَل المدير')
    }
    // ✅ FIX: new Google users always go to pending-approval
    const entry = await upsertPendingUser({
      id: fbUser.uid,
      name: fbUser.displayName || fbUser.email || 'User',
      email: fbUser.email || '',
      photoURL: fbUser.photoURL || undefined,
    })
    setPendingEntry(entry)
    router.push('/pending-approval')
  }, [router])

  const loginWithEmail = useCallback(async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isFirebaseConfigured()) return { success: false, error: 'Firebase غير مهيأ' }
    try {
      const result = await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
      const fbUser = result.user
      await logLoginAttempt({ userId: fbUser.uid, userEmail: fbUser.email || '', method: 'email', success: true, timestamp: new Date().toISOString() })
      const record = await getUserById(fbUser.uid)
      if (record && record.status === 'active') {
        setUser(await buildAppUser(record, await loadRoles()))
        router.push('/dashboard')
        return { success: true }
      }
      const entry = await getPendingUserById(fbUser.uid)
      if (entry?.status === 'rejected') {
        await signOut(getFirebaseAuth())
        return { success: false, error: 'تم رفض طلبك من قِبَل المدير' }
      }
      if (entry) { setPendingEntry(entry); router.push('/pending-approval'); return { success: true } }
      const newEntry = await upsertPendingUser({
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email || 'User',
        email: fbUser.email || email,
        photoURL: fbUser.photoURL || undefined,
      })
      setPendingEntry(newEntry)
      router.push('/pending-approval')
      return { success: true }
    } catch (err: any) {
      const code = err?.code || ''
      let msg = 'فشل تسجيل الدخول'
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') msg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      else if (code === 'auth/wrong-password') msg = 'كلمة المرور غير صحيحة'
      else if (code === 'auth/too-many-requests') msg = 'محاولات كثيرة — حاول لاحقاً'
      else if (code === 'auth/user-disabled') msg = 'تم تعطيل هذا الحساب'
      return { success: false, error: msg }
    }
  }, [router])

  const signUpWithEmail = useCallback(async (
    name: string,
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isFirebaseConfigured()) return { success: false, error: 'Firebase غير مهيأ' }
    try {
      const result = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
      const fbUser = result.user
      try { await sendEmailVerification(fbUser) } catch {}
      const entry = await upsertPendingUser({
        id: fbUser.uid,
        name: name || email,
        email: fbUser.email || email,
        photoURL: fbUser.photoURL || undefined,
      })
      setPendingEntry(entry)
      await logLoginAttempt({ userId: fbUser.uid, userEmail: fbUser.email || '', method: 'email', success: true, timestamp: new Date().toISOString() })
      router.push('/pending-approval')
      return { success: true }
    } catch (err: any) {
      const code = err?.code || ''
      let msg = 'فشل إنشاء الحساب'
      if (code === 'auth/email-already-in-use') msg = 'البريد الإلكتروني مستخدم بالفعل'
      else if (code === 'auth/invalid-email') msg = 'بريد إلكتروني غير صالح'
      else if (code === 'auth/weak-password') msg = 'كلمة المرور ضعيفة — 6 أحرف على الأقل'
      return { success: false, error: msg }
    }
  }, [router])

  const sendPasswordReset = useCallback(async (email: string): Promise<void> => {
    if (!isFirebaseConfigured()) throw new Error('Firebase غير مهيأ')
    await sendPasswordResetEmail(getFirebaseAuth(), email)
  }, [])

  const loginWithEmployeeCode = useCallback(async (
    employeeId: string,
    password: string,
  ): Promise<{ success: boolean; mustChangePassword?: boolean; error?: string }> => {
    const roles = await loadRoles()
    const dbUser = await import('@/lib/services/users.service').then((m) => m.getUserByEmployeeCode(employeeId))
    if (dbUser) {
      const creds = await getEmployeeCredentials(dbUser.id)
      let passwordValid = false
      let mustChange = creds?.mustChange ?? true
      if (creds) {
        const storedPwd = creds.password
        if (storedPwd.startsWith('$2')) {
          const { default: bcrypt } = await import("bcryptjs"); passwordValid = await bcrypt.compare(password, storedPwd)
        } else {
          passwordValid = password === storedPwd
          if (passwordValid) await setEmployeeCredentials(dbUser.id, password, mustChange)
        }
      } else {
        passwordValid = password === employeeId.toUpperCase()
      }
      if (!passwordValid) {
        await logLoginAttempt({ userId: dbUser.id, userEmail: dbUser.email, method: 'employee_code', success: false, timestamp: new Date().toISOString() })
        return { success: false, error: 'كلمة المرور غير صحيحة' }
      }
      setUser({ ...await buildAppUser(dbUser, roles), mustChangePassword: mustChange })
      await logLoginAttempt({ userId: dbUser.id, userEmail: dbUser.email, method: 'employee_code', success: true, timestamp: new Date().toISOString() })
      if (mustChange) router.push('/change-password')
      return { success: true, mustChangePassword: mustChange }
    }
    return { success: false, error: 'كود الموظف غير موجود' }
  }, [router])

  const changePassword = useCallback(async (employeeId: string, newPassword: string) => {
    await setEmployeeCredentials(employeeId, newPassword, false)
    const dbUser = await import('@/lib/services/users.service').then((m) => m.getUserById(employeeId))
    if (dbUser) await import('@/lib/services/users.service').then((m) => m.updateUserProfile(employeeId, { mustChangePassword: false }))
    setUser((prev) => prev ? { ...prev, mustChangePassword: false } : prev)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setPendingEntry(null)
    if (isFirebaseConfigured()) signOut(getFirebaseAuth()).catch(() => {})
    router.push('/login')
  }, [router])

  const can = useCallback((permission: string): boolean => user?.permissions.includes(permission) ?? false, [user])
  const hasRole = useCallback((role: string): boolean => user?.roles.includes(role) ?? false, [user])

  return (
    <AuthContext.Provider value={{
      user, pendingEntry, isAuthenticated: !!user, isLoading,
      login, loginWithGoogle, loginWithEmployeeCode, loginWithEmail,
      signUpWithEmail, sendPasswordReset, changePassword, logout,
      can, hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export function useRole(): string | null {
  const { user } = useAuth()
  return user?.role || null
}

export function RequirePermission({
  permission, children, fallback = null,
}: {
  permission: string
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { can } = useAuth()
  if (!can(permission)) return <>{fallback}</>
  return <>{children}</>
}

export const DEMO_EMPLOYEES = [
  { id: '1', nameAr: 'أحمد محمد', employeeCode: 'EMP001' },
  { id: '2', nameAr: 'سارة علي', employeeCode: 'EMP002' },
  { id: '3', nameAr: 'محمد خالد', employeeCode: 'EMP003' },
] as const
