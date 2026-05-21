

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Bell, Info, AlertTriangle, CheckCircle2, XCircle, Mail, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getNotificationsByUser,
  markNotificationAsRead,
  deleteNotification,
} from '@/lib/services/notifications.service'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'
import type { NotificationRecord, NotificationType, NotificationStatus } from '@/lib/repositories/contracts'

const NOTIFICATION_TYPES: Record<NotificationType, { label: string; icon: React.ReactNode; color: string }> = {
  alert: { label: 'تنبيه', icon: <AlertTriangle className="h-3 w-3"/>, color: 'bg-red-100 text-red-700' },
  info: { label: 'معلومة', icon: <Info className="h-3 w-3"/>, color: 'bg-blue-100 text-blue-700' },
  warning: { label: 'تحذير', icon: <AlertTriangle className="h-3 w-3"/>, color: 'bg-amber-100 text-amber-700' },
  success: { label: 'نجاح', icon: <CheckCircle2 className="h-3 w-3"/>, color: 'bg-green-100 text-green-700' },
  error: { label: 'خطأ', icon: <XCircle className="h-3 w-3"/>, color: 'bg-destructive-foreground text-destructive' },
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewItem, setViewItem] = useState<NotificationRecord | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const data = await getNotificationsByUser(user.id)
      setNotifications(data)
    } catch (e) {
      toast.error('فشل في تحميل الإشعارات')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const filteredNotifications = useMemo(() => {
    let list = [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    if (filterStatus === 'unread') {
      list = list.filter(n => n.status === 'unread')
    } else if (filterStatus === 'read') {
      list = list.filter(n => n.status === 'read')
    }
    return list
  }, [notifications, filterStatus])

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id)
      toast.success('تم وضع علامة "مقروءة"')
      loadNotifications()
    } catch (e) {
      toast.error('فشل في تحديث حالة الإشعار')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id)
      toast.success('تم حذف الإشعار')
      loadNotifications()
    } catch (e) {
      toast.error('فشل في حذف الإشعار')
    }
  }

  const handleViewNotification = (notif: NotificationRecord) => {
    setViewItem(notif)
    if (notif.status === 'unread') {
      handleMarkAsRead(notif.id)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-2xl font-bold">الإشعارات</h1><p className="text-sm text-muted-foreground">تتبع جميع التنبيهات والإشعارات الخاصة بك</p></div>
      </div>

      {/* Filters */}
      <Card><CardContent className="pt-4 pb-3">
        <div className="flex flex-wrap gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="الحالة"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الإشعارات</SelectItem>
              <SelectItem value="unread">غير مقروءة</SelectItem>
              <SelectItem value="read">مقروءة</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      {/* Notifications List */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">إشعاراتك — {filteredNotifications.length} إشعار</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <p className="text-muted-foreground">جاري تحميل إشعاراتك...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground"><Bell className="h-12 w-12 mx-auto mb-3 opacity-30"/><p>لا توجد إشعارات حالياً</p></div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map(notif => (
                <div
                  key={notif.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    notif.status === 'unread' ? "bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900" : "hover:bg-muted/50"
                  )}
                  onClick={() => handleViewNotification(notif)}
                >
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-full shrink-0", NOTIFICATION_TYPES[notif.type].color)}>
                    {NOTIFICATION_TYPES[notif.type].icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{notif.title}</span>
                      {notif.status === 'unread' && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200">جديد</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(notif.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {notif.status === 'unread' && (
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id) }} title="وضع علامة مقروءة">
                        <Mail className="h-3 w-3"/>
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(notif.id) }} title="حذف">
                      <XCircle className="h-3 w-3"/>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Notification Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        {viewItem && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={cn('text-xs flex items-center gap-1', NOTIFICATION_TYPES[viewItem.type].color)}>
                  {NOTIFICATION_TYPES[viewItem.type].icon}{NOTIFICATION_TYPES[viewItem.type].label}
                </Badge>
                <Badge variant="secondary" className="text-xs">{viewItem.status === 'unread' ? 'غير مقروءة' : 'مقروءة'}</Badge>
              </div>
              <DialogTitle className="text-base mt-1">{viewItem.title}</DialogTitle>
            </DialogHeader>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{viewItem.message}</p>
            {viewItem.link && (
              <Button variant="link" className="px-0 justify-start" asChild>
                <a href={viewItem.link} target="_blank" rel="noopener noreferrer">عرض التفاصيل</a>
              </Button>
            )}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              <span>تاريخ الإرسال: {new Date(viewItem.createdAt).toLocaleString()}</span>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}