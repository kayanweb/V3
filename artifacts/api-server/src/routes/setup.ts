import { Router, type Request, type Response } from "express";

const router = Router();

const DEFAULT_ROLES = [
  {
    key: "admin",
    name: "System Admin",
    nameAr: "مدير النظام",
    description: "صلاحية كاملة على جميع أقسام النظام",
    permissions: [
      "dashboard.view",
      "reports.view","reports.create","reports.approve","reports.export",
      "staff.view","staff.create","staff.edit","staff.delete",
      "departments.view","departments.manage",
      "patients.view","patients.create","patients.edit",
      "inventory.view","inventory.manage",
      "equipment.view","equipment.manage",
      "emergency.view","emergency.activate",
      "users.view","users.create","users.edit","users.delete","users.approve",
      "roles.view","roles.manage",
      "settings.view","settings.manage",
      "analytics.view","logs.view","notifications.send",
    ],
    isActive: true,
    isDefault: false,
    order: 1,
  },
  {
    key: "it_admin",
    name: "IT Admin",
    nameAr: "مسؤول تقنية المعلومات",
    description: "إدارة النظام والمستخدمين والإعدادات التقنية",
    permissions: [
      "dashboard.view",
      "users.view","users.create","users.edit","users.delete","users.approve",
      "roles.view","roles.manage",
      "settings.view","settings.manage",
      "logs.view","analytics.view",
      "departments.view","departments.manage",
    ],
    isActive: true,
    isDefault: false,
    order: 2,
  },
  {
    key: "head_nurse",
    name: "Head Nurse",
    nameAr: "رئيس التمريض",
    description: "إدارة الكادر والأقسام وإنشاء التقارير",
    permissions: [
      "dashboard.view",
      "reports.view","reports.create","reports.approve","reports.export",
      "staff.view","staff.create","staff.edit",
      "departments.view","departments.manage",
      "patients.view","patients.create","patients.edit",
      "inventory.view","equipment.view","emergency.view",
      "users.view","users.approve","analytics.view","logs.view",
    ],
    isActive: true,
    isDefault: false,
    order: 3,
  },
  {
    key: "supervisor",
    name: "Supervisor",
    nameAr: "مشرف",
    description: "إشراف على الكادر والأقسام",
    permissions: [
      "dashboard.view",
      "reports.view","reports.create",
      "staff.view","staff.edit",
      "departments.view",
      "patients.view","patients.create","patients.edit",
      "inventory.view","equipment.view","emergency.view",
    ],
    isActive: true,
    isDefault: false,
    order: 4,
  },
  {
    key: "nurse",
    name: "Nurse",
    nameAr: "ممرضة",
    description: "وصول للوحة التحكم ومهام التمريض",
    permissions: [
      "dashboard.view",
      "patients.view","patients.create","patients.edit",
      "inventory.view","equipment.view","emergency.view",
    ],
    isActive: true,
    isDefault: true,
    order: 5,
  },
];

async function getAdminApp() {
  const { initializeApp, getApps, cert } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  const { getAuth } = await import("firebase-admin/auth");

  if (getApps().length === 0) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON env var is not set");
    }
    initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) });
  }

  return { db: getFirestore(), authAdmin: getAuth() };
}

router.get("/setup", (_req: Request, res: Response) => {
  res.json({
    message: "PRO Nurse Setup endpoint. POST to /api/setup to bootstrap roles and admin accounts.",
    env: {
      FIREBASE_SERVICE_ACCOUNT_JSON: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      SETUP_SECRET: !!process.env.SETUP_SECRET,
      FIRST_ADMIN_EMAIL: process.env.FIRST_ADMIN_EMAIL ?? "(not set)",
    },
  });
});

router.post("/setup", async (req: Request, res: Response) => {
  const secret = process.env.SETUP_SECRET;
  if (secret) {
    const auth = req.headers["authorization"];
    if (auth !== `Bearer ${secret}`) {
      res.status(401).json({ error: "Unauthorised" });
      return;
    }
  }

  try {
    const { db, authAdmin } = await getAdminApp();
    const now = new Date().toISOString();
    const results: Record<string, string> = {};

    // ── 1. Seed default roles ──────────────────────────────────
    const rolesRef = db.collection("roles");
    const roleIdMap: Record<string, string> = {};

    for (const role of DEFAULT_ROLES) {
      const existing = await rolesRef.where("key", "==", role.key).limit(1).get();
      if (existing.empty) {
        const ref = await rolesRef.add({ ...role, createdAt: now, updatedAt: now });
        roleIdMap[role.key] = ref.id;
        results[`role.${role.key}`] = `created (${ref.id})`;
      } else {
        roleIdMap[role.key] = existing.docs[0].id;
        results[`role.${role.key}`] = "already exists — skipped";
      }
    }

    // ── 2. Create / update Admin account ──────────────────────
    const adminEmail    = process.env.FIRST_ADMIN_EMAIL    || "admin@pronurse.local";
    const adminPassword = process.env.FIRST_ADMIN_PASSWORD || "Admin@12345";
    const adminRoleId   = roleIdMap["admin"];

    let adminUid: string;
    try {
      const existing = await authAdmin.getUserByEmail(adminEmail);
      adminUid = existing.uid;
      results["admin.auth"] = `already exists (${adminUid})`;
    } catch {
      const created = await authAdmin.createUser({
        email: adminEmail,
        password: adminPassword,
        displayName: "System Admin",
        emailVerified: true,
      });
      adminUid = created.uid;
      results["admin.auth"] = `created (${adminUid})`;
    }

    const adminUserRef  = db.collection("users").doc(adminUid);
    const adminUserSnap = await adminUserRef.get();
    if (!adminUserSnap.exists) {
      await adminUserRef.set({
        id: adminUid,
        name: "System Admin",
        nameAr: "مدير النظام",
        email: adminEmail,
        employeeCode: "ADMIN001",
        roles: [adminRoleId],
        roleKeys: ["admin"],
        departments: ["الإدارة"],
        status: "active",
        mustChangePassword: false,
        createdAt: now,
        updatedAt: now,
      });
      results["admin.firestore"] = "user document created";
      await db.collection("employeeCredentials").doc(adminUid).set({
        userId: adminUid,
        password: "ADMIN001",
        mustChange: true,
        updatedAt: now,
      });
      results["admin.credentials"] = "credentials seeded (default password = ADMIN001)";
    } else {
      await adminUserRef.update({ roles: [adminRoleId], roleKeys: ["admin"], status: "active", updatedAt: now });
      results["admin.firestore"] = "user already exists — promoted to admin";
    }

    // ── 3. Create / update IT Admin account ───────────────────
    const itEmail    = process.env.FIRST_IT_ADMIN_EMAIL    || "itadmin@pronurse.local";
    const itPassword = process.env.FIRST_IT_ADMIN_PASSWORD || "ITAdmin@12345";
    const itRoleId   = roleIdMap["it_admin"];

    let itUid: string;
    try {
      const existing = await authAdmin.getUserByEmail(itEmail);
      itUid = existing.uid;
      results["it_admin.auth"] = `already exists (${itUid})`;
    } catch {
      const created = await authAdmin.createUser({
        email: itEmail,
        password: itPassword,
        displayName: "IT Admin",
        emailVerified: true,
      });
      itUid = created.uid;
      results["it_admin.auth"] = `created (${itUid})`;
    }

    const itUserRef  = db.collection("users").doc(itUid);
    const itUserSnap = await itUserRef.get();
    if (!itUserSnap.exists) {
      await itUserRef.set({
        id: itUid,
        name: "IT Admin",
        nameAr: "مسؤول تقنية المعلومات",
        email: itEmail,
        employeeCode: "ITADM001",
        roles: [itRoleId],
        roleKeys: ["it_admin"],
        departments: ["تقنية المعلومات"],
        status: "active",
        mustChangePassword: false,
        createdAt: now,
        updatedAt: now,
      });
      results["it_admin.firestore"] = "user document created";
      await db.collection("employeeCredentials").doc(itUid).set({
        userId: itUid,
        password: "ITADM001",
        mustChange: true,
        updatedAt: now,
      });
      results["it_admin.credentials"] = "credentials seeded (default password = ITADM001)";
    } else {
      await itUserRef.update({ roles: [itRoleId], roleKeys: ["it_admin"], status: "active", updatedAt: now });
      results["it_admin.firestore"] = "user already exists — promoted to it_admin";
    }

    res.json({ ok: true, results });
  } catch (err) {
    console.error("[setup]", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
});

export default router;
