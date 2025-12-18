import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
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
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
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
  AlertCircle,
  Calculator,
  Zap,
  Activity,
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { isAccountant, isAdmin, isTechnician, loading } = useUserRole();
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

  // توجيه المستخدمين تلقائياً إلى لوحاتهم الخاصة
  useEffect(() => {
    if (!loading) {
      if (isTechnician && !isAdmin) {
        navigate('/technician');
      } else if (isAccountant && !isAdmin) {
        navigate('/accountant');
      }
    }
  }, [isTechnician, isAccountant, isAdmin, loading, navigate]);

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

  const handleRefresh = () => {
    toast.info("جاري تحديث البيانات...");
    setTimeout(() => {
      toast.success("تم تحديث البيانات بنجاح");
    }, 1000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    toast.info("العودة للخلف");
  };

  const handleDiscount = () => {
    toast.info("تطبيق خصم على العنصر المحدد");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full relative" dir="rtl">
        {/* الخلفية الفضائية */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-[20%] w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-40 left-[10%] w-80 h-80 bg-violet-500/5 rounded-full blur-[100px]" />
          <div className="absolute top-[60%] right-[60%] w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px]" />
        </div>
        
        <AppSidebar />
        
        <div className="flex-1 flex flex-col relative z-10">
          <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
          
          {/* ترويسة الطباعة */}
          <div className="print-header print-only">
            <h1>نظام إدارة المشتركين</h1>
            <p>تقرير بتاريخ: {new Date().toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          
          <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Quick Access Cards - For Admins Only */}
            {isAdmin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Admin Dashboard Link */}
                <div 
                  className="group relative cursor-pointer"
                  onClick={() => navigate('/admin')}
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-violet-500/50 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300" />
                  <Card className="relative glass-card border-white/[0.08] hover:border-primary/40">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-4 rounded-xl bg-gradient-to-br from-primary to-violet-600 shadow-lg">
                            <Users className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-foreground">لوحة الأدمن الشاملة</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              إدارة الفنيين، العملاء، المحاسبة، والتقارير المتقدمة
                            </p>
                          </div>
                        </div>
                        <ArrowLeft className="h-6 w-6 text-primary group-hover:translate-x-[-4px] transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Accountant Dashboard Link */}
                <div 
                  className="group relative cursor-pointer"
                  onClick={() => navigate('/accountant')}
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/50 to-primary/50 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300" />
                  <Card className="relative glass-card border-white/[0.08] hover:border-cyan-500/40">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500 to-primary shadow-lg">
                            <Calculator className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-foreground">لوحة المحاسب المتقدمة</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              النظام المحاسبي - التقارير، القيود، دفتر الأستاذ
                            </p>
                          </div>
                        </div>
                        <ArrowLeft className="h-6 w-6 text-cyan-400 group-hover:translate-x-[-4px] transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Stats Cards - محسّنة */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card 
                className="glass-card stat-card-hover cursor-pointer border-r-4 border-r-primary"
                onClick={() => setSubscribersListOpen(true)}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المشتركين</CardTitle>
                  <div className="p-2 bg-primary/20 rounded-xl">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">0</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    لا يوجد مشتركين
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="glass-card stat-card-hover cursor-pointer border-r-4 border-r-warning"
                onClick={() => setPendingInvoicesOpen(true)}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">الفواتير المعلقة</CardTitle>
                  <div className="p-2 bg-warning/20 rounded-xl">
                    <FileText className="h-5 w-5 text-warning" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">0</div>
                  <p className="text-xs text-muted-foreground mt-2">بقيمة 0 دينار عراقي</p>
                </CardContent>
              </Card>

              <Card 
                className="glass-card stat-card-hover cursor-pointer border-r-4 border-r-destructive"
                onClick={() => setMaintenanceTicketsOpen(true)}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">تذاكر الصيانة</CardTitle>
                  <div className="p-2 bg-destructive/20 rounded-xl">
                    <Wrench className="h-5 w-5 text-destructive" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">0</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    لا توجد تذاكر
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="glass-card stat-card-hover cursor-pointer border-r-4 border-r-success"
                onClick={() => setMonthlyRevenueOpen(true)}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">الإيرادات الشهرية</CardTitle>
                  <div className="p-2 bg-success/20 rounded-xl">
                    <DollarSign className="h-5 w-5 text-success" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">0</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    لا توجد إيرادات
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons - معاد تنظيمها */}
            <Card className="glass-card">
              <CardHeader className="border-b border-white/[0.06]">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <span className="gradient-text">الإجراءات السريعة</span>
                </CardTitle>
                <CardDescription>العمليات الأساسية والأكثر استخداماً</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* العمليات الأساسية */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    العمليات الأساسية
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button
                      onClick={() => setAddSubscriberOpen(true)}
                      className="h-auto py-4 flex-col gap-2 btn-futuristic rounded-xl"
                      title="إضافة مشترك جديد"
                    >
                      <UserPlus className="h-6 w-6" />
                      <span className="text-sm font-medium">إضافة مشترك</span>
                    </Button>

                    <Button
                      onClick={() => setIssueInvoiceOpen(true)}
                      className="h-auto py-4 flex-col gap-2 btn-futuristic rounded-xl"
                      title="إصدار فاتورة جديدة"
                    >
                      <FileText className="h-6 w-6" />
                      <span className="text-sm font-medium">فاتورة جديدة</span>
                    </Button>

                    <Button
                      onClick={() => setMaintenanceTicketOpen(true)}
                      className="h-auto py-4 flex-col gap-2 btn-futuristic rounded-xl"
                      title="فتح تذكرة صيانة"
                    >
                      <Wrench className="h-6 w-6" />
                      <span className="text-sm font-medium">تذكرة صيانة</span>
                    </Button>

                    <Button
                      onClick={() => setScheduleTechOpen(true)}
                      className="h-auto py-4 flex-col gap-2 bg-gradient-to-r from-cyan-600 to-primary text-white rounded-xl hover:from-cyan-500 hover:to-primary/90 transition-all"
                      title="جدولة فني"
                    >
                      <Calendar className="h-6 w-6" />
                      <span className="text-sm font-medium">جدولة فني</span>
                    </Button>
                  </div>
                </div>

                {/* السندات المالية */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    السندات المالية
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Button
                      className="h-auto py-4 flex-col gap-2 btn-futuristic rounded-xl"
                      title="إصدار سند قبض"
                      onClick={() => setReceiptOpen(true)}
                    >
                      <DollarSign className="h-6 w-6" />
                      <span className="text-sm font-medium">سند قبض</span>
                    </Button>

                    <Button
                      className="h-auto py-4 flex-col gap-2 btn-futuristic rounded-xl"
                      title="إصدار سند صرف"
                      onClick={() => setVoucherOpen(true)}
                    >
                      <DollarSign className="h-6 w-6" />
                      <span className="text-sm font-medium">سند صرف</span>
                    </Button>

                    <Button
                      className="h-auto py-4 flex-col gap-2 bg-gradient-to-r from-violet-600 to-primary text-white rounded-xl hover:from-violet-500 hover:to-primary/90 transition-all"
                      title="تطبيق خصم"
                      onClick={handleDiscount}
                    >
                      <Percent className="h-6 w-6" />
                      <span className="text-sm font-medium">خصم</span>
                    </Button>
                  </div>
                </div>

                {/* أدوات إضافية */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    أدوات إضافية
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex-col gap-2 border-white/[0.1] text-foreground hover:bg-white/[0.05] hover:border-primary/40 rounded-xl transition-all"
                      title="تحديث البيانات (Ctrl+R)"
                      onClick={handleRefresh}
                    >
                      <RefreshCw className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">تحديث</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-auto py-4 flex-col gap-2 border-white/[0.1] text-foreground hover:bg-white/[0.05] hover:border-primary/40 rounded-xl transition-all"
                      title="طباعة (Ctrl+P)"
                      onClick={handlePrint}
                    >
                      <Printer className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">طباعة</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-auto py-4 flex-col gap-2 border-white/[0.1] text-foreground hover:bg-white/[0.05] hover:border-primary/40 rounded-xl transition-all"
                      title="رجوع"
                      onClick={handleBack}
                    >
                      <ArrowLeft className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">رجوع</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity - محسّن */}
            <Card className="glass-card">
              <CardHeader className="border-b border-white/[0.06]">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-violet-500/20 rounded-lg">
                    <Activity className="h-5 w-5 text-violet-400" />
                  </div>
                  <span className="gradient-text">النشاط الأخير</span>
                </CardTitle>
                <CardDescription>آخر العمليات والأحداث في النظام</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10 hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <UserPlus className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">تم إضافة مشترك جديد</p>
                        <p className="text-sm text-muted-foreground">أحمد محمد - 0501234567</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground bg-white/[0.05] px-3 py-1.5 rounded-full border border-white/[0.08]">منذ 5 دقائق</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-success/5 rounded-xl border border-success/10 hover:border-success/30 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <FileText className="h-6 w-6 text-success" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">تم إصدار فاتورة</p>
                        <p className="text-sm text-muted-foreground">فاتورة #1234 - 500 دينار عراقي</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground bg-white/[0.05] px-3 py-1.5 rounded-full border border-white/[0.08]">منذ 15 دقيقة</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-warning/5 rounded-xl border border-warning/10 hover:border-warning/30 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Wrench className="h-6 w-6 text-warning" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">تذكرة صيانة جديدة</p>
                        <p className="text-sm text-muted-foreground">انقطاع الإنترنت - عالية</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground bg-white/[0.05] px-3 py-1.5 rounded-full border border-white/[0.08]">منذ 30 دقيقة</span>
                  </div>
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
      
      {/* تذييل الطباعة */}
      <div className="print-footer print-only">
        <p>تم إنشاء هذا التقرير بواسطة نظام إدارة المشتركين | {new Date().toLocaleDateString('ar-IQ')} - {new Date().toLocaleTimeString('ar-IQ')}</p>
      </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
