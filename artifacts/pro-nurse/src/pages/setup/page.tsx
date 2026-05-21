import { useState } from 'react'
import { useLocation } from 'wouter'
import { Shield, CheckCircle2, XCircle, Loader2, Terminal, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useLang } from '@/contexts/lang-context'

const API_BASE = import.meta.env.NEXT_PUBLIC_API_URL || ''

type SetupResult = Record<string, string>

export default function SetupPage() {
  const [, navigate] = useLocation()
  const { lang } = useLang()
  const isAr = lang === 'ar'

  const [secret, setSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<SetupResult | null>(null)

  const runSetup = async () => {
    setLoading(true)
    setError('')
    setResults(null)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (secret.trim()) headers['Authorization'] = `Bearer ${secret.trim()}`

      const res = await fetch(`${API_BASE}/api/setup`, { method: 'POST', headers })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`)
      } else {
        setResults(data.results)
        setDone(true)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
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
              ? 'هذه الصفحة تُنشئ الأدوار الافتراضية وحسابات Admin و IT Admin في Firebase تلقائياً.'
              : 'This page creates default roles and Admin / IT Admin accounts in Firebase automatically.'}
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-teal-600" />
              {isAr ? 'تشغيل الإعداد' : 'Run Setup'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isAr
                ? 'إذا كان متغير SETUP_SECRET مضبوطاً، أدخله هنا. وإلا اتركه فارغاً.'
                : 'If SETUP_SECRET env var is set, enter it here. Otherwise leave blank.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? 'Setup Secret (اختياري)' : 'Setup Secret (optional)'}</Label>
              <Input
                type="password"
                placeholder={isAr ? 'اتركه فارغاً إن لم يكن مضبوطاً' : 'Leave blank if not set'}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                disabled={loading || done}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 text-sm">
                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="font-mono text-xs">{error}</span>
              </div>
            )}

            {!done ? (
              <Button
                className="w-full bg-teal-600 hover:bg-teal-700 gap-2"
                onClick={runSetup}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Terminal className="h-4 w-4" />}
                {loading
                  ? (isAr ? 'جاري الإعداد...' : 'Running setup...')
                  : (isAr ? 'تشغيل الإعداد الآن' : 'Run Setup Now')}
              </Button>
            ) : (
              <Button
                className="w-full gap-2"
                variant="outline"
                onClick={() => navigate('/login')}
              >
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {isAr ? 'الذهاب لتسجيل الدخول' : 'Go to Login'}
              </Button>
            )}
          </CardContent>
        </Card>

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

              <div className="mt-4 p-3 rounded-lg bg-teal-50 dark:bg-teal-950 space-y-1.5 text-xs text-teal-800 dark:text-teal-300">
                <p className="font-semibold">{isAr ? 'بيانات تسجيل الدخول:' : 'Login credentials:'}</p>
                <p>📧 admin@pronurse.local &nbsp;·&nbsp; 🔑 Admin@12345</p>
                <p>📧 itadmin@pronurse.local &nbsp;·&nbsp; 🔑 ITAdmin@12345</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {isAr
                    ? '* أو استخدم كود الموظف ADMIN001 / ITADM001 مع كلمة المرور الافتراضية (نفس الكود).'
                    : '* Or use Employee Code ADMIN001 / ITADM001 with default password (same as code).'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
