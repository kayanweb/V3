

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'wouter'
import { Plus, Eye, FileText, Filter, Download, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/status-badge'
import { DataTable, Column } from '@/components/ui/data-table'
import { getAllReports, getReportsByFilters, type ReportRecord } from '@/lib/services/reports.service'

// تعريف الأنواع المحلية
type ReportShift = 'morning' | 'evening' | 'night'
type ReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

export default function ReportsArchivePage() {
  const [allReports, setAllReports] = useState<ReportRecord[]>([])
  const [filteredReports, setFilteredReports] = useState<ReportRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('')
  const [shiftFilter, setShiftFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const loadReports = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getAllReports()
      setAllReports(data)
      setFilteredReports(data)
    } catch (error) {
      toast.error('حدث خطأ في تحميل التقارير من السحابة')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  useEffect(() => {
    const applyFilters = async () => {
      try {
        if (dateFilter || shiftFilter !== 'all' || statusFilter !== 'all') {
          setIsLoading(true)
          const filtered = await getReportsByFilters(
            dateFilter || undefined,
            shiftFilter === 'all' ? undefined : (shiftFilter as ReportShift),
            statusFilter === 'all' ? undefined : (statusFilter as ReportStatus)
          )
          setFilteredReports(filtered)
        } else {
          setFilteredReports(allReports)
        }
      } catch (error) {
        toast.error('فشل تطبيق الفلاتر على التقارير')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    applyFilters()
  }, [dateFilter, shiftFilter, statusFilter, allReports])

  const columns: Column<ReportRecord>[] = [
    {
      key: 'date',
      header: 'التاريخ',
      cell: (row) => (
        <span className="font-medium">
          {new Date(row.date).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'shift',
      header: 'الشفت',
      cell: (row) => <StatusBadge status={row.shift} />,
    },
    {
      key: 'supervisor',
      header: 'المشرف',
    },
    {
      key: 'totalPatients',
      header: 'المرضى',
    },
    {
      key: 'totalStaff',
      header: 'الكادر',
    },
    {
      key: 'status',
      header: 'الحالة',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/reports/${row.id}`}>
              <Eye className="h-4 w-4 ml-1" />
              عرض
            </Link>
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">أرشيف التقارير</h1>
          <p className="text-muted-foreground">
            عرض وإدارة جميع تقارير المناوبات
          </p>
        </div>
        <Button asChild>
          <Link to="/reports/create">
            <Plus className="h-4 w-4 ml-2" />
            تقرير جديد
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            تصفية النتائج
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Filter */}
            <div className="flex flex-col space-y-2">
              <label htmlFor="date-filter" className="text-sm font-medium">التاريخ</label>
              <Input id="date-filter" type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            </div>

            {/* Shift Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">الشفت</label>
              <Select value={shiftFilter} onValueChange={setShiftFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الشفتات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الشفتات</SelectItem>
                  <SelectItem value="morning">صباحي</SelectItem>
                  <SelectItem value="evening">مسائي</SelectItem>
                  <SelectItem value="night">ليلي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">الحالة</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="submitted">مُرسل</SelectItem>
                  <SelectItem value="approved">معتمد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setDateFilter('')
                  setShiftFilter('all')
                  setStatusFilter('all')
                }}
              >
                مسح الفلاتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <p className="text-muted-foreground font-cairo">جاري مزامنة التقارير السحابية...</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredReports}
              searchKey="supervisor"
              searchPlaceholder="البحث بالمشرف..."
              emptyMessage="لا توجد تقارير مطابقة للفلاتر المحددة"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
