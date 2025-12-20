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
  Wallet,
  Users,
  Package,
  Archive,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  LayoutGrid
} from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountingEntries } from '@/components/accountant/AccountingEntries';
import { GeneralLedger } from '@/components/accountant/GeneralLedger';
import { FinancialCharts } from '@/components/accountant/FinancialCharts';
import { AdvancedReports } from '@/components/accountant/AdvancedReports';
import { BalanceSheet } from '@/components/accountant/BalanceSheet';
import { IncomeStatement } from '@/components/accountant/IncomeStatement';
import { CashFlowStatement } from '@/components/accountant/CashFlowStatement';
import { usePermissions } from '@/hooks/usePermissions';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { RevenueExpenseCharts } from '@/components/accountant/RevenueExpenseCharts';
import { AccountantMenuGrid } from '@/components/accountant/AccountantMenuGrid';

export default function AccountantDashboard() {
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const { layout, loading: layoutLoading, updateIconOrder, updateViewMode } = useDashboardLayout();
  
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
    { value: 'cashflow', label: 'التدفقات النقدية', show: hasPermission('view_reports'), icon: Wallet },
    { value: 'reports', label: 'التقارير المتقدمة', show: hasPermission('export_reports'), icon: Archive },
  ].filter(tab => tab.show);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full" dir="rtl">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader />
        
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="container mx-auto p-4 md:p-6 space-y-6">
              {/* Professional Header */}
              <div className="glass-card p-4 md:p-6 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl gradient-bg">
                      <Calculator className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold gradient-text">لوحة المحاسب</h1>
                      <p className="text-sm text-muted-foreground">إدارة ومراقبة العمليات المحاسبية</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="px-3 py-1">
                      <Clock className="h-4 w-4 ml-2" />
                      {new Date().toLocaleString('ar-IQ', { 
                        hour: '2-digit', 
                        minute: '2-digit'
                      })}
                    </Badge>
                  </div>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                {/* Improved TabsList with horizontal scroll on mobile */}
                <div className="overflow-x-auto pb-2">
                  <TabsList className="inline-flex h-auto p-1.5 gap-1 bg-muted/50 backdrop-blur-sm rounded-xl min-w-full">
                    {availableTabs.map(tab => {
                      const Icon = tab.icon;
                      return (
                        <TabsTrigger 
                          key={tab.value} 
                          value={tab.value} 
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
                        >
                          <Icon className="h-4 w-4" />
                          <span className="hidden sm:inline">{tab.label}</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </div>

                {/* Menu Tab */}
                <TabsContent value="menu" className="space-y-4 mt-0">
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl gradient-bg">
                          <LayoutGrid className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">القائمة الرئيسية</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">الوصول السريع للوظائف المحاسبية</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <AccountantMenuGrid />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="overview" className="space-y-6 mt-0">
                  {/* Main Financial KPIs */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {/* Revenue Card */}
                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div className="p-2.5 rounded-xl gradient-bg">
                              <Coins className="h-5 w-5 text-white" />
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-secondary" />
                          </div>
                          <div>
                            <p className="text-xs md:text-sm text-muted-foreground">إجمالي الإيرادات</p>
                            <h3 className="text-lg md:text-2xl font-bold gradient-text mt-1">
                              {formatCurrency(stats.totalRevenue, 'IQD')}
                            </h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Expenses Card */}
                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div className="p-2.5 rounded-xl bg-destructive">
                              <TrendingDown className="h-5 w-5 text-white" />
                            </div>
                            <ArrowDownRight className="h-4 w-4 text-destructive" />
                          </div>
                          <div>
                            <p className="text-xs md:text-sm text-muted-foreground">إجمالي المصروفات</p>
                            <h3 className="text-lg md:text-2xl font-bold text-destructive mt-1">
                              {formatCurrency(stats.totalExpenses, 'IQD')}
                            </h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Net Profit Card */}
                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div className={`p-2.5 rounded-xl ${stats.netProfit >= 0 ? 'bg-secondary' : 'bg-destructive'}`}>
                              <DollarSign className="h-5 w-5 text-white" />
                            </div>
                            {stats.netProfit >= 0 ? (
                              <ArrowUpRight className="h-4 w-4 text-secondary" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs md:text-sm text-muted-foreground">صافي الربح</p>
                            <h3 className={`text-lg md:text-2xl font-bold mt-1 ${stats.netProfit >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                              {formatCurrency(stats.netProfit, 'IQD')}
                            </h3>
                            <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
                              هامش الربح: {stats.profitMargin.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Cash Flow Card */}
                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div className={`p-2.5 rounded-xl ${stats.cashFlow >= 0 ? 'bg-primary' : 'bg-destructive'}`}>
                              <Wallet className="h-5 w-5 text-white" />
                            </div>
                            {stats.cashFlow >= 0 ? (
                              <ArrowUpRight className="h-4 w-4 text-primary" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs md:text-sm text-muted-foreground">التدفق النقدي</p>
                            <h3 className={`text-lg md:text-2xl font-bold mt-1 ${stats.cashFlow >= 0 ? 'text-primary' : 'text-destructive'}`}>
                              {formatCurrency(stats.cashFlow, 'IQD')}
                            </h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts Section */}
                  <RevenueExpenseCharts stats={stats} />

                  {/* Quick Stats Row */}
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        إحصائيات سريعة
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/5 border border-secondary/10">
                          <div className="p-2 rounded-lg bg-secondary/10">
                            <FileText className="h-4 w-4 text-secondary" />
                          </div>
                          <div>
                            <p className="text-xl md:text-2xl font-bold">{stats.paidInvoices}</p>
                            <p className="text-[10px] md:text-xs text-muted-foreground">فواتير مدفوعة</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                          <div className="p-2 rounded-lg bg-orange-500/10">
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                          </div>
                          <div>
                            <p className="text-xl md:text-2xl font-bold">{stats.pendingInvoices}</p>
                            <p className="text-[10px] md:text-xs text-muted-foreground">فواتير معلقة</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Banknote className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-lg md:text-xl font-bold">{formatCurrency(stats.todayPayments, 'IQD')}</p>
                            <p className="text-[10px] md:text-xs text-muted-foreground">مدفوعات اليوم</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                          <div className="p-2 rounded-lg bg-destructive/10">
                            <Archive className="h-4 w-4 text-destructive" />
                          </div>
                          <div>
                            <p className="text-xl md:text-2xl font-bold">{stats.lowStockItems}</p>
                            <p className="text-[10px] md:text-xs text-muted-foreground">مخزون منخفض</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Transactions Tables */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="border-0 shadow-md">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <div className="p-2 rounded-lg gradient-bg">
                            <FileText className="h-4 w-4 text-white" />
                          </div>
                          آخر الفواتير
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-lg border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/30">
                                <TableHead className="font-semibold">رقم الفاتورة</TableHead>
                                <TableHead className="font-semibold">المشترك</TableHead>
                                <TableHead className="font-semibold">المبلغ</TableHead>
                                <TableHead className="font-semibold">الحالة</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {recentInvoices.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">لا توجد فواتير حالياً</p>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                recentInvoices.map((invoice) => (
                                  <TableRow key={invoice.id} className="hover:bg-muted/30 transition-colors">
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
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <div className="p-2 rounded-lg bg-secondary">
                            <Banknote className="h-4 w-4 text-white" />
                          </div>
                          آخر المدفوعات
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-lg border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/30">
                                <TableHead className="font-semibold">المشترك</TableHead>
                                <TableHead className="font-semibold">المبلغ</TableHead>
                                <TableHead className="font-semibold">الطريقة</TableHead>
                                <TableHead className="font-semibold">التاريخ</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {recentPayments.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                    <Banknote className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">لا توجد مدفوعات حالياً</p>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                recentPayments.map((payment) => (
                                  <TableRow key={payment.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium">{payment.subscribers?.name || 'غير محدد'}</TableCell>
                                    <TableCell className="font-semibold text-secondary">
                                      {formatCurrency(payment.amount, payment.currency || 'IQD')}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="text-xs">
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
                        </div>
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
        
        
      </div>
    </SidebarProvider>
  );
}
