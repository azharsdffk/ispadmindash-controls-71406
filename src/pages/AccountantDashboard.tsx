import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/currency';
import { DollarSign, TrendingUp, TrendingDown, FileText, CreditCard, Package, AlertCircle, Wallet, Clock, Zap, Activity } from 'lucide-react';
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
import { ProfessionalStatCard } from '@/components/accountant/ProfessionalStatCard';
import { QuickActionsPanel } from '@/components/accountant/QuickActionsPanel';
import { FinancialSummaryCards } from '@/components/accountant/FinancialSummaryCards';

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
    { value: 'balance', label: 'الميزانية', show: hasPermission('view_balance') },
    { value: 'income', label: 'قائمة الدخل', show: hasPermission('view_reports') },
    { value: 'cashflow', label: 'التدفقات النقدية', show: hasPermission('view_reports') },
    { value: 'reports', label: 'التقارير', show: hasPermission('export_reports') },
  ].filter(tab => tab.show);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1">
        <AppSidebar />
        
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
            {/* Clean Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                  لوحة التحكم المحاسبية
                </h1>
                <p className="text-sm text-muted-foreground">
                  نظام إدارة مالية متكامل
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-3 py-1.5">
                  <Clock className="h-3.5 w-3.5 ml-1.5" />
                  <span className="text-xs">{new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</span>
                </Badge>
              </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full" style={{
                gridTemplateColumns: `repeat(${availableTabs.length}, minmax(0, 1fr))`
              }}>
                {availableTabs.map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Quick Actions */}
                <QuickActionsPanel />

                {/* Notifications */}
                <PermissionGuard permission="view_notifications" hideOnNoPermission>
                  <AccountingNotifications />
                </PermissionGuard>

                {/* Financial Summary Cards */}
                <PermissionGuard permission="view_reports" hideOnNoPermission>
                  <FinancialSummaryCards stats={stats} />
                </PermissionGuard>

                {/* Main Stats Grid - Simplified */}
                <PermissionGuard permission="view_reports" hideOnNoPermission>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="glass-card">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground">الإيرادات الشهرية</span>
                          <DollarSign className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-2xl font-bold mb-1">{formatCurrency(stats.totalRevenue, 'IQD')}</div>
                        <p className="text-xs text-muted-foreground">+12% من الشهر الماضي</p>
                      </CardContent>
                    </Card>

                    <Card className="glass-card">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground">تذاكر الصيانة</span>
                          <AlertCircle className="h-5 w-5 text-warning" />
                        </div>
                        <div className="text-2xl font-bold mb-1">{stats.pendingInvoices}</div>
                        <p className="text-xs text-muted-foreground">12 تذكرة جديدة</p>
                      </CardContent>
                    </Card>

                    <Card className="glass-card">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground">الفواتير المعلقة</span>
                          <FileText className="h-5 w-5 text-destructive" />
                        </div>
                        <div className="text-2xl font-bold mb-1">{stats.paidInvoices}</div>
                        <p className="text-xs text-muted-foreground">بقيمة {formatCurrency(125000, 'IQD')}</p>
                      </CardContent>
                    </Card>

                    <Card className="glass-card">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground">إجمالي المشتركين</span>
                          <TrendingUp className="h-5 w-5 text-success" />
                        </div>
                        <div className="text-2xl font-bold mb-1">1,234</div>
                        <p className="text-xs text-muted-foreground">+12% من الشهر الماضي</p>
                      </CardContent>
                    </Card>
                  </div>
                </PermissionGuard>


                {/* Recent Invoices & Payments Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <PermissionGuard permission="view_invoices" hideOnNoPermission>
                    <Card className="glass-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
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
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {recentInvoices.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                  لا توجد فواتير
                                </TableCell>
                              </TableRow>
                            ) : (
                              recentInvoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                                  <TableCell>{invoice.subscribers?.name || 'غير محدد'}</TableCell>
                                  <TableCell>{formatCurrency(invoice.net_amount || invoice.amount, invoice.currency || 'IQD')}</TableCell>
                                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </PermissionGuard>

                  <PermissionGuard permission="view_payments" hideOnNoPermission>
                    <Card className="glass-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-success" />
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
                                  <TableCell className="font-medium">{payment.subscribers?.name || 'غير محدد'}</TableCell>
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
