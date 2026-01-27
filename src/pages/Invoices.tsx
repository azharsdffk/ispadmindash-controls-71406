import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, FilePlus, Eye, CreditCard, Smartphone, Search, Filter, 
  RefreshCw, Download, ChevronLeft, ChevronRight, ArrowUpDown,
  CalendarIcon, X, MoreVertical, CheckCircle, Clock, AlertTriangle, XCircle,
  DollarSign, TrendingUp, Receipt
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { IssueInvoiceModal } from "@/components/modals/IssueInvoiceModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { RecordPaymentModal } from "@/components/modals/RecordPaymentModal";
import { SubscriberDetailsModal } from "@/components/modals/SubscriberDetailsModal";
import { InvoiceDetailsModal } from "@/components/modals/InvoiceDetailsModal";
import { ZainCashPayment } from "@/components/payments/ZainCashPayment";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency, Currency } from "@/lib/currency";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Invoice = {
  id: string;
  invoice_number: string;
  subscriber_id: string;
  amount: number;
  discount?: number;
  net_amount?: number;
  currency: Currency;
  status: string;
  issue_date: string;
  due_date: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  subscribers?: {
    id: string;
    name: string;
    phone: string;
    phone_secondary?: string;
    username?: string;
    email?: string;
    address?: string;
    plan?: string;
    balance: number;
    status_comment?: string;
    address_notes?: string;
    latitude?: number;
    longitude?: number;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
  };
  creator?: {
    full_name: string;
    phone?: string;
  };
};

type SortField = 'invoice_number' | 'amount' | 'issue_date' | 'due_date' | 'status';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 15;

const Invoices = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [issueInvoiceOpen, setIssueInvoiceOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [zainCashPaymentOpen, setZainCashPaymentOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [invoiceDetailsOpen, setInvoiceDetailsOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedInvoiceForDetails, setSelectedInvoiceForDetails] = useState<Invoice | null>(null);
  const [selectedSubscriber, setSelectedSubscriber] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  
  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('issue_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          subscribers (
            id,
            name,
            phone,
            phone_secondary,
            username,
            email,
            address,
            plan,
            balance,
            status_comment,
            address_notes,
            latitude,
            longitude,
            created_at,
            updated_at,
            created_by
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const creatorIds = [...new Set(data?.map(inv => inv.created_by).filter(Boolean))];
      let creatorsMap: Record<string, { full_name: string; phone?: string }> = {};
      
      if (creatorIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', creatorIds);
        
        if (profilesData) {
          creatorsMap = profilesData.reduce((acc, profile) => {
            acc[profile.id] = { full_name: profile.full_name, phone: profile.phone || undefined };
            return acc;
          }, {} as Record<string, { full_name: string; phone?: string }>);
        }
      }
      
      const invoicesWithCreators = data?.map(inv => ({
        ...inv,
        creator: inv.created_by ? creatorsMap[inv.created_by] : undefined
      })) || [];
      
      setInvoices(invoicesWithCreators);
    } catch (error: any) {
      toast.error("فشل تحميل الفواتير: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Statistics
  const stats = useMemo(() => {
    const total = invoices.length;
    const paid = invoices.filter(i => i.status === 'paid');
    const pending = invoices.filter(i => i.status === 'pending');
    const overdue = invoices.filter(i => i.status === 'overdue');
    const cancelled = invoices.filter(i => i.status === 'cancelled');
    
    const totalAmount = invoices.reduce((sum, i) => sum + (i.net_amount || i.amount || 0), 0);
    const paidAmount = paid.reduce((sum, i) => sum + (i.net_amount || i.amount || 0), 0);
    const pendingAmount = pending.reduce((sum, i) => sum + (i.net_amount || i.amount || 0), 0);
    const overdueAmount = overdue.reduce((sum, i) => sum + (i.net_amount || i.amount || 0), 0);
    
    return {
      total,
      paid: paid.length,
      pending: pending.length,
      overdue: overdue.length,
      cancelled: cancelled.length,
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount
    };
  }, [invoices]);

  // Filtered & Sorted Invoices
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(inv => 
        inv.invoice_number.toLowerCase().includes(query) ||
        inv.subscribers?.name?.toLowerCase().includes(query) ||
        inv.subscribers?.phone?.includes(query)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(inv => inv.status === statusFilter);
    }
    
    // Date range filter
    if (dateFrom) {
      result = result.filter(inv => new Date(inv.issue_date) >= dateFrom);
    }
    if (dateTo) {
      result = result.filter(inv => new Date(inv.issue_date) <= dateTo);
    }
    
    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'invoice_number':
          comparison = a.invoice_number.localeCompare(b.invoice_number);
          break;
        case 'amount':
          comparison = (a.net_amount || a.amount) - (b.net_amount || b.amount);
          break;
        case 'issue_date':
          comparison = new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime();
          break;
        case 'due_date':
          comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [invoices, searchQuery, statusFilter, dateFrom, dateTo, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInvoices.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInvoices, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFrom, dateTo]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || dateFrom || dateTo;

  const exportToCSV = () => {
    const headers = ['رقم الفاتورة', 'المشترك', 'الهاتف', 'المبلغ', 'الخصم', 'الصافي', 'تاريخ الإصدار', 'تاريخ الاستحقاق', 'الحالة'];
    const rows = filteredInvoices.map(inv => [
      inv.invoice_number,
      inv.subscribers?.name || '',
      inv.subscribers?.phone || '',
      inv.amount,
      inv.discount || 0,
      inv.net_amount || inv.amount,
      inv.issue_date,
      inv.due_date,
      inv.status
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoices_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير الفواتير بنجاح');
  };

  const openInvoiceDetails = (invoice: Invoice) => {
    setSelectedInvoiceForDetails(invoice);
    setInvoiceDetailsOpen(true);
  };

  const openSubscriberDetails = (subscriber: any) => {
    setSelectedSubscriber(subscriber);
    setDetailsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      paid: { label: 'مدفوعة', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
      pending: { label: 'معلقة', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      overdue: { label: 'متأخرة', variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" /> },
      cancelled: { label: 'ملغاة', variant: 'outline', icon: <XCircle className="h-3 w-3" /> },
    };
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const, icon: null };
    return (
      <Badge variant={statusInfo.variant} className="gap-1">
        {statusInfo.icon}
        {statusInfo.label}
      </Badge>
    );
  };

  const StatCard = ({ title, value, subValue, icon, color }: { 
    title: string; 
    value: string | number; 
    subValue?: string;
    icon: React.ReactNode; 
    color: string;
  }) => (
    <Card className="relative overflow-hidden">
      <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 opacity-20", color)} />
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
          </div>
          <div className={cn("p-3 rounded-xl", color)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
        <div className="flex flex-1 w-full">
          <AppSidebar />
          <main className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* Header Skeleton */}
            <div className="bg-gradient-to-l from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-muted w-14 h-14" />
                  <div className="space-y-2">
                    <div className="h-8 w-40 bg-muted rounded" />
                    <div className="h-4 w-48 bg-muted/50 rounded" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-9 w-20 bg-muted rounded" />
                  <div className="h-9 w-20 bg-muted rounded" />
                  <div className="h-9 w-28 bg-muted rounded" />
                </div>
              </div>
            </div>
            {/* Stats Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-4 rounded-xl bg-card border animate-pulse relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 bg-muted/20" />
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="h-3 w-20 bg-muted/50 rounded" />
                      <div className="h-6 w-14 bg-muted rounded mt-1" />
                      <div className="h-3 w-24 bg-muted/30 rounded mt-1" />
                    </div>
                    <div className="p-3 rounded-xl bg-muted w-11 h-11" />
                  </div>
                </div>
              ))}
            </div>
            {/* Filters Skeleton */}
            <div className="p-4 rounded-xl bg-card border animate-pulse">
              <div className="flex gap-4">
                <div className="flex-1 h-10 bg-muted rounded" />
                <div className="w-40 h-10 bg-muted rounded" />
                <div className="w-36 h-10 bg-muted rounded" />
                <div className="w-36 h-10 bg-muted rounded" />
              </div>
            </div>
            {/* Table Skeleton */}
            <div className="rounded-xl bg-card border animate-pulse overflow-hidden">
              <div className="bg-muted/30 p-4">
                <div className="flex gap-6">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="h-4 w-20 bg-muted rounded" />
                  ))}
                </div>
              </div>
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="flex items-center gap-6 py-3 border-b border-muted/20">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="space-y-1">
                      <div className="h-4 w-28 bg-muted rounded" />
                      <div className="h-3 w-20 bg-muted/50 rounded" />
                    </div>
                    <div className="h-5 w-20 bg-muted rounded" />
                    <div className="h-4 w-20 bg-muted rounded" />
                    <div className="h-4 w-20 bg-muted rounded" />
                    <div className="h-6 w-16 bg-muted rounded-full" />
                    <div className="h-8 w-8 bg-muted rounded ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1 w-full">
        <AppSidebar />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-l from-primary/10 via-primary/5 to-transparent rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">إدارة الفواتير</h1>
                    <p className="text-muted-foreground">تتبع وإدارة جميع الفواتير</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={fetchInvoices} disabled={loading}>
                    <RefreshCw className={cn("h-4 w-4 ml-2", loading && "animate-spin")} />
                    تحديث
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToCSV} disabled={filteredInvoices.length === 0}>
                    <Download className="h-4 w-4 ml-2" />
                    تصدير
                  </Button>
                  <Button onClick={() => setIssueInvoiceOpen(true)}>
                    <FilePlus className="h-4 w-4 ml-2" />
                    فاتورة جديدة
                  </Button>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <StatCard
                title="إجمالي الفواتير"
                value={stats.total}
                subValue={formatCurrency(stats.totalAmount, 'IQD')}
                icon={<Receipt className="h-5 w-5 text-white" />}
                color="bg-blue-500"
              />
              <StatCard
                title="مدفوعة"
                value={stats.paid}
                subValue={formatCurrency(stats.paidAmount, 'IQD')}
                icon={<CheckCircle className="h-5 w-5 text-white" />}
                color="bg-green-500"
              />
              <StatCard
                title="معلقة"
                value={stats.pending}
                subValue={formatCurrency(stats.pendingAmount, 'IQD')}
                icon={<Clock className="h-5 w-5 text-white" />}
                color="bg-yellow-500"
              />
              <StatCard
                title="متأخرة"
                value={stats.overdue}
                subValue={formatCurrency(stats.overdueAmount, 'IQD')}
                icon={<AlertTriangle className="h-5 w-5 text-white" />}
                color="bg-red-500"
              />
              <StatCard
                title="ملغاة"
                value={stats.cancelled}
                icon={<XCircle className="h-5 w-5 text-white" />}
                color="bg-gray-500"
              />
              <StatCard
                title="نسبة التحصيل"
                value={stats.totalAmount > 0 ? `${Math.round((stats.paidAmount / stats.totalAmount) * 100)}%` : '0%'}
                icon={<TrendingUp className="h-5 w-5 text-white" />}
                color="bg-purple-500"
              />
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث برقم الفاتورة، اسم المشترك، أو رقم الهاتف..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  
                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="paid">مدفوعة</SelectItem>
                      <SelectItem value="pending">معلقة</SelectItem>
                      <SelectItem value="overdue">متأخرة</SelectItem>
                      <SelectItem value="cancelled">ملغاة</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Date From */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full md:w-40 justify-start">
                        <CalendarIcon className="h-4 w-4 ml-2" />
                        {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : 'من تاريخ'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        locale={ar}
                      />
                    </PopoverContent>
                  </Popover>
                  
                  {/* Date To */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full md:w-40 justify-start">
                        <CalendarIcon className="h-4 w-4 ml-2" />
                        {dateTo ? format(dateTo, 'dd/MM/yyyy') : 'إلى تاريخ'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        locale={ar}
                      />
                    </PopoverContent>
                  </Popover>
                  
                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <Button variant="ghost" size="icon" onClick={clearFilters}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {/* Active Filters Display */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {searchQuery && (
                      <Badge variant="secondary" className="gap-1">
                        بحث: {searchQuery}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                      </Badge>
                    )}
                    {statusFilter !== 'all' && (
                      <Badge variant="secondary" className="gap-1">
                        الحالة: {statusFilter === 'paid' ? 'مدفوعة' : statusFilter === 'pending' ? 'معلقة' : statusFilter === 'overdue' ? 'متأخرة' : 'ملغاة'}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter('all')} />
                      </Badge>
                    )}
                    {dateFrom && (
                      <Badge variant="secondary" className="gap-1">
                        من: {format(dateFrom, 'dd/MM/yyyy')}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setDateFrom(undefined)} />
                      </Badge>
                    )}
                    {dateTo && (
                      <Badge variant="secondary" className="gap-1">
                        إلى: {format(dateTo, 'dd/MM/yyyy')}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setDateTo(undefined)} />
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6 space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex gap-4">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-28" />
                      </div>
                    ))}
                  </div>
                ) : paginatedInvoices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {hasActiveFilters ? 'لا توجد فواتير تطابق معايير البحث' : 'لا توجد فواتير حالياً'}
                    </p>
                    {hasActiveFilters && (
                      <Button variant="link" onClick={clearFilters} className="mt-2">
                        مسح الفلاتر
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead 
                              className="cursor-pointer hover:bg-muted transition-colors"
                              onClick={() => handleSort('invoice_number')}
                            >
                              <div className="flex items-center gap-1">
                                رقم الفاتورة
                                <ArrowUpDown className="h-3 w-3" />
                              </div>
                            </TableHead>
                            <TableHead>المشترك</TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted transition-colors"
                              onClick={() => handleSort('amount')}
                            >
                              <div className="flex items-center gap-1">
                                المبلغ
                                <ArrowUpDown className="h-3 w-3" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted transition-colors"
                              onClick={() => handleSort('issue_date')}
                            >
                              <div className="flex items-center gap-1">
                                تاريخ الإصدار
                                <ArrowUpDown className="h-3 w-3" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted transition-colors"
                              onClick={() => handleSort('due_date')}
                            >
                              <div className="flex items-center gap-1">
                                تاريخ الاستحقاق
                                <ArrowUpDown className="h-3 w-3" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted transition-colors"
                              onClick={() => handleSort('status')}
                            >
                              <div className="flex items-center gap-1">
                                الحالة
                                <ArrowUpDown className="h-3 w-3" />
                              </div>
                            </TableHead>
                            <TableHead className="text-center">الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedInvoices.map((invoice) => (
                            <TableRow key={invoice.id} className="hover:bg-muted/30">
                              <TableCell 
                                className="font-medium cursor-pointer hover:text-primary transition-colors"
                                onClick={() => openInvoiceDetails(invoice)}
                              >
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  {invoice.invoice_number}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div 
                                  className="cursor-pointer hover:text-primary transition-colors"
                                  onClick={() => invoice.subscribers && openSubscriberDetails(invoice.subscribers)}
                                >
                                  <p className="font-medium">{invoice.subscribers?.name}</p>
                                  <p className="text-xs text-muted-foreground">{invoice.subscribers?.phone}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-semibold">{formatCurrency(invoice.net_amount || invoice.amount, invoice.currency || "IQD")}</p>
                                  {invoice.discount && invoice.discount > 0 && (
                                    <p className="text-xs text-muted-foreground line-through">
                                      {formatCurrency(invoice.amount, invoice.currency || "IQD")}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {format(new Date(invoice.issue_date), 'dd/MM/yyyy', { locale: ar })}
                              </TableCell>
                              <TableCell>
                                <span className={cn(
                                  new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' && invoice.status !== 'cancelled' 
                                    ? 'text-destructive font-medium' 
                                    : ''
                                )}>
                                  {format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: ar })}
                                </span>
                              </TableCell>
                              <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => openInvoiceDetails(invoice)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => {
                                          setSelectedInvoice(invoice);
                                          setRecordPaymentOpen(true);
                                        }}>
                                          <CreditCard className="h-4 w-4 ml-2" />
                                          تسجيل دفعة
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => {
                                          setSelectedInvoice(invoice);
                                          setZainCashPaymentOpen(true);
                                        }}>
                                          <Smartphone className="h-4 w-4 ml-2" />
                                          دفع ZainCash
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between p-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          عرض {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredInvoices.length)} من {filteredInvoices.length}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
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
                                  onClick={() => setCurrentPage(pageNum)}
                                  className="w-8 h-8 p-0"
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
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
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <IssueInvoiceModal 
        open={issueInvoiceOpen} 
        onOpenChange={setIssueInvoiceOpen}
        onSuccess={fetchInvoices}
      />
      <RecordPaymentModal
        open={recordPaymentOpen}
        onOpenChange={setRecordPaymentOpen}
        subscriberId={selectedInvoice?.subscriber_id || ''}
        invoiceId={selectedInvoice?.id}
        invoiceAmount={selectedInvoice?.amount}
        onSuccess={fetchInvoices}
      />
      <ZainCashPayment
        open={zainCashPaymentOpen}
        onOpenChange={setZainCashPaymentOpen}
        subscriberId={selectedInvoice?.subscriber_id || ''}
        invoiceId={selectedInvoice?.id}
        amount={selectedInvoice?.amount || 0}
        onSuccess={fetchInvoices}
      />
      <SubscriberDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        subscriber={selectedSubscriber}
      />
      <InvoiceDetailsModal
        open={invoiceDetailsOpen}
        onOpenChange={setInvoiceDetailsOpen}
        invoice={selectedInvoiceForDetails}
      />
    </div>
  );
};

export default Invoices;
