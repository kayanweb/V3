

import * as React from 'react'
import { History, Filter, Download, Clock, CheckCircle2, XCircle, LogIn, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLang } from '@/contexts/lang-context'
import { getRecentLoginLogs } from '@/lib/services/auth.service'
import type { LoginLogRecord } from '@/lib/repositories'

type LogRow = LoginLogRecord & Record<string, unknown>

export default function AuditLogsPage() {
  const { isAr } = useLang()
  const [logs, setLogs] = React.useState<LogRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dateFilter, setDateFilter] = React.useState('')
  const [methodFilter, setMethodFilter] = React.useState('all')
  const [successFilter, setSuccessFilter] = React.useState('all')

  React.useEffect(() => {
    getRecentLoginLogs(200).then((data) => {
      setLogs(data as LogRow[])
      setLoading(false)
    })
  }, [])

  const filtered = React.useMemo(() => {
    return logs.filter((log) => {
      if (dateFilter && !log.timestamp.startsWith(dateFilter)) return false
      if (methodFilter !== 'all' && log.method !== methodFilter) return false
      if (successFilter === 'success' && !log.success) return false
      if (successFilter === 'failed' && log.success) return false
      return true
    })
  }, [logs, dateFilter, methodFilter, successFilter])

  const today = new Date().toISOString().split('T')[0]
  const todayCount = logs.filter((l) => l.timestamp.startsWith(today)).length
  const successCount = logs.filter((l) => l.success).length
  const failedCount = logs.filter((l) => !l.success).length

  const methodLabels: Record<string, { ar: string; en: string }> = {
    employee_code: { ar: 'كود الموظف', en: 'Employee Code' },
    google: { ar: 'Google', en: 'Google' },
    email: { ar: 'بريد إلكتروني', en: 'Email' },
  }

  const handleExport = () => {
    const csv = [
      ['timestamp', 'email', 'method', 'success'].join(','),
      ...filtered.map((l) => [l.timestamp, l.userEmail, l.method, l.success].join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'login-logs.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? 'سجل تسجيلات الدخول' : 'Login Audit Log'}</h1>
          <p className="text-muted-foreground text-sm">{isAr ? 'سجل كامل لمحاولات الدخول — من Firestore مباشرة' : 'Full login history — directly from Firestore'}</p>
        </div>
        <Button variant="outline" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          {isAr ? 'تصدير CSV' : 'Export CSV'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: isAr ? 'إجمالي المحاولات' : 'Total Attempts', val: logs.length, icon: History, color: 'bg-primary/10 text-primary' },
          { label: isAr ? 'اليوم' : 'Today', val: todayCount, icon: Clock, color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
          { label: isAr ? 'ناجحة' : 'Successful', val: successCount, icon: CheckCircle2, color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' },
          { label: isAr ? 'فاشلة' : 'Failed', val: failedCount, icon: XCircle, color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' },
        ].map(({ label, val, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{val}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Filter className="h-4 w-4" />{isAr ? 'التصفية' : 'Filters'}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{isAr ? 'التاريخ' : 'Date'}</p>
              <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{isAr ? 'طريقة الدخول' : 'Login Method'}</p>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? 'الكل' : 'All'}</SelectItem>
                  <SelectItem value="employee_code">{isAr ? 'كود الموظف' : 'Employee Code'}</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{isAr ? 'الحالة' : 'Status'}</p>
              <Select value={successFilter} onValueChange={setSuccessFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? 'الكل' : 'All'}</SelectItem>
                  <SelectItem value="success">{isAr ? 'ناجحة' : 'Successful'}</SelectItem>
                  <SelectItem value="failed">{isAr ? 'فاشلة' : 'Failed'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <History className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">{isAr ? 'لا توجد سجلات بعد' : 'No logs yet'}</p>
              <p className="text-xs text-muted-foreground">{isAr ? 'ستظهر هنا سجلات الدخول بعد أول تسجيل دخول عبر الموقع' : 'Login logs will appear here after the first login'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className={`text-xs font-bold ${log.success ? 'bg-green-100 text-green-700 dark:bg-green-950' : 'bg-red-100 text-red-700 dark:bg-red-950'}`}>
                      {log.userEmail.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">{log.userEmail}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${log.success ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400'}`}>
                        {log.success ? (isAr ? 'ناجح' : 'Success') : (isAr ? 'فاشل' : 'Failed')}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {isAr ? methodLabels[log.method]?.ar : methodLabels[log.method]?.en ?? log.method}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(log.timestamp).toLocaleString(isAr ? 'ar-EG' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  {log.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
