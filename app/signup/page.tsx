'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Mail, User, Hospital, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useLang } from '@/contexts/lang-context'
import { toast } from 'sonner'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { ok: password.length >= 6 },
    { ok: /[A-Z]/.test(password) },
    { ok: /\d/.test(password) },
    { ok: /[!@#$%^&*]/.test(password) },
  ]
  const score = checks.filter((c) => c.ok).length
  const color = score <= 1 ? 'bg-red-500' : score <= 2 ? 'bg-amber-400' : score <= 3 ? 'bg-blue-500' : 'bg-green-500'
  return (
    <div className="flex gap-1 mt-1">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < score ? color : 'bg-muted'}`} />
      ))}
    </div>
  )
}

export default function SignUpPage() {
  const router = useRouter()
  const { signUpWithEmail } = useAuth()
  const { lang, toggleLang } = useLang()
  const isAr = lang === 'ar'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { toast.error(isAr ? 'أدخل اسمك الكامل' : 'Enter your full name'); return }
    if (password.length < 6) { toast.error(isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters'); return }
    if (password !== confirm) { toast.error(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'); return }
    setIsLoading(true)
    try {
      const res = await signUpWithEmail(name.trim(), email.trim(), password)
      if (!res.success) toast.error(isAr ? 'فشل إنشاء الحساب' : 'Sign up failed', { description: res.error })
      else toast.success(isAr ? 'تم إنشاء الحساب — في انتظار الموافقة' : 'Account created — awaiting approval')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <button onClick={toggleLang} className="fixed top-4 left-4 px-3 py-1.5 rounded-full border border-teal-300 bg-white/80 text-xs font-bold text-teal-700 hover:bg-teal-50 transition-all shadow-sm z-50">
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
            <p className="text-muted-foreground text-sm mt-1">{isAr ? 'نظام إدارة التمريض المتكامل' : 'Integrated Nursing Management System'}</p>
          </div>
        </div>
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">{isAr ? 'إنشاء حساب جديد' : 'Create New Account'}</CardTitle>
            <CardDescription>{isAr ? 'بعد التسجيل يحتاج حسابك لموافقة المدير' : 'After signing up, your account needs admin approval'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{isAr ? 'الاسم الكامل' : 'Full Name'}</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="name" type="text" placeholder={isAr ? 'أدخل اسمك الكامل' : 'Enter your full name'} className="pr-10" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{isAr ? 'البريد الإلكتروني' : 'Email Address'}</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="example@hospital.com" className="pr-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{isAr ? 'كلمة المرور' : 'Password'}</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pr-10 pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && <PasswordStrength password={password} />}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">{isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="confirm" type={showConfirm ? 'text' : 'password'} placeholder="••••••••" className={`pr-10 pl-10 ${confirm && confirm !== password ? 'border-red-400' : ''}`} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
                  <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirm && confirm !== password && <p className="text-xs text-red-500">{isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'}</p>}
              </div>
              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
                {isLoading
                  ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />{isAr ? 'جاري إنشاء الحساب...' : 'Creating account...'}</span>
                  : <span className="flex items-center gap-2"><UserPlus className="h-4 w-4" />{isAr ? 'إنشاء الحساب' : 'Create Account'}</span>}
              </Button>
            </form>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">{isAr ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}</span>
              <button type="button" onClick={() => router.push('/login')} className="text-teal-600 hover:underline font-medium">{isAr ? 'تسجيل الدخول' : 'Sign In'}</button>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">{isAr ? 'نظام إدارة التمريض ©' : 'PRO Nurse ©'} {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
