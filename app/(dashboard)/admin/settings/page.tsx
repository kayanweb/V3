'use client'

import * as React from 'react'
import {
  Settings, Users, Shield, Database, History, CheckCircle2, Lock,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useAuth, RequirePermission } from '@/contexts/auth-context'
import { useLang } from '@/contexts/lang-context'
import { GeneralTab }  from './_tabs/general-tab'
import { UsersTab }    from './_tabs/users-tab'
import { RolesTab }    from './_tabs/roles-tab'
import { BackupTab }   from './_tabs/backup-tab'
import { LogsTab }     from './_tabs/logs-tab'

function AccessDenied({ isAr }: { isAr: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
      <Lock className="h-10 w-10 opacity-40" />
      <p className="text-sm">{isAr ? 'ليس لديك صلاحية للوصول لهذه الصفحة' : 'You do not have permission to access this page'}</p>
    </div>
  )
}

export default function AdminSettingsPage() {
  const { isAr } = useLang()
  const { user, can } = useAuth()

  const isAdmin = can('settings.manage') || can('users.view') || can('roles.manage')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? 'لوحة تحكم المدير' : 'Admin Control Panel'}</h1>
          <p className="text-muted-foreground text-sm">
            {isAr ? 'إدارة شاملة للنظام — Firestore Real-time' : 'Full system management — Firestore Real-time'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-green-700 border-green-300 bg-green-50 dark:bg-green-950 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3" />
            Real-time
          </Badge>
          <Badge variant="outline" className="gap-1 text-blue-700 border-blue-300 bg-blue-50 dark:bg-blue-950 dark:text-blue-400">
            <Shield className="h-3 w-3" />
            {user?.role ?? (isAr ? 'غير محدد' : 'Unknown')}
          </Badge>
        </div>
      </div>

      {!isAdmin ? (
        <AccessDenied isAr={isAr} />
      ) : (
        <Tabs defaultValue="general">
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            <TabsTrigger value="general" className="gap-1.5">
              <Settings className="h-4 w-4" />
              {isAr ? 'إعدادات عامة' : 'General Settings'}
            </TabsTrigger>

            <TabsTrigger value="users" className="gap-1.5" disabled={!can('users.view')}>
              <Users className="h-4 w-4" />
              {isAr ? 'إدارة المستخدمين' : 'Users Management'}
            </TabsTrigger>

            <TabsTrigger value="roles" className="gap-1.5" disabled={!can('roles.manage')}>
              <Shield className="h-4 w-4" />
              {isAr ? 'الأدوار والصلاحيات' : 'Roles & Permissions'}
            </TabsTrigger>

            <TabsTrigger value="backup" className="gap-1.5" disabled={!can('settings.manage')}>
              <Database className="h-4 w-4" />
              {isAr ? 'نسخ احتياطي' : 'Backup & Restore'}
            </TabsTrigger>

            <TabsTrigger value="logs" className="gap-1.5" disabled={!can('logs.view')}>
              <History className="h-4 w-4" />
              {isAr ? 'سجلات النظام' : 'System Logs'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <RequirePermission permission="settings.view" fallback={<AccessDenied isAr={isAr} />}>
              <GeneralTab />
            </RequirePermission>
          </TabsContent>

          <TabsContent value="users">
            <RequirePermission permission="users.view" fallback={<AccessDenied isAr={isAr} />}>
              <UsersTab />
            </RequirePermission>
          </TabsContent>

          <TabsContent value="roles">
            <RequirePermission permission="roles.manage" fallback={<AccessDenied isAr={isAr} />}>
              <RolesTab />
            </RequirePermission>
          </TabsContent>

          <TabsContent value="backup">
            <RequirePermission permission="settings.manage" fallback={<AccessDenied isAr={isAr} />}>
              <BackupTab />
            </RequirePermission>
          </TabsContent>

          <TabsContent value="logs">
            <RequirePermission permission="logs.view" fallback={<AccessDenied isAr={isAr} />}>
              <LogsTab />
            </RequirePermission>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
