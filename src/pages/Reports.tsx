import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, FileText, Wrench, DollarSign, TrendingUp, TrendingDown, Download, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const Reports = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    activeSubscribers: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    openTickets: 0,
    resolvedTickets: 0,
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [revenueByPlan, setRevenueByPlan] = useState<any[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      // Load subscribers count
      const { count: subscribersCount } = await supabase
        .from("subscribers")
        .select("*", { count: "exact", head: true });

      // Load invoices data
      const { data: invoices } = await supabase
        .from("invoices")
        .select("status, net_amount, created_at, issue_date")
        .gte('issue_date', dateRange.from)
        .lte('issue_date', dateRange.to);

      const pendingInvoices = invoices?.filter(i => i.status === "pending").length || 0;
      const totalRevenue = invoices?.reduce((sum, inv) => sum + (Number(inv.net_amount) || 0), 0) || 0;

      // Load vouchers (expenses)
      const { data: vouchers } = await supabase
        .from("vouchers")
        .select("amount, created_at")
        .eq("voucher_type", "expense")
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to);

      const totalExpenses = vouchers?.reduce((sum, v) => sum + (Number(v.amount) || 0), 0) || 0;

      // Load maintenance tickets
      const { data: tickets } = await supabase
        .from("maintenance_tickets")
        .select("status");

      const openTickets = tickets?.filter(t => t.status === "open" || t.status === "in_progress").length || 0;
      const resolvedTickets = tickets?.filter(t => t.status === "closed" || t.status === "resolved").length || 0;

      // Load payments by method
      const { data: payments } = await supabase
        .from("payments")
        .select("payment_method, amount")
        .gte('payment_date', dateRange.from)
        .lte('payment_date', dateRange.to);

      const methodCounts = payments?.reduce((acc: any, payment) => {
        const method = payment.payment_method || 'other';
        if (!acc[method]) {
          acc[method] = { name: method === 'cash' ? 'نقدي' : method === 'card' ? 'بطاقة' : 'حوالة', value: 0 };
        }
        acc[method].value += Number(payment.amount) || 0;
        return acc;
      }, {});

      setPaymentMethods(Object.values(methodCounts || {}));

      // Revenue by plan (mock data for now)
      const { data: subscribers } = await supabase
        .from("subscribers")
        .select("plan");

      const planRevenue = subscribers?.reduce((acc: any, sub) => {
        const plan = sub.plan || 'غير محدد';
        acc[plan] = (acc[plan] || 0) + 1;
        return acc;
      }, {});

      setRevenueByPlan(Object.entries(planRevenue || {}).map(([name, count]) => ({
        name,
        subscribers: count,
      })));

      // Monthly data (mock for visualization)
      const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];
      const mockMonthlyData = months.map((month, index) => ({
        month,
        revenue: Math.floor(40000 + Math.random() * 30000),
        expenses: Math.floor(20000 + Math.random() * 15000),
      }));

      setMonthlyData(mockMonthlyData);

      setStats({
        totalSubscribers: subscribersCount || 0,
        activeSubscribers: subscribersCount || 0,
        totalInvoices: invoices?.length || 0,
        pendingInvoices,
        totalRevenue,
        totalExpenses,
        openTickets,
        resolvedTickets,
      });
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }


  const netProfit = stats.totalRevenue - stats.totalExpenses;
  const profitMargin = stats.totalRevenue > 0 ? ((netProfit / stats.totalRevenue) * 100).toFixed(1) : 0;

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

  const exportReport = () => {
    const data = {
      period: `${dateRange.from} - ${dateRange.to}`,
      stats,
      netProfit,
      profitMargin,
      generatedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1 w-full">
        <AppSidebar />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">التقارير المالية المتقدمة</h1>
              </div>
              <Button onClick={exportReport} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                تصدير التقرير
              </Button>
            </div>

            {/* Date Range Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  الفترة الزمنية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="from">من</Label>
                    <Input
                      id="from"
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="to">إلى</Label>
                    <Input
                      id="to"
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={loadReports} className="w-full">
                      تحديث التقرير
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
                <TabsTrigger value="financial">التحليل المالي</TabsTrigger>
                <TabsTrigger value="subscribers">المشتركين</TabsTrigger>
                <TabsTrigger value="maintenance">الصيانة</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">

            {/* Financial Report */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  الملخص المالي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">إجمالي الإيرادات</p>
                    <p className="text-2xl font-bold text-success flex items-center gap-2">
                      {formatCurrency(stats.totalRevenue)}
                      <TrendingUp className="h-5 w-5" />
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">إجمالي المصروفات</p>
                    <p className="text-2xl font-bold text-destructive flex items-center gap-2">
                      {formatCurrency(stats.totalExpenses)}
                      <TrendingDown className="h-5 w-5" />
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">صافي الربح</p>
                    <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(netProfit)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">هامش ربح: {profitMargin}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">المشتركين</p>
                    <p className="text-2xl font-bold">{stats.totalSubscribers}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <FileText className="h-8 w-8 text-warning mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">فواتير معلقة</p>
                    <p className="text-2xl font-bold">{stats.pendingInvoices}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Wrench className="h-8 w-8 text-destructive mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">تذاكر مفتوحة</p>
                    <p className="text-2xl font-bold">{stats.openTickets}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 text-success mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">تذاكر محلولة</p>
                    <p className="text-2xl font-bold">{stats.resolvedTickets}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              {/* Monthly Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>الإيرادات والمصروفات الشهرية</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="hsl(var(--success))" strokeWidth={2} name="الإيرادات" />
                      <Line type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" strokeWidth={2} name="المصروفات" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Payment Methods Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>التوزيع حسب طريقة الدفع</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={paymentMethods}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {paymentMethods.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>تحليل التدفق النقدي</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-success/10 rounded-lg border border-success">
                        <p className="text-sm font-medium text-success mb-1">التدفقات الداخلة</p>
                        <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                      </div>
                      <div className="p-4 bg-destructive/10 rounded-lg border border-destructive">
                        <p className="text-sm font-medium text-destructive mb-1">التدفقات الخارجة</p>
                        <p className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</p>
                      </div>
                      <div className="p-4 bg-primary/10 rounded-lg border border-primary">
                        <p className="text-sm font-medium text-primary mb-1">صافي التدفق النقدي</p>
                        <p className="text-2xl font-bold">{formatCurrency(netProfit)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="subscribers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>المشتركين حسب الباقة</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueByPlan}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="subscribers" fill="hsl(var(--primary))" name="عدد المشتركين" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>معدل النمو</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-success mb-2">+12%</p>
                      <p className="text-sm text-muted-foreground">مقارنة بالشهر السابق</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>معدل الاحتفاظ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-primary mb-2">94%</p>
                      <p className="text-sm text-muted-foreground">معدل بقاء العملاء</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>حالة التذاكر</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg">
                        <span className="font-medium">مفتوحة</span>
                        <span className="text-xl font-bold">{stats.openTickets}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                        <span className="font-medium">محلولة</span>
                        <span className="text-xl font-bold">{stats.resolvedTickets}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>متوسط وقت الحل</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-4xl font-bold mb-2">2.5</p>
                      <p className="text-sm text-muted-foreground">ساعة في المتوسط</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default Reports;
