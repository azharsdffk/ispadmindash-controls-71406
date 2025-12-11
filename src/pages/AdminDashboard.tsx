import { useState } from 'react';
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
import { TechniciansTable } from '@/components/admin/TechniciansTable';
import { SubscribersTable } from '@/components/admin/SubscribersTable';
import { FinancialManagement } from '@/components/admin/FinancialManagement';
import { ReportsAnalytics } from '@/components/admin/ReportsAnalytics';
import { ActivityLog } from '@/components/admin/ActivityLog';
import { 
  LayoutDashboard, Wrench, Users, DollarSign, BarChart3, Activity, Zap, TrendingUp,
  Calculator, FileText, Layers, Target, Wallet, User, MapPin
} from 'lucide-react';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { Badge } from '@/components/ui/badge';
import { AccountingEntries } from '@/components/accountant/AccountingEntries';
import { GeneralLedger } from '@/components/accountant/GeneralLedger';
import { BalanceSheet } from '@/components/accountant/BalanceSheet';
import { IncomeStatement } from '@/components/accountant/IncomeStatement';
import { CashFlowStatement } from '@/components/accountant/CashFlowStatement';
import { AdvancedReports } from '@/components/accountant/AdvancedReports';
import { AdminCustomerPortal } from '@/components/admin/AdminCustomerPortal';
import { AdminTechnicianView } from '@/components/admin/AdminTechnicianView';

const AdminDashboard = () => {
  const { isAdmin, loading } = useUserRole();
  const [activeTab, setActiveTab] = useState('overview');
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (loading) {
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
      <div className="min-h-screen bg-background flex w-full" dir="rtl">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <ProfessionalHeader onOpenSettings={() => setSettingsOpen(true)} />
        
          <main className="flex-1 overflow-y-auto">
        
        {/* Hero Header Section */}
        <div className="relative overflow-hidden border-b">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent"></div>
          <div className="container mx-auto px-6 py-6 relative">
            <div className="flex items-center justify-between">
              <div className="space-y-2 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg">
                    <LayoutDashboard className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gradient-primary">
                      لوحة المدير العام
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                      إدارة شاملة لجميع عمليات النظام
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 animate-slide-up">
                  <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">
                    <Zap className="h-3 w-3 ml-1" />
                    نظام نشط
                  </Badge>
                  <Badge className="bg-info/10 text-info border-info/20 hover:bg-info/20">
                    <TrendingUp className="h-3 w-3 ml-1" />
                    تحديث مباشر
                  </Badge>
                  <Badge className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20">
                    <Activity className="h-3 w-3 ml-1" />
                    {new Date().toLocaleDateString('ar-EG')}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-5 lg:grid-cols-10 w-full bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="overview" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden lg:inline">الرئيسية</span>
              </TabsTrigger>
              <TabsTrigger value="tickets" className="gap-2">
                <Wrench className="h-4 w-4" />
                <span className="hidden lg:inline">التذاكر</span>
              </TabsTrigger>
              <TabsTrigger value="technicians" className="gap-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden lg:inline">الفنيين</span>
              </TabsTrigger>
              <TabsTrigger value="subscribers" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden lg:inline">المشتركين</span>
              </TabsTrigger>
              <TabsTrigger value="customers" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden lg:inline">بوابة العميل</span>
              </TabsTrigger>
              <TabsTrigger value="finance" className="gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden lg:inline">المالية</span>
              </TabsTrigger>
              <TabsTrigger value="accounting" className="gap-2">
                <Calculator className="h-4 w-4" />
                <span className="hidden lg:inline">المحاسبة</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden lg:inline">التقارير</span>
              </TabsTrigger>
              <TabsTrigger value="statements" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden lg:inline">القوائم المالية</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden lg:inline">السجل</span>
              </TabsTrigger>
            </TabsList>

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
              <Tabs defaultValue="entries" className="space-y-4">
                <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full">
                  <TabsTrigger value="entries" className="gap-2">
                    <FileText className="h-4 w-4" />
                    القيود المحاسبية
                  </TabsTrigger>
                  <TabsTrigger value="ledger" className="gap-2">
                    <Layers className="h-4 w-4" />
                    دفتر الأستاذ
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="gap-2">
                    <Target className="h-4 w-4" />
                    التقارير المتقدمة
                  </TabsTrigger>
                  <TabsTrigger value="cashflow" className="gap-2">
                    <Wallet className="h-4 w-4" />
                    التدفقات النقدية
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="entries">
                  <AccountingEntries />
                </TabsContent>
                <TabsContent value="ledger">
                  <GeneralLedger />
                </TabsContent>
                <TabsContent value="advanced">
                  <AdvancedReports />
                </TabsContent>
                <TabsContent value="cashflow">
                  <CashFlowStatement />
                </TabsContent>
              </Tabs>
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
