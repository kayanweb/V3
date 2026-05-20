'use client'

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './auth-context'
import { updateUserPreferences } from '@/lib/services/users.service'
import { toast } from 'sonner'

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

  useEffect(() => {
    if (!isAuthLoading) {
      const anyUser = user as Record<string, unknown> | null
      const prefs = anyUser?.preferences as Record<string, unknown> | undefined
      if (isAuthenticated && prefs?.language) {
        setLang(prefs.language as Lang)
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
