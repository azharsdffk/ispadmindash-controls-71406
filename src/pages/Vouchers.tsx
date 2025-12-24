import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  Plus, 
  Loader2, 
  Printer, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  Receipt,
  LayoutGrid,
  List,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  MoreVertical,
  Eye,
  Download,
  RefreshCw,
  FileText,
  PiggyBank,
  Calculator
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { ReceiptModal } from "@/components/modals/ReceiptModal";
import { VoucherModal } from "@/components/modals/VoucherModal";
import { VoucherDetailsModal } from "@/components/modals/VoucherDetailsModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, Currency } from "@/lib/currency";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

interface Voucher {
  id: string;
  voucher_number: string;
  voucher_type: 'income' | 'expense' | 'receipt';
  amount: number;
  currency: Currency;
  description: string;
  account?: string;
  expense_type?: string;
  created_at: string;
  created_by?: string;
}

const Vouchers = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vouchers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVouchers(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل تحميل السندات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setReceiptOpen(false);
    setVoucherOpen(false);
    loadVouchers();
  };

  const handleVoucherClick = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setDetailsOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  // الإحصائيات
  const stats = useMemo(() => {
    const isIncomeType = (type: string) => type === 'income' || type === 'receipt';
    const incomeVouchers = vouchers.filter(v => isIncomeType(v.voucher_type));
    const expenseVouchers = vouchers.filter(v => v.voucher_type === 'expense');
    const totalIncome = incomeVouchers.reduce((sum, v) => sum + Number(v.amount), 0);
    const totalExpense = expenseVouchers.reduce((sum, v) => sum + Number(v.amount), 0);
    const netBalance = totalIncome - totalExpense;
    
    // حساب إحصائيات اليوم
    const today = new Date().toDateString();
    const todayVouchers = vouchers.filter(v => new Date(v.created_at).toDateString() === today);
    const todayIncome = todayVouchers.filter(v => isIncomeType(v.voucher_type)).reduce((sum, v) => sum + Number(v.amount), 0);
    const todayExpense = todayVouchers.filter(v => v.voucher_type === 'expense').reduce((sum, v) => sum + Number(v.amount), 0);

    // حساب إحصائيات الأسبوع
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekVouchers = vouchers.filter(v => new Date(v.created_at) >= weekAgo);
    
    return {
      totalIncome,
      totalExpense,
      netBalance,
      totalVouchers: vouchers.length,
      incomeCount: incomeVouchers.length,
      expenseCount: expenseVouchers.length,
      todayIncome,
      todayExpense,
      todayCount: todayVouchers.length,
      weekCount: weekVouchers.length,
      incomePercentage: vouchers.length > 0 ? (incomeVouchers.length / vouchers.length) * 100 : 0
    };
  }, [vouchers]);

  // الفلترة والترتيب
  const filteredVouchers = useMemo(() => {
    let result = [...vouchers];

    // فلتر البحث
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(v => 
        v.voucher_number?.toLowerCase().includes(query) ||
        v.description?.toLowerCase().includes(query) ||
        v.account?.toLowerCase().includes(query) ||
        v.expense_type?.toLowerCase().includes(query)
      );
    }

    // فلتر النوع
    if (typeFilter !== "all") {
      result = result.filter(v => v.voucher_type === typeFilter);
    }

    // فلتر التاب
    if (activeTab === "income") {
      result = result.filter(v => v.voucher_type === "income");
    } else if (activeTab === "expense") {
      result = result.filter(v => v.voucher_type === "expense");
    } else if (activeTab === "today") {
      const today = new Date().toDateString();
      result = result.filter(v => new Date(v.created_at).toDateString() === today);
    }

    // الترتيب
    result.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "date-asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "amount-desc":
          return Number(b.amount) - Number(a.amount);
        case "amount-asc":
          return Number(a.amount) - Number(b.amount);
        default:
          return 0;
      }
    });

    return result;
  }, [vouchers, searchQuery, typeFilter, sortBy, activeTab]);

  const isIncomeType = (type: string) => type === 'income' || type === 'receipt';

  const getTypeIcon = (type: string) => {
    return isIncomeType(type) ? (
      <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
    ) : (
      <ArrowUpRight className="h-4 w-4 text-rose-500" />
    );
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    subtitle,
    trend
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    color: string;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <Card className={`relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br ${color}`}>
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/20" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-white/10" />
      </div>
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-white/80">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {subtitle && (
              <p className="text-xs text-white/60 flex items-center gap-1">
                {trend === 'up' && <TrendingUp className="h-3 w-3" />}
                {trend === 'down' && <TrendingDown className="h-3 w-3" />}
                {subtitle}
              </p>
            )}
          </div>
          <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const VoucherGridCard = ({ voucher }: { voucher: Voucher }) => {
    const isIncome = isIncomeType(voucher.voucher_type);
    return (
    <Card 
      className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg overflow-hidden"
      onClick={() => handleVoucherClick(voucher)}
    >
      <div className={`h-2 ${isIncome ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-rose-400 to-rose-600'}`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isIncome ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
              {isIncome ? (
                <ArrowDownLeft className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ArrowUpRight className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              )}
            </div>
            <div>
              <p className="font-bold text-foreground">{voucher.voucher_number}</p>
              <Badge 
                variant={isIncome ? "default" : "destructive"}
                className={`mt-1 ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'}`}
              >
                {isIncome ? "سند قبض" : "سند صرف"}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleVoucherClick(voucher); }}>
                <Eye className="h-4 w-4 ml-2" />
                عرض التفاصيل
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Printer className="h-4 w-4 ml-2" />
                طباعة
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Download className="h-4 w-4 ml-2" />
                تصدير PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          <div className={`text-2xl font-bold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {isIncome ? '+' : '-'} {formatCurrency(Number(voucher.amount), voucher.currency || "IQD")}
          </div>
          
          {voucher.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{voucher.description}</p>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            <Calendar className="h-3 w-3" />
            <span>{new Date(voucher.created_at).toLocaleDateString("ar-IQ", { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>

          {voucher.account && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Wallet className="h-3 w-3" />
              <span>{voucher.account}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      {/* ======= قسم الطباعة الاحترافي ======= */}
      <div className="print-only">
        <div className="print-professional-header">
          <div className="print-logo-section">
            <div className="print-logo">
              <svg viewBox="0 0 100 100" className="print-logo-icon">
                <circle cx="50" cy="50" r="45" fill="#1e40af" />
                <text x="50" y="60" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold">$</text>
              </svg>
            </div>
            <div className="print-company-info">
              <h1 className="print-company-name">نظام إدارة المشتركين</h1>
              <p className="print-company-subtitle">Financial Management System</p>
            </div>
          </div>
          <div className="print-report-info">
            <div className="print-report-title">تقرير السندات المالية</div>
            <div className="print-report-date">
              <span>تاريخ التقرير:</span>
              <strong>{new Date().toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
            </div>
            <div className="print-report-time">
              <span>وقت الطباعة:</span>
              <strong>{new Date().toLocaleTimeString('ar-IQ')}</strong>
            </div>
          </div>
        </div>

        <div className="print-summary-section">
          <div className="print-summary-card print-income">
            <div className="print-summary-icon">↓</div>
            <div className="print-summary-content">
              <span className="print-summary-label">إجمالي القبض</span>
              <span className="print-summary-value">{formatCurrency(stats.totalIncome, "IQD")}</span>
            </div>
          </div>
          <div className="print-summary-card print-expense">
            <div className="print-summary-icon">↑</div>
            <div className="print-summary-content">
              <span className="print-summary-label">إجمالي الصرف</span>
              <span className="print-summary-value">{formatCurrency(stats.totalExpense, "IQD")}</span>
            </div>
          </div>
          <div className="print-summary-card print-balance">
            <div className="print-summary-icon">=</div>
            <div className="print-summary-content">
              <span className="print-summary-label">صافي الرصيد</span>
              <span className="print-summary-value">{formatCurrency(stats.netBalance, "IQD")}</span>
            </div>
          </div>
          <div className="print-summary-card print-count">
            <div className="print-summary-icon">#</div>
            <div className="print-summary-content">
              <span className="print-summary-label">عدد السندات</span>
              <span className="print-summary-value">{vouchers.length}</span>
            </div>
          </div>
        </div>

        <div className="print-table-header">
          <h2>تفاصيل السندات المالية</h2>
          <div className="print-table-line"></div>
        </div>
      </div>
      
      <div className="flex flex-1 w-full">
        <AppSidebar />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* العنوان والأزرار */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 no-print">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg">
                  <Receipt className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">السندات المالية</h1>
                  <p className="text-muted-foreground text-sm">إدارة ومتابعة جميع السندات المالية</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={loadVouchers} variant="outline" size="icon" className="rounded-xl" disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button onClick={handlePrint} variant="outline" className="rounded-xl gap-2">
                  <Printer className="h-4 w-4" />
                  طباعة
                </Button>
                <Button onClick={() => setReceiptOpen(true)} className="rounded-xl gap-2 bg-emerald-500 hover:bg-emerald-600 text-white">
                  <Plus className="h-4 w-4" />
                  سند قبض
                </Button>
                <Button onClick={() => setVoucherOpen(true)} className="rounded-xl gap-2 bg-rose-500 hover:bg-rose-600 text-white">
                  <Plus className="h-4 w-4" />
                  سند صرف
                </Button>
              </div>
            </div>

            {/* بطاقات الإحصائيات */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
              <StatCard
                title="إجمالي القبض"
                value={formatCurrency(stats.totalIncome, "IQD")}
                icon={TrendingUp}
                color="from-emerald-500 to-emerald-600"
                subtitle={`${stats.incomeCount} سند قبض`}
                trend="up"
              />
              <StatCard
                title="إجمالي الصرف"
                value={formatCurrency(stats.totalExpense, "IQD")}
                icon={TrendingDown}
                color="from-rose-500 to-rose-600"
                subtitle={`${stats.expenseCount} سند صرف`}
                trend="down"
              />
              <StatCard
                title="صافي الرصيد"
                value={formatCurrency(stats.netBalance, "IQD")}
                icon={Wallet}
                color={stats.netBalance >= 0 ? "from-blue-500 to-blue-600" : "from-amber-500 to-amber-600"}
                subtitle={stats.netBalance >= 0 ? "رصيد إيجابي" : "رصيد سالب"}
                trend={stats.netBalance >= 0 ? "up" : "down"}
              />
              <StatCard
                title="سندات اليوم"
                value={stats.todayCount}
                icon={Calendar}
                color="from-violet-500 to-violet-600"
                subtitle={`قبض: ${formatCurrency(stats.todayIncome, "IQD")}`}
              />
            </div>

            {/* شريط التقدم */}
            <Card className="border-0 shadow-lg no-print">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">نسبة القبض إلى الصرف</span>
                  <span className="text-sm text-muted-foreground">{stats.incomePercentage.toFixed(1)}% قبض</span>
                </div>
                <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-muted">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                    style={{ width: `${stats.incomePercentage}%` }}
                  />
                  <div 
                    className="bg-gradient-to-r from-rose-400 to-rose-500 transition-all duration-500"
                    style={{ width: `${100 - stats.incomePercentage}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    سندات القبض ({stats.incomeCount})
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    سندات الصرف ({stats.expenseCount})
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* التابات والفلاتر */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="no-print">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
                <TabsList className="bg-muted/50 p-1 rounded-xl">
                  <TabsTrigger value="all" className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow">
                    <FileText className="h-4 w-4" />
                    الكل ({vouchers.length})
                  </TabsTrigger>
                  <TabsTrigger value="income" className="rounded-lg gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                    <ArrowDownLeft className="h-4 w-4" />
                    القبض ({stats.incomeCount})
                  </TabsTrigger>
                  <TabsTrigger value="expense" className="rounded-lg gap-2 data-[state=active]:bg-rose-500 data-[state=active]:text-white">
                    <ArrowUpRight className="h-4 w-4" />
                    الصرف ({stats.expenseCount})
                  </TabsTrigger>
                  <TabsTrigger value="today" className="rounded-lg gap-2 data-[state=active]:bg-violet-500 data-[state=active]:text-white">
                    <Calendar className="h-4 w-4" />
                    اليوم ({stats.todayCount})
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "table" ? "default" : "outline"}
                    size="icon"
                    className="rounded-xl"
                    onClick={() => setViewMode("table")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="icon"
                    className="rounded-xl"
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* شريط البحث والفلاتر */}
              <Card className="border-0 shadow-lg mb-6">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="ابحث برقم السند، الوصف، الحساب..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10 rounded-xl border-muted"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[140px] rounded-xl">
                          <Filter className="h-4 w-4 ml-2" />
                          <SelectValue placeholder="النوع" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">جميع الأنواع</SelectItem>
                          <SelectItem value="income">سندات القبض</SelectItem>
                          <SelectItem value="expense">سندات الصرف</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[160px] rounded-xl">
                          <SelectValue placeholder="ترتيب حسب" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date-desc">الأحدث أولاً</SelectItem>
                          <SelectItem value="date-asc">الأقدم أولاً</SelectItem>
                          <SelectItem value="amount-desc">الأعلى مبلغاً</SelectItem>
                          <SelectItem value="amount-asc">الأقل مبلغاً</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* المحتوى */}
              <TabsContent value={activeTab} className="mt-0">
                {loading ? (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="flex justify-center items-center py-20">
                      <div className="text-center space-y-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                        <p className="text-muted-foreground">جاري تحميل السندات...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : filteredVouchers.length === 0 ? (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="flex flex-col justify-center items-center py-20">
                      <div className="p-6 rounded-full bg-muted/50 mb-4">
                        <Receipt className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">لا توجد سندات</h3>
                      <p className="text-muted-foreground text-center max-w-md">
                        {searchQuery ? "لم يتم العثور على نتائج تطابق بحثك" : "ابدأ بإضافة سند قبض أو صرف جديد"}
                      </p>
                      {!searchQuery && (
                        <div className="flex gap-2 mt-6">
                          <Button onClick={() => setReceiptOpen(true)} className="bg-emerald-500 hover:bg-emerald-600">
                            <Plus className="h-4 w-4 ml-2" />
                            سند قبض
                          </Button>
                          <Button onClick={() => setVoucherOpen(true)} className="bg-rose-500 hover:bg-rose-600">
                            <Plus className="h-4 w-4 ml-2" />
                            سند صرف
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredVouchers.map((voucher) => (
                      <VoucherGridCard key={voucher.id} voucher={voucher} />
                    ))}
                  </div>
                ) : (
                  <Card className="border-0 shadow-lg overflow-hidden print-main-table">
                    <CardContent className="p-0">
                      <Table className="print-table">
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="text-right font-bold">رقم السند</TableHead>
                            <TableHead className="text-right font-bold">النوع</TableHead>
                            <TableHead className="text-right font-bold">المبلغ</TableHead>
                            <TableHead className="text-right font-bold">الحساب</TableHead>
                            <TableHead className="text-right font-bold">الوصف</TableHead>
                            <TableHead className="text-right font-bold">التاريخ</TableHead>
                            <TableHead className="text-right font-bold w-[50px] no-print">الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredVouchers.map((voucher, index) => (
                            <TableRow 
                              key={voucher.id} 
                              className={`cursor-pointer hover:bg-muted/50 transition-colors ${index % 2 === 0 ? 'print-row-even' : 'print-row-odd'}`}
                              onClick={() => handleVoucherClick(voucher)}
                            >
                              <TableCell className="font-bold text-primary">{voucher.voucher_number}</TableCell>
                              <TableCell>
                                <Badge 
                                  className={`gap-1 ${voucher.voucher_type === "income" 
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                                    : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"}`}
                                >
                                  {getTypeIcon(voucher.voucher_type)}
                                  {voucher.voucher_type === "income" ? "قبض" : "صرف"}
                                </Badge>
                              </TableCell>
                              <TableCell className={`font-bold ${voucher.voucher_type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {voucher.voucher_type === 'income' ? '+' : '-'} {formatCurrency(Number(voucher.amount), voucher.currency || "IQD")}
                              </TableCell>
                              <TableCell className="text-muted-foreground">{voucher.account || '-'}</TableCell>
                              <TableCell className="max-w-xs truncate text-muted-foreground">{voucher.description || '-'}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(voucher.created_at).toLocaleDateString("ar-IQ", {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </TableCell>
                              <TableCell className="no-print">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleVoucherClick(voucher); }}>
                                      <Eye className="h-4 w-4 ml-2" />
                                      عرض التفاصيل
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Printer className="h-4 w-4 ml-2" />
                                      طباعة
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                      <Download className="h-4 w-4 ml-2" />
                                      تصدير PDF
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {/* ملخص الإحصائيات السفلي */}
            {filteredVouchers.length > 0 && (
              <Card className="border-0 shadow-lg no-print">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                    <div className="flex items-center gap-6">
                      <span className="text-muted-foreground">
                        عرض <span className="font-bold text-foreground">{filteredVouchers.length}</span> من <span className="font-bold text-foreground">{vouchers.length}</span> سند
                      </span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-muted-foreground">قبض:</span>
                        <span className="font-bold text-emerald-600">
                          {formatCurrency(filteredVouchers.filter(v => v.voucher_type === 'income').reduce((s, v) => s + Number(v.amount), 0), "IQD")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                        <span className="text-muted-foreground">صرف:</span>
                        <span className="font-bold text-rose-600">
                          {formatCurrency(filteredVouchers.filter(v => v.voucher_type === 'expense').reduce((s, v) => s + Number(v.amount), 0), "IQD")}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* تذييل الطباعة */}
      <div className="print-professional-footer print-only">
        <div className="print-footer-line"></div>
        <div className="print-footer-content">
          <div className="print-footer-center">
            <span>صفحة <span className="print-page-number"></span></span>
          </div>
        </div>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ReceiptModal open={receiptOpen} onOpenChange={(open) => !open && handleModalClose()} />
      <VoucherModal open={voucherOpen} onOpenChange={(open) => !open && handleModalClose()} />
      <VoucherDetailsModal open={detailsOpen} onOpenChange={setDetailsOpen} voucher={selectedVoucher} />
    </div>
  );
};

export default Vouchers;
