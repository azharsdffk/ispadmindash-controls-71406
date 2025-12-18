import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  QrCode,
  Wrench,
  Play,
  Square,
  Camera,
  History,
  Lightbulb,
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  Image,
  User,
  Phone,
  Mail,
  Calendar,
  Star,
  Trophy,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import WorkOrderDetailCard from "@/components/technician/WorkOrderDetailCard";
import DiagnosisChecklist from "@/components/technician/DiagnosisChecklist";
import TechnicianStatsCard from "@/components/technician/TechnicianStatsCard";
import WorkReportModal from "@/components/technician/WorkReportModal";

interface TechnicianInfo {
  id: string;
  full_name: string;
  phone: string | null;
  username: string | null;
}

interface WorkOrder {
  id: string;
  ticket_number: string;
  issue_description: string;
  issue_type: string | null;
  priority: string;
  status: string;
  scheduled_date: string | null;
  subscriber: {
    name: string;
    phone: string;
    address: string | null;
  };
}

interface WorkLog {
  id: string;
  ticket_id: string;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
  status: string;
  notes: string | null;
  ticket: {
    ticket_number: string;
    issue_description: string;
  };
}

interface SmartSuggestion {
  issue: string;
  solutions: string[];
}

const smartSuggestions: SmartSuggestion[] = [
  {
    issue: "ضعف بالخدمة",
    solutions: [
      "فحص مستوى إشارة الـ ONT",
      "التحقق من توصيلات الكابل",
      "إعادة تشغيل جهاز الراوتر",
      "فحص الـ Splitter",
    ],
  },
  {
    issue: "تبديل جهاز الـ ONT",
    solutions: [
      "تسجيل الرقم التسلسلي الجديد",
      "تحديث إعدادات الشبكة",
      "اختبار السرعة بعد التبديل",
      "التأكد من تفعيل الجهاز",
    ],
  },
  {
    issue: "قطع في الكابل الرئيسي",
    solutions: [
      "تحديد موقع القطع بدقة",
      "استخدام OTDR للفحص",
      "لحام الكابل أو التبديل",
      "اختبار الخط بعد الإصلاح",
    ],
  },
  {
    issue: "الأجهزة لا تعمل بسبب تغير فولتية الكهرباء",
    solutions: [
      "فحص مصدر الطاقة",
      "تركيب UPS للحماية",
      "فحص الأجهزة التالفة",
      "تبديل المحول الكهربائي",
    ],
  },
  {
    issue: "فيشة مكسورة",
    solutions: [
      "تحديد نوع الفيشة المطلوبة",
      "تنظيف طرف الكابل",
      "تركيب فيشة جديدة",
      "اختبار الاتصال",
    ],
  },
];

const TechnicianProfile = () => {
  const { user } = useAuth();
  const [technicianInfo, setTechnicianInfo] = useState<TechnicianInfo | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [activeWorkLog, setActiveWorkLog] = useState<WorkLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoType, setPhotoType] = useState<"before" | "after">("before");
  const [showDiagnosisDialog, setShowDiagnosisDialog] = useState(false);
  const [diagnosisIssueType, setDiagnosisIssueType] = useState<string | null>(null);
  const [showWorkReportModal, setShowWorkReportModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);

  useEffect(() => {
    if (user) {
      fetchTechnicianData();
    }
  }, [user]);

  const fetchTechnicianData = async () => {
    if (!user) return;

    try {
      // Fetch technician profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      setTechnicianInfo({
        id: profile.id,
        full_name: profile.full_name,
        phone: profile.phone,
        username: profile.username,
      });

      // Fetch work orders (assigned tickets)
      const { data: tickets, error: ticketsError } = await supabase
        .from("maintenance_tickets")
        .select(`
          id,
          ticket_number,
          issue_description,
          issue_type,
          priority,
          status,
          scheduled_date,
          subscribers:subscriber_id (
            name,
            phone,
            address
          )
        `)
        .eq("technician_id", user.id)
        .in("status", ["open", "in_progress"])
        .order("created_at", { ascending: false });

      if (ticketsError) throw ticketsError;

      const formattedOrders = (tickets || []).map((ticket: any) => ({
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        issue_description: ticket.issue_description,
        issue_type: ticket.issue_type,
        priority: ticket.priority,
        status: ticket.status,
        scheduled_date: ticket.scheduled_date,
        subscriber: {
          name: ticket.subscribers?.name || "غير معروف",
          phone: ticket.subscribers?.phone || "",
          address: ticket.subscribers?.address || null,
        },
      }));

      setWorkOrders(formattedOrders);

      // Fetch work logs
      const { data: logs, error: logsError } = await supabase
        .from("work_logs")
        .select(`
          *,
          maintenance_tickets:ticket_id (
            ticket_number,
            issue_description
          )
        `)
        .eq("technician_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (logsError) throw logsError;

      const formattedLogs = (logs || []).map((log: any) => ({
        ...log,
        ticket: {
          ticket_number: log.maintenance_tickets?.ticket_number || "",
          issue_description: log.maintenance_tickets?.issue_description || "",
        },
      }));

      setWorkLogs(formattedLogs);

      // Check for active work
      const activeLog = formattedLogs.find((log: WorkLog) => log.status === "in_progress");
      setActiveWorkLog(activeLog || null);

    } catch (error) {
      console.error("Error fetching technician data:", error);
      toast.error("حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleStartWork = async (ticketId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("work_logs")
        .insert({
          ticket_id: ticketId,
          technician_id: user.id,
          started_at: new Date().toISOString(),
          status: "in_progress",
        })
        .select()
        .single();

      if (error) throw error;

      // Update ticket status
      await supabase
        .from("maintenance_tickets")
        .update({ status: "in_progress" })
        .eq("id", ticketId);

      toast.success("تم بدء العمل بنجاح");
      fetchTechnicianData();
    } catch (error) {
      console.error("Error starting work:", error);
      toast.error("حدث خطأ في بدء العمل");
    }
  };

  const handleEndWork = async (workLogId: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from("work_logs")
        .update({
          ended_at: new Date().toISOString(),
          status: "completed",
          notes: notes || null,
        })
        .eq("id", workLogId);

      if (error) throw error;

      // Update ticket status
      if (activeWorkLog) {
        await supabase
          .from("maintenance_tickets")
          .update({ status: "resolved", resolved_at: new Date().toISOString() })
          .eq("id", activeWorkLog.ticket_id);
      }

      toast.success("تم إنهاء العمل بنجاح");
      setActiveWorkLog(null);
      fetchTechnicianData();
    } catch (error) {
      console.error("Error ending work:", error);
      toast.error("حدث خطأ في إنهاء العمل");
    }
  };

  const openDiagnosisDialog = (issueType: string) => {
    setDiagnosisIssueType(issueType);
    setShowDiagnosisDialog(true);
  };

  const openWorkReportModal = () => {
    if (activeWorkLog) {
      const order = workOrders.find(o => o.id === activeWorkLog.ticket_id);
      if (order) {
        setSelectedOrder(order);
        setShowWorkReportModal(true);
      }
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !activeWorkLog || !user) return;

    const file = event.target.files[0];
    setUploadingPhoto(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${activeWorkLog.ticket_id}/${photoType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("work-photos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("work-photos")
        .getPublicUrl(fileName);

      // Save photo record
      const { error: insertError } = await supabase.from("work_photos").insert({
        work_log_id: activeWorkLog.id,
        ticket_id: activeWorkLog.ticket_id,
        technician_id: user.id,
        photo_type: photoType,
        photo_url: urlData.publicUrl,
      });

      if (insertError) throw insertError;

      toast.success(`تم رفع صورة ${photoType === "before" ? "قبل" : "بعد"} بنجاح`);
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("حدث خطأ في رفع الصورة");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerPhotoUpload = (type: "before" | "after") => {
    setPhotoType(type);
    fileInputRef.current?.click();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in_progress":
        return "bg-blue-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <AppHeader />

          <div className="p-4 md:p-6 space-y-6" dir="rtl">
            <h1 className="text-2xl font-bold text-white">الملف الشخصي الذكي</h1>
            {/* Profile & QR Code Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="text-center">
                  <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-xl text-white">
                    {technicianInfo?.full_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {technicianInfo?.phone && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="w-4 h-4" />
                      <span>{technicianInfo.phone}</span>
                    </div>
                  )}
                  {technicianInfo?.username && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail className="w-4 h-4" />
                      <span>{technicianInfo.username}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(), "dd MMMM yyyy", { locale: ar })}</span>
                  </div>
                </CardContent>
              </Card>

              {/* QR Code Card */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <QrCode className="w-5 h-5 text-blue-400" />
                    رمز QR الخاص بك
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-lg">
                    <QRCodeSVG
                      value={`TECH-${technicianInfo?.id || "unknown"}`}
                      size={150}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-slate-400 text-sm mt-3 text-center">
                    امسح هذا الرمز للتعريف السريع
                  </p>
                </CardContent>
              </Card>

              {/* Active Work Status */}
              <Card className={`border-2 ${activeWorkLog ? "bg-green-900/30 border-green-500" : "bg-slate-800/50 border-slate-700"}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    {activeWorkLog ? (
                      <>
                        <Play className="w-5 h-5 text-green-400" />
                        عمل جاري
                      </>
                    ) : (
                      <>
                        <Clock className="w-5 h-5 text-slate-400" />
                        لا يوجد عمل نشط
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeWorkLog ? (
                    <div className="space-y-4">
                      <div className="text-white">
                        <p className="font-semibold">{activeWorkLog.ticket?.ticket_number}</p>
                        <p className="text-slate-300 text-sm">{activeWorkLog.ticket?.issue_description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => triggerPhotoUpload("before")}
                          variant="outline"
                          size="sm"
                          disabled={uploadingPhoto}
                          className="flex-1"
                        >
                          <Camera className="w-4 h-4 ml-1" />
                          صورة قبل
                        </Button>
                        <Button
                          onClick={() => triggerPhotoUpload("after")}
                          variant="outline"
                          size="sm"
                          disabled={uploadingPhoto}
                          className="flex-1"
                        >
                          <Image className="w-4 h-4 ml-1" />
                          صورة بعد
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={openWorkReportModal}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <FileText className="w-4 h-4 ml-1" />
                          تقرير الإنهاء
                        </Button>
                        <Button
                          onClick={() => handleEndWork(activeWorkLog.id)}
                          variant="destructive"
                          className="flex-1"
                        >
                          <Square className="w-4 h-4 ml-2" />
                          إنهاء سريع
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-center">
                      اختر تذكرة من القائمة لبدء العمل
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="orders" className="w-full">
              <TabsList className="grid w-full grid-cols-6 bg-slate-800/50">
                <TabsTrigger value="orders" className="data-[state=active]:bg-blue-600">
                  <Wrench className="w-4 h-4 ml-1" />
                  الطلبات
                </TabsTrigger>
                <TabsTrigger value="stats" className="data-[state=active]:bg-blue-600">
                  <Trophy className="w-4 h-4 ml-1" />
                  الإحصائيات
                </TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-blue-600">
                  <History className="w-4 h-4 ml-1" />
                  السجل
                </TabsTrigger>
                <TabsTrigger value="suggestions" className="data-[state=active]:bg-blue-600">
                  <Lightbulb className="w-4 h-4 ml-1" />
                  المساعد
                </TabsTrigger>
                <TabsTrigger value="photos" className="data-[state=active]:bg-blue-600">
                  <Camera className="w-4 h-4 ml-1" />
                  الصور
                </TabsTrigger>
                <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-600">
                  <Bell className="w-4 h-4 ml-1" />
                  الإشعارات
                </TabsTrigger>
              </TabsList>

              {/* Work Orders Tab */}
              <TabsContent value="orders" className="space-y-4 mt-4">
                {workOrders.length === 0 ? (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="text-center py-8">
                      <p className="text-slate-400">لا توجد طلبات عمل حالياً</p>
                    </CardContent>
                  </Card>
                ) : (
                  workOrders.map((order) => (
                    <Card key={order.id} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold">{order.ticket_number}</span>
                              <Badge className={getPriorityColor(order.priority)}>
                                {order.priority === "urgent" ? "عاجل" : 
                                 order.priority === "high" ? "مرتفع" :
                                 order.priority === "medium" ? "متوسط" : "منخفض"}
                              </Badge>
                            </div>
                            <p className="text-slate-300">{order.issue_description}</p>
                            {order.issue_type && (
                              <Badge variant="outline" className="text-blue-400 border-blue-400">
                                {order.issue_type}
                              </Badge>
                            )}
                            <div className="text-sm text-slate-400">
                              <p>المشترك: {order.subscriber.name}</p>
                              <p>الهاتف: {order.subscriber.phone}</p>
                              {order.subscriber.address && <p>العنوان: {order.subscriber.address}</p>}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {order.scheduled_date && (
                              <Badge variant="secondary">
                                <Clock className="w-3 h-3 ml-1" />
                                {format(new Date(order.scheduled_date), "dd/MM HH:mm")}
                              </Badge>
                            )}
                            {!activeWorkLog && (
                              <Button
                                onClick={() => handleStartWork(order.id)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Play className="w-4 h-4 ml-1" />
                                بدء العمل
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Stats Tab */}
              <TabsContent value="stats" className="space-y-4 mt-4">
                {user && <TechnicianStatsCard technicianId={user.id} />}
              </TabsContent>

              {/* Work History Tab */}
              <TabsContent value="history" className="space-y-4 mt-4">
                {workLogs.length === 0 ? (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="text-center py-8">
                      <p className="text-slate-400">لا يوجد سجل أعمال</p>
                    </CardContent>
                  </Card>
                ) : (
                  workLogs.map((log) => (
                    <Card key={log.id} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-white font-semibold">{log.ticket?.ticket_number}</p>
                            <p className="text-slate-300 text-sm">{log.ticket?.issue_description}</p>
                            {log.started_at && (
                              <p className="text-slate-400 text-xs">
                                البدء: {format(new Date(log.started_at), "dd/MM/yyyy HH:mm")}
                              </p>
                            )}
                            {log.ended_at && (
                              <p className="text-slate-400 text-xs">
                                الانتهاء: {format(new Date(log.ended_at), "dd/MM/yyyy HH:mm")}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={getStatusColor(log.status)}>
                              {log.status === "completed" ? "مكتمل" :
                               log.status === "in_progress" ? "جاري" :
                               log.status === "cancelled" ? "ملغي" : "معلق"}
                            </Badge>
                            {log.duration_minutes && (
                              <span className="text-slate-400 text-sm">
                                {Math.floor(log.duration_minutes / 60)}س {log.duration_minutes % 60}د
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Smart Suggestions Tab */}
              <TabsContent value="suggestions" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Issue Selector */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-400" />
                        اختر نوع المشكلة
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {smartSuggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant={selectedIssue === suggestion.issue ? "default" : "outline"}
                          className="w-full justify-start"
                          onClick={() => setSelectedIssue(suggestion.issue)}
                        >
                          {suggestion.issue}
                        </Button>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Solutions */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-green-400" />
                        الحلول المقترحة
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedIssue ? (
                        <div className="space-y-2">
                          {smartSuggestions
                            .find((s) => s.issue === selectedIssue)
                            ?.solutions.map((solution, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-2 p-2 bg-slate-700/50 rounded-lg"
                              >
                                <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-200">{solution}</span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-center">
                          اختر نوع المشكلة لعرض الحلول المقترحة
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Photos Tab */}
              <TabsContent value="photos" className="mt-4">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Camera className="w-5 h-5 text-blue-400" />
                      صور العمل
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div
                        onClick={() => activeWorkLog && triggerPhotoUpload("before")}
                        className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                          activeWorkLog
                            ? "border-blue-500 hover:bg-blue-500/10"
                            : "border-slate-600 opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-slate-400 text-sm">صورة قبل</span>
                      </div>
                      <div
                        onClick={() => activeWorkLog && triggerPhotoUpload("after")}
                        className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                          activeWorkLog
                            ? "border-green-500 hover:bg-green-500/10"
                            : "border-slate-600 opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-slate-400 text-sm">صورة بعد</span>
                      </div>
                    </div>
                    {!activeWorkLog && (
                      <p className="text-slate-400 text-center mt-4">
                        ابدأ عملاً لتتمكن من رفع الصور
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="mt-4">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Bell className="w-5 h-5 text-yellow-400" />
                      الإشعارات والتنبيهات
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {workOrders.filter(o => o.priority === "urgent").length > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                        <div>
                          <p className="text-red-300 font-semibold">تذاكر عاجلة</p>
                          <p className="text-red-400 text-sm">
                            لديك {workOrders.filter(o => o.priority === "urgent").length} تذكرة عاجلة تحتاج اهتمام فوري
                          </p>
                        </div>
                      </div>
                    )}
                    {workOrders.length > 5 && (
                      <div className="flex items-start gap-3 p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
                        <Bell className="w-5 h-5 text-yellow-400 mt-0.5" />
                        <div>
                          <p className="text-yellow-300 font-semibold">تذاكر متراكمة</p>
                          <p className="text-yellow-400 text-sm">
                            لديك {workOrders.length} تذكرة في الانتظار
                          </p>
                        </div>
                      </div>
                    )}
                    {workOrders.length === 0 && (
                      <div className="flex items-start gap-3 p-3 bg-green-900/30 border border-green-500/50 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                        <div>
                          <p className="text-green-300 font-semibold">لا توجد تذاكر معلقة</p>
                          <p className="text-green-400 text-sm">
                            أنت متفرغ حالياً، أحسنت!
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />

          {/* Diagnosis Dialog */}
          <Dialog open={showDiagnosisDialog} onOpenChange={setShowDiagnosisDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-blue-400" />
                  التشخيص السريع - {diagnosisIssueType}
                </DialogTitle>
              </DialogHeader>
              <DiagnosisChecklist 
                issueType={diagnosisIssueType} 
                onClose={() => setShowDiagnosisDialog(false)}
              />
            </DialogContent>
          </Dialog>

          {/* Work Report Modal */}
          {activeWorkLog && selectedOrder && (
            <WorkReportModal
              open={showWorkReportModal}
              onOpenChange={setShowWorkReportModal}
              workLogId={activeWorkLog.id}
              ticketId={activeWorkLog.ticket_id}
              technicianId={user?.id || ""}
              subscriberId={selectedOrder.subscriber?.name ? workOrders.find(o => o.id === activeWorkLog.ticket_id)?.id || "" : ""}
              ticketNumber={activeWorkLog.ticket?.ticket_number || ""}
              issueDescription={activeWorkLog.ticket?.issue_description || ""}
              startTime={activeWorkLog.started_at || ""}
              onComplete={fetchTechnicianData}
            />
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default TechnicianProfile;
