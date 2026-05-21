import { inventoryRepo } from '@/lib/repositories'
import type { InventoryItem } from '@/lib/repositories/contracts'

export const inventoryService = {
  async getAll(): Promise<InventoryItem[]> {
    return await inventoryRepo().getAll()
  },

  async getById(id: string): Promise<InventoryItem | null> {
    return await inventoryRepo().getById(id)
  },

  async updateStock(id: string, amount: number): Promise<void> {
    const item = await inventoryRepo().getById(id)
    if (!item) throw new Error('Item not found')

    const newStock = Math.min(item.currentStock + amount, item.maxStock)
    
    await inventoryRepo().update(id, {
      currentStock: newStock,
      lastRestocked: new Date().toISOString().split('T')[0] // Keep as string date for UI
    })
  },

  async createItem(item: Omit<InventoryItem, 'id'>): Promise<string> {
    if (item.minStock > item.maxStock) {
      throw new Error('Minimum stock cannot exceed maximum stock')
    }
    return await inventoryRepo().create(item)
  },

  async getLowStockItems(): Promise<InventoryItem[]> {
    const all = await this.getAll()
    return all.filter(item => item.currentStock < item.minStock)
  }
}