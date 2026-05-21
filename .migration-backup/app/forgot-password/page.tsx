'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Hospital, Mail, SendHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useLang } from '@/contexts/lang-context'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { sendPasswordReset } = useAuth()
  const { lang, toggleLang } = useLang()
  const isAr = lang === 'ar'

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { toast.error(isAr ? 'أدخل بريدك الإلكتروني' : 'Enter your email'); return }
    setIsLoading(true)
    try {
      await sendPasswordReset(email.trim())
      setSent(true)
      toast.success(isAr ? 'تم إرسال رابط الاستعادة' : 'Reset link sent!')
    } catch (err: any) {
      const code = err?.code || ''
      let msg = isAr ? 'فشل إرسال الرابط' : 'Failed to send reset link'
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') msg = isAr ? 'البريد الإلكتروني غير موجود' : 'Email not found'
      else if (code === 'auth/too-many-requests') msg = isAr ? 'محاولات كثيرة — حاول لاحقاً' : 'Too many requests — try later'
      toast.error(msg)
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
            <p className="text-muted-foreground text-sm mt-1">{isAr ? 'استعادة كلمة المرور' : 'Password Recovery'}</p>
          </div>
        </div>
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">{isAr ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}</CardTitle>
            <CardDescription>{isAr ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين' : "Enter your email and we'll send you a reset link"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{isAr ? 'البريد الإلكتروني' : 'Email Address'}</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="example@hospital.com" className="pr-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
                  {isLoading
                    ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />{isAr ? 'جاري الإرسال...' : 'Sending...'}</span>
                    : <span className="flex items-center gap-2"><SendHorizontal className="h-4 w-4" />{isAr ? 'إرسال رابط الاستعادة' : 'Send Reset Link'}</span>}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4 py-4">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
                    <Mail className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-green-700 dark:text-green-400">{isAr ? 'تم إرسال الرابط!' : 'Link Sent!'}</p>
                  <p className="text-sm text-muted-foreground">{isAr ? `تحقق من صندوق الوارد في ${email} واتبع التعليمات.` : `Check your inbox at ${email} and follow the instructions.`}</p>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setSent(false)}>{isAr ? 'إعادة الإرسال' : 'Resend'}</Button>
              </div>
            )}
            <div className="text-center">
              <button type="button" onClick={() => router.push('/login')} className="text-sm text-teal-600 hover:underline flex items-center justify-center gap-1">
                <ArrowRight className="h-3.5 w-3.5" />{isAr ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}
              </button>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">{isAr ? 'نظام إدارة التمريض ©' : 'PRO Nurse ©'} {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
