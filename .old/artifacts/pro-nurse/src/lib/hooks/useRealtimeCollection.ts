

import { useEffect, useState, useRef } from 'react'
import {
  collection,
  onSnapshot,
  query,
  QueryConstraint,
  DocumentData,
  CollectionReference,
  Query,
  orderBy,
} from 'firebase/firestore'
import { getFirestoreDb, isFirebaseConfigured } from '@/lib/firebase'

export interface UseRealtimeCollectionResult<T> {
  data: T[]
  loading: boolean
  error: Error | null
  refresh: () => void
}

/**
 * Real-time Firestore collection hook using onSnapshot.
 * Automatically subscribes and cleans up on unmount.
 */
export function useRealtimeCollection<T extends DocumentData & { id: string }>(
  collectionPath: string,
  constraints: QueryConstraint[] = [],
): UseRealtimeCollectionResult<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)
  const unsubRef = useRef<(() => void) | null>(null)

  const refresh = () => setTick((n) => n + 1)

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false)
      return
    }

    setLoading(true)
    const db = getFirestoreDb()
    const colRef: CollectionReference = collection(db, collectionPath)
    const q: Query = constraints.length > 0
      ? query(colRef, ...constraints)
      : query(colRef)

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[]
        setData(docs)
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err as Error)
        setLoading(false)
      },
    )

    unsubRef.current = unsub
    return () => {
      unsub()
      unsubRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionPath, tick])

  return { data, loading, error, refresh }
}

/**
 * Convenience wrapper — watches a single ordered collection.
 */
export function useRealtimeOrderedCollection<T extends DocumentData & { id: string }>(
  collectionPath: string,
  field: string,
  direction: 'asc' | 'desc' = 'asc',
): UseRealtimeCollectionResult<T> {
  return useRealtimeCollection<T>(collectionPath, [orderBy(field, direction)])
}
