

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './auth-context'
import { updateUserPreferences, getAllUsers, UserRecord } from '@/lib/services/users.service'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Search, Loader2 } from 'lucide-react'

// ==========================================
// 1. مكون صفحة إدارة المستخدمين (UsersPage)
// ==========================================
export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getAllUsers()
      setUsers(data)
    } catch (error) {
      toast.error('حدث خطأ في تحميل بيانات المستخدمين من السحابة')
      console.error(error)
    } 
    finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.nameAr.includes(searchQuery) ||
      user.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
          <p className="text-muted-foreground text-sm">
            عرض وإدارة جميع المستخدمين في النظام.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-1" /> إضافة مستخدم جديد
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الكود أو البريد الإلكتروني..."
              className="pr-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قائمة المستخدمين</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <p className="text-muted-foreground font-cairo">
                جاري مزامنة بيانات المستخدمين السحابية...
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>كود الموظف</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>الأدوار</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        لا توجد مستخدمون مطابقون
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium">{user.nameAr || user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </TableCell>
                        <TableCell>{user.employeeCode}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.roles.join(', ')}</TableCell>
                        <TableCell>{user.status}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            تعديل
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500">
                            حذف
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ==========================================
// 2. إعدادات سياق اللغة (Language Context)
// ==========================================
type Lang = 'ar' | 'en'

interface LangContextValue {
  lang: Lang
  toggleLang: () => void
  t: (ar: string, en: string) => string
  isAr: boolean
}

const LangContext = React.createContext<LangContextValue>({
  lang: 'ar',
  toggleLang: () => {},
  t: (ar) => ar,
  isAr: true,
})

export function LangProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth()
  const [lang, setLang] = useState<Lang>('ar')
  const [mounted, setMounted] = useState(false)

  // After mount: load stored preference from user profile or default
  useEffect(() => {
    if (!isAuthLoading) {
      const anyUser = user as any // حل مشكلة TypeScript هنا
      if (isAuthenticated && anyUser?.preferences?.language) {
        setLang(anyUser.preferences.language as Lang)
      } else {
        const browserLang = navigator.language.startsWith('ar') ? 'ar' : 'en'
        setLang(browserLang)
      }
    }
    setMounted(true)
  }, [isAuthLoading, isAuthenticated, user])

  useEffect(() => {
    if (!mounted) return
    const html = document.documentElement
    html.setAttribute('lang', lang === 'ar' ? 'ar' : 'en')
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
  }, [lang, mounted])

  const toggleLang = () => setLang((prev) => (prev === 'ar' ? 'en' : 'ar'))
  const t = useCallback((ar: string, en: string) => (lang === 'ar' ? ar : en), [lang])
  
  // Effect to save language preference to Firestore when it changes
  useEffect(() => {
    if (mounted && isAuthenticated && user?.id) {
      updateUserPreferences(user.id, { language: lang })
        .catch(error => {
          console.error("Failed to save language preference to Firestore:", error)
          toast.error(t('فشل حفظ تفضيل اللغة.', 'Failed to save language preference.'))
        })
    }
  }, [lang, mounted, isAuthenticated, user?.id, t])

  const effectiveLang: Lang = mounted ? lang : 'ar'

  return (
    <LangContext.Provider value={{ lang: effectiveLang, toggleLang, t, isAr: effectiveLang === 'ar' }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return React.useContext(LangContext)
}