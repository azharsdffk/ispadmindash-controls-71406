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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1">
        <AppSidebar />
        
        <div className="flex-1 overflow-auto custom-scrollbar">
          <div className="container mx-auto p-6 space-y-6">
            {/* Professional Header */}
            <div className="flex items-center justify-between mb-8 animate-fade-in">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  لوحة التحكم المحاسبية المتقدمة
                </h1>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  نظام إدارة مالية شامل ومتكامل
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="px-4 py-2 border-2 border-primary/30 bg-primary/5">
                  <Clock className="h-4 w-4 ml-2 text-primary" />
                  <span className="font-semibold">{new Date().toLocaleTimeString('ar-IQ')}</span>
                </Badge>
                <Badge className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 animate-pulse-glow">
                  <Zap className="h-4 w-4 ml-2" />
                  نشط الآن
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

                {/* Main Stats Grid */}
                <PermissionGuard permission="view_reports" hideOnNoPermission>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ProfessionalStatCard
                      title="إجمالي الإيرادات"
                      value={formatCurrency(stats.totalRevenue, 'IQD')}
                      subtitle={`${stats.paidInvoices} فاتورة مدفوعة`}
                      icon={TrendingUp}
                      colorScheme="success"
                      trend="up"
                      trendValue="+12.5%"
                    />

                    <ProfessionalStatCard
                      title="إجمالي المصروفات"
                      value={formatCurrency(stats.totalExpenses, 'IQD')}
                      subtitle="من السندات والمصاريف"
                      icon={TrendingDown}
                      colorScheme="danger"
                      trend="down"
                      trendValue="-5.3%"
                    />

                    <ProfessionalStatCard
                      title="صافي الربح"
                      value={formatCurrency(stats.netProfit, 'IQD')}
                      subtitle="الإيرادات - المصروفات"
                      icon={DollarSign}
                      colorScheme={stats.netProfit >= 0 ? 'primary' : 'danger'}
                      trend={stats.netProfit >= 0 ? 'up' : 'down'}
                      trendValue={stats.netProfit >= 0 ? '+8.2%' : '-3.1%'}
                    />

                    <ProfessionalStatCard
                      title="الفواتير المعلقة"
                      value={stats.pendingInvoices}
                      subtitle="بانتظار الدفع"
                      icon={FileText}
                      colorScheme="warning"
                    />
                  </div>
                </PermissionGuard>

                {/* Secondary Stats */}
                <PermissionGuard permission={['view_payments', 'view_inventory']} hideOnNoPermission>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <PermissionGuard permission="view_payments" hideOnNoPermission>
                      <ProfessionalStatCard
                        title="مدفوعات اليوم"
                        value={formatCurrency(stats.todayPayments, 'IQD')}
                        subtitle="المدفوعات المستلمة اليوم"
                        icon={CreditCard}
                        colorScheme="primary"
                      />
                    </PermissionGuard>

                    <PermissionGuard permission="view_inventory" hideOnNoPermission>
                      <ProfessionalStatCard
                        title="تنبيهات المخزون"
                        value={stats.lowStockItems}
                        subtitle="عناصر منخفضة المخزون"
                        icon={AlertCircle}
                        colorScheme="danger"
                      />
                    </PermissionGuard>

                    <PermissionGuard permission="view_invoices" hideOnNoPermission>
                      <ProfessionalStatCard
                        title="الذمم المدينة"
                        value={formatCurrency(stats.totalReceivables, 'IQD')}
                        subtitle={`${stats.overdueInvoices} فاتورة متأخرة`}
                        icon={Wallet}
                        colorScheme="purple"
                      />
                    </PermissionGuard>

                    <PermissionGuard permission="view_inventory" hideOnNoPermission>
                      <ProfessionalStatCard
                        title="قيمة المخزون"
                        value={formatCurrency(stats.inventoryValue, 'IQD')}
                        subtitle="إجمالي قيمة المخزون"
                        icon={Package}
                        colorScheme="cyan"
                      />
                    </PermissionGuard>
                  </div>
                </PermissionGuard>

                {/* Recent Invoices & Payments Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PermissionGuard permission="view_invoices" hideOnNoPermission>
                    <Card className="border-2 hover:border-primary/30 transition-all duration-300 animate-slide-up">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
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
                    <Card className="border-2 hover:border-success/30 transition-all duration-300 animate-slide-up">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-success" />
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
