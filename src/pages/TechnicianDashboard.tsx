import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TicketDetailsModal } from '@/components/modals/TicketDetailsModal';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { TechnicianHeader } from '@/components/technician/TechnicianHeader';
import { TechnicianFilters } from '@/components/technician/TechnicianFilters';
import { TechnicianTicketCard } from '@/components/technician/TechnicianTicketCard';
import { TechnicianStats } from '@/components/technician/TechnicianStats';
import { 
  CheckCircle2, 
  Clock, 
  FileText, 
  Bell,
  MapPin,
  Calendar,
  Activity,
  Ticket,
  Search
} from 'lucide-react';
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

  // فتح نافذة تفاصيل التذكرة
  const handleOpenTicketDetails = (ticketId: string) => {
    console.log('🔍 Opening ticket details for:', ticketId);
    setSelectedTicketId(ticketId);
    setDetailsModalOpen(true);
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
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1">
          <AppHeader onOpenSettings={() => {}} />
          
          <main className="container mx-auto p-6 space-y-6">
            <TechnicianHeader
              fullName={technicianProfile?.full_name || 'الفني'}
              phone={technicianProfile?.phone || null}
              currentLocation={currentLocation}
              openTicketsCount={openTickets.length}
              completedTicketsCount={completedTickets.length}
              scheduledTicketsCount={scheduledTickets.length}
            />

            <TechnicianFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              priorityFilter={priorityFilter}
              onPriorityChange={setPriorityFilter}
            />

            <TechnicianStats
              totalTickets={tickets.length}
              openTickets={openTickets.length}
              completedTickets={completedTickets.length}
              scheduledTickets={scheduledTickets.length}
            />

            <Tabs defaultValue="open" className="space-y-4">
              <TabsList className="glass-card grid w-full grid-cols-3 h-14">
                <TabsTrigger value="open" className="text-sm font-semibold data-[state=active]:gradient-bg data-[state=active]:text-white">
                  📋 الجارية ({openTickets.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="text-sm font-semibold data-[state=active]:bg-green-500 data-[state=active]:text-white">
                  ✅ المكتملة ({completedTickets.length})
                </TabsTrigger>
                <TabsTrigger value="tracking" className="text-sm font-semibold data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                  🗺️ التتبع
                </TabsTrigger>
              </TabsList>

              <TabsContent value="open" className="space-y-4 animate-fade-in">
                {openTickets.length === 0 ? (
                  <Card className="glass-card border-dashed">
                    <CardContent className="pt-6 text-center py-16">
                      <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <p className="text-muted-foreground text-lg font-medium">لا توجد تذاكر جارية</p>
                    </CardContent>
                  </Card>
                ) : (
                  openTickets.map((ticket) => (
                    <TechnicianTicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onOpenDetails={handleOpenTicketDetails}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4 animate-fade-in">
                {completedTickets.length === 0 ? (
                  <Card className="glass-card border-dashed">
                    <CardContent className="pt-6 text-center py-16">
                      <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4 opacity-50" />
                      <p className="text-muted-foreground text-lg font-medium">لا توجد تذاكر مكتملة</p>
                    </CardContent>
                  </Card>
                ) : (
                  completedTickets.map((ticket) => (
                    <TechnicianTicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onOpenDetails={handleOpenTicketDetails}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="tracking" className="space-y-4 animate-fade-in">
                <Card className="glass-card">
                  <CardContent className="pt-6">
                    {currentLocation ? (
                      <div className="space-y-4">
                        <div className="p-4 glass-card rounded-xl border border-green-500/20">
                          <div className="flex items-center gap-3 mb-2">
                            <Activity className="h-5 w-5 text-green-500 animate-pulse" />
                            <p className="font-bold text-green-500">🟢 التتبع نشط</p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            الإحداثيات: <span className="font-mono font-bold">{currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}</span>
                          </p>
                        </div>
                        
                        <div className="rounded-2xl overflow-hidden glass-card">
                          <iframe
                            width="100%"
                            height="400"
                            frameBorder="0"
                            style={{ border: 0 }}
                            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${currentLocation.lat},${currentLocation.lng}&zoom=16`}
                            allowFullScreen
                            title="موقعك الحالي"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Button 
                            variant="glass"
                            onClick={() => window.open(`https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`, '_blank')}
                          >
                            🗺️ Google Maps
                          </Button>
                          <Button 
                            variant="glass"
                            onClick={() => window.open(`https://waze.com/ul?ll=${currentLocation.lat},${currentLocation.lng}&navigate=yes`, '_blank')}
                          >
                            🧭 Waze
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                        <p className="text-muted-foreground text-lg font-medium">يتم تحديد موقعك...</p>
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

        <Button
          onClick={() => setAllTicketsSheetOpen(true)}
          className="fixed left-6 bottom-6 h-16 w-16 rounded-full shadow-glow gradient-bg z-50 group hover:scale-110 transition-all"
          size="icon"
        >
          <div className="relative">
            <Ticket className="h-7 w-7 text-white" />
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
              {tickets.length}
            </Badge>
          </div>
        </Button>

        <Sheet open={allTicketsSheetOpen} onOpenChange={setAllTicketsSheetOpen}>
          <SheetContent side="left" className="w-full sm:max-w-2xl overflow-y-auto glass-card border-primary/20">
            <SheetHeader>
              <SheetTitle className="text-2xl font-bold gradient-text flex items-center gap-2">
                <Ticket className="h-6 w-6" />
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
                    <TechnicianTicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onOpenDetails={(id) => {
                        handleOpenTicketDetails(id);
                        setAllTicketsSheetOpen(false);
                      }}
                    />
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
