

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import type { InventoryItem } from '@/lib/repositories/contracts'
import { inventoryService } from '@/lib/services/inventory.service'
import { toast } from 'sonner'
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Calendar,
  Download,
  Upload,
  BarChart3,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [restockAmount, setRestockAmount] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const loadInventory = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await inventoryService.getAll()
      setInventory(data)
    } catch (error) {
      toast.error('حدث خطأ في تحميل البيانات من السحابة')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInventory()
  }, [loadInventory])

  // Stats
  const totalItems = inventory.length
  const lowStockItems = inventory.filter((i) => i.currentStock < i.minStock)
  const expiringItems = inventory.filter((i) => {
    if (!i.expiryDate) return false
    const daysUntil = Math.ceil(
      (new Date(i.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    return daysUntil <= 30 && daysUntil >= 0
  })

  const categories = [...new Set(inventory.map((i) => i.category))]

  const getStockStatus = (item: InventoryItem) => {
    const percentage = (item.currentStock / item.maxStock) * 100
    if (item.currentStock < item.minStock) {
      return { status: 'critical', label: 'مخزون حرج', color: 'text-red-600' }
    }
    if (percentage < 40) {
      return { status: 'low', label: 'مخزون منخفض', color: 'text-amber-600' }
    }
    return { status: 'normal', label: 'طبيعي', color: 'text-green-600' }
  }

  const filteredInventory = inventory.filter((i) => {
    const matchesSearch =
      i.nameAr.includes(searchQuery) ||
      i.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || i.category === filterCategory
    const stockStatus = getStockStatus(i)
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'low' && stockStatus.status !== 'normal') ||
      (filterStatus === 'normal' && stockStatus.status === 'normal')
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleRestock = async () => {
    if (!selectedItem || !restockAmount) return
    const amount = parseInt(restockAmount)
    if (isNaN(amount) || amount <= 0) return

    setIsUpdating(true)
    try {
      await inventoryService.updateStock(selectedItem.id, amount)
      toast.success('تم تحديث المخزون في السحابة بنجاح')
      await loadInventory()
      setIsRestockDialogOpen(false)
      setSelectedItem(null)
      setRestockAmount('')
    } catch (error) {
      toast.error('فشل في تحديث المخزون السحابي')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة المخزون</h1>
          <p className="text-muted-foreground">
            تتبع المستلزمات الطبية ومراقبة مستويات المخزون
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            تصدير
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة صنف
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الأصناف</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مخزون حرج</p>
                <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">قريب الانتهاء</p>
                <p className="text-2xl font-bold text-amber-600">{expiringItems.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مستوى طبيعي</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalItems - lowStockItems.length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              تنبيه: أصناف بحاجة لإعادة تخزين ({lowStockItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map((item) => (
                <Badge
                  key={item.id}
                  variant="outline"
                  className="border-red-300 text-red-700 cursor-pointer hover:bg-red-100"
                  onClick={() => {
                    setSelectedItem(item)
                    setIsRestockDialogOpen(true)
                  }}
                >
                  {item.nameAr} ({item.currentStock}/{item.minStock})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم..."
                className="pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="حالة المخزون" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="low">منخفض/حرج</SelectItem>
                <SelectItem value="normal">طبيعي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المخزون</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                <p className="text-muted-foreground font-cairo">جاري مزامنة البيانات السحابية...</p>
              </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الصنف</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>الكمية</TableHead>
                  <TableHead>مستوى المخزون</TableHead>
                  <TableHead>آخر تخزين</TableHead>
                  <TableHead>تاريخ الانتهاء</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد أصناف مطابقة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item) => {
                    const stockStatus = getStockStatus(item)
                    const percentage = (item.currentStock / item.maxStock) * 100
                    const isExpiring =
                      item.expiryDate &&
                      Math.ceil(
                        (new Date(item.expiryDate).getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24)
                      ) <= 30

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.nameAr}</p>
                            <p className="text-xs text-muted-foreground">{item.unit}</p>
                          </div>
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>
                          <span className={cn('font-medium', stockStatus.color)}>
                            {item.currentStock}
                          </span>
                          <span className="text-muted-foreground">
                            {' '}
                            / {item.maxStock}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="w-32 space-y-1">
                            <Progress
                              value={percentage}
                              className={cn(
                                'h-2',
                                stockStatus.status === 'critical' && '[&>div]:bg-red-500',
                                stockStatus.status === 'low' && '[&>div]:bg-amber-500',
                                stockStatus.status === 'normal' && '[&>div]:bg-green-500'
                              )}
                            />
                            <p className={cn('text-xs', stockStatus.color)}>
                              {stockStatus.label}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.lastRestocked
                            ? new Date(item.lastRestocked).toLocaleDateString('ar-EG')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {item.expiryDate ? (
                            <span className={cn(isExpiring && 'text-amber-600 font-medium')}>
                              {new Date(item.expiryDate).toLocaleDateString('ar-EG')}
                              {isExpiring && (
                                <AlertTriangle className="inline h-3 w-3 mr-1" />
                              )}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item)
                              setIsRestockDialogOpen(true)
                            }}
                          >
                            <Upload className="h-4 w-4 ml-1" />
                            تخزين
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Restock Dialog */}
      <Dialog open={isRestockDialogOpen} onOpenChange={setIsRestockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إعادة تخزين</DialogTitle>
            {selectedItem && (
              <DialogDescription>
                {selectedItem.nameAr} - المخزون الحالي: {selectedItem.currentStock}{' '}
                {selectedItem.unit}
              </DialogDescription>
            )}
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>الكمية المضافة</Label>
                <Input
                  type="number"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(e.target.value)}
                  placeholder="أدخل الكمية"
                  min={1}
                  max={selectedItem.maxStock - selectedItem.currentStock}
                />
                <p className="text-xs text-muted-foreground">
                  الحد الأقصى للإضافة:{' '}
                  {selectedItem.maxStock - selectedItem.currentStock} {selectedItem.unit}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestockDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleRestock} disabled={!restockAmount || isUpdating}>
              {isUpdating && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تأكيد التخزين
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
