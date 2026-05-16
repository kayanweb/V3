import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  addDoc,
  query,
  where,
  Timestamp 
} from 'firebase/firestore'
import { getFirestoreDb } from '@/lib/firebase'
import { InventoryItem } from '@/types'

const COLLECTION = 'inventory'

export class FirestoreInventoryRepository {
  private db = getFirestoreDb()
  private coll = collection(this.db, COLLECTION)

  private mapDocToInventoryItem(docSnap: any): InventoryItem {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      lastRestocked: data.lastRestocked?.toDate().toISOString().split('T')[0],
      expiryDate: data.expiryDate?.toDate().toISOString().split('T')[0],
    } as InventoryItem;
  }

  async getAll(): Promise<InventoryItem[]> {
    const snapshot = await getDocs(this.coll)
    return snapshot.docs.map(this.mapDocToInventoryItem);
  }

  async getById(id: string): Promise<InventoryItem | null> {
    const docRef = doc(this.db, COLLECTION, id)
    const snapshot = await getDoc(docRef)
    if (!snapshot.exists()) return null;
    return this.mapDocToInventoryItem(snapshot);
  }

  async update(id: string, data: Partial<InventoryItem>): Promise<void> {
    const docRef = doc(this.db, COLLECTION, id)
    if (data.lastRestocked && typeof data.lastRestocked === 'string') {
      data.lastRestocked = Timestamp.fromDate(new Date(data.lastRestocked)) as any;
    }
    if (data.expiryDate && typeof data.expiryDate === 'string') {
      data.expiryDate = Timestamp.fromDate(new Date(data.expiryDate)) as any;
    }
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    })
  }

  async create(data: Omit<InventoryItem, 'id'>): Promise<string> {
    const docRef = await addDoc(this.coll, {
      ...data,
      createdAt: Timestamp.now()
    })
    return docRef.id
  }
}

export const inventoryRepo = new FirestoreInventoryRepository()