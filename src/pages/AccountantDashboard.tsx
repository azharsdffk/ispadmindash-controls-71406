import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/currency';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Banknote, 
  AlertCircle,
  Clock,
  Activity,
  Target,
  Layers,
  Calculator,
  Wallet2,
  Users2,
  ShoppingBag,
  Archive,
  ArrowUpRight,
  ArrowDownRight,
  CircleDollarSign,
  LayoutGrid
} from 'lucide-react';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountingEntries } from '@/components/accountant/AccountingEntries';
import { GeneralLedger } from '@/components/accountant/GeneralLedger';
import { FinancialCharts } from '@/components/accountant/FinancialCharts';
import { AdvancedReports } from '@/components/accountant/AdvancedReports';
import { BalanceSheet } from '@/components/accountant/BalanceSheet';
import { IncomeStatement } from '@/components/accountant/IncomeStatement';
import { CashFlowStatement } from '@/components/accountant/CashFlowStatement';
import { usePermissions } from '@/hooks/usePermissions';
import { DraggableIconGrid } from '@/components/accountant/DraggableIconGrid';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { accountantMenuItems } from '@/config/accountantMenu';

export default function AccountantDashboard() {
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const { layout, loading: layoutLoading, updateIconOrder, updateViewMode } = useDashboardLayout();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('menu');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    pendingInvoices: 0,
    paidInvoices: 0,
    todayPayments: 0,
    lowStockItems: 0,
    totalReceivables: 0,
    totalPayables: 0,
    cashFlow: 0,
    inventoryValue: 0,
    profitMargin: 0,
    overdueInvoices: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
    
    // التحقق من التبويب في الـ hash
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setActiveTab(hash);
    }
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('amount, net_amount, status, currency');

      const totalRevenue = invoices?.reduce((sum, inv) => 
        inv.status === 'paid' ? sum + (inv.net_amount || 0) : sum, 0) || 0;
      const pendingInvoices = invoices?.filter(inv => inv.status === 'pending').length || 0;
      const paidInvoices = invoices?.filter(inv => inv.status === 'paid').length || 0;

      const { data: vouchers } = await supabase
        .from('vouchers')
        .select('amount, currency');

      const totalExpenses = vouchers?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;

      const todayDate = new Date().toISOString().split('T')[0];
      const { data: todayPaymentsData } = await supabase
        .from('payments')
        .select('amount')
        .eq('payment_date', todayDate);

      const todayPayments = todayPaymentsData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      const { data: inventory } = await supabase
        .from('inventory')
        .select('*');

      const lowStockItems = inventory?.filter(item => 
        item.quantity < (item.min_stock_level || 10)
      ).length || 0;

      const { data: recentInvoicesData } = await supabase
        .from('invoices')
        .select('*, subscribers(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: recentPaymentsData } = await supabase
        .from('payments')
        .select('*, subscribers(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      const inventoryValue = inventory?.reduce((sum, item) => 
        sum + ((item.quantity || 0) * (item.unit_price || 0)), 0) || 0;

      const totalReceivables = invoices?.reduce((sum, inv) => 
        inv.status === 'pending' || inv.status === 'overdue' ? sum + (inv.net_amount || 0) : sum, 0) || 0;

      const overdueInvoices = invoices?.filter(inv => 
        (inv.status === 'pending' || inv.status === 'overdue')
      ).length || 0;

      const { data: allPayments } = await supabase
        .from('payments')
        .select('amount');
      
      const totalPayments = allPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const cashFlow = totalPayments - totalExpenses;

      const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

      setStats({
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        pendingInvoices,
        paidInvoices,
        todayPayments,
        lowStockItems,
        totalReceivables,
        totalPayables: totalExpenses,
        cashFlow,
        inventoryValue,
        profitMargin,
        overdueInvoices,
      });

      setRecentInvoices(recentInvoicesData || []);
      setRecentPayments(recentPaymentsData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      paid: "default",
      pending: "secondary",
      overdue: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  // تصفية القائمة حسب الصلاحيات
  const filteredMenuItems = accountantMenuItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  // ترتيب القائمة حسب التخصيص أو الترتيب الافتراضي
  const sortedMenuItems = layout.iconOrder.length > 0
    ? layout.iconOrder
        .map(id => filteredMenuItems.find(item => item.id === id))
        .filter(Boolean)
        .concat(filteredMenuItems.filter(item => !layout.iconOrder.includes(item.id)))
    : filteredMenuItems;

  if (loading || permissionsLoading || layoutLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const availableTabs = [
    { value: 'menu', label: 'القائمة الرئيسية', show: true, icon: LayoutGrid },
    { value: 'overview', label: 'نظرة عامة', show: true, icon: Activity },
    { value: 'financial', label: 'التحليل المالي', show: hasPermission('view_reports'), icon: TrendingUp },
    { value: 'entries', label: 'القيود المحاسبية', show: hasPermission('add_transaction'), icon: FileText },
    { value: 'ledger', label: 'دفتر الأستاذ', show: hasPermission('view_balance'), icon: Layers },
    { value: 'balance', label: 'الميزانية العمومية', show: hasPermission('view_balance'), icon: Target },
    { value: 'income', label: 'قائمة الدخل', show: hasPermission('view_reports'), icon: Coins },
    { value: 'cashflow', label: 'التدفقات النقدية', show: hasPermission('view_reports'), icon: Wallet2 },
    { value: 'reports', label: 'التقارير المتقدمة', show: hasPermission('export_reports'), icon: Archive },
  ].filter(tab => tab.show);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex bg-background w-full" dir="rtl">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
        
          <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
            {/* Professional Header */}
            <div className="glass-card p-8 rounded-3xl animate-fade-in">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="absolute -inset-1 gradient-bg rounded-2xl blur opacity-30 animate-pulse-glow"></div>
                    <div className="relative p-4 rounded-2xl gradient-bg">
                      <Calculator className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold mb-2">
                      <span className="gradient-text">مركز التحكم المالي</span>
                    </h1>
                    <p className="text-muted-foreground flex items-center gap-2 text-base">
                      <Activity className="h-5 w-5 text-primary" />
                      إدارة ومراقبة شاملة للعمليات المحاسبية
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline" className="px-5 py-2.5 glass text-base">
                    <Clock className="h-5 w-5 ml-2 text-primary" />
                    {new Date().toLocaleString('ar-IQ', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      day: 'numeric',
                      month: 'short'
                    })}
                  </Badge>
                  <Badge className="px-5 py-2.5 gradient-bg text-base">
                    <Users2 className="h-5 w-5 ml-2" />
                    محاسب نظام
                  </Badge>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="w-full glass p-1 h-auto flex-wrap gap-1">
                {availableTabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger 
                      key={tab.value} 
                      value={tab.value} 
                      className="flex-1 min-w-[140px] data-[state=active]:gradient-bg data-[state=active]:text-white flex items-center gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* Menu Tab with Draggable Icons */}
              <TabsContent value="menu" className="space-y-6 mt-8">
                <Card className="glass-card">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl gradient-bg">
                        <LayoutGrid className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">القائمة الرئيسية</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          يمكنك ترتيب الأيقونات بالسحب والإفلات حسب تفضيلاتك
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <DraggableIconGrid
                      items={sortedMenuItems as any}
                      onReorder={updateIconOrder}
                      viewMode={layout.viewMode}
                      onViewModeChange={updateViewMode}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="overview" className="space-y-8 mt-8">
                {/* Enhanced Financial Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
                  {/* Revenue Card */}
                  <Card className="glass-card hover-scale border-0 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
                    <CardContent className="pt-7 pb-6 relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                            <p className="text-sm font-semibold text-muted-foreground">إجمالي الإيرادات</p>
                          </div>
                          <h3 className="text-3xl font-bold mb-2 bg-gradient-to-l from-primary to-secondary bg-clip-text text-transparent">
                            {formatCurrency(stats.totalRevenue, 'IQD')}
                          </h3>
                          <div className="flex items-center gap-1.5 text-sm">
                            <ArrowUpRight className="h-4 w-4 text-secondary" />
                            <span className="text-secondary font-medium">+12.5%</span>
                            <span className="text-muted-foreground text-xs">هذا الشهر</span>
                          </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg">
                          <Coins className="h-7 w-7 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Expenses Card */}
                  <Card className="glass-card hover-scale border-0 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
                    <CardContent className="pt-7 pb-6 relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-2 w-2 rounded-full bg-destructive animate-pulse"></div>
                            <p className="text-sm font-semibold text-muted-foreground">إجمالي المصروفات</p>
                          </div>
                          <h3 className="text-3xl font-bold mb-2 text-destructive">
                            {formatCurrency(stats.totalExpenses, 'IQD')}
                          </h3>
                          <div className="flex items-center gap-1.5 text-sm">
                            <ArrowDownRight className="h-4 w-4 text-secondary" />
                            <span className="text-secondary font-medium">-8.3%</span>
                            <span className="text-muted-foreground text-xs">هذا الشهر</span>
                          </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-destructive shadow-lg">
                          <ShoppingBag className="h-7 w-7 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Net Profit Card */}
                  <Card className="glass-card hover-scale border-0 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
                    <CardContent className="pt-7 pb-6 relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-2 w-2 rounded-full bg-accent animate-pulse"></div>
                            <p className="text-sm font-semibold text-muted-foreground">صافي الربح</p>
                          </div>
                          <h3 className={`text-3xl font-bold mb-2 ${stats.netProfit >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                            {formatCurrency(stats.netProfit, 'IQD')}
                          </h3>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Target className="h-4 w-4 text-accent" />
                            <span className="text-accent font-medium">{stats.profitMargin.toFixed(1)}%</span>
                            <span className="text-muted-foreground text-xs">هامش الربح</span>
                          </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-accent shadow-lg">
                          <CircleDollarSign className="h-7 w-7 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cash Flow Card */}
                  <Card className="glass-card hover-scale border-0 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
                    <CardContent className="pt-7 pb-6 relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-2 w-2 rounded-full bg-secondary animate-pulse"></div>
                            <p className="text-sm font-semibold text-muted-foreground">التدفق النقدي</p>
                          </div>
                          <h3 className={`text-3xl font-bold mb-2 ${stats.cashFlow >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                            {formatCurrency(stats.cashFlow, 'IQD')}
                          </h3>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Activity className="h-4 w-4 text-primary" />
                            <span className="text-primary font-medium">نشط</span>
                            <span className="text-muted-foreground text-xs">التدفقات</span>
                          </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-secondary to-accent shadow-lg">
                          <Wallet2 className="h-7 w-7 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 animate-fade-in">
                  <Card className="glass-card border-0 hover:shadow-xl transition-shadow">
                    <CardContent className="pt-6 pb-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5">
                          <FileText className="h-6 w-6 text-secondary" />
                        </div>
                        <Badge variant="secondary" className="text-xs px-2.5">مدفوع</Badge>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-3xl font-bold">{stats.paidInvoices}</h4>
                        <p className="text-sm text-muted-foreground font-medium">الفواتير المدفوعة</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-0 hover:shadow-xl transition-shadow">
                    <CardContent className="pt-6 pb-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5">
                          <AlertCircle className="h-6 w-6 text-accent" />
                        </div>
                        <Badge variant="outline" className="text-xs px-2.5 border-accent text-accent">معلق</Badge>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-3xl font-bold">{stats.pendingInvoices}</h4>
                        <p className="text-sm text-muted-foreground font-medium">الفواتير المعلقة</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-0 hover:shadow-xl transition-shadow">
                    <CardContent className="pt-6 pb-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                          <Banknote className="h-6 w-6 text-primary" />
                        </div>
                        <Badge variant="default" className="text-xs px-2.5">اليوم</Badge>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-2xl font-bold">{formatCurrency(stats.todayPayments, 'IQD')}</h4>
                        <p className="text-sm text-muted-foreground font-medium">مدفوعات اليوم</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-0 hover:shadow-xl transition-shadow">
                    <CardContent className="pt-6 pb-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/5">
                          <Archive className="h-6 w-6 text-destructive" />
                        </div>
                        <Badge variant="destructive" className="text-xs px-2.5">{stats.lowStockItems} ناقص</Badge>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-2xl font-bold">{formatCurrency(stats.inventoryValue, 'IQD')}</h4>
                        <p className="text-sm text-muted-foreground font-medium">قيمة المخزون</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Transactions Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
                  <Card className="glass-card border-0">
                    <CardHeader className="pb-4 border-b border-border/50">
                      <CardTitle className="text-xl flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 gradient-bg rounded-xl blur opacity-50"></div>
                          <div className="relative p-2.5 rounded-xl gradient-bg">
                            <FileText className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <span className="gradient-text">آخر الفواتير الصادرة</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>رقم الفاتورة</TableHead>
                            <TableHead>المشترك</TableHead>
                            <TableHead>المبلغ</TableHead>
                            <TableHead>الحالة</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentInvoices.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>لا توجد فواتير حالياً</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            recentInvoices.map((invoice) => (
                              <TableRow key={invoice.id} className="hover:bg-muted/50 transition-colors">
                                <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                                <TableCell>{invoice.subscribers?.name || 'غير محدد'}</TableCell>
                                <TableCell className="font-semibold">
                                  {formatCurrency(invoice.net_amount || invoice.amount, invoice.currency || 'IQD')}
                                </TableCell>
                                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-0">
                    <CardHeader className="pb-4 border-b border-border/50">
                      <CardTitle className="text-xl flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 gradient-bg rounded-xl blur opacity-50"></div>
                          <div className="relative p-2.5 rounded-xl gradient-bg">
                            <Banknote className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <span className="gradient-text">آخر المدفوعات الواردة</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>المشترك</TableHead>
                            <TableHead>المبلغ</TableHead>
                            <TableHead>الطريقة</TableHead>
                            <TableHead>التاريخ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentPayments.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                <Banknote className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>لا توجد مدفوعات حالياً</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            recentPayments.map((payment) => (
                              <TableRow key={payment.id} className="hover:bg-muted/50 transition-colors">
                                <TableCell className="font-medium">{payment.subscribers?.name || 'غير محدد'}</TableCell>
                                <TableCell className="font-semibold" style={{ color: 'hsl(var(--secondary))' }}>
                                  {formatCurrency(payment.amount, payment.currency || 'IQD')}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="glass">
                                    {payment.payment_method}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(payment.payment_date).toLocaleDateString('ar-IQ')}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {hasPermission('view_reports') && (
                <TabsContent value="financial" className="space-y-4">
                  <FinancialCharts />
                </TabsContent>
              )}

              {hasPermission('add_transaction') && (
                <TabsContent value="entries" className="space-y-4">
                  <AccountingEntries />
                </TabsContent>
              )}

              {hasPermission('view_balance') && (
                <TabsContent value="ledger" className="space-y-4">
                  <GeneralLedger />
                </TabsContent>
              )}

              {hasPermission('view_balance') && (
                <TabsContent value="balance" className="space-y-4">
                  <BalanceSheet />
                </TabsContent>
              )}

              {hasPermission('view_reports') && (
                <TabsContent value="income" className="space-y-4">
                  <IncomeStatement />
                </TabsContent>
              )}

              {hasPermission('view_reports') && (
                <TabsContent value="cashflow" className="space-y-4">
                  <CashFlowStatement />
                </TabsContent>
              )}

              {hasPermission('export_reports') && (
                <TabsContent value="reports" className="space-y-4">
                  <AdvancedReports />
                </TabsContent>
            )}
          </Tabs>
        </div>
        </main>
        </div>
        
        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    </SidebarProvider>
  );
}
