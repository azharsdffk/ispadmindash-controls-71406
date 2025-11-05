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
      <div className="min-h-screen flex w-full" dir="rtl">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
        
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="container mx-auto p-6 space-y-6">
              {/* Professional Header */}
              <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl gradient-bg">
                    <Calculator className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold gradient-text">لوحة المحاسب</h1>
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

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="w-full p-1 flex-wrap gap-1 bg-muted">
                  {availableTabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger 
                        key={tab.value} 
                        value={tab.value} 
                        className="flex-1 min-w-[120px] flex items-center gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {/* Menu Tab */}
                <TabsContent value="menu" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg gradient-bg">
                          <LayoutGrid className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle>القائمة الرئيسية</CardTitle>
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

                <TabsContent value="overview" className="space-y-4">
                  {/* Financial Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Revenue Card */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-1">إجمالي الإيرادات</p>
                            <h3 className="text-2xl font-bold gradient-text">
                              {formatCurrency(stats.totalRevenue, 'IQD')}
                            </h3>
                          </div>
                          <div className="p-3 rounded-lg gradient-bg">
                            <Coins className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Expenses Card */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-1">إجمالي المصروفات</p>
                            <h3 className="text-2xl font-bold text-destructive">
                              {formatCurrency(stats.totalExpenses, 'IQD')}
                            </h3>
                          </div>
                          <div className="p-3 rounded-lg bg-destructive">
                            <ShoppingBag className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Net Profit Card */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-1">صافي الربح</p>
                            <h3 className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                              {formatCurrency(stats.netProfit, 'IQD')}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              هامش الربح: {stats.profitMargin.toFixed(1)}%
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-secondary">
                            <TrendingUp className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Cash Flow Card */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-1">التدفق النقدي</p>
                            <h3 className={`text-2xl font-bold ${stats.cashFlow >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                              {formatCurrency(stats.cashFlow, 'IQD')}
                            </h3>
                          </div>
                          <div className={`p-3 rounded-lg ${stats.cashFlow >= 0 ? 'bg-secondary' : 'bg-destructive'}`}>
                            <Wallet2 className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-secondary/10">
                            <FileText className="h-5 w-5 text-secondary" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{stats.paidInvoices}</p>
                            <p className="text-xs text-muted-foreground">فواتير مدفوعة</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-orange-500/10">
                            <AlertCircle className="h-5 w-5 text-orange-500" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{stats.pendingInvoices}</p>
                            <p className="text-xs text-muted-foreground">فواتير معلقة</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Banknote className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{formatCurrency(stats.todayPayments, 'IQD')}</p>
                            <p className="text-xs text-muted-foreground">مدفوعات اليوم</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-destructive/10">
                            <Archive className="h-5 w-5 text-destructive" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{stats.lowStockItems}</p>
                            <p className="text-xs text-muted-foreground">مخزون منخفض</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Transactions Tables */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          آخر الفواتير
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

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Banknote className="h-5 w-5" />
                          آخر المدفوعات
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
