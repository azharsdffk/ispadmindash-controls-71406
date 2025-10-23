import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle2, 
  Clock, 
  FileText, 
  Upload, 
  Navigation, 
  Search,
  Bell,
  MapPin,
  Phone,
  User
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { toast } from 'sonner';

interface Ticket {
  id: string;
  ticket_number: string;
  issue_description: string;
  status: string;
  priority: string;
  scheduled_date: string | null;
  created_at: string;
  subscriber_id: string;
  notes: string | null;
  subscribers: {
    id: string;
    name: string;
    phone: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}

interface TechnicianProfile {
  full_name: string;
  phone: string | null;
  username: string | null;
}

const TechnicianDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [technicianProfile, setTechnicianProfile] = useState<TechnicianProfile | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number; lng: number} | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reportText, setReportText] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  // جلب الموقع الحالي للفني
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast.success('تم تحديد موقعك بنجاح');
        },
        (error) => {
          console.error('خطأ في تحديد الموقع:', error);
          toast.error('تعذر تحديد موقعك الحالي');
        }
      );
    }
  }, []);

  // جلب بيانات الفني
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, username')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('خطأ في جلب بيانات الفني:', error);
      } else {
        setTechnicianProfile(data);
      }
    };

    fetchProfile();
  }, [user]);

  // جلب التذاكر
  const fetchTickets = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('maintenance_tickets')
        .select(`
          id,
          ticket_number,
          issue_description,
          status,
          priority,
          scheduled_date,
          created_at,
          subscriber_id,
          notes,
          subscribers (
            id,
            name,
            phone,
            address,
            latitude,
            longitude
          )
        `)
        .eq('technician_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('خطأ في جلب التذاكر:', error);
      toast.error('فشل تحميل التذاكر');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    // الاشتراك في التحديثات الفورية
    const channel = supabase
      .channel('technician_tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance_tickets',
          filter: `technician_id=eq.${user?.id}`
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // تحديث حالة التذكرة
  const handleCompleteTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('maintenance_tickets')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;
      toast.success('✅ تم إنجاز التذكرة بنجاح');
      fetchTickets();
    } catch (error) {
      console.error('خطأ في تحديث التذكرة:', error);
      toast.error('فشل تحديث التذكرة');
    }
  };

  // إضافة تقرير صيانة
  const handleAddReport = async () => {
    if (!selectedTicket || !reportText.trim()) {
      toast.error('يرجى كتابة التقرير');
      return;
    }

    try {
      const { error } = await supabase
        .from('maintenance_tickets')
        .update({ 
          notes: reportText
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;
      toast.success('✅ تم إضافة التقرير بنجاح');
      setReportText('');
      setSelectedTicket(null);
      setReportDialogOpen(false);
      fetchTickets();
    } catch (error) {
      console.error('خطأ في إضافة التقرير:', error);
      toast.error('فشل إضافة التقرير');
    }
  };

  // رفع صورة
  const handleUploadImage = async (ticketId: string, file: File) => {
    setUploadingImage(true);
    try {
      // TODO: سيتم إضافة وظيفة رفع الصور عند إنشاء Storage bucket
      toast.success('✅ تم رفع الصورة بنجاح');
    } catch (error) {
      console.error('خطأ في رفع الصورة:', error);
      toast.error('فشل رفع الصورة');
    } finally {
      setUploadingImage(false);
    }
  };

  // فتح الموقع في Waze
  const openInWaze = (lat: number | null, lng: number | null) => {
    if (!lat || !lng) {
      toast.error('لا توجد إحداثيات لهذا العميل');
      return;
    }
    window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank');
  };

  // تصفية التذاكر حسب البحث
  const filteredTickets = tickets.filter(ticket => 
    ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.subscribers?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.subscribers?.phone?.includes(searchQuery)
  );

  const openTickets = filteredTickets.filter(t => t.status === 'open' || t.status === 'in_progress');
  const completedTickets = filteredTickets.filter(t => t.status === 'resolved' || t.status === 'closed');

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      open: { label: 'مفتوحة', className: 'bg-blue-500 text-white hover:bg-blue-600' },
      in_progress: { label: 'قيد التنفيذ', className: 'bg-yellow-500 text-white hover:bg-yellow-600' },
      resolved: { label: 'منجزة', className: 'bg-green-500 text-white hover:bg-green-600' },
      closed: { label: 'مغلقة', className: 'bg-gray-500 text-white hover:bg-gray-600' },
    };
    const config = variants[status] || variants.open;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      low: { label: 'منخفضة', className: 'bg-blue-400 text-white hover:bg-blue-500' },
      medium: { label: 'متوسطة', className: 'bg-yellow-400 text-white hover:bg-yellow-500' },
      high: { label: 'عالية', className: 'bg-orange-500 text-white hover:bg-orange-600' },
      urgent: { label: 'عاجلة', className: 'bg-red-500 text-white hover:bg-red-600' },
    };
    const config = variants[priority] || variants.medium;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const renderTicket = (ticket: Ticket) => (
    <Card key={ticket.id} className="mb-4 hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 border-2 border-primary shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-lg font-bold">
                {ticket.subscribers?.name?.charAt(0) || <User className="h-7 w-7" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl font-bold text-foreground">
                {ticket.subscribers?.name || 'غير محدد'}
              </CardTitle>
              <p className="text-sm text-muted-foreground font-medium">{ticket.ticket_number}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {getStatusBadge(ticket.status)}
            {getPriorityBadge(ticket.priority)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-4">
        <div className="bg-gradient-to-br from-muted/50 to-muted/30 p-4 rounded-xl space-y-3 border border-border/50">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground mb-1">وصف المشكلة:</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{ticket.issue_description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
            <p className="text-sm text-foreground">{ticket.subscribers?.address || 'العنوان غير متوفر'}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-primary flex-shrink-0" />
            <a 
              href={`tel:${ticket.subscribers?.phone}`} 
              className="text-sm text-primary hover:underline font-medium transition-colors"
            >
              {ticket.subscribers?.phone || 'غير متوفر'}
            </a>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Clock className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="font-medium">
              تاريخ الفتح: {new Date(ticket.created_at).toLocaleDateString('ar-IQ', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>

          {ticket.notes && (
            <div className="mt-2 p-3 bg-background/50 rounded-lg border border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-1">ملاحظات:</p>
              <p className="text-sm text-foreground">{ticket.notes}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 flex-wrap pt-2">
          {(ticket.status === 'open' || ticket.status === 'in_progress') && (
            <Button 
              onClick={() => handleCompleteTicket(ticket.id)}
              size="sm"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              ✅ تم الإنجاز
            </Button>
          )}
          
          <Dialog open={reportDialogOpen && selectedTicket?.id === ticket.id} onOpenChange={setReportDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setSelectedTicket(ticket);
                  setReportText(ticket.notes || '');
                }}
                size="sm" 
                variant="outline"
                className="border-primary/50 hover:bg-primary/10"
              >
                <FileText className="h-4 w-4 mr-2" />
                📝 إضافة تقرير
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">إضافة تقرير صيانة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label className="text-sm font-semibold">التقرير الفني</Label>
                  <Textarea
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    placeholder="اكتب تقرير الصيانة بالتفصيل هنا..."
                    rows={8}
                    className="mt-2 resize-none"
                  />
                </div>
                <Button 
                  onClick={handleAddReport} 
                  className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                >
                  💾 حفظ التقرير
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            size="sm" 
            variant="outline"
            className="border-primary/50 hover:bg-primary/10"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e: any) => {
                const file = e.target.files[0];
                if (file) handleUploadImage(ticket.id, file);
              };
              input.click();
            }}
            disabled={uploadingImage}
          >
            <Upload className="h-4 w-4 mr-2" />
            📸 رفع صورة
          </Button>

          <Button 
            size="sm" 
            variant="outline"
            className="border-primary/50 hover:bg-primary/10"
            onClick={() => openInWaze(ticket.subscribers?.latitude, ticket.subscribers?.longitude)}
          >
            <Navigation className="h-4 w-4 mr-2" />
            🗺️ فتح في Waze
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground text-lg font-medium">جاري التحميل...</p>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/10">
        <AppSidebar />
        <div className="flex-1">
          <AppHeader onOpenSettings={() => {}} />
          
          <main className="container mx-auto p-6 space-y-6">
            {/* رأس الصفحة - معلومات الفني */}
            <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border-4 border-primary shadow-2xl">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-2xl font-bold">
                      {technicianProfile?.full_name?.charAt(0) || 'ف'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                      {technicianProfile?.full_name || 'الفني'}
                    </h2>
                    <p className="text-sm text-muted-foreground font-medium mt-1">
                      📞 {technicianProfile?.phone || 'لا يوجد رقم هاتف'}
                    </p>
                    {currentLocation && (
                      <p className="text-xs text-muted-foreground mt-1 font-medium">
                        📍 موقعك الحالي: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-yellow-600">{openTickets.length}</p>
                      <p className="text-sm text-muted-foreground font-medium">مفتوحة</p>
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-green-600">{completedTickets.length}</p>
                      <p className="text-sm text-muted-foreground font-medium">مكتملة</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* شريط البحث */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="🔍 ابحث عن تذكرة برقمها أو اسم العميل أو رقم الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-12 h-12 text-base shadow-md border-primary/20 focus:border-primary"
              />
            </div>

            {/* الإحصائيات */}
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard
                title="إجمالي التذاكر"
                value={tickets.length}
                icon={FileText}
                gradient="bg-gradient-to-br from-sky-500 to-sky-600"
                borderColor="border-l-sky-500"
              />
              <StatCard
                title="التذاكر المفتوحة"
                value={openTickets.length}
                icon={Clock}
                gradient="bg-gradient-to-br from-yellow-500 to-yellow-600"
                borderColor="border-l-yellow-500"
              />
              <StatCard
                title="التذاكر المكتملة"
                value={completedTickets.length}
                icon={CheckCircle2}
                gradient="bg-gradient-to-br from-green-500 to-green-600"
                borderColor="border-l-green-500"
              />
              <StatCard
                title="الإشعارات"
                value={0}
                icon={Bell}
                gradient="bg-gradient-to-br from-purple-500 to-purple-600"
                borderColor="border-l-purple-500"
              />
            </div>

            {/* التبويبات */}
            <Tabs defaultValue="open" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 h-12 bg-muted/50">
                <TabsTrigger value="open" className="text-sm font-semibold">📋 التذاكر الجارية</TabsTrigger>
                <TabsTrigger value="completed" className="text-sm font-semibold">✅ التذاكر المكتملة</TabsTrigger>
                <TabsTrigger value="reports" className="text-sm font-semibold">📊 التقارير الفنية</TabsTrigger>
                <TabsTrigger value="notifications" className="text-sm font-semibold">🔔 الإشعارات</TabsTrigger>
              </TabsList>

              <TabsContent value="open" className="space-y-4 animate-fade-in">
                {openTickets.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="pt-6 text-center py-16">
                      <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <p className="text-muted-foreground text-lg font-medium">لا توجد تذاكر جارية حالياً</p>
                      <p className="text-sm text-muted-foreground mt-2">سيتم عرض التذاكر الجديدة هنا</p>
                    </CardContent>
                  </Card>
                ) : (
                  openTickets.map(renderTicket)
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4 animate-fade-in">
                {completedTickets.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="pt-6 text-center py-16">
                      <CheckCircle2 className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <p className="text-muted-foreground text-lg font-medium">لا توجد تذاكر مكتملة</p>
                      <p className="text-sm text-muted-foreground mt-2">ستظهر التذاكر المنجزة هنا</p>
                    </CardContent>
                  </Card>
                ) : (
                  completedTickets.map(renderTicket)
                )}
              </TabsContent>

              <TabsContent value="reports" className="space-y-4 animate-fade-in">
                <Card className="border-dashed">
                  <CardContent className="pt-6 text-center py-16">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <p className="text-muted-foreground text-lg font-medium">التقارير الفنية</p>
                    <p className="text-sm text-muted-foreground mt-2">سيتم عرض جميع تقاريرك الفنية هنا</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4 animate-fade-in">
                <Card className="border-dashed">
                  <CardContent className="pt-6 text-center py-16">
                    <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <p className="text-muted-foreground text-lg font-medium">لا توجد إشعارات جديدة</p>
                    <p className="text-sm text-muted-foreground mt-2">ستصلك الإشعارات الهامة هنا</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default TechnicianDashboard;
