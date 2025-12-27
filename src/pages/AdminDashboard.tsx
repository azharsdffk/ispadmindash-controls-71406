import { useState, useEffect } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ProfessionalHeader } from '@/components/admin/ProfessionalHeader';
import { AdminStatsCards } from '@/components/admin/AdminStatsCards';
import { AdminCharts } from '@/components/admin/AdminCharts';
import { MapView } from '@/components/admin/MapView';
import { TicketsTable } from '@/components/admin/TicketsTable';
import { SubscribersTable } from '@/components/admin/SubscribersTable';
import { FinancialManagement } from '@/components/admin/FinancialManagement';
import { ReportsAnalytics } from '@/components/admin/ReportsAnalytics';
import { ActivityLog } from '@/components/admin/ActivityLog';
import { 
  LayoutDashboard, Zap, TrendingUp, Activity, UserCog,
  FileText, Layers, Target, Coins, Wallet, Archive
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AccountingEntries } from '@/components/accountant/AccountingEntries';
import { GeneralLedger } from '@/components/accountant/GeneralLedger';
import { BalanceSheet } from '@/components/accountant/BalanceSheet';
import { IncomeStatement } from '@/components/accountant/IncomeStatement';
import { CashFlowStatement } from '@/components/accountant/CashFlowStatement';
import { AdvancedReports } from '@/components/accountant/AdvancedReports';
import { AdminCustomerPortal } from '@/components/admin/AdminCustomerPortal';
import { AdminTechnicianView } from '@/components/admin/AdminTechnicianView';
import { OverviewDashboard } from '@/components/accountant/OverviewDashboard';
import { FinancialCharts } from '@/components/accountant/FinancialCharts';
import { DraggableTabsBar } from '@/components/admin/DraggableTabsBar';
import { useAdminLayout } from '@/hooks/useAdminLayout';
import { mainAdminTabs, accountingSubTabs, getOrderedTabs } from '@/config/adminTabs';
import { supabase } from '@/integrations/supabase/client';
import { AutoBillingSettings } from '@/components/billing/AutoBillingSettings';
import { PushNotificationSettings } from '@/components/notifications/PushNotificationSettings';

const AdminDashboard = () => {
  const { isAdmin, loading } = useUserRole();
  const { 
    layout, 
    loading: layoutLoading, 
    updateTabOrder, 
    updateAccountingTabOrder, 
    resetToDefault 
  } = useAdminLayout();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountingStats, setAccountingStats] = useState({
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
  const [accountingLoading, setAccountingLoading] = useState(false);

  // Get ordered tabs based on saved layout
  const orderedMainTabs = getOrderedTabs(mainAdminTabs, layout.tabOrder);
  const orderedAccountingTabs = getOrderedTabs(accountingSubTabs, layout.accountingTabOrder);

  useEffect(() => {
    if (activeTab === 'accounting') {
      fetchAccountingData();
    }
  }, [activeTab]);

  const fetchAccountingData = async () => {
    setAccountingLoading(true);
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

      setAccountingStats({
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
      console.error('Error fetching accounting data:', error);
    } finally {
      setAccountingLoading(false);
    }
  };

  if (loading || layoutLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-slate-900 flex w-full" dir="rtl">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <ProfessionalHeader onOpenSettings={() => setSettingsOpen(true)} />
        
          <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950">
        
        {/* Hero Header Section */}
        <div className="relative overflow-hidden border-b border-blue-800/30">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-800/50 to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent"></div>
          <div className="container mx-auto px-6 py-6 relative">
            <div className="flex items-center justify-between">
              <div className="space-y-2 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <LayoutDashboard className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                      لوحة المدير العام
                    </h1>
                    <p className="text-blue-200/70 text-sm mt-1">
                      إدارة شاملة لجميع عمليات النظام
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 animate-slide-up">
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30">
                    <Zap className="h-3 w-3 ml-1" />
                    نظام نشط
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30">
                    <TrendingUp className="h-3 w-3 ml-1" />
                    تحديث مباشر
                  </Badge>
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30">
                    <Activity className="h-3 w-3 ml-1" />
                    {new Date().toLocaleDateString('ar-EG')}
                  </Badge>
                  <Link to="/agents">
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                      <UserCog className="h-4 w-4" />
                      إضافة / تعديل وكيل
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <DraggableTabsBar
              tabs={orderedMainTabs}
              onReorder={updateTabOrder}
              onReset={resetToDefault}
            />

            <TabsContent value="overview" className="space-y-6 animate-fade-in">
              <AdminStatsCards />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <AdminCharts />
                <MapView />
              </div>
            </TabsContent>

            <TabsContent value="tickets">
              <TicketsTable />
            </TabsContent>

            <TabsContent value="technicians">
              <AdminTechnicianView />
            </TabsContent>

            <TabsContent value="subscribers">
              <SubscribersTable />
            </TabsContent>

            <TabsContent value="customers">
              <AdminCustomerPortal />
            </TabsContent>

            <TabsContent value="finance">
              <FinancialManagement />
            </TabsContent>

            <TabsContent value="accounting" className="space-y-6">
              {accountingLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <Tabs defaultValue="overview" className="space-y-4">
                  <TabsList className="grid grid-cols-3 lg:grid-cols-8 w-full bg-slate-700/50 border border-blue-800/30 p-1 rounded-lg">
                    <TabsTrigger value="overview" className="gap-2 text-blue-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                      <Activity className="h-4 w-4" />
                      <span className="hidden sm:inline">نظرة عامة</span>
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="gap-2 text-blue-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                      <TrendingUp className="h-4 w-4" />
                      <span className="hidden sm:inline">التحليل المالي</span>
                    </TabsTrigger>
                    <TabsTrigger value="entries" className="gap-2 text-blue-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                      <FileText className="h-4 w-4" />
                      <span className="hidden sm:inline">القيود</span>
                    </TabsTrigger>
                    <TabsTrigger value="ledger" className="gap-2 text-blue-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                      <Layers className="h-4 w-4" />
                      <span className="hidden sm:inline">دفتر الأستاذ</span>
                    </TabsTrigger>
                    <TabsTrigger value="balance" className="gap-2 text-blue-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                      <Target className="h-4 w-4" />
                      <span className="hidden sm:inline">الميزانية</span>
                    </TabsTrigger>
                    <TabsTrigger value="income" className="gap-2 text-blue-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                      <Coins className="h-4 w-4" />
                      <span className="hidden sm:inline">قائمة الدخل</span>
                    </TabsTrigger>
                    <TabsTrigger value="cashflow" className="gap-2 text-blue-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                      <Wallet className="h-4 w-4" />
                      <span className="hidden sm:inline">التدفقات</span>
                    </TabsTrigger>
                    <TabsTrigger value="advanced" className="gap-2 text-blue-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                      <Archive className="h-4 w-4" />
                      <span className="hidden sm:inline">متقدمة</span>
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview" className="space-y-6">
                    <OverviewDashboard 
                      stats={accountingStats} 
                      recentInvoices={recentInvoices} 
                      recentPayments={recentPayments} 
                    />
                  </TabsContent>
                  <TabsContent value="financial" className="space-y-4">
                    <FinancialCharts />
                  </TabsContent>
                  <TabsContent value="entries">
                    <AccountingEntries />
                  </TabsContent>
                  <TabsContent value="ledger">
                    <GeneralLedger />
                  </TabsContent>
                  <TabsContent value="balance">
                    <BalanceSheet />
                  </TabsContent>
                  <TabsContent value="income">
                    <IncomeStatement />
                  </TabsContent>
                  <TabsContent value="cashflow">
                    <CashFlowStatement />
                  </TabsContent>
                  <TabsContent value="advanced">
                    <AdvancedReports />
                  </TabsContent>
                </Tabs>
              )}
            </TabsContent>

            <TabsContent value="reports">
              <ReportsAnalytics />
            </TabsContent>

            <TabsContent value="statements" className="space-y-6">
              <Tabs defaultValue="balance" className="space-y-4">
                <TabsList className="grid grid-cols-2 w-full max-w-md">
                  <TabsTrigger value="balance" className="gap-2">
                    <Target className="h-4 w-4" />
                    الميزانية العمومية
                  </TabsTrigger>
                  <TabsTrigger value="income" className="gap-2">
                    <TrendingUp className="h-4 w-4" />
                    قائمة الدخل
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="balance">
                  <BalanceSheet />
                </TabsContent>
                <TabsContent value="income">
                  <IncomeStatement />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="activity">
              <ActivityLog />
            </TabsContent>

            <TabsContent value="auto-billing" className="space-y-6">
              <AutoBillingSettings />
            </TabsContent>

            <TabsContent value="system-settings" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PushNotificationSettings />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
        </div>
        
        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
