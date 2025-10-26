import { useEffect, useState, useMemo } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { TicketDetailsModal } from '@/components/modals/TicketDetailsModal';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
  User,
  Filter,
  Calendar,
  TrendingUp,
  Activity,
  Ticket
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

// حساب المسافة بين نقطتين GPS بالكيلومترات (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const TechnicianDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [technicianProfile, setTechnicianProfile] = useState<TechnicianProfile | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number; lng: number} | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [locationTracking, setLocationTracking] = useState<number | null>(null);
  const [allTicketsSheetOpen, setAllTicketsSheetOpen] = useState(false);

  // جلب الموقع الحالي للفني وتتبعه تلقائياً
  useEffect(() => {
    if (navigator.geolocation) {
      // موقع أولي
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(newLocation);
          toast.success('✅ تم تحديد موقعك بنجاح');
          
          // حفظ الموقع في قاعدة البيانات
          if (user) {
            supabase.from('employee_locations').insert({
              user_id: user.id,
              latitude: newLocation.lat,
              longitude: newLocation.lng,
              accuracy: position.coords.accuracy
            });
          }
        },
        (error) => {
          console.error('خطأ في تحديد الموقع:', error);
          toast.error('⚠️ تعذر تحديد موقعك الحالي');
        },
        { enableHighAccuracy: true }
      );

      // تتبع الموقع كل 5 دقائق
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(newLocation);
          
          // تحديث الموقع في قاعدة البيانات
          if (user) {
            supabase.from('employee_locations').insert({
              user_id: user.id,
              latitude: newLocation.lat,
              longitude: newLocation.lng,
              accuracy: position.coords.accuracy
            });
          }
        },
        (error) => console.error('خطأ في تتبع الموقع:', error),
        { enableHighAccuracy: true, maximumAge: 300000, timeout: 10000 }
      );

      setLocationTracking(watchId);

      return () => {
        if (watchId) navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [user]);

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

  // فتح نافذة تفاصيل التذكرة
  const handleOpenTicketDetails = (ticketId: string) => {
    console.log('🎯 فتح تفاصيل التذكرة:', ticketId);
    setSelectedTicketId(ticketId);
    setDetailsModalOpen(true);
    console.log('📋 detailsModalOpen:', true);
  };

  // فتح الموقع في Waze
  const openInWaze = (lat: number | null, lng: number | null) => {
    if (!lat || !lng) {
      toast.error('لا توجد إحداثيات لهذا العميل');
      return;
    }
    window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank');
  };

  // تصفية وترتيب التذاكر حسب البحث والفلاتر والمسافة
  const filteredAndSortedTickets = useMemo(() => {
    let filtered = tickets.filter(ticket => {
      // البحث
      const matchesSearch = 
        ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.subscribers?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.subscribers?.phone?.includes(searchQuery);
      
      // فلتر الحالة
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      
      // فلتر الأولوية
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });

    // حساب المسافة وإضافتها لكل تذكرة
    if (currentLocation) {
      filtered = filtered.map(ticket => ({
        ...ticket,
        distance: ticket.subscribers?.latitude && ticket.subscribers?.longitude
          ? calculateDistance(
              currentLocation.lat,
              currentLocation.lng,
              ticket.subscribers.latitude,
              ticket.subscribers.longitude
            )
          : 999999
      }));

      // ترتيب حسب الأولوية أولاً ثم المسافة
      filtered.sort((a, b) => {
        const priorityOrder: Record<string, number> = { urgent: 1, high: 2, medium: 3, low: 4 };
        const priorityDiff = (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
        
        if (priorityDiff !== 0) return priorityDiff;
        return ((a as any).distance || 0) - ((b as any).distance || 0);
      });
    }

    return filtered;
  }, [tickets, searchQuery, statusFilter, priorityFilter, currentLocation]);

  const openTickets = filteredAndSortedTickets.filter(t => t.status === 'open' || t.status === 'in_progress');
  const completedTickets = filteredAndSortedTickets.filter(t => t.status === 'resolved' || t.status === 'closed');
  const scheduledTickets = filteredAndSortedTickets.filter(t => t.scheduled_date);

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

  const renderTicket = (ticket: Ticket & { distance?: number }) => {
    const ticketDistance = ticket.distance !== undefined && ticket.distance < 999999 
      ? ticket.distance.toFixed(2) 
      : null;

    return (
      <Card 
        key={ticket.id} 
        className="mb-4 hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary cursor-pointer"
        onClick={() => handleOpenTicketDetails(ticket.id)}
      >
        <CardHeader className="pb-3 bg-gradient-to-r from-sky-500/5 via-primary/5 to-transparent">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 border-2 border-sky-500 shadow-lg">
                <AvatarFallback className="bg-gradient-to-br from-sky-500 to-sky-600 text-white text-lg font-bold">
                  {ticket.subscribers?.name?.charAt(0) || <User className="h-7 w-7" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl font-bold text-foreground">
                  {ticket.subscribers?.name || 'غير محدد'}
                </CardTitle>
                <p className="text-sm text-muted-foreground font-medium">{ticket.ticket_number}</p>
                {ticketDistance && (
                  <p className="text-xs text-sky-600 font-bold mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    المسافة: {ticketDistance} كم
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
            </div>
          </div>
        </CardHeader>
      
        <CardContent className="space-y-4 pt-4">
          <div className="bg-gradient-to-br from-sky-50/50 to-blue-50/30 dark:from-sky-950/30 dark:to-blue-950/20 p-4 rounded-xl space-y-3 border border-sky-200/50 dark:border-sky-800/50">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 mt-1 text-sky-600 dark:text-sky-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground mb-1">وصف المشكلة:</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{ticket.issue_description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
              <p className="text-sm text-foreground">{ticket.subscribers?.address || 'العنوان غير متوفر'}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
              <a 
                href={`tel:${ticket.subscribers?.phone}`} 
                className="text-sm text-sky-600 dark:text-sky-400 hover:underline font-medium transition-colors"
              >
                {ticket.subscribers?.phone || 'غير متوفر'}
              </a>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Clock className="h-5 w-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
              <span className="font-medium">
                تاريخ الفتح: {new Date(ticket.created_at).toLocaleDateString('ar-IQ', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>

            {ticket.scheduled_date && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-5 w-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                <span className="font-medium text-sky-700 dark:text-sky-300">
                  موعد الصيانة: {new Date(ticket.scheduled_date).toLocaleDateString('ar-IQ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}

            {ticket.notes && (
              <div className="mt-2 p-3 bg-background/50 rounded-lg border border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-1">ملاحظات:</p>
                <p className="text-sm text-foreground">{ticket.notes}</p>
              </div>
            )}

            {/* خريطة صغيرة تعرض موقع العميل */}
            {ticket.subscribers?.latitude && ticket.subscribers?.longitude && (
              <div className="mt-3 rounded-lg overflow-hidden border-2 border-sky-200 dark:border-sky-800">
                <iframe
                  width="100%"
                  height="200"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${ticket.subscribers.latitude},${ticket.subscribers.longitude}&zoom=15`}
                  allowFullScreen
                  title={`موقع ${ticket.subscribers.name}`}
                />
              </div>
            )}
          </div>

        </CardContent>
      </Card>
    );
  };

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
            <Card className="bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-transparent border-sky-300/30 dark:border-sky-700/30 shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 flex-wrap">
                  <Avatar className="h-20 w-20 border-4 border-sky-500 shadow-2xl">
                    <AvatarFallback className="bg-gradient-to-br from-sky-500 to-sky-600 text-white text-2xl font-bold">
                      {technicianProfile?.full_name?.charAt(0) || 'ف'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-[200px]">
                    <h2 className="text-3xl font-bold text-foreground">
                      {technicianProfile?.full_name || 'الفني'}
                    </h2>
                    <p className="text-sm text-muted-foreground font-medium mt-1 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {technicianProfile?.phone || 'لا يوجد رقم هاتف'}
                    </p>
                    {currentLocation && (
                      <div className="flex items-center gap-2 mt-1">
                        <Activity className="h-4 w-4 text-green-500 animate-pulse" />
                        <p className="text-xs text-green-600 dark:text-green-400 font-bold">
                          🟢 تتبع نشط • {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                      <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">{openTickets.length}</p>
                      <p className="text-sm text-muted-foreground font-medium">جارية</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <p className="text-4xl font-bold text-green-600 dark:text-green-400">{completedTickets.length}</p>
                      <p className="text-sm text-muted-foreground font-medium">مكتملة</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{scheduledTickets.length}</p>
                      <p className="text-sm text-muted-foreground font-medium">مجدولة</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* شريط البحث والفلاتر */}
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[300px] relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="🔍 ابحث عن تذكرة برقمها أو اسم العميل أو رقم الهاتف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-12 h-12 text-base shadow-md border-sky-300/30 dark:border-sky-700/30 focus:border-sky-500"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] h-12 border-sky-300/30 dark:border-sky-700/30">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="حسب الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="open">مفتوحة</SelectItem>
                  <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                  <SelectItem value="resolved">منجزة</SelectItem>
                  <SelectItem value="closed">مغلقة</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[180px] h-12 border-sky-300/30 dark:border-sky-700/30">
                  <Bell className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="حسب الأولوية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأولويات</SelectItem>
                  <SelectItem value="urgent">عاجلة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="low">منخفضة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* الإحصائيات */}
            <div className="grid gap-4 md:grid-cols-5">
              <StatCard
                title="إجمالي التذاكر"
                value={tickets.length}
                icon={FileText}
                gradient="bg-gradient-to-br from-sky-500 to-sky-600"
                borderColor="border-l-sky-500"
              />
              <StatCard
                title="التذاكر الجارية"
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
                title="التذاكر المجدولة"
                value={scheduledTickets.length}
                icon={Calendar}
                gradient="bg-gradient-to-br from-blue-500 to-blue-600"
                borderColor="border-l-blue-500"
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
              <TabsList className="grid w-full grid-cols-6 h-12 bg-gradient-to-r from-sky-100/50 to-blue-100/50 dark:from-sky-950/50 dark:to-blue-950/50">
                <TabsTrigger value="open" className="text-sm font-semibold data-[state=active]:bg-sky-500 data-[state=active]:text-white">
                  📋 الجارية ({openTickets.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="text-sm font-semibold data-[state=active]:bg-green-500 data-[state=active]:text-white">
                  ✅ المكتملة ({completedTickets.length})
                </TabsTrigger>
                <TabsTrigger value="scheduled" className="text-sm font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  📅 المجدولة ({scheduledTickets.length})
                </TabsTrigger>
                <TabsTrigger value="reports" className="text-sm font-semibold data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                  📊 التقارير
                </TabsTrigger>
                <TabsTrigger value="notifications" className="text-sm font-semibold data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                  🔔 الإشعارات
                </TabsTrigger>
                <TabsTrigger value="tracking" className="text-sm font-semibold data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                  🗺️ التتبع المباشر
                </TabsTrigger>
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
                  <Card className="border-dashed border-green-300 dark:border-green-800">
                    <CardContent className="pt-6 text-center py-16">
                      <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4 opacity-50" />
                      <p className="text-muted-foreground text-lg font-medium">لا توجد تذاكر مكتملة</p>
                      <p className="text-sm text-muted-foreground mt-2">ستظهر التذاكر المنجزة هنا</p>
                    </CardContent>
                  </Card>
                ) : (
                  completedTickets.map(renderTicket)
                )}
              </TabsContent>

              <TabsContent value="scheduled" className="space-y-4 animate-fade-in">
                {scheduledTickets.length === 0 ? (
                  <Card className="border-dashed border-blue-300 dark:border-blue-800">
                    <CardContent className="pt-6 text-center py-16">
                      <Calendar className="h-16 w-16 mx-auto text-blue-500 mb-4 opacity-50" />
                      <p className="text-muted-foreground text-lg font-medium">لا توجد تذاكر مجدولة</p>
                      <p className="text-sm text-muted-foreground mt-2">ستظهر التذاكر ذات المواعيد المحددة هنا</p>
                    </CardContent>
                  </Card>
                ) : (
                  scheduledTickets.map(renderTicket)
                )}
              </TabsContent>

              <TabsContent value="reports" className="space-y-4 animate-fade-in">
                <Card className="border-dashed border-purple-300 dark:border-purple-800">
                  <CardContent className="pt-6 text-center py-16">
                    <FileText className="h-16 w-16 mx-auto text-purple-500 mb-4 opacity-50" />
                    <p className="text-muted-foreground text-lg font-medium">التقارير الفنية</p>
                    <p className="text-sm text-muted-foreground mt-2">سيتم عرض جميع تقاريرك الفنية المحفوظة هنا</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4 animate-fade-in">
                <Card className="border-dashed border-orange-300 dark:border-orange-800">
                  <CardContent className="pt-6 text-center py-16">
                    <Bell className="h-16 w-16 mx-auto text-orange-500 mb-4 opacity-50" />
                    <p className="text-muted-foreground text-lg font-medium">لا توجد إشعارات جديدة</p>
                    <p className="text-sm text-muted-foreground mt-2">ستصلك الإشعارات الهامة هنا</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tracking" className="space-y-4 animate-fade-in">
                <Card className="border-indigo-300 dark:border-indigo-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                      <MapPin className="h-6 w-6" />
                      التتبع المباشر لموقعك
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentLocation ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-3 mb-2">
                            <Activity className="h-5 w-5 text-green-600 dark:text-green-400 animate-pulse" />
                            <p className="font-bold text-green-700 dark:text-green-300">🟢 التتبع نشط</p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            خطوط الطول والعرض: <span className="font-mono font-bold text-foreground">{currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}</span>
                          </p>
                        </div>
                        
                        <div className="rounded-xl overflow-hidden border-4 border-indigo-200 dark:border-indigo-800 shadow-2xl">
                          <iframe
                            width="100%"
                            height="450"
                            frameBorder="0"
                            style={{ border: 0 }}
                            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${currentLocation.lat},${currentLocation.lng}&zoom=16`}
                            allowFullScreen
                            title="موقعك الحالي"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Button 
                            variant="outline"
                            className="border-indigo-500/50 hover:bg-indigo-500/10"
                            onClick={() => window.open(`https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`, '_blank')}
                          >
                            🗺️ فتح في Google Maps
                          </Button>
                          <Button 
                            variant="outline"
                            className="border-indigo-500/50 hover:bg-indigo-500/10"
                            onClick={() => openInWaze(currentLocation.lat, currentLocation.lng)}
                          >
                            🧭 فتح في Waze
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                        <p className="text-muted-foreground text-lg font-medium">يتم تحديد موقعك...</p>
                        <p className="text-sm text-muted-foreground mt-2">الرجاء السماح بالوصول للموقع</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>

        {/* نافذة تفاصيل التذكرة */}
        <TicketDetailsModal
          ticketId={selectedTicketId}
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          onTicketUpdated={fetchTickets}
        />

        {/* زر عائم لعرض جميع التذاكر */}
        <Button
          onClick={() => setAllTicketsSheetOpen(true)}
          className="fixed left-6 bottom-6 h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 z-50 group"
          size="icon"
        >
          <div className="relative">
            <Ticket className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
              {tickets.length}
            </Badge>
          </div>
        </Button>

        {/* Sheet لعرض جميع التذاكر */}
        <Sheet open={allTicketsSheetOpen} onOpenChange={setAllTicketsSheetOpen}>
          <SheetContent side="left" className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                <Ticket className="h-6 w-6 text-sky-500" />
                جميع التذاكر ({tickets.length})
              </SheetTitle>
              <SheetDescription>
                قائمة كاملة بجميع تذاكر الصيانة المسندة إليك
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-4">
              {/* شريط البحث داخل الـ Sheet */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن تذكرة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>

              {/* قائمة التذاكر */}
              <div className="space-y-3">
                {filteredAndSortedTickets.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                    <p className="text-muted-foreground">لا توجد تذاكر</p>
                  </div>
                ) : (
                  filteredAndSortedTickets.map((ticket) => (
                    <Card
                      key={ticket.id}
                      className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-sky-500"
                      onClick={() => {
                        handleOpenTicketDetails(ticket.id);
                        setAllTicketsSheetOpen(false);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-foreground">{ticket.subscribers?.name || 'غير محدد'}</p>
                            <p className="text-xs text-muted-foreground">{ticket.ticket_number}</p>
                          </div>
                          <div className="flex gap-2">
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {ticket.issue_description}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(ticket.created_at).toLocaleDateString('ar-IQ')}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </SidebarProvider>
  );
};

export default TechnicianDashboard;
