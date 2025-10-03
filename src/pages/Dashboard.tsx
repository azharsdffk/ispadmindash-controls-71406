import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Users, TrendingUp, DollarSign, Wrench, CalendarCheck, AlertCircle } from "lucide-react";

const Dashboard = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    activeSubscribers: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    openTickets: 0,
    urgentTickets: 0,
  });

  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [subscribersByPlan, setSubscribersByPlan] = useState<any[]>([]);
  const [ticketsByStatus, setTicketsByStatus] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
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
      
      const openTickets = tickets?.filter(t => t.status === 'open').length || 0;
      const urgentTickets = tickets?.filter(t => t.priority === 'high').length || 0;

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

      setStats({
        totalSubscribers: subscribersCount || 0,
        activeSubscribers: subscribersCount || 0,
        totalRevenue,
        pendingInvoices,
        openTickets,
        urgentTickets,
      });

      setMonthlyRevenue(revenueData);
      setSubscribersByPlan(planData);
      setTicketsByStatus(ticketsData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1 w-full">
        <AppSidebar />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">لوحة التحكم المتقدمة</h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="stat-card-hover animate-fade-in border-l-4 border-l-primary">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي المشتركين</CardTitle>
                  <div className="p-3 rounded-lg bg-gradient-primary">
                    <Users className="h-5 w-5 text-primary-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gradient-primary">{stats.totalSubscribers}</div>
                  <p className="text-xs text-success flex items-center gap-1 mt-2">
                    <TrendingUp className="h-3 w-3" />
                    {stats.activeSubscribers} نشط
                  </p>
                </CardContent>
              </Card>

              <Card className="stat-card-hover animate-fade-in border-l-4 border-l-success" style={{animationDelay: '0.1s'}}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">الإيرادات الكلية</CardTitle>
                  <div className="p-3 rounded-lg bg-gradient-success">
                    <DollarSign className="h-5 w-5 text-success-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gradient-success">{stats.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.pendingInvoices} فاتورة معلقة
                  </p>
                </CardContent>
              </Card>

              <Card className="stat-card-hover animate-fade-in border-l-4 border-l-warning" style={{animationDelay: '0.2s'}}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">تذاكر الصيانة</CardTitle>
                  <div className="p-3 rounded-lg bg-gradient-warning">
                    <Wrench className="h-5 w-5 text-warning-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.openTickets}</div>
                  <p className="text-xs text-destructive flex items-center gap-1 mt-2">
                    <AlertCircle className="h-3 w-3" />
                    {stats.urgentTickets} عاجلة
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Revenue Chart */}
              <Card className="animate-slide-up glass-effect">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📈 الإيرادات الشهرية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} name="الإيرادات" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Subscribers by Plan */}
              <Card className="animate-slide-up glass-effect" style={{animationDelay: '0.1s'}}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📊 توزيع المشتركين حسب الباقة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={subscribersByPlan}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
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
                </CardContent>
              </Card>

              {/* Tickets by Status */}
              <Card className="lg:col-span-2 animate-slide-up glass-effect" style={{animationDelay: '0.2s'}}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🎫 حالة تذاكر الصيانة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ticketsByStatus}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="hsl(var(--primary))" name="عدد التذاكر" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default Dashboard;
