import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Gift, TrendingUp, Calendar, Search, X, ChevronLeft, ChevronRight, RefreshCw, Download, ArrowUpDown, CheckCircle, XCircle, Percent, Clock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddPromotionalOfferModal } from "./AddPromotionalOfferModal";
import { DeleteConfirmDialog } from "@/components/modals/DeleteConfirmDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface PromotionalOffer {
  id: string;
  name: string;
  description: string | null;
  offer_type: string;
  discount_percentage: number | null;
  free_months: number | null;
  bonus_speed_mbps: number | null;
  valid_from: string;
  valid_until: string;
  auto_apply: boolean;
  active: boolean;
  created_at: string;
}

type SortField = 'name' | 'offer_type' | 'valid_until' | 'created_at';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

export const PromotionalOffersManager = () => {
  const [offers, setOffers] = useState<PromotionalOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<{ id: string; name: string } | null>(null);
  
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
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('promotional_offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers((data || []) as PromotionalOffer[]);
    } catch (error: any) {
      console.error('Error fetching offers:', error);
      toast.error('فشل تحميل العروض');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort offers
  const filteredAndSortedOffers = useMemo(() => {
    let result = [...offers];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(o => 
        o.name.toLowerCase().includes(query) ||
        o.description?.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter === "active") {
      result = result.filter(o => o.active && new Date(o.valid_until) >= new Date());
    } else if (statusFilter === "inactive") {
      result = result.filter(o => !o.active);
    } else if (statusFilter === "expired") {
      result = result.filter(o => new Date(o.valid_until) < new Date());
    }
    
    // Apply type filter
    if (typeFilter !== "all") {
      result = result.filter(o => o.offer_type === typeFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'valid_until' || sortField === 'created_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
    
    return result;
  }, [offers, searchQuery, statusFilter, typeFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedOffers.length / ITEMS_PER_PAGE);
  const paginatedOffers = filteredAndSortedOffers.slice(
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

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('promotional_offers')
        .update({ active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(currentStatus ? 'تم تعطيل العرض' : 'تم تفعيل العرض');
      fetchOffers();
    } catch (error) {
      toast.error('فشل تحديث العرض');
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setSelectedOffer({ id, name });
    setDeleteDialogOpen(true);
  };

  const deleteOffer = async () => {
    if (!selectedOffer) return;

    try {
      const { error } = await supabase
        .from('promotional_offers')
        .delete()
        .eq('id', selectedOffer.id);

      if (error) throw error;
      toast.success('تم حذف العرض');
      fetchOffers();
    } catch (error) {
      toast.error('فشل حذف العرض');
    }
  };

  const getOfferValue = (offer: PromotionalOffer) => {
    if (offer.offer_type === 'discount' && offer.discount_percentage) {
      return `خصم ${offer.discount_percentage}%`;
    }
    if (offer.offer_type === 'free_months' && offer.free_months) {
      return `${offer.free_months} شهر مجاني`;
    }
    if (offer.offer_type === 'speed_upgrade' && offer.bonus_speed_mbps) {
      return `+${offer.bonus_speed_mbps} ميجابت`;
    }
    return '-';
  };

  const getOfferIcon = (type: string) => {
    if (type === 'discount') return <Percent className="h-4 w-4" />;
    if (type === 'free_months') return <Calendar className="h-4 w-4" />;
    if (type === 'speed_upgrade') return <TrendingUp className="h-4 w-4" />;
    return <Gift className="h-4 w-4" />;
  };

  const getOfferTypeLabel = (type: string) => {
    if (type === 'discount') return 'خصم';
    if (type === 'free_months') return 'أشهر مجانية';
    if (type === 'speed_upgrade') return 'زيادة سرعة';
    return type;
  };

  const getOfferStatus = (offer: PromotionalOffer) => {
    const now = new Date();
    const validUntil = new Date(offer.valid_until);
    
    if (!offer.active) {
      return { label: 'معطل', variant: 'secondary' as const, icon: XCircle };
    }
    if (validUntil < now) {
      return { label: 'منتهي', variant: 'destructive' as const, icon: Clock };
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
    const headers = ['اسم العرض', 'الوصف', 'النوع', 'القيمة', 'من', 'حتى', 'تطبيق تلقائي', 'الحالة'];
    const rows = filteredAndSortedOffers.map(o => [
      o.name,
      o.description || '',
      getOfferTypeLabel(o.offer_type),
      getOfferValue(o),
      new Date(o.valid_from).toLocaleDateString('ar-IQ'),
      new Date(o.valid_until).toLocaleDateString('ar-IQ'),
      o.auto_apply ? 'نعم' : 'لا',
      o.active ? 'نشط' : 'معطل'
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `promotional_offers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('تم تصدير العروض');
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
            <div className="p-2 rounded-lg bg-green-500/10">
              <Gift className="h-5 w-5 text-green-500" />
            </div>
            <CardTitle>العروض الترويجية</CardTitle>
            <Badge variant="outline" className="text-sm">
              {filteredAndSortedOffers.length} عرض
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchOffers}>
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 ml-2" />
              تصدير
            </Button>
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة عرض
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
                  placeholder="البحث بالاسم أو الوصف..."
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
                <SelectValue placeholder="نوع العرض" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="discount">خصم</SelectItem>
                <SelectItem value="free_months">أشهر مجانية</SelectItem>
                <SelectItem value="speed_upgrade">زيادة سرعة</SelectItem>
              </SelectContent>
            </Select>
            
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 ml-2" />
                مسح الفلاتر
              </Button>
            )}
          </div>

          {paginatedOffers.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {hasActiveFilters ? 'لا توجد نتائج مطابقة للفلاتر' : 'لا توجد عروض ترويجية حالياً'}
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
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-2">
                          العرض
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/80 transition-colors"
                        onClick={() => handleSort('offer_type')}
                      >
                        <div className="flex items-center gap-2">
                          النوع
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>القيمة</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/80 transition-colors"
                        onClick={() => handleSort('valid_until')}
                      >
                        <div className="flex items-center gap-2">
                          الصلاحية
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>تطبيق تلقائي</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOffers.map((offer) => {
                      const status = getOfferStatus(offer);
                      return (
                        <TableRow key={offer.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell>
                            <div>
                              <div className="font-semibold">{offer.name}</div>
                              {offer.description && (
                                <div className="text-sm text-muted-foreground line-clamp-1">{offer.description}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-md bg-muted">
                                {getOfferIcon(offer.offer_type)}
                              </div>
                              <span className="text-sm">{getOfferTypeLabel(offer.offer_type)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-bold">
                              {getOfferValue(offer)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <span>من:</span>
                                {new Date(offer.valid_from).toLocaleDateString('ar-IQ')}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">حتى:</span>
                                {new Date(offer.valid_until).toLocaleDateString('ar-IQ')}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={offer.auto_apply ? 'default' : 'secondary'}>
                              {offer.auto_apply ? 'نعم' : 'لا'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={status.variant}
                              className="cursor-pointer gap-1"
                              onClick={() => toggleActive(offer.id, offer.active)}
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
                                onClick={() => handleDeleteClick(offer.id, offer.name)}
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
                    عرض {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedOffers.length)} من {filteredAndSortedOffers.length}
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

      <AddPromotionalOfferModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSuccess={fetchOffers}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={deleteOffer}
        title="حذف العرض الترويجي"
        description="هل أنت متأكد من حذف هذا العرض؟ لا يمكن التراجع عن هذا الإجراء."
        itemName={selectedOffer?.name}
      />
    </>
  );
};
