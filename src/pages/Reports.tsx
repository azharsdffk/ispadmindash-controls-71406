import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, FileText, Wrench, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

const Reports = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      // Load subscribers count
      const { count: subscribersCount } = await supabase
        .from("subscribers")
        .select("*", { count: "exact", head: true });

      // Load invoices data
      const { data: invoices } = await supabase
        .from("invoices")
        .select("status, net_amount");

      const pendingInvoices = invoices?.filter(i => i.status === "pending").length || 0;
      const totalRevenue = invoices?.reduce((sum, inv) => sum + (Number(inv.net_amount) || 0), 0) || 0;

      // Load vouchers (expenses)
      const { data: vouchers } = await supabase
        .from("vouchers")
        .select("amount")
        .eq("voucher_type", "expense");

      const totalExpenses = vouchers?.reduce((sum, v) => sum + (Number(v.amount) || 0), 0) || 0;

      // Load maintenance tickets
      const { data: tickets } = await supabase
        .from("maintenance_tickets")
        .select("status");

      const openTickets = tickets?.filter(t => t.status === "open" || t.status === "in_progress").length || 0;
      const resolvedTickets = tickets?.filter(t => t.status === "closed" || t.status === "resolved").length || 0;

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

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1 w-full">
        <AppSidebar />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">التقارير والإحصائيات</h1>
            </div>

            {/* Subscribers Report */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  تقرير المشتركين
                </CardTitle>
                <CardDescription>إحصائيات المشتركين في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">إجمالي المشتركين</p>
                    <p className="text-2xl font-bold">{stats.totalSubscribers}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">المشتركين النشطين</p>
                    <p className="text-2xl font-bold text-success">{stats.activeSubscribers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Report */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  التقرير المالي
                </CardTitle>
                <CardDescription>ملخص الإيرادات والمصروفات</CardDescription>
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

            {/* Invoices Report */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  تقرير الفواتير
                </CardTitle>
                <CardDescription>إحصائيات الفواتير</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">إجمالي الفواتير</p>
                    <p className="text-2xl font-bold">{stats.totalInvoices}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">الفواتير المعلقة</p>
                    <p className="text-2xl font-bold text-warning">{stats.pendingInvoices}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Report */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  تقرير الصيانة
                </CardTitle>
                <CardDescription>إحصائيات تذاكر الصيانة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">التذاكر المفتوحة</p>
                    <p className="text-2xl font-bold text-warning">{stats.openTickets}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">التذاكر المكتملة</p>
                    <p className="text-2xl font-bold text-success">{stats.resolvedTickets}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default Reports;
