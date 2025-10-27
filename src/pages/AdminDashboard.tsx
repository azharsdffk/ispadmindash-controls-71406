import { useState, useEffect } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AdminStatsCards } from '@/components/admin/AdminStatsCards';
import { AdminCharts } from '@/components/admin/AdminCharts';
import { TicketsTable } from '@/components/admin/TicketsTable';
import { TechniciansTable } from '@/components/admin/TechniciansTable';
import { SubscribersTable } from '@/components/admin/SubscribersTable';
import { FinancialManagement } from '@/components/admin/FinancialManagement';
import { ReportsAnalytics } from '@/components/admin/ReportsAnalytics';
import { ActivityLog } from '@/components/admin/ActivityLog';
import { LayoutDashboard, Wrench, Users, DollarSign, BarChart3, Activity, Settings } from 'lucide-react';

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
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="lg:mr-64">
        <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
        
        {/* Header Section */}
        <div className="border-b bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-l from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-2">
                  لوحة المدير العام
                </h1>
                <p className="text-muted-foreground text-lg">
                  إدارة شاملة لجميع عمليات النظام
                </p>
              </div>
              <div className="flex gap-2">
                <div className="px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">الوقت الفعلي</p>
                  <p className="text-lg font-semibold">{new Date().toLocaleTimeString('ar-EG')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-7 w-full bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="overview" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden md:inline">الرئيسية</span>
              </TabsTrigger>
              <TabsTrigger value="tickets" className="gap-2">
                <Wrench className="h-4 w-4" />
                <span className="hidden md:inline">التذاكر</span>
              </TabsTrigger>
              <TabsTrigger value="technicians" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden md:inline">الفنيين</span>
              </TabsTrigger>
              <TabsTrigger value="subscribers" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden md:inline">المشتركين</span>
              </TabsTrigger>
              <TabsTrigger value="finance" className="gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden md:inline">المالية</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden md:inline">التقارير</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden md:inline">السجل</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <AdminStatsCards />
              <AdminCharts />
            </TabsContent>

            <TabsContent value="tickets">
              <TicketsTable />
            </TabsContent>

            <TabsContent value="technicians">
              <TechniciansTable />
            </TabsContent>

            <TabsContent value="subscribers">
              <SubscribersTable />
            </TabsContent>

            <TabsContent value="finance">
              <FinancialManagement />
            </TabsContent>

            <TabsContent value="reports">
              <ReportsAnalytics />
            </TabsContent>

            <TabsContent value="activity">
              <ActivityLog />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
