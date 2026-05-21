import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from 'firebase/firestore'
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  Auth,
} from 'firebase/auth'
import { getDatabase, Database } from 'firebase/database'
import { getStorage, FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey:            import.meta.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain:        import.meta.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId:         import.meta.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket:     import.meta.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             import.meta.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  databaseURL:       import.meta.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
}

let app: FirebaseApp | undefined
let db: Firestore | undefined
let auth: Auth | undefined
let realtimeDb: Database | undefined
let storage: FirebaseStorage | undefined

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  }
  return app
}

export function getFirestoreDb(): Firestore {
  if (!db) {
    const appInstance = getFirebaseApp()
    if (typeof window !== 'undefined') {
      try {
        db = initializeFirestore(appInstance, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        })
      } catch {
        db = getFirestore(appInstance)
      }
    } else {
      db = getFirestore(appInstance)
    }
  }
  return db!
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp())
    if (typeof window !== 'undefined') {
      setPersistence(auth, browserLocalPersistence).catch(() => {})
    }
  }
  return auth
}

export function getRealtimeDb(): Database {
  if (!realtimeDb) {
    realtimeDb = getDatabase(getFirebaseApp())
  }
  return realtimeDb
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getFirebaseApp())
  }
  return storage
}

export { app, db, auth, realtimeDb, storage }

export function isFirebaseConfigured(): boolean {
  return !!(
    import.meta.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    import.meta.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    import.meta.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  )
}
