

import { useState } from 'react'
import { useLocation } from 'wouter'
import { Eye, EyeOff, Lock, IdCard, Hospital, LogIn, Mail, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useLang } from '@/contexts/lang-context'
import { toast } from 'sonner'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

type Tab = 'employee' | 'google' | 'email'

export default function LoginPage() {
  const [, navigate] = useLocation()
  const { loginWithGoogle, loginWithEmployeeCode, loginWithEmail } = useAuth()
  const { lang, toggleLang } = useLang()
  const isAr = lang === 'ar'

  const [tab, setTab] = useState<Tab>('employee')
  const [empCode, setEmpCode] = useState('')
  const [empPassword, setEmpPassword] = useState('')
  const [showEmpPassword, setShowEmpPassword] = useState(false)
  const [empLoading, setEmpLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [showEmailPassword, setShowEmailPassword] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empCode.trim() || !empPassword.trim()) {
      toast.error(isAr ? 'أدخل كود الموظف وكلمة المرور' : 'Enter employee code and password')
      return
    }
    setEmpLoading(true)
    try {
      const res = await loginWithEmployeeCode(empCode.trim(), empPassword.trim())
      if (!res.success) {
        toast.error(isAr ? 'خطأ في بيانات الدخول' : 'Login failed', { description: res.error })
      } else if (res.mustChangePassword) {
        navigate('/change-password')
      } else {
        toast.success(isAr ? 'مرحباً بك' : 'Welcome back!')
        navigate('/dashboard')
      }
    } finally {
      setEmpLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !emailPassword.trim()) {
      toast.error(isAr ? 'أدخل البريد الإلكتروني وكلمة المرور' : 'Enter email and password')
      return
    }
    setEmailLoading(true)
    try {
      const res = await loginWithEmail(email.trim(), emailPassword)
      if (!res.success) toast.error(isAr ? 'خطأ في بيانات الدخول' : 'Login failed', { description: res.error })
    } finally {
      setEmailLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      toast.error(isAr ? 'فشل تسجيل الدخول بـ Google' : 'Google sign-in failed', { description: msg })
    } finally {
      setGoogleLoading(false)
    }
  }

  const tabs: { key: Tab; ar: string; en: string; icon: React.ReactNode }[] = [
    { key: 'employee', ar: 'كود الموظف', en: 'Employee Code', icon: <IdCard className="h-4 w-4" /> },
    { key: 'google',   ar: 'Google',      en: 'Google',        icon: <GoogleIcon /> },
    { key: 'email',    ar: 'الإيميل',    en: 'Email',         icon: <Mail className="h-4 w-4" /> },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <button
        onClick={toggleLang}
        className="fixed top-4 left-4 px-3 py-1.5 rounded-full border border-teal-300 bg-white/80 text-xs font-bold text-teal-700 hover:bg-teal-50 transition-all shadow-sm z-50"
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
          <div>
            <h1 className="text-3xl font-bold text-teal-700 dark:text-teal-400">PRO Nurse</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isAr ? 'نظام إدارة التمريض المتكامل' : 'Integrated Nursing Management System'}
            </p>
          </div>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">{isAr ? 'تسجيل الدخول' : 'Sign In'}</CardTitle>
            <CardDescription>{isAr ? 'اختر طريقة تسجيل الدخول' : 'Choose your sign-in method'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-3 gap-1 bg-muted rounded-lg p-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`py-2 px-2 rounded-md text-xs font-medium transition-all ${
                    tab === t.key
                      ? 'bg-white dark:bg-slate-800 shadow text-teal-700 dark:text-teal-400'
                      : 'text-muted-foreground'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1">
                    {t.icon}
                    <span className="hidden sm:inline">{isAr ? t.ar : t.en}</span>
                  </span>
                </button>
              ))}
            </div>

            {tab === 'employee' && (
              <form onSubmit={handleEmployeeLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="empCode">{isAr ? 'كود الموظف' : 'Employee Code'}</Label>
                  <div className="relative">
                    <IdCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="empCode" type="text" placeholder={isAr ? 'مثال: EMP001' : 'e.g. EMP001'} className="pr-10 uppercase" value={empCode} onChange={(e) => setEmpCode(e.target.value.toUpperCase())} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empPassword">{isAr ? 'كلمة المرور' : 'Password'}</Label>
                  <p className="text-xs text-muted-foreground -mt-1">{isAr ? 'كلمة المرور الافتراضية هي كود الموظف' : 'Default password is your employee code'}</p>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="empPassword" type={showEmpPassword ? 'text' : 'password'} placeholder="••••••••" className="pr-10 pl-10" value={empPassword} onChange={(e) => setEmpPassword(e.target.value)} required />
                    <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowEmpPassword(!showEmpPassword)}>
                      {showEmpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={empLoading}>
                  {empLoading ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />{isAr ? 'جاري التحقق...' : 'Verifying...'}</span>
                  : <span className="flex items-center gap-2"><LogIn className="h-4 w-4" />{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>}
                </Button>
              </form>
            )}

            {tab === 'google' && (
              <div className="space-y-4 py-2">
                <p className="text-sm text-center text-muted-foreground">{isAr ? 'سجّل دخولك باستخدام حساب Google الخاص بك' : 'Sign in using your Google account'}</p>
                <Button type="button" variant="outline" className="w-full gap-3 h-11 border-2 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-950 transition-all" onClick={handleGoogle} disabled={googleLoading}>
                  {googleLoading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" /> : <GoogleIcon />}
                  <span className="font-medium">{isAr ? 'الدخول عبر Google' : 'Continue with Google'}</span>
                </Button>
                <p className="text-xs text-center text-muted-foreground px-4">{isAr ? 'المستخدمون الجدد سيُوجَّهون لصفحة انتظار الموافقة' : 'New users will be directed to the pending approval page'}</p>
              </div>
            )}

            {tab === 'email' && (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{isAr ? 'البريد الإلكتروني' : 'Email Address'}</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="example@hospital.com" className="pr-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="emailPassword">{isAr ? 'كلمة المرور' : 'Password'}</Label>
                    <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs text-teal-600 hover:underline">{isAr ? 'نسيت كلمة السر؟' : 'Forgot password?'}</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="emailPassword" type={showEmailPassword ? 'text' : 'password'} placeholder="••••••••" className="pr-10 pl-10" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} required />
                    <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowEmailPassword(!showEmailPassword)}>
                      {showEmailPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={emailLoading}>
                  {emailLoading ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />{isAr ? 'جاري التحقق...' : 'Verifying...'}</span>
                  : <span className="flex items-center gap-2"><LogIn className="h-4 w-4" />{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>}
                </Button>
                <div className="text-center text-sm">
                  <span className="text-muted-foreground">{isAr ? 'ليس لديك حساب؟ ' : "Don't have an account? "}</span>
                  <button type="button" onClick={() => navigate('/signup')} className="text-teal-600 hover:underline font-medium inline-flex items-center gap-1">
                    <UserPlus className="h-3.5 w-3.5" />{isAr ? 'إنشاء حساب جديد' : 'Create Account'}
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">{isAr ? 'نظام إدارة التمريض ©' : 'PRO Nurse ©'} {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
