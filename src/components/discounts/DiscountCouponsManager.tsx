import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Copy, Search, X, ChevronLeft, ChevronRight, Filter, RefreshCw, Download, ArrowUpDown, Ticket, CheckCircle, XCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddCouponModal } from "./AddCouponModal";
import { DeleteConfirmDialog } from "@/components/modals/DeleteConfirmDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  currency: string;
  min_purchase_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number;
  valid_from: string;
  valid_until: string;
  active: boolean;
  applicable_to: string;
  created_at: string;
}

type SortField = 'code' | 'discount_value' | 'usage_count' | 'valid_until' | 'created_at';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

export const DiscountCouponsManager = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<{ id: string; code: string } | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons((data || []) as Coupon[]);
    } catch (error: any) {
      console.error('Error fetching coupons:', error);
      toast.error('فشل تحميل الكوبونات');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort coupons
  const filteredAndSortedCoupons = useMemo(() => {
    let result = [...coupons];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.code.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter === "active") {
      result = result.filter(c => c.active && new Date(c.valid_until) >= new Date());
    } else if (statusFilter === "inactive") {
      result = result.filter(c => !c.active);
    } else if (statusFilter === "expired") {
      result = result.filter(c => new Date(c.valid_until) < new Date());
    }
    
    // Apply type filter
    if (typeFilter !== "all") {
      result = result.filter(c => c.discount_type === typeFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'valid_until' || sortField === 'created_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
    
    return result;
  }, [coupons, searchQuery, statusFilter, typeFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedCoupons.length / ITEMS_PER_PAGE);
  const paginatedCoupons = filteredAndSortedCoupons.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('تم نسخ الكود');
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('discount_coupons')
        .update({ active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(currentStatus ? 'تم تعطيل الكوبون' : 'تم تفعيل الكوبون');
      fetchCoupons();
    } catch (error) {
      toast.error('فشل تحديث الكوبون');
    }
  };

  const handleDeleteClick = (id: string, code: string) => {
    setSelectedCoupon({ id, code });
    setDeleteDialogOpen(true);
  };

  const deleteCoupon = async () => {
    if (!selectedCoupon) return;

    try {
      const { error } = await supabase
        .from('discount_coupons')
        .delete()
        .eq('id', selectedCoupon.id);

      if (error) throw error;
      toast.success('تم حذف الكوبون');
      fetchCoupons();
    } catch (error) {
      toast.error('فشل حذف الكوبون');
    }
  };

  const getDiscountText = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%`;
    }
    return `${coupon.discount_value.toLocaleString()} ${coupon.currency}`;
  };

  const getCouponStatus = (coupon: Coupon) => {
    const now = new Date();
    const validUntil = new Date(coupon.valid_until);
    
    if (!coupon.active) {
      return { label: 'معطل', variant: 'secondary' as const, icon: XCircle };
    }
    if (validUntil < now) {
      return { label: 'منتهي', variant: 'destructive' as const, icon: Calendar };
    }
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return { label: 'مستنفد', variant: 'outline' as const, icon: XCircle };
    }
    return { label: 'نشط', variant: 'default' as const, icon: CheckCircle };
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || typeFilter !== "all";

  const exportToCSV = () => {
    const headers = ['الكود', 'الوصف', 'نوع الخصم', 'قيمة الخصم', 'الاستخدامات', 'الحد الأقصى', 'صالح حتى', 'الحالة'];
    const rows = filteredAndSortedCoupons.map(c => [
      c.code,
      c.description || '',
      c.discount_type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت',
      c.discount_value,
      `${c.usage_count}/${c.usage_limit || '∞'}`,
      c.max_discount_amount || '-',
      new Date(c.valid_until).toLocaleDateString('ar-IQ'),
      c.active ? 'نشط' : 'معطل'
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `coupons_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('تم تصدير الكوبونات');
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Ticket className="h-5 w-5 text-blue-500" />
            </div>
            <CardTitle>كوبونات الخصم</CardTitle>
            <Badge variant="outline" className="text-sm">
              {filteredAndSortedCoupons.length} كوبون
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchCoupons}>
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 ml-2" />
              تصدير
            </Button>
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة كوبون
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Section */}
          <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-xl">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث بالكود أو الوصف..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pr-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">معطل</SelectItem>
                <SelectItem value="expired">منتهي</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="نوع الخصم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="percentage">نسبة مئوية</SelectItem>
                <SelectItem value="fixed_amount">مبلغ ثابت</SelectItem>
              </SelectContent>
            </Select>
            
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 ml-2" />
                مسح الفلاتر
              </Button>
            )}
          </div>

          {paginatedCoupons.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {hasActiveFilters ? 'لا توجد نتائج مطابقة للفلاتر' : 'لا توجد كوبونات خصم حالياً'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/80 transition-colors"
                        onClick={() => handleSort('code')}
                      >
                        <div className="flex items-center gap-2">
                          الكود
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/80 transition-colors"
                        onClick={() => handleSort('discount_value')}
                      >
                        <div className="flex items-center gap-2">
                          قيمة الخصم
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/80 transition-colors"
                        onClick={() => handleSort('usage_count')}
                      >
                        <div className="flex items-center gap-2">
                          الاستخدامات
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/80 transition-colors"
                        onClick={() => handleSort('valid_until')}
                      >
                        <div className="flex items-center gap-2">
                          الصلاحية
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCoupons.map((coupon) => {
                      const status = getCouponStatus(coupon);
                      return (
                        <TableRow key={coupon.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                                {coupon.code}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => copyCode(coupon.code)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {coupon.description || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-bold">
                              {getDiscountText(coupon)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{coupon.usage_count}</span>
                              <span className="text-muted-foreground">/ {coupon.usage_limit || '∞'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {new Date(coupon.valid_until).toLocaleDateString('ar-IQ')}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={status.variant}
                              className="cursor-pointer gap-1"
                              onClick={() => toggleActive(coupon.id, coupon.active)}
                            >
                              <status.icon className="h-3 w-3" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-left">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-destructive/10"
                                onClick={() => handleDeleteClick(coupon.id, coupon.code)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    عرض {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedCoupons.length)} من {filteredAndSortedCoupons.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AddCouponModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSuccess={fetchCoupons}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={deleteCoupon}
        title="حذف الكوبون"
        description="هل أنت متأكد من حذف هذا الكوبون؟ لا يمكن التراجع عن هذا الإجراء."
        itemName={selectedCoupon?.code}
      />
    </>
  );
};
