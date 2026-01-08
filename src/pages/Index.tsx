import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AppHeader } from "@/components/layout/AppHeader";
import { PendingUsersManager } from "@/components/admin/PendingUsersManager";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { AddSubscriberModal } from "@/components/modals/AddSubscriberModal";
import { IssueInvoiceModal } from "@/components/modals/IssueInvoiceModal";
import { MaintenanceTicketModal } from "@/components/modals/MaintenanceTicketModal";
import { ReceiptModal } from "@/components/modals/ReceiptModal";
import { VoucherModal } from "@/components/modals/VoucherModal";
import { ScheduleTechnicianModal } from "@/components/modals/ScheduleTechnicianModal";
import { SubscribersListModal } from "@/components/modals/SubscribersListModal";
import { PendingInvoicesModal } from "@/components/modals/PendingInvoicesModal";
import { MaintenanceTicketsListModal } from "@/components/modals/MaintenanceTicketsListModal";
import { MonthlyRevenueModal } from "@/components/modals/MonthlyRevenueModal";
import { AIChatbot } from "@/components/ai/AIChatbot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";
import {
  UserPlus,
  FileText,
  DollarSign,
  Wrench,
  Calendar,
  RefreshCw,
  Percent,
  Printer,
  ArrowLeft,
  Users,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calculator,
  Zap,
  Activity,
  CheckCircle,
  Clock,
  XCircle,
  Building,
  Wifi,
  Shield,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  PieChart,
  Target,
  Award,
  Bell,
  Settings,
  Eye,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface DashboardStats {
  totalSubscribers: number;
  activeSubscribers: number;
  inactiveSubscribers: number;
  pendingInvoices: number;
  pendingInvoicesAmount: number;
  paidInvoices: number;
  openTickets: number;
  resolvedTickets: number;
  monthlyRevenue: number;
  lastMonthRevenue: number;
  totalAgents: number;
  totalTechnicians: number;
}

interface RecentActivity {
  id: string;
  type: 'subscriber' | 'invoice' | 'ticket' | 'payment';
  title: string;
  description: string;
  timestamp: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { isAccountant, isAdmin, isTechnician, isClient, loading } = useUserRole();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addSubscriberOpen, setAddSubscriberOpen] = useState(false);
  const [issueInvoiceOpen, setIssueInvoiceOpen] = useState(false);
  const [maintenanceTicketOpen, setMaintenanceTicketOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [scheduleTechOpen, setScheduleTechOpen] = useState(false);
  const [subscribersListOpen, setSubscribersListOpen] = useState(false);
  const [pendingInvoicesOpen, setPendingInvoicesOpen] = useState(false);
  const [maintenanceTicketsOpen, setMaintenanceTicketsOpen] = useState(false);
  const [monthlyRevenueOpen, setMonthlyRevenueOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalSubscribers: 0,
    activeSubscribers: 0,
    inactiveSubscribers: 0,
    pendingInvoices: 0,
    pendingInvoicesAmount: 0,
    paidInvoices: 0,
    openTickets: 0,
    resolvedTickets: 0,
    monthlyRevenue: 0,
    lastMonthRevenue: 0,
    totalAgents: 0,
    totalTechnicians: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // توجيه المستخدمين تلقائياً إلى لوحاتهم الخاصة
  
  useEffect(() => {
    if (!loading) {
      if (isClient && !isAdmin) {
        navigate('/my-portal');
      } else if (isTechnician && !isAdmin) {
        navigate('/technician');
      } else if (isAccountant && !isAdmin) {
        navigate('/accountant');
      }
    }
  }, [isClient, isTechnician, isAccountant, isAdmin, loading, navigate]);

  // جلب الإحصائيات
  const fetchStats = async () => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // جلب المشتركين
      const { data: subscribers, error: subError } = await supabase
        .from('subscribers')
        .select('id, status_comment, created_at');
      
      if (subError) throw subError;

      // جلب الفواتير
      const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('id, status, amount, net_amount, issue_date');
      
      if (invError) throw invError;

      // جلب التذاكر
      const { data: tickets, error: ticketError } = await supabase
        .from('maintenance_tickets')
        .select('id, status, created_at');
      
      if (ticketError) throw ticketError;

      // جلب المدفوعات
      const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('id, amount, payment_date');
      
      if (payError) throw payError;

      // جلب الوكلاء
      const { data: agents, error: agentError } = await supabase
        .from('agents')
        .select('id');
      
      if (agentError) throw agentError;

      // جلب الفنيين
      const { data: technicians, error: techError } = await supabase
        .from('technicians')
        .select('id');
      
      if (techError) throw techError;

      // حساب الإحصائيات
      const activeSubscribers = subscribers?.filter(s => 
        s.status_comment?.toLowerCase().includes('active') || 
        s.status_comment?.toLowerCase().includes('نشط') ||
        !s.status_comment
      ).length || 0;

      const pendingInvoicesList = invoices?.filter(i => i.status === 'pending') || [];
      const paidInvoicesList = invoices?.filter(i => i.status === 'paid') || [];

      const openTicketsList = tickets?.filter(t => 
        t.status === 'in_progress'
      ) || [];
      const resolvedTicketsList = tickets?.filter(t => 
        t.status === 'resolved' || t.status === 'closed'
      ) || [];

      // إيرادات الشهر الحالي
      const currentMonthPayments = payments?.filter(p => {
        const paymentDate = new Date(p.payment_date);
        return paymentDate >= startOfMonth;
      }) || [];
      const monthlyRevenue = currentMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      // إيرادات الشهر الماضي
      const lastMonthPayments = payments?.filter(p => {
        const paymentDate = new Date(p.payment_date);
        return paymentDate >= startOfLastMonth && paymentDate <= endOfLastMonth;
      }) || [];
      const lastMonthRevenue = lastMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      setStats({
        totalSubscribers: subscribers?.length || 0,
        activeSubscribers,
        inactiveSubscribers: (subscribers?.length || 0) - activeSubscribers,
        pendingInvoices: pendingInvoicesList.length,
        pendingInvoicesAmount: pendingInvoicesList.reduce((sum, i) => sum + (i.net_amount || i.amount || 0), 0),
        paidInvoices: paidInvoicesList.length,
        openTickets: openTicketsList.length,
        resolvedTickets: resolvedTicketsList.length,
        monthlyRevenue,
        lastMonthRevenue,
        totalAgents: agents?.length || 0,
        totalTechnicians: technicians?.length || 0,
      });

      // بناء الأنشطة الأخيرة
      const activities: RecentActivity[] = [];

      // أحدث المشتركين
      const recentSubscribers = subscribers?.sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      ).slice(0, 2) || [];

      recentSubscribers.forEach(sub => {
        activities.push({
          id: sub.id,
          type: 'subscriber',
          title: 'مشترك جديد',
          description: `تم إضافة مشترك جديد للنظام`,
          timestamp: sub.created_at || '',
          icon: UserPlus,
          color: 'text-primary',
          bgColor: 'bg-primary/10',
        });
      });

      // أحدث التذاكر
      const recentTickets = tickets?.sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      ).slice(0, 2) || [];

      recentTickets.forEach(ticket => {
        activities.push({
          id: ticket.id,
          type: 'ticket',
          title: 'تذكرة صيانة',
          description: `حالة: ${ticket.status === 'open' ? 'مفتوحة' : ticket.status === 'resolved' ? 'محلولة' : ticket.status}`,
          timestamp: ticket.created_at || '',
          icon: Wrench,
          color: 'text-warning',
          bgColor: 'bg-warning/10',
        });
      });

      // ترتيب حسب التاريخ
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivities(activities.slice(0, 5));

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && (isAdmin || isAccountant)) {
      fetchStats();
    }
  }, [loading, isAdmin, isAccountant]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "s") {
        e.preventDefault();
        setSettingsOpen(true);
      }
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        toast.success("تم الحفظ بنجاح");
      }
      if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        toast.info("جاري تحضير الطباعة...");
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    toast.info("جاري تحديث البيانات...");
    await fetchStats();
    setRefreshing(false);
    toast.success("تم تحديث البيانات بنجاح");
  };

  const handlePrint = () => {
    window.print();
  };

  const formatTimeAgo = (timestamp: string) => {
    if (!timestamp) return 'غير معروف';
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${diffDays} يوم`;
  };

  const revenueChange = stats.lastMonthRevenue > 0 
    ? ((stats.monthlyRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue * 100).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>الصفحة الرئيسية | نظام إدارة الاشتراكات</title>
        <meta name="description" content="لوحة التحكم الرئيسية لنظام إدارة اشتراكات الإنترنت" />
      </Helmet>

      <SidebarProvider>
        <div className="min-h-screen bg-background flex w-full relative" dir="rtl">
          {/* الخلفية */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-[20%] w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-40 left-[10%] w-80 h-80 bg-violet-500/5 rounded-full blur-[100px]" />
            <div className="absolute top-[60%] right-[60%] w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px]" />
          </div>
          
          <AppSidebar />
          
          <div className="flex-1 flex flex-col relative z-10">
            <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
            
            <main className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-7xl mx-auto space-y-6">
                {/* الترحيب والإجراءات السريعة */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                      <Sparkles className="h-8 w-8 text-primary" />
                      مرحباً بك في لوحة التحكم
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      {new Date().toLocaleDateString('ar-IQ', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={refreshing}
                    >
                      <RefreshCw className={`h-4 w-4 ml-1 ${refreshing ? 'animate-spin' : ''}`} />
                      تحديث
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                    >
                      <Printer className="h-4 w-4 ml-1" />
                      طباعة
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setSettingsOpen(true)}
                    >
                      <Settings className="h-4 w-4 ml-1" />
                      الإعدادات
                    </Button>
                  </div>
                </div>

                {/* بطاقات الوصول السريع للأدمن */}
                {isAdmin && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card 
                      className="group cursor-pointer border-2 border-transparent hover:border-primary/30 transition-all duration-300 bg-gradient-to-br from-primary/5 to-primary/10"
                      onClick={() => navigate('/admin')}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-4 rounded-xl bg-gradient-to-br from-primary to-violet-600 shadow-lg group-hover:scale-110 transition-transform">
                              <Shield className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">لوحة الأدمن</h3>
                              <p className="text-sm text-muted-foreground">إدارة شاملة للنظام</p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-[-4px] transition-all" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card 
                      className="group cursor-pointer border-2 border-transparent hover:border-cyan-500/30 transition-all duration-300 bg-gradient-to-br from-cyan-500/5 to-cyan-500/10"
                      onClick={() => navigate('/accountant')}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg group-hover:scale-110 transition-transform">
                              <Calculator className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">لوحة المحاسب</h3>
                              <p className="text-sm text-muted-foreground">الإدارة المالية</p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-cyan-500 group-hover:translate-x-[-4px] transition-all" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card 
                      className="group cursor-pointer border-2 border-transparent hover:border-green-500/30 transition-all duration-300 bg-gradient-to-br from-green-500/5 to-green-500/10"
                      onClick={() => navigate('/reports')}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-4 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg group-hover:scale-110 transition-transform">
                              <BarChart3 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">التقارير</h3>
                              <p className="text-sm text-muted-foreground">تقارير وإحصائيات</p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-green-500 group-hover:translate-x-[-4px] transition-all" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* قسم المستخدمين المنتظرين الموافقة - للمدير فقط */}
                {isAdmin && (
                  <PendingUsersManager />
                )}

                {/* بطاقات الإحصائيات الرئيسية */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all border-r-4 border-r-primary group"
                    onClick={() => setSubscribersListOpen(true)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-primary/10 group-hover:scale-110 transition-transform">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {stats.activeSubscribers} نشط
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">إجمالي المشتركين</p>
                        <p className="text-2xl font-bold">
                          {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.totalSubscribers}
                        </p>
                      </div>
                      <Progress 
                        value={stats.totalSubscribers > 0 ? (stats.activeSubscribers / stats.totalSubscribers) * 100 : 0} 
                        className="h-1.5 mt-3" 
                      />
                    </CardContent>
                  </Card>

                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all border-r-4 border-r-warning group"
                    onClick={() => setPendingInvoicesOpen(true)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-warning/10 group-hover:scale-110 transition-transform">
                          <FileText className="h-5 w-5 text-warning" />
                        </div>
                        <Badge variant="outline" className="text-xs text-warning border-warning/30">
                          معلقة
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">الفواتير المعلقة</p>
                        <p className="text-2xl font-bold">
                          {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.pendingInvoices}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatCurrency(stats.pendingInvoicesAmount)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all border-r-4 border-r-destructive group"
                    onClick={() => setMaintenanceTicketsOpen(true)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-destructive/10 group-hover:scale-110 transition-transform">
                          <Wrench className="h-5 w-5 text-destructive" />
                        </div>
                        <Badge variant="outline" className="text-xs text-destructive border-destructive/30">
                          {stats.openTickets} مفتوحة
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">تذاكر الصيانة</p>
                        <p className="text-2xl font-bold">
                          {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.openTickets + stats.resolvedTickets}
                        </p>
                      </div>
                      <Progress 
                        value={(stats.openTickets + stats.resolvedTickets) > 0 
                          ? (stats.resolvedTickets / (stats.openTickets + stats.resolvedTickets)) * 100 
                          : 0
                        } 
                        className="h-1.5 mt-3" 
                      />
                    </CardContent>
                  </Card>

                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all border-r-4 border-r-green-500 group"
                    onClick={() => setMonthlyRevenueOpen(true)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-green-500/10 group-hover:scale-110 transition-transform">
                          <DollarSign className="h-5 w-5 text-green-500" />
                        </div>
                        {Number(revenueChange) >= 0 ? (
                          <Badge className="text-xs bg-green-500/10 text-green-500 hover:bg-green-500/20">
                            <TrendingUp className="h-3 w-3 ml-1" />
                            +{revenueChange}%
                          </Badge>
                        ) : (
                          <Badge className="text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20">
                            <TrendingDown className="h-3 w-3 ml-1" />
                            {revenueChange}%
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">الإيرادات الشهرية</p>
                        <p className="text-xl font-bold">
                          {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : formatCurrency(stats.monthlyRevenue)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* إحصائيات إضافية */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10">
                    <CardContent className="p-4 text-center">
                      <Building className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{stats.totalAgents}</p>
                      <p className="text-xs text-muted-foreground">الوكلاء</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10">
                    <CardContent className="p-4 text-center">
                      <Wrench className="h-6 w-6 text-green-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{stats.totalTechnicians}</p>
                      <p className="text-xs text-muted-foreground">الفنيين</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10">
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{stats.paidInvoices}</p>
                      <p className="text-xs text-muted-foreground">فواتير مدفوعة</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10">
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{stats.resolvedTickets}</p>
                      <p className="text-xs text-muted-foreground">تذاكر محلولة</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-cyan-500/5 to-cyan-500/10">
                    <CardContent className="p-4 text-center">
                      <Users className="h-6 w-6 text-cyan-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{stats.activeSubscribers}</p>
                      <p className="text-xs text-muted-foreground">مشتركين نشطين</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-500/5 to-red-500/10">
                    <CardContent className="p-4 text-center">
                      <XCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{stats.inactiveSubscribers}</p>
                      <p className="text-xs text-muted-foreground">غير نشطين</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* الإجراءات السريعة */}
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Zap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle>الإجراءات السريعة</CardTitle>
                          <CardDescription>العمليات الأساسية والأكثر استخداماً</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* العمليات الأساسية */}
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          العمليات الأساسية
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <Button
                            onClick={() => setAddSubscriberOpen(true)}
                            className="h-auto py-4 flex-col gap-2"
                            variant="outline"
                          >
                            <UserPlus className="h-5 w-5 text-primary" />
                            <span className="text-xs">إضافة مشترك</span>
                          </Button>

                          <Button
                            onClick={() => setIssueInvoiceOpen(true)}
                            className="h-auto py-4 flex-col gap-2"
                            variant="outline"
                          >
                            <FileText className="h-5 w-5 text-blue-500" />
                            <span className="text-xs">فاتورة جديدة</span>
                          </Button>

                          <Button
                            onClick={() => setMaintenanceTicketOpen(true)}
                            className="h-auto py-4 flex-col gap-2"
                            variant="outline"
                          >
                            <Wrench className="h-5 w-5 text-orange-500" />
                            <span className="text-xs">تذكرة صيانة</span>
                          </Button>

                          <Button
                            onClick={() => setScheduleTechOpen(true)}
                            className="h-auto py-4 flex-col gap-2"
                            variant="outline"
                          >
                            <Calendar className="h-5 w-5 text-green-500" />
                            <span className="text-xs">جدولة فني</span>
                          </Button>
                        </div>
                      </div>

                      {/* السندات المالية */}
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          السندات المالية
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                          <Button
                            onClick={() => setReceiptOpen(true)}
                            className="h-auto py-4 flex-col gap-2"
                            variant="outline"
                          >
                            <DollarSign className="h-5 w-5 text-green-500" />
                            <span className="text-xs">سند قبض</span>
                          </Button>

                          <Button
                            onClick={() => setVoucherOpen(true)}
                            className="h-auto py-4 flex-col gap-2"
                            variant="outline"
                          >
                            <DollarSign className="h-5 w-5 text-red-500" />
                            <span className="text-xs">سند صرف</span>
                          </Button>

                          <Button
                            onClick={() => navigate('/discounts')}
                            className="h-auto py-4 flex-col gap-2"
                            variant="outline"
                          >
                            <Percent className="h-5 w-5 text-purple-500" />
                            <span className="text-xs">الخصومات</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* النشاط الأخير */}
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-violet-500/10">
                            <Activity className="h-5 w-5 text-violet-500" />
                          </div>
                          <CardTitle className="text-base">النشاط الأخير</CardTitle>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/notifications')}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[280px]">
                        <div className="space-y-3">
                          {recentActivities.length > 0 ? (
                            recentActivities.map((activity) => {
                              const ActivityIcon = activity.icon;
                              return (
                                <div
                                  key={activity.id}
                                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                  <div className={`p-2 rounded-lg ${activity.bgColor}`}>
                                    <ActivityIcon className={`h-4 w-4 ${activity.color}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm">{activity.title}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {activity.description}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {formatTimeAgo(activity.timestamp)}
                                    </p>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">لا يوجد نشاط حديث</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                {/* روابط سريعة */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10">
                        <Target className="h-5 w-5 text-cyan-500" />
                      </div>
                      <div>
                        <CardTitle>الوصول السريع</CardTitle>
                        <CardDescription>انتقل مباشرة إلى الأقسام المختلفة</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {[
                        { label: 'المشتركين', icon: Users, path: '/subscribers', color: 'text-blue-500' },
                        { label: 'الفواتير', icon: FileText, path: '/invoices', color: 'text-green-500' },
                        { label: 'الصيانة', icon: Wrench, path: '/maintenance', color: 'text-orange-500' },
                        { label: 'العقود', icon: FileText, path: '/contracts', color: 'text-purple-500' },
                        { label: 'الوكلاء', icon: Building, path: '/agents', color: 'text-cyan-500' },
                        { label: 'المخزون', icon: Wrench, path: '/inventory', color: 'text-red-500' },
                      ].map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <Button
                            key={item.path}
                            variant="outline"
                            className="h-auto py-4 flex-col gap-2 hover:border-primary/30"
                            onClick={() => navigate(item.path)}
                          >
                            <ItemIcon className={`h-5 w-5 ${item.color}`} />
                            <span className="text-xs">{item.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </main>
          </div>

          <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
          <AddSubscriberModal open={addSubscriberOpen} onOpenChange={setAddSubscriberOpen} />
          <IssueInvoiceModal open={issueInvoiceOpen} onOpenChange={setIssueInvoiceOpen} />
          <MaintenanceTicketModal open={maintenanceTicketOpen} onOpenChange={setMaintenanceTicketOpen} />
          <ReceiptModal open={receiptOpen} onOpenChange={setReceiptOpen} />
          <VoucherModal open={voucherOpen} onOpenChange={setVoucherOpen} />
          <ScheduleTechnicianModal open={scheduleTechOpen} onOpenChange={setScheduleTechOpen} />
          <SubscribersListModal open={subscribersListOpen} onOpenChange={setSubscribersListOpen} />
          <PendingInvoicesModal open={pendingInvoicesOpen} onOpenChange={setPendingInvoicesOpen} />
          <MaintenanceTicketsListModal open={maintenanceTicketsOpen} onOpenChange={setMaintenanceTicketsOpen} />
          <MonthlyRevenueModal open={monthlyRevenueOpen} onOpenChange={setMonthlyRevenueOpen} />
          <AIChatbot />
        </div>
      </SidebarProvider>
    </>
  );
};

export default Index;
