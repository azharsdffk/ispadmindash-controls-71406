import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/currency';
import { DollarSign, TrendingUp, TrendingDown, FileText, CreditCard, Package, AlertCircle, Wallet, ArrowUpRight, PieChart, BarChart3, Calculator, Users, Clock } from 'lucide-react';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountingEntries } from '@/components/accountant/AccountingEntries';
import { GeneralLedger } from '@/components/accountant/GeneralLedger';
import { FinancialCharts } from '@/components/accountant/FinancialCharts';
import { AdvancedReports } from '@/components/accountant/AdvancedReports';
import { BalanceSheet } from '@/components/accountant/BalanceSheet';
import { IncomeStatement } from '@/components/accountant/IncomeStatement';
import { CashFlowStatement } from '@/components/accountant/CashFlowStatement';
import { AccountingNotifications } from '@/components/accountant/AccountingNotifications';
import { PermissionGuard } from '@/components/permissions/PermissionGuard';
import { usePermissions } from '@/hooks/usePermissions';

export default function AccountantDashboard() {
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
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
  const [recentVouchers, setRecentVouchers] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [topSubscribers, setTopSubscribers] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
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

      const { data: recentVouchersData } = await supabase
        .from('vouchers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: lowStockData } = await supabase
        .from('inventory')
        .select('*')
        .or('quantity.lt.min_stock_level,quantity.lt.10')
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

      const { data: topSubscribersData } = await supabase
        .from('payments')
        .select('subscriber_id, amount, subscribers(name)')
        .order('amount', { ascending: false })
        .limit(5);

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data: monthlyRevenueData } = await supabase
        .from('payments')
        .select('payment_date, amount')
        .gte('payment_date', sixMonthsAgo.toISOString().split('T')[0]);

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
      setRecentVouchers(recentVouchersData || []);
      setLowStockItems(lowStockData || []);
      setTopSubscribers(topSubscribersData || []);
      
      const monthlyData: any = {};
      monthlyRevenueData?.forEach((payment) => {
        const month = new Date(payment.payment_date).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'short' });
        monthlyData[month] = (monthlyData[month] || 0) + payment.amount;
      });
      setMonthlyRevenue(Object.entries(monthlyData).map(([month, amount]) => ({ month, amount })));
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

  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const availableTabs = [
    { value: 'overview', label: 'نظرة عامة', show: true },
    { value: 'financial', label: 'التحليل المالي', show: hasPermission('view_reports') },
    { value: 'entries', label: 'القيود المحاسبية', show: hasPermission('add_transaction') },
    { value: 'ledger', label: 'دفتر الأستاذ', show: hasPermission('view_balance') },
    { value: 'balance', label: 'الميزانية', show: hasPermission('view_balance') },
    { value: 'income', label: 'قائمة الدخل', show: hasPermission('view_reports') },
    { value: 'cashflow', label: 'التدفقات النقدية', show: hasPermission('view_reports') },
    { value: 'operations', label: 'العمليات', show: hasPermission('manage_accounts') },
    { value: 'reports', label: 'التقارير', show: hasPermission('export_reports') },
  ].filter(tab => tab.show);

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1">
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">لوحة التحكم المحاسبية</h1>
              <Badge variant="outline" className="px-4 py-2">
                <Clock className="h-4 w-4 ml-2" />
                آخر تحديث: {new Date().toLocaleTimeString('ar-IQ')}
              </Badge>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full" style={{
                gridTemplateColumns: `repeat(${availableTabs.length}, minmax(0, 1fr))`
              }}>
                {availableTabs.map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <PermissionGuard permission="view_notifications" hideOnNoPermission>
                  <AccountingNotifications />
                </PermissionGuard>

                <PermissionGuard permission="view_reports" hideOnNoPermission>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(stats.totalRevenue, 'IQD')}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stats.paidInvoices} فاتورة مدفوعة
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                          {formatCurrency(stats.totalExpenses, 'IQD')}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          من السندات
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-600" />
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {formatCurrency(stats.netProfit, 'IQD')}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          الإيرادات - المصروفات
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">الفواتير المعلقة</CardTitle>
                        <FileText className="h-4 w-4 text-orange-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                          {stats.pendingInvoices}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          بانتظار الدفع
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </PermissionGuard>

                <PermissionGuard permission={['view_payments', 'view_inventory']} hideOnNoPermission>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <PermissionGuard permission="view_payments" hideOnNoPermission>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium">مدفوعات اليوم</CardTitle>
                          <CreditCard className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {formatCurrency(stats.todayPayments, 'IQD')}
                          </div>
                        </CardContent>
                      </Card>
                    </PermissionGuard>

                    <PermissionGuard permission="view_inventory" hideOnNoPermission>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium">تنبيهات المخزون</CardTitle>
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-red-600">
                            {stats.lowStockItems}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            عناصر منخفضة المخزون
                          </p>
                        </CardContent>
                      </Card>
                    </PermissionGuard>

                    <PermissionGuard permission="view_invoices" hideOnNoPermission>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium">الذمم المدينة</CardTitle>
                          <Wallet className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-purple-600">
                            {formatCurrency(stats.totalReceivables, 'IQD')}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {stats.overdueInvoices} فاتورة متأخرة
                          </p>
                        </CardContent>
                      </Card>
                    </PermissionGuard>

                    <PermissionGuard permission="view_inventory" hideOnNoPermission>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium">قيمة المخزون</CardTitle>
                          <Package className="h-4 w-4 text-cyan-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-cyan-600">
                            {formatCurrency(stats.inventoryValue, 'IQD')}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            إجمالي قيمة المخزون
                          </p>
                        </CardContent>
                      </Card>
                    </PermissionGuard>
                  </div>
                </PermissionGuard>

                <PermissionGuard permission="view_balance" hideOnNoPermission>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">التدفق النقدي</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-blue-600" />
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${stats.cashFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {formatCurrency(stats.cashFlow, 'IQD')}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          صافي التدفقات النقدية
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">هامش الربح</CardTitle>
                        <PieChart className="h-4 w-4 text-green-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {stats.profitMargin.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          نسبة الربح من الإيرادات
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">معدل التحصيل</CardTitle>
                        <Calculator className="h-4 w-4 text-orange-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                          {stats.pendingInvoices > 0 
                            ? ((stats.paidInvoices / (stats.paidInvoices + stats.pendingInvoices)) * 100).toFixed(1)
                            : 100}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          نسبة الفواتير المحصلة
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </PermissionGuard>

                <PermissionGuard permission="view_invoices" hideOnNoPermission>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        أحدث الفواتير
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
                            <TableHead>التاريخ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentInvoices.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground">
                                لا توجد فواتير
                              </TableCell>
                            </TableRow>
                          ) : (
                            recentInvoices.map((invoice) => (
                              <TableRow key={invoice.id}>
                                <TableCell>{invoice.invoice_number}</TableCell>
                                <TableCell>{invoice.subscribers?.name || 'غير محدد'}</TableCell>
                                <TableCell>{formatCurrency(invoice.net_amount || invoice.amount, invoice.currency || 'IQD')}</TableCell>
                                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                                <TableCell>{new Date(invoice.created_at).toLocaleDateString('ar-IQ')}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </PermissionGuard>

                <PermissionGuard permission="view_payments" hideOnNoPermission>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        أحدث المدفوعات
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>المشترك</TableHead>
                            <TableHead>المبلغ</TableHead>
                            <TableHead>طريقة الدفع</TableHead>
                            <TableHead>التاريخ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentPayments.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground">
                                لا توجد مدفوعات
                              </TableCell>
                            </TableRow>
                          ) : (
                            recentPayments.map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell>{payment.subscribers?.name || 'غير محدد'}</TableCell>
                                <TableCell>{formatCurrency(payment.amount, payment.currency || 'IQD')}</TableCell>
                                <TableCell><Badge variant="outline">{payment.payment_method}</Badge></TableCell>
                                <TableCell>{new Date(payment.payment_date).toLocaleDateString('ar-IQ')}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </PermissionGuard>
              </TabsContent>

              {hasPermission('view_financial_reports') && (
                <TabsContent value="financial" className="space-y-4">
                  <FinancialCharts />
                </TabsContent>
              )}

              {hasPermission('manage_accounting_entries') && (
                <TabsContent value="entries" className="space-y-4">
                  <AccountingEntries />
                </TabsContent>
              )}

              {hasPermission('view_general_ledger') && (
                <TabsContent value="ledger" className="space-y-4">
                  <GeneralLedger />
                </TabsContent>
              )}

              {hasPermission('view_balance_sheet') && (
                <TabsContent value="balance" className="space-y-4">
                  <BalanceSheet />
                </TabsContent>
              )}

              {hasPermission('view_financial_reports') && (
                <TabsContent value="income" className="space-y-4">
                  <IncomeStatement />
                </TabsContent>
              )}

              {hasPermission('view_financial_reports') && (
                <TabsContent value="cashflow" className="space-y-4">
                  <CashFlowStatement />
                </TabsContent>
              )}

              {hasPermission('view_transactions') && (
                <TabsContent value="operations" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>العمليات اليومية</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-green-500" />
                            <span>مدفوعات اليوم</span>
                          </div>
                          <span className="font-bold text-green-600">{formatCurrency(stats.todayPayments, 'IQD')}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-orange-500" />
                            <span>فواتير معلقة</span>
                          </div>
                          <span className="font-bold text-orange-600">{stats.pendingInvoices}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>المستحقات</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                          <div className="flex items-center gap-3">
                            <Wallet className="h-5 w-5 text-purple-500" />
                            <span>الذمم المدينة</span>
                          </div>
                          <span className="font-bold text-purple-600">{formatCurrency(stats.totalReceivables, 'IQD')}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <span>فواتير متأخرة</span>
                          </div>
                          <span className="font-bold text-red-600">{stats.overdueInvoices}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              )}

              {hasPermission('generate_reports') && (
                <TabsContent value="reports" className="space-y-4">
                  <AdvancedReports />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>

        <AppSidebar />
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
