

import * as React from 'react'
import { History, Download, LogIn, Loader2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLang } from '@/contexts/lang-context'
import { useRealtimeOrderedCollection } from '@/lib/hooks/useRealtimeCollection'
import type { LoginLogRecord } from '@/lib/repositories'

type LogRow = LoginLogRecord & Record<string, unknown>

const METHOD_LABELS: Record<string, { ar: string; en: string }> = {
  employee_code: { ar: 'كود الموظف', en: 'Employee Code' },
  google:        { ar: 'Google', en: 'Google' },
  email:         { ar: 'بريد إلكتروني', en: 'Email' },
}

export function LogsTab() {
  const { isAr } = useLang()
  const { data: allLogs, loading, refresh } = useRealtimeOrderedCollection<LogRow>('loginLogs', 'timestamp', 'desc')

  const [dateFilter, setDateFilter] = React.useState('')
  const [methodFilter, setMethodFilter] = React.useState('all')
  const [successFilter, setSuccessFilter] = React.useState('all')

  const logs = React.useMemo(() => {
    return allLogs.slice(0, 300).filter((log) => {
      if (dateFilter && !log.timestamp?.startsWith(dateFilter)) return false
      if (methodFilter !== 'all' && log.method !== methodFilter) return false
      if (successFilter === 'success' && !log.success) return false
      if (successFilter === 'failed' && log.success) return false
      return true
    })
  }, [allLogs, dateFilter, methodFilter, successFilter])

  const today = new Date().toISOString().split('T')[0]
  const todayCount = allLogs.filter((l) => l.timestamp?.startsWith(today)).length
  const successCount = allLogs.filter((l) => l.success).length
  const failedCount = allLogs.filter((l) => !l.success).length

  const handleExport = () => {
    const csv = [
      ['timestamp', 'email', 'method', 'success'].join(','),
      ...logs.map((l) => [l.timestamp, l.userEmail, l.method, l.success].join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `login-logs-${today}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: isAr ? 'اليوم' : 'Today', value: todayCount, color: 'text-blue-600' },
          { label: isAr ? 'ناجح' : 'Success', value: successCount, color: 'text-green-600' },
          { label: isAr ? 'فاشل' : 'Failed', value: failedCount, color: 'text-red-600' },
        ].map((s) => (
          <Card key={s.label} className="text-center py-3">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters + actions */}
      <div className="flex flex-wrap gap-2">
        <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-auto" />
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? 'كل الطرق' : 'All Methods'}</SelectItem>
            <SelectItem value="employee_code">{isAr ? 'كود الموظف' : 'Employee Code'}</SelectItem>
            <SelectItem value="google">Google</SelectItem>
            <SelectItem value="email">{isAr ? 'بريد إلكتروني' : 'Email'}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={successFilter} onValueChange={setSuccessFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? 'الكل' : 'All'}</SelectItem>
            <SelectItem value="success">{isAr ? 'ناجح' : 'Success'}</SelectItem>
            <SelectItem value="failed">{isAr ? 'فاشل' : 'Failed'}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={refresh} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />{isAr ? 'تحديث' : 'Refresh'}
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
          <Download className="h-3.5 w-3.5" />{isAr ? 'تصدير CSV' : 'Export CSV'}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-teal-600" />
            {isAr ? 'سجل تسجيل الدخول' : 'Login Audit Log'}
            <Badge variant="secondary" className="mr-auto">{logs.length} {isAr ? 'سجل' : 'records'}</Badge>
          </CardTitle>
          <CardDescription className="flex items-center gap-1 text-xs text-teal-600">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
            {isAr ? 'يتحدث تلقائياً (Real-time)' : 'Live real-time updates'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">{isAr ? 'لا توجد سجلات' : 'No logs found'}</p>
              ) : (
                logs.map((log) => {
                  const ml = METHOD_LABELS[log.method] ?? { ar: log.method, en: log.method }
                  return (
                    <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/30 transition-colors">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full shrink-0">
                        {log.success
                          ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                          : <XCircle className="h-4 w-4 text-red-500" />}
                      </div>
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-[10px] bg-primary/10">
                          {(log.userEmail as string || '?').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{log.userEmail as string || '—'}</p>
                        <p className="text-xs text-muted-foreground">{log.timestamp ? new Date(log.timestamp as string).toLocaleString(isAr ? 'ar-SA' : 'en-US') : '—'}</p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <Badge variant={log.success ? 'default' : 'destructive'} className="text-[10px] px-1.5 py-0">
                          {log.success ? (isAr ? 'ناجح' : 'Success') : (isAr ? 'فاشل' : 'Failed')}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <LogIn className="h-2.5 w-2.5" />{isAr ? ml.ar : ml.en}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
