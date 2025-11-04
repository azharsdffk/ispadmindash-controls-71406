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

  // توجيه الفني تلقائياً إلى صفحته الخاصة
  useEffect(() => {
    if (!loading && isTechnician) {
      navigate('/technician');
    }
  }, [isTechnician, loading, navigate]);

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
    toast.info("جاري فتح معاينة الطباعة...");
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
      <div className="min-h-screen bg-background flex w-full" dir="rtl">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
          
          <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Quick Access to Accountant Dashboard - For Admins Only */}
            {isAdmin && (
              <Card 
                className="glass-effect hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-primary/20 hover:border-primary/40 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950"
                onClick={() => navigate('/accountant')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg">
                        <Calculator className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">لوحة المحاسب المتقدمة</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          الوصول إلى النظام المحاسبي الاحترافي - التقارير، القيود، دفتر الأستاذ، والرسوم البيانية
                        </p>
                      </div>
                    </div>
                    <ArrowLeft className="h-6 w-6 text-primary animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Cards - محسّنة */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">إجمالي المشتركين</CardTitle>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">1,234</div>
                  <p className="text-xs text-success flex items-center gap-1 mt-2">
                    <TrendingUp className="h-3 w-3" />
                    +12% من الشهر الماضي
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-warning">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">الفواتير المعلقة</CardTitle>
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <FileText className="h-5 w-5 text-warning" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">234</div>
                  <p className="text-xs text-muted-foreground mt-2">بقيمة 125,000 دينار عراقي</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-destructive">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">تذاكر الصيانة</CardTitle>
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <Wrench className="h-5 w-5 text-destructive" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">45</div>
                  <p className="text-xs text-warning flex items-center gap-1 mt-2">
                    <AlertCircle className="h-3 w-3" />
                    12 تذكرة عاجلة
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-success">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">الإيرادات الشهرية</CardTitle>
                  <div className="p-2 bg-success/10 rounded-lg">
                    <DollarSign className="h-5 w-5 text-success" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">450,000</div>
                  <p className="text-xs text-success flex items-center gap-1 mt-2">
                    <TrendingUp className="h-3 w-3" />
                    +8% من الشهر الماضي
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons - معاد تنظيمها */}
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  الإجراءات السريعة
                </CardTitle>
                <CardDescription>العمليات الأساسية والأكثر استخداماً</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* العمليات الأساسية */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    العمليات الأساسية
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button
                      onClick={() => setAddSubscriberOpen(true)}
                      className="h-auto py-4 flex-col gap-2 bg-primary hover:bg-primary/90"
                      title="إضافة مشترك جديد"
                    >
                      <UserPlus className="h-6 w-6" />
                      <span className="text-sm font-medium">إضافة مشترك</span>
                    </Button>

                    <Button
                      onClick={() => setIssueInvoiceOpen(true)}
                      className="h-auto py-4 flex-col gap-2 bg-blue-600 hover:bg-blue-700"
                      title="إصدار فاتورة جديدة"
                    >
                      <FileText className="h-6 w-6" />
                      <span className="text-sm font-medium">فاتورة جديدة</span>
                    </Button>

                    <Button
                      onClick={() => setMaintenanceTicketOpen(true)}
                      className="h-auto py-4 flex-col gap-2 bg-orange-600 hover:bg-orange-700"
                      title="فتح تذكرة صيانة"
                    >
                      <Wrench className="h-6 w-6" />
                      <span className="text-sm font-medium">تذكرة صيانة</span>
                    </Button>

                    <Button
                      onClick={() => setScheduleTechOpen(true)}
                      variant="secondary"
                      className="h-auto py-4 flex-col gap-2"
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
                    <DollarSign className="h-4 w-4" />
                    السندات المالية
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Button
                      className="h-auto py-4 flex-col gap-2 bg-success hover:bg-success/90"
                      title="إصدار سند قبض"
                      onClick={() => setReceiptOpen(true)}
                    >
                      <DollarSign className="h-6 w-6" />
                      <span className="text-sm font-medium">سند قبض</span>
                    </Button>

                    <Button
                      className="h-auto py-4 flex-col gap-2 bg-warning hover:bg-warning/90"
                      title="إصدار سند صرف"
                      onClick={() => setVoucherOpen(true)}
                    >
                      <DollarSign className="h-6 w-6" />
                      <span className="text-sm font-medium">سند صرف</span>
                    </Button>

                    <Button
                      variant="secondary"
                      className="h-auto py-4 flex-col gap-2"
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
                    <Calculator className="h-4 w-4" />
                    أدوات إضافية
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex-col gap-2 hover:bg-accent"
                      title="تحديث البيانات (Ctrl+R)"
                      onClick={handleRefresh}
                    >
                      <RefreshCw className="h-5 w-5" />
                      <span className="text-sm font-medium">تحديث</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-auto py-4 flex-col gap-2 hover:bg-accent"
                      title="طباعة (Ctrl+P)"
                      onClick={handlePrint}
                    >
                      <Printer className="h-5 w-5" />
                      <span className="text-sm font-medium">طباعة</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-auto py-4 flex-col gap-2 hover:bg-accent"
                      title="رجوع"
                      onClick={handleBack}
                    >
                      <ArrowLeft className="h-5 w-5" />
                      <span className="text-sm font-medium">رجوع</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity - محسّن */}
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-purple-500/5 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  النشاط الأخير
                </CardTitle>
                <CardDescription>آخر العمليات والأحداث في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-xl border border-primary/10 hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserPlus className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">تم إضافة مشترك جديد</p>
                        <p className="text-sm text-muted-foreground">أحمد محمد - 0501234567</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">منذ 5 دقائق</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-success/5 to-transparent rounded-xl border border-success/10 hover:border-success/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-success" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">تم إصدار فاتورة</p>
                        <p className="text-sm text-muted-foreground">فاتورة #1234 - 500 دينار عراقي</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">منذ 15 دقيقة</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-warning/5 to-transparent rounded-xl border border-warning/10 hover:border-warning/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                        <Wrench className="h-6 w-6 text-warning" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">تذكرة صيانة جديدة</p>
                        <p className="text-sm text-muted-foreground">انقطاع الإنترنت - عالية</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">منذ 30 دقيقة</span>
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
      <AIChatbot />
      </div>
    </SidebarProvider>
  );
};

export default Index;
