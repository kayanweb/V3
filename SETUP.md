# PRO Nurse — Setup Guide

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com) → **Add project**.
2. Enable **Google Analytics** (optional).
3. Inside the project:
   - **Authentication** → Sign-in methods → Enable **Google** and **Email/Password**.
   - **Firestore Database** → Create database → **Production mode**.
   - **Storage** → Get started (optional, for file uploads).

---

## 2. Configure Client-Side Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
```

Get these values from **Firebase Console → Project Settings → Your apps → Web app**.

---

## 3. Setup Service Account for API Routes (Admin SDK)

API routes (e.g. `/api/setup`) use the Firebase Admin SDK and require a Service Account.

1. Go to **Firebase Console → Project Settings → Service accounts**.
2. Click **Generate new private key** → download the JSON file.
3. Add the entire JSON content (minified) as an environment variable:

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
```

### Optional variables

```env
# Email address of the first admin user (must sign in at least once first)
FIRST_ADMIN_EMAIL=admin@yourhospital.com

# Secret to protect the /api/setup endpoint in production
SETUP_SECRET=a-long-random-string
```

---

## 4. Register the First Admin User

### Step A — Promote via API (recommended)

1. Set `FIRST_ADMIN_EMAIL` to the admin's Google/email address in `.env.local`.
2. Have the admin sign in to the app at least once (so their user document is created).
3. Call the setup endpoint:

```bash
curl -X POST https://your-domain.com/api/setup \
  -H "Authorization: Bearer <SETUP_SECRET>"
```

The endpoint will:
- Seed the three default roles (`admin`, `head_nurse`, `nurse`) if they do not exist.
- Promote `FIRST_ADMIN_EMAIL` to the `admin` role.

### Step B — Promote manually via Firebase Console

1. Open **Firestore → `users` collection** → find the user document.
2. Edit the `roles` field: `["<admin-role-document-id>"]`
3. Edit `roleKeys`: `["admin"]`
4. Edit `status`: `"active"`

---

## 5. Roles & Permissions System

### Structure

```
Firestore
└── roles/
    ├── {adminRoleId}   { key:"admin",      permissions:[...all permissions] }
    ├── {hnRoleId}      { key:"head_nurse",  permissions:[...subset] }
    └── {nurseRoleId}   { key:"nurse",       permissions:[...basic] }

└── users/
    └── {uid}           { roles:["{adminRoleId}"], roleKeys:["admin"], ... }
```

### Default Permissions

| Key | Description |
|-----|-------------|
| `dashboard.view` | View main dashboard |
| `users.view` / `users.create` / `users.edit` / `users.delete` | User CRUD |
| `users.approve` | Approve pending registrations |
| `roles.view` / `roles.manage` | View and manage roles |
| `settings.view` / `settings.manage` | View and manage system settings |
| `staff.view` / `staff.create` / `staff.edit` / `staff.delete` | Staff management |
| `reports.view` / `reports.create` / `reports.approve` / `reports.export` | Reports |
| `departments.view` / `departments.manage` | Department management |
| `patients.view` / `patients.create` / `patients.edit` | Patient records |
| `inventory.view` / `inventory.manage` | Inventory |
| `equipment.view` / `equipment.manage` | Equipment |
| `emergency.view` / `emergency.activate` | Emergency codes |
| `analytics.view` | Analytics dashboard |
| `logs.view` | Audit logs |
| `notifications.send` | Send notifications |

### Adding a New Permission

1. Add the key string to `PERMISSION_KEYS` in `lib/services/roles.service.ts`.
2. Add a display label in `PERMISSION_LABELS`.
3. Add to a group in `PERMISSION_GROUPS`.
4. Use in components:
   ```tsx
   const { can } = useAuth()
   if (!can('your.new.permission')) return <AccessDenied />
   ```
5. Update Firestore rules in `firestore.rules` if the permission controls data access.

---

## 6. Managing Users & Roles from the UI

Navigate to **الإدارة والنظام → إعدادات النظام** (Admin Control Panel).

- **General Settings**: hospital info, notifications, security, departments, appearance.
- **Users Management**: live user list with role assignment and activate/deactivate.
- **Roles & Permissions**: add/edit/delete roles; full permission matrix per role.
- **Backup & Restore**: export any Firestore collection as JSON for offline backup.
- **System Logs**: real-time login audit logs with CSV export.

> Only users with `settings.view`, `users.view`, `roles.manage`, or `logs.view` permissions
> can access the corresponding tabs.

---

## 7. Offline Persistence & Real-time Updates

### How It Works

| Feature | Implementation |
|---------|---------------|
| **Offline persistence** | `initializeFirestore` with `persistentLocalCache` (IndexedDB) |
| **Auth persistence** | `setPersistence(auth, browserLocalPersistence)` |
| **Real-time updates** | `onSnapshot` via `useRealtimeCollection` hook |

### Using the Real-time Hook

```tsx
import { useRealtimeCollection } from '@/lib/hooks/useRealtimeCollection'

function MyComponent() {
  const { data, loading, error, refresh } = useRealtimeCollection<UserRecord>('users')
  // data is updated instantly whenever Firestore changes
}
```

### Using Ordered Collections

```tsx
import { useRealtimeOrderedCollection } from '@/lib/hooks/useRealtimeCollection'

const { data } = useRealtimeOrderedCollection<LogRecord>('loginLogs', 'timestamp', 'desc')
```

---

## 8. Firestore Security Rules

Deploy `firestore.rules` to Firebase:

```bash
firebase deploy --only firestore:rules
```

Key rule patterns:

```javascript
// Admin check using stored roleKeys array
function isAdmin() {
  return hasRoleKey('admin');
}

// Only admins can write roles
match /roles/{roleId} {
  allow read: if isActive();
  allow write: if isAdmin();
}
```

---

## 9. Deployment

```bash
# Install dependencies
pnpm install

# Development
pnpm dev

# Production build (verifies TypeScript + Next.js)
pnpm build

# Start production server
pnpm start
```

For Vercel deployment, add all environment variables in the Vercel project settings.
