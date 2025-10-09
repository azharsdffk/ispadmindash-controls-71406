import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Users, TrendingUp, DollarSign, Wrench, AlertCircle, Activity, CheckCircle2, Clock } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { toast } from "sonner";

const Dashboard = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    activeSubscribers: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    openTickets: 0,
    urgentTickets: 0,
    completedTickets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [subscribersByPlan, setSubscribersByPlan] = useState<any[]>([]);
  const [ticketsByStatus, setTicketsByStatus] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
    
    // Real-time updates
    const ticketsChannel = supabase
      .channel('dashboard-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_tickets' }, () => {
        fetchDashboardData();
        toast.success("تم تحديث البيانات", { duration: 2000 });
      })
      .subscribe();

    const paymentsChannel = supabase
      .channel('dashboard-payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Get subscriber stats
      const { count: subscribersCount } = await supabase
        .from('subscribers')
        .select('*', { count: 'exact', head: true });

      // Get invoices stats
      const { data: invoices } = await supabase
        .from('invoices')
        .select('status, net_amount');
      
      const pendingInvoices = invoices?.filter(inv => inv.status === 'pending').length || 0;
      const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.net_amount), 0) || 0;

      // Get maintenance tickets stats
      const { data: tickets } = await supabase
        .from('maintenance_tickets')
        .select('status, priority');
      
      const openTickets = tickets?.filter(t => t.status === 'open' || t.status === 'in_progress').length || 0;
      const urgentTickets = tickets?.filter(t => t.priority === 'high' || t.priority === 'urgent').length || 0;
      const completedTickets = tickets?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0;

      // Get subscribers by plan
      const { data: subscribers } = await supabase
        .from('subscribers')
        .select('plan');
      
      const planCounts = subscribers?.reduce((acc: any, sub) => {
        const plan = sub.plan || 'غير محدد';
        acc[plan] = (acc[plan] || 0) + 1;
        return acc;
      }, {});

      const planData = Object.entries(planCounts || {}).map(([name, value]) => ({
        name,
        value,
      }));

      // Get tickets by status
      const statusCounts = tickets?.reduce((acc: any, ticket) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1;
        return acc;
      }, {});

      const ticketsData = Object.entries(statusCounts || {}).map(([status, count]) => ({
        status: status === 'open' ? 'مفتوحة' : status === 'in_progress' ? 'قيد المعالجة' : 'مغلقة',
        count,
      }));

      // Mock monthly revenue data
      const revenueData = [
        { month: 'يناير', revenue: 45000 },
        { month: 'فبراير', revenue: 52000 },
        { month: 'مارس', revenue: 48000 },
        { month: 'أبريل', revenue: 61000 },
        { month: 'مايو', revenue: 55000 },
        { month: 'يونيو', revenue: 67000 },
      ];

      // Get recent activities
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      setStats({
        totalSubscribers: subscribersCount || 0,
        activeSubscribers: subscribersCount || 0,
        totalRevenue,
        pendingInvoices,
        openTickets,
        urgentTickets,
        completedTickets,
      });

      setMonthlyRevenue(revenueData);
      setSubscribersByPlan(planData);
      setTicketsByStatus(ticketsData);
      setRecentActivities(auditLogs || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error("فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(220, 90%, 56%)', 'hsl(142, 76%, 36%)', 'hsl(0, 84%, 60%)'];

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'UPDATE': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'DELETE': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-primary" />;
    }
  };

  const getActionLabel = (action: string, tableName: string) => {
    const actions: Record<string, string> = {
      CREATE: 'إضافة', UPDATE: 'تعديل', DELETE: 'حذف', SELECT: 'عرض',
    };
    const tables: Record<string, string> = {
      subscribers: 'مشترك', maintenance_tickets: 'تذكرة', payments: 'دفعة', invoices: 'فاتورة',
    };
    return `${actions[action] || action} ${tables[tableName] || tableName}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Activity className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1 w-full">
        <AppSidebar />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between animate-fade-in">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  لوحة التحكم الاحترافية
                </h1>
                <p className="text-muted-foreground mt-1">مرحباً بك في نظام إدارة مزود خدمة الإنترنت المتطور</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="إجمالي المشتركين"
                value={stats.totalSubscribers}
                icon={Users}
                gradient="bg-gradient-to-br from-blue-600 to-blue-400"
                borderColor="border-l-blue-600"
                subtitle={
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {stats.activeSubscribers} نشط
                  </p>
                }
              />

              <StatCard
                title="الإيرادات الكلية"
                value={`${stats.totalRevenue.toLocaleString()} د.ع`}
                icon={DollarSign}
                gradient="bg-gradient-to-br from-green-600 to-green-400"
                borderColor="border-l-green-600"
                subtitle={
                  <p className="text-xs text-muted-foreground">
                    {stats.pendingInvoices} فاتورة معلقة
                  </p>
                }
                delay="0.1s"
              />

              <StatCard
                title="تذاكر نشطة"
                value={stats.openTickets}
                icon={Wrench}
                gradient="bg-gradient-to-br from-orange-600 to-orange-400"
                borderColor="border-l-orange-600"
                subtitle={
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {stats.urgentTickets} عاجلة
                  </p>
                }
                delay="0.2s"
              />

              <StatCard
                title="تذاكر محلولة"
                value={stats.completedTickets}
                icon={CheckCircle2}
                gradient="bg-gradient-to-br from-purple-600 to-purple-400"
                borderColor="border-l-purple-600"
                subtitle={
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +15% هذا الشهر
                  </p>
                }
                delay="0.3s"
              />
            </div>

            {/* Charts and Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly Revenue Chart */}
              <ChartCard title="📈 الإيرادات الشهرية" className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(220, 90%, 56%)" 
                      strokeWidth={3} 
                      name="الإيرادات"
                      dot={{ fill: 'hsl(220, 90%, 56%)', r: 6 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Recent Activities */}
              <Card className="animate-slide-up glass-effect" style={{animationDelay: '0.1s'}}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gradient-primary">
                    <Activity className="h-5 w-5" />
                    الأنشطة الأخيرة
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  <div className="space-y-3">
                    {recentActivities.length > 0 ? (
                      recentActivities.map((activity) => (
                        <div 
                          key={activity.id} 
                          className="flex items-center gap-3 pb-3 border-b last:border-0 transition-all hover:bg-muted/50 rounded p-2 cursor-pointer"
                        >
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {getActionIcon(activity.action)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {getActionLabel(activity.action, activity.table_name)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.created_at).toLocaleDateString('ar-IQ', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">لا توجد أنشطة حديثة</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Subscribers by Plan */}
              <ChartCard title="📊 توزيع المشتركين" delay="0.2s">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={subscribersByPlan}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {subscribersByPlan.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Tickets by Status */}
              <ChartCard title="🎫 حالة التذاكر" className="lg:col-span-2" delay="0.3s">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ticketsByStatus}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="hsl(220, 90%, 56%)" name="عدد التذاكر" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default Dashboard;
