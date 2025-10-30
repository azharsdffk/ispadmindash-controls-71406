import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/currency';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  CreditCard, 
  AlertTriangle,
  Clock,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  Calculator,
  DollarSign,
  Users,
  ShoppingCart,
  Package
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
    { value: 'balance', label: 'الميزانية العمومية', show: hasPermission('view_balance') },
    { value: 'income', label: 'قائمة الدخل', show: hasPermission('view_reports') },
    { value: 'cashflow', label: 'التدفقات النقدية', show: hasPermission('view_reports') },
    { value: 'reports', label: 'التقارير المتقدمة', show: hasPermission('export_reports') },
  ].filter(tab => tab.show);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1">
        <AppSidebar />
        
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
            {/* Enhanced Header */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl gradient-bg">
                    <Calculator className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold gradient-text mb-1">
                      لوحة التحكم المحاسبية
                    </h1>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      نظام إدارة مالية شامل ومتكامل
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="px-4 py-2 glass">
                    <Clock className="h-4 w-4 ml-2" />
                    {new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                  </Badge>
                  <Badge variant="default" className="px-4 py-2">
                    <Users className="h-4 w-4 ml-2" />
                    محاسب
                  </Badge>
                </div>
              </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="w-full glass p-1 h-auto flex-wrap gap-1">
                {availableTabs.map(tab => (
                  <TabsTrigger 
                    key={tab.value} 
                    value={tab.value} 
                    className="flex-1 min-w-[140px] data-[state=active]:gradient-bg data-[state=active]:text-white"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* Primary Financial Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="glass-card hover-scale border-0">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground mb-1">إجمالي الإيرادات</p>
                          <h3 className="text-2xl font-bold mb-1">{formatCurrency(stats.totalRevenue, 'IQD')}</h3>
                          <div className="flex items-center gap-1 text-xs">
                            <TrendingUp className="h-3 w-3" style={{ color: 'hsl(var(--secondary))' }} />
                            <span className="text-muted-foreground">+12% من الشهر السابق</span>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl gradient-bg">
                          <Wallet className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card hover-scale border-0">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground mb-1">إجمالي المصروفات</p>
                          <h3 className="text-2xl font-bold mb-1">{formatCurrency(stats.totalExpenses, 'IQD')}</h3>
                          <div className="flex items-center gap-1 text-xs">
                            <TrendingDown className="h-3 w-3" style={{ color: 'hsl(var(--destructive))' }} />
                            <span className="text-muted-foreground">-5% من الشهر السابق</span>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-destructive">
                          <ShoppingCart className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card hover-scale border-0">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground mb-1">صافي الربح</p>
                          <h3 className="text-2xl font-bold mb-1" style={{ color: stats.netProfit >= 0 ? 'hsl(var(--secondary))' : 'hsl(var(--destructive))' }}>
                            {formatCurrency(stats.netProfit, 'IQD')}
                          </h3>
                          <div className="flex items-center gap-1 text-xs">
                            <PieChart className="h-3 w-3" style={{ color: 'hsl(var(--accent))' }} />
                            <span className="text-muted-foreground">هامش {stats.profitMargin.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-secondary">
                          <DollarSign className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card hover-scale border-0">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground mb-1">التدفق النقدي</p>
                          <h3 className="text-2xl font-bold mb-1" style={{ color: stats.cashFlow >= 0 ? 'hsl(var(--secondary))' : 'hsl(var(--destructive))' }}>
                            {formatCurrency(stats.cashFlow, 'IQD')}
                          </h3>
                          <div className="flex items-center gap-1 text-xs">
                            <BarChart3 className="h-3 w-3" style={{ color: 'hsl(var(--primary))' }} />
                            <span className="text-muted-foreground">التدفقات الشهرية</span>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl" style={{ background: 'hsl(var(--accent))' }}>
                          <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Secondary Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="glass-card border-0">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">الفواتير المدفوعة</span>
                        <div className="p-2 rounded-lg" style={{ background: 'hsl(var(--secondary) / 0.1)' }}>
                          <Receipt className="h-5 w-5" style={{ color: 'hsl(var(--secondary))' }} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold">{stats.paidInvoices}</div>
                      <p className="text-xs text-muted-foreground mt-1">فاتورة مكتملة</p>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-0">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">الفواتير المعلقة</span>
                        <div className="p-2 rounded-lg" style={{ background: 'hsl(var(--accent) / 0.1)' }}>
                          <AlertTriangle className="h-5 w-5" style={{ color: 'hsl(var(--accent))' }} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
                      <p className="text-xs text-muted-foreground mt-1">بانتظار الدفع</p>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-0">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">مدفوعات اليوم</span>
                        <div className="p-2 rounded-lg" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
                          <CreditCard className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold">{formatCurrency(stats.todayPayments, 'IQD')}</div>
                      <p className="text-xs text-muted-foreground mt-1">إجمالي اليوم</p>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-0">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">قيمة المخزون</span>
                        <div className="p-2 rounded-lg bg-destructive/10">
                          <Package className="h-5 w-5" style={{ color: 'hsl(var(--destructive))' }} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold">{formatCurrency(stats.inventoryValue, 'IQD')}</div>
                      <p className="text-xs text-muted-foreground mt-1">{stats.lowStockItems} صنف ناقص</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Transactions Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="glass-card border-0">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-3">
                        <div className="p-2 rounded-lg gradient-bg">
                          <Receipt className="h-5 w-5 text-white" />
                        </div>
                        <span>أحدث الفواتير</span>
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
                                <FileSpreadsheet className="h-12 w-12 mx-auto mb-2 opacity-50" />
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
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-secondary">
                          <CreditCard className="h-5 w-5 text-white" />
                        </div>
                        <span>أحدث المدفوعات</span>
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
                                <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
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
        </div>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
