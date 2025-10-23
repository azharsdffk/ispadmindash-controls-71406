import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
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
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />

      <div className="flex flex-1 w-full">
        <AppSidebar />

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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي المشتركين</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-xs text-success flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" />
                    +12% من الشهر الماضي
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">الفواتير المعلقة</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">234</div>
                  <p className="text-xs text-muted-foreground mt-1">بقيمة 125,000 دينار عراقي</p>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">تذاكر الصيانة</CardTitle>
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">45</div>
                  <p className="text-xs text-warning flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    12 تذكرة عاجلة
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">الإيرادات الشهرية</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">450,000</div>
                  <p className="text-xs text-success flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" />
                    +8% من الشهر الماضي
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>الإجراءات السريعة</CardTitle>
                <CardDescription>العمليات الأساسية في النظام</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <Button
                    onClick={() => setAddSubscriberOpen(true)}
                    className="flex items-center gap-2 h-auto py-3 flex-col"
                    title="إضافة مشترك جديد"
                  >
                    <UserPlus className="h-5 w-5" />
                    <span>إضافة مشترك</span>
                  </Button>

                  <Button
                    onClick={() => setIssueInvoiceOpen(true)}
                    className="flex items-center gap-2 h-auto py-3 flex-col"
                    title="إصدار فاتورة جديدة"
                  >
                    <FileText className="h-5 w-5" />
                    <span>فاتورة جديدة</span>
                  </Button>

                  <Button
                    variant="default"
                    className="flex items-center gap-2 h-auto py-3 flex-col bg-success hover:bg-success/90"
                    title="إصدار سند قبض"
                    onClick={() => setReceiptOpen(true)}
                  >
                    <DollarSign className="h-5 w-5" />
                    <span>سند قبض</span>
                  </Button>

                  <Button
                    variant="default"
                    className="flex items-center gap-2 h-auto py-3 flex-col bg-warning hover:bg-warning/90"
                    title="إصدار سند صرف"
                    onClick={() => setVoucherOpen(true)}
                  >
                    <DollarSign className="h-5 w-5" />
                    <span>سند صرف</span>
                  </Button>

                  <Button
                    onClick={() => setMaintenanceTicketOpen(true)}
                    className="flex items-center gap-2 h-auto py-3 flex-col"
                    title="فتح تذكرة صيانة"
                  >
                    <Wrench className="h-5 w-5" />
                    <span>تذكرة صيانة</span>
                  </Button>

                  <Button
                    variant="secondary"
                    className="flex items-center gap-2 h-auto py-3 flex-col"
                    title="جدولة فني"
                    onClick={() => setScheduleTechOpen(true)}
                  >
                    <Calendar className="h-5 w-5" />
                    <span>جدولة فني</span>
                  </Button>

                  <Button
                    variant="secondary"
                    className="flex items-center gap-2 h-auto py-3 flex-col"
                    title="تطبيق خصم"
                    onClick={handleDiscount}
                  >
                    <Percent className="h-5 w-5" />
                    <span>خصم</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center gap-2 h-auto py-3 flex-col"
                    title="تحديث البيانات (Ctrl+R)"
                    onClick={handleRefresh}
                  >
                    <RefreshCw className="h-5 w-5" />
                    <span>تحديث</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center gap-2 h-auto py-3 flex-col"
                    title="طباعة (Ctrl+P)"
                    onClick={handlePrint}
                  >
                    <Printer className="h-5 w-5" />
                    <span>طباعة</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center gap-2 h-auto py-3 flex-col"
                    title="رجوع"
                    onClick={handleBack}
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span>رجوع</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>النشاط الأخير</CardTitle>
                <CardDescription>آخر العمليات في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserPlus className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">تم إضافة مشترك جديد</p>
                        <p className="text-sm text-muted-foreground">أحمد محمد - 0501234567</p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">منذ 5 دقائق</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium">تم إصدار فاتورة</p>
                        <p className="text-sm text-muted-foreground">فاتورة #1234 - 500 دينار عراقي</p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">منذ 15 دقيقة</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                        <Wrench className="h-5 w-5 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium">تذكرة صيانة جديدة</p>
                        <p className="text-sm text-muted-foreground">انقطاع الإنترنت - عالية</p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">منذ 30 دقيقة</span>
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
  );
};

export default Index;
