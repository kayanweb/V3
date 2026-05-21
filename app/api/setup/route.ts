import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/setup
 * First-run bootstrap: seeds default roles and optionally promotes the
 * first admin user defined in FIRST_ADMIN_EMAIL environment variable.
 *
 * Guarded by SETUP_SECRET to prevent unauthorised calls in production.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SETUP_SECRET
  if (secret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }
  }

  try {
    // Dynamic imports keep firebase-admin out of the client bundle
    const { initializeApp, getApps, cert } = await import('firebase-admin/app')
    const { getFirestore }                  = await import('firebase-admin/firestore')

    // Initialise the Admin SDK (idempotent)
    if (getApps().length === 0) {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      if (!serviceAccount) {
        return NextResponse.json(
          { error: 'FIREBASE_SERVICE_ACCOUNT_JSON env var is not set' },
          { status: 500 },
        )
      }
      initializeApp({ credential: cert(JSON.parse(serviceAccount)) })
    }

    const db    = getFirestore()
    const now   = new Date().toISOString()
    const results: Record<string, string> = {}

    // ── 1. Seed default roles ────────────────────────────────

    const DEFAULT_ROLES = [
      {
        key: 'admin',
        name: 'System Admin',
        nameAr: 'مدير النظام',
        description: 'صلاحية كاملة على جميع أقسام النظام',
        permissions: [
          'dashboard.view',
          'reports.view', 'reports.create', 'reports.approve', 'reports.export',
          'staff.view', 'staff.create', 'staff.edit', 'staff.delete',
          'departments.view', 'departments.manage',
          'patients.view', 'patients.create', 'patients.edit',
          'inventory.view', 'inventory.manage',
          'equipment.view', 'equipment.manage',
          'emergency.view', 'emergency.activate',
          'users.view', 'users.create', 'users.edit', 'users.delete', 'users.approve',
          'roles.view', 'roles.manage',
          'settings.view', 'settings.manage',
          'analytics.view',
          'logs.view',
          'notifications.send',
        ],
        isActive: true,
        isDefault: false,
        order: 1,
      },
      {
        key: 'head_nurse',
        name: 'Head Nurse',
        nameAr: 'رئيس التمريض',
        description: 'إدارة الكادر والأقسام وإنشاء التقارير',
        permissions: [
          'dashboard.view',
          'reports.view', 'reports.create', 'reports.approve', 'reports.export',
          'staff.view', 'staff.create', 'staff.edit',
          'departments.view', 'departments.manage',
          'patients.view', 'patients.create', 'patients.edit',
          'inventory.view', 'equipment.view', 'emergency.view',
          'users.view', 'users.approve',
          'analytics.view', 'logs.view',
        ],
        isActive: true,
        isDefault: false,
        order: 2,
      },
      {
        key: 'nurse',
        name: 'Nurse',
        nameAr: 'ممرضة',
        description: 'وصول للوحة التحكم ومهام التمريض',
        permissions: [
          'dashboard.view',
          'patients.view', 'patients.create', 'patients.edit',
          'inventory.view', 'equipment.view', 'emergency.view',
        ],
        isActive: true,
        isDefault: true,
        order: 3,
      },
    ]

    const rolesRef = db.collection('roles')
    for (const role of DEFAULT_ROLES) {
      const existing = await rolesRef.where('key', '==', role.key).limit(1).get()
      if (existing.empty) {
        const ref = await rolesRef.add({ ...role, createdAt: now, updatedAt: now })
        results[`role.${role.key}`] = `created (${ref.id})`
      } else {
        results[`role.${role.key}`] = 'already exists — skipped'
      }
    }

    // ── 2. Promote first admin (optional) ───────────────────

    const firstAdminEmail = process.env.FIRST_ADMIN_EMAIL
    if (firstAdminEmail) {
      const adminRoleSnap = await rolesRef.where('key', '==', 'admin').limit(1).get()
      if (!adminRoleSnap.empty) {
        const adminRoleId = adminRoleSnap.docs[0].id
        const usersRef = db.collection('users')
        const userSnap = await usersRef.where('email', '==', firstAdminEmail).limit(1).get()
        if (!userSnap.empty) {
          const userDoc = userSnap.docs[0]
          await userDoc.ref.update({
            roles:     [adminRoleId],
            roleKeys:  ['admin'],
            status:    'active',
            updatedAt: now,
          })
          results['firstAdmin'] = `promoted ${firstAdminEmail} to admin`
        } else {
          results['firstAdmin'] = `user ${firstAdminEmail} not found — they must sign in first`
        }
      }
    } else {
      results['firstAdmin'] = 'FIRST_ADMIN_EMAIL not set — skipped'
    }

    return NextResponse.json({ ok: true, results })
  } catch (err) {
    console.error('[setup]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'PRO Nurse Setup endpoint. Send POST with Authorization: Bearer <SETUP_SECRET> to run.',
    env: {
      FIREBASE_SERVICE_ACCOUNT_JSON: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      FIRST_ADMIN_EMAIL: process.env.FIRST_ADMIN_EMAIL ?? '(not set)',
      SETUP_SECRET: !!process.env.SETUP_SECRET,
    },
  })
}
