import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
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
  CheckCircle, Clock, ListTodo, Bell, MapPin,
  CalendarClock, Activity, Wrench, Search
} from 'lucide-react';
import { toast } from 'sonner';

interface Ticket {
  id: string;
  ticket_number: string;
  issue_description: string;
  issue_type?: string | null;
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

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const TechnicianDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [technicianProfile, setTechnicianProfile] = useState<{ full_name: string; phone: string | null } | null>(null);
  const [technicianRecordId, setTechnicianRecordId] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [allTicketsSheetOpen, setAllTicketsSheetOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // GPS tracking
  useEffect(() => {
    if (!navigator.geolocation || !user) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        supabase.from('employee_locations').insert({
          user_id: user.id,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      () => {},
      { enableHighAccuracy: true }
    );
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        supabase.from('employee_locations').insert({
          user_id: user.id,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 300000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [user]);

  // Fetch profile + technician record
  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const [profileRes, techRes] = await Promise.all([
        supabase.from('profiles').select('full_name, phone').eq('id', user.id).single(),
        supabase.from('technicians').select('id').eq('user_id', user.id).maybeSingle(),
      ]);
      if (profileRes.data) setTechnicianProfile(profileRes.data);
      if (techRes.data) setTechnicianRecordId(techRes.data.id);
    };
    init();
  }, [user]);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    if (!user || !technicianRecordId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('maintenance_tickets')
        .select(`id, ticket_number, issue_description, issue_type, status, priority, scheduled_date, created_at, subscriber_id, notes,
          subscribers (id, name, phone, address, latitude, longitude)`)
        .eq('technician_id', technicianRecordId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTickets(data || []);
    } catch (e) {
      console.error(e);
      toast.error('فشل تحميل التذاكر');
    } finally {
      setLoading(false);
    }
  }, [user, technicianRecordId]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(10);
    setNotifications(data || []);
  }, [user]);

  useEffect(() => {
    if (!technicianRecordId) return;
    fetchTickets();
    fetchNotifications();

    const channel = supabase
      .channel('tech_tickets_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_tickets' }, () => fetchTickets())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => fetchNotifications())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [technicianRecordId, fetchTickets, fetchNotifications]);

  const handleOpenTicketDetails = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setDetailsModalOpen(true);
  };

  const filteredAndSortedTickets = useMemo(() => {
    let filtered = tickets.filter(t => {
      const matchSearch = !searchQuery ||
        t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subscribers?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subscribers?.phone?.includes(searchQuery);
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });

    if (currentLocation) {
      filtered = filtered.map(t => ({
        ...t,
        distance: t.subscribers?.latitude && t.subscribers?.longitude
          ? calculateDistance(currentLocation.lat, currentLocation.lng, t.subscribers.latitude, t.subscribers.longitude)
          : 999999,
      }));
      filtered.sort((a, b) => {
        const po: Record<string, number> = { urgent: 1, high: 2, medium: 3, low: 4 };
        const pd = (po[a.priority] || 3) - (po[b.priority] || 3);
        if (pd !== 0) return pd;
        return ((a as any).distance || 0) - ((b as any).distance || 0);
      });
    }
    return filtered;
  }, [tickets, searchQuery, statusFilter, priorityFilter, currentLocation]);

  const activeTickets = filteredAndSortedTickets.filter(t => !['resolved', 'closed'].includes(t.status));
  const completedTickets = filteredAndSortedTickets.filter(t => ['resolved', 'closed'].includes(t.status));
  const scheduledTickets = filteredAndSortedTickets.filter(t => t.scheduled_date);

  if (loading && tickets.length === 0) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full" dir="rtl">
          <AppSidebar />
          <div className="flex-1">
            <AppHeader onOpenSettings={() => {}} />
            <main className="container mx-auto p-6 space-y-6">
              <div className="p-6 rounded-2xl animate-pulse bg-card border">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-6 w-48 bg-muted rounded" />
                    <div className="h-4 w-32 bg-muted/50 rounded" />
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="p-6 rounded-xl bg-card border animate-pulse">
                    <div className="h-4 w-20 bg-muted rounded mb-2" />
                    <div className="h-8 w-12 bg-muted rounded" />
                  </div>
                ))}
              </div>
              {[1, 2, 3].map(i => (
                <div key={i} className="p-6 rounded-xl bg-card border animate-pulse">
                  <div className="flex justify-between">
                    <div className="space-y-2"><div className="h-5 w-32 bg-muted rounded" /><div className="h-4 w-48 bg-muted/50 rounded" /></div>
                    <div className="h-8 w-20 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </main>
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
              openTicketsCount={activeTickets.length}
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
              openTickets={activeTickets.length}
              completedTickets={completedTickets.length}
              scheduledTickets={scheduledTickets.length}
            />

            {/* Notifications banner */}
            {notifications.length > 0 && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">إشعارات جديدة ({notifications.length})</span>
                  </div>
                  <div className="space-y-1">
                    {notifications.slice(0, 3).map(n => (
                      <p key={n.id} className="text-xs text-muted-foreground">• {n.message}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="active" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 h-12">
                <TabsTrigger value="active" className="text-sm font-semibold">
                  📋 الجارية ({activeTickets.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="text-sm font-semibold">
                  ✅ المكتملة ({completedTickets.length})
                </TabsTrigger>
                <TabsTrigger value="tracking" className="text-sm font-semibold">
                  🗺️ التتبع
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="space-y-4">
                {activeTickets.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="pt-6 text-center py-16">
                      <Clock className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground text-lg font-medium">لا توجد تذاكر جارية حالياً</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">ستظهر هنا عند تعيين طلبات صيانة جديدة لك</p>
                    </CardContent>
                  </Card>
                ) : (
                  activeTickets.map(ticket => (
                    <TechnicianTicketCard
                      key={ticket.id}
                      ticket={ticket}
                      technicianId={technicianRecordId || undefined}
                      onOpenDetails={handleOpenTicketDetails}
                      onStatusUpdated={fetchTickets}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                {completedTickets.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="pt-6 text-center py-16">
                      <CheckCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground text-lg font-medium">لا توجد تذاكر مكتملة</p>
                    </CardContent>
                  </Card>
                ) : (
                  completedTickets.map(ticket => (
                    <TechnicianTicketCard
                      key={ticket.id}
                      ticket={ticket}
                      technicianId={technicianRecordId || undefined}
                      onOpenDetails={handleOpenTicketDetails}
                      onStatusUpdated={fetchTickets}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="tracking" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    {currentLocation ? (
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50">
                          <div className="flex items-center gap-3 mb-1">
                            <Activity className="h-5 w-5 text-emerald-600 animate-pulse" />
                            <p className="font-bold text-emerald-700">التتبع نشط</p>
                          </div>
                          <p className="text-sm text-emerald-600 font-mono">
                            {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                          </p>
                        </div>
                        <div className="rounded-xl overflow-hidden border">
                          <iframe
                            width="100%" height="400" frameBorder="0" style={{ border: 0 }}
                            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${currentLocation.lat},${currentLocation.lng}&zoom=16`}
                            allowFullScreen title="موقعك الحالي"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Button variant="outline" onClick={() => window.open(`https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`, '_blank')}>
                            🗺️ Google Maps
                          </Button>
                          <Button variant="outline" onClick={() => window.open(`https://waze.com/ul?ll=${currentLocation.lat},${currentLocation.lng}&navigate=yes`, '_blank')}>
                            🧭 Waze
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <MapPin className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground text-lg">يتم تحديد موقعك...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>

        <TicketDetailsModal
          ticketId={selectedTicketId}
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          onTicketUpdated={fetchTickets}
        />

        {/* FAB */}
        <Button
          onClick={() => setAllTicketsSheetOpen(true)}
          className="fixed left-6 bottom-6 h-14 w-14 rounded-full shadow-lg z-50 hover:scale-110 transition-transform"
          size="icon"
        >
          <div className="relative">
            <Wrench className="h-6 w-6" />
            {tickets.length > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs rounded-full">
                {tickets.length}
              </Badge>
            )}
          </div>
        </Button>

        <Sheet open={allTicketsSheetOpen} onOpenChange={setAllTicketsSheetOpen}>
          <SheetContent side="left" className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                <Wrench className="h-5 w-5" /> جميع التذاكر ({tickets.length})
              </SheetTitle>
              <SheetDescription>قائمة كاملة بجميع تذاكر الصيانة المسندة إليك</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="ابحث عن تذكرة..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-10" />
              </div>
              <div className="space-y-3">
                {filteredAndSortedTickets.length === 0 ? (
                  <div className="text-center py-12">
                    <ListTodo className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">لا توجد تذاكر</p>
                  </div>
                ) : (
                  filteredAndSortedTickets.map(ticket => (
                    <TechnicianTicketCard
                      key={ticket.id}
                      ticket={ticket}
                      technicianId={technicianRecordId || undefined}
                      onOpenDetails={id => { handleOpenTicketDetails(id); setAllTicketsSheetOpen(false); }}
                      onStatusUpdated={fetchTickets}
                    />
                  ))
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <MobileBottomNav role="technician" />
    </SidebarProvider>
  );
};

export default TechnicianDashboard;
