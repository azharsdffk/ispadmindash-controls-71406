import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Download, Calendar, RefreshCw, Sparkles, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ExportReportModal } from "@/components/reports/ExportReportModal";
import { KPICards } from "@/components/reports/KPICards";
import { QuickReports } from "@/components/reports/QuickReports";
import { AdvancedCharts } from "@/components/reports/AdvancedCharts";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { Badge } from "@/components/ui/badge";

const Reports = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      const { count: subscribersCount } = await supabase
        .from("subscribers")
        .select("*", { count: "exact", head: true });

      const { data: invoices } = await supabase
        .from("invoices")
        .select("status, net_amount, created_at, issue_date")
        .gte('issue_date', dateRange.from)
        .lte('issue_date', dateRange.to);

      const pendingInvoices = invoices?.filter(i => i.status === "pending").length || 0;
      const totalRevenue = invoices?.reduce((sum, inv) => sum + (Number(inv.net_amount) || 0), 0) || 0;

      const { data: vouchers } = await supabase
        .from("vouchers")
        .select("amount, created_at")
        .eq("voucher_type", "expense")
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to);

      const totalExpenses = vouchers?.reduce((sum, v) => sum + (Number(v.amount) || 0), 0) || 0;

      const { data: tickets } = await supabase
        .from("maintenance_tickets")
        .select("status");

      const openTickets = tickets?.filter(t => t.status === "open" || t.status === "in_progress").length || 0;
      const resolvedTickets = tickets?.filter(t => t.status === "closed" || t.status === "resolved").length || 0;

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

      const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];
      const mockMonthlyData = months.map((month) => ({
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
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">جاري تحميل التقارير...</p>
        </div>
      </div>
    );
  }

  const netProfit = stats.totalRevenue - stats.totalExpenses;
  const profitMargin = stats.totalRevenue > 0 ? ((netProfit / stats.totalRevenue) * 100).toFixed(1) : 0;

  const reportData = {
    period: `${dateRange.from} - ${dateRange.to}`,
    stats,
    netProfit,
    profitMargin,
    generatedAt: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1 w-full">
        <AppSidebar />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">التقارير والتحليلات</h1>
                  <p className="text-muted-foreground text-sm">تحليلات شاملة وتقارير مفصلة</p>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  متقدم
                </Badge>
              </div>
              <Button onClick={() => setExportOpen(true)} className="gap-2">
                <Download className="h-4 w-4" />
                تصدير التقرير
              </Button>
            </div>

            {/* Date Range Filter */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-primary" />
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
                    <Button onClick={() => loadReports()} className="w-full gap-2">
                      <RefreshCw className="h-4 w-4" />
                      تحديث التقرير
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 h-12">
                <TabsTrigger value="overview" className="text-base">نظرة عامة</TabsTrigger>
                <TabsTrigger value="analytics" className="text-base gap-2">
                  <TrendingUp className="h-4 w-4" />
                  التحليلات المتقدمة
                </TabsTrigger>
                <TabsTrigger value="charts" className="text-base">الرسوم البيانية</TabsTrigger>
                <TabsTrigger value="reports" className="text-base">التقارير السريعة</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <KPICards stats={stats} netProfit={netProfit} profitMargin={profitMargin} />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <AnalyticsDashboard dateRange={dateRange} />
              </TabsContent>

              <TabsContent value="charts" className="space-y-6">
                <AdvancedCharts 
                  monthlyData={monthlyData} 
                  paymentMethods={paymentMethods} 
                  stats={stats}
                  netProfit={netProfit}
                />
              </TabsContent>

              <TabsContent value="reports" className="space-y-6">
                <QuickReports dateRange={dateRange} />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ExportReportModal 
        open={exportOpen} 
        onOpenChange={setExportOpen} 
        reportData={reportData}
        dateRange={dateRange}
      />
    </div>
  );
};

export default Reports;
