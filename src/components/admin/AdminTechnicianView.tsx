import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, MapPin, Wrench, Search, Eye, Activity, Clock, CheckCircle, 
  AlertTriangle, Navigation, Phone, User, ListTodo, Calendar, 
  RefreshCw, FileText, TrendingUp, ArrowLeft
} from 'lucide-react';
import { TechniciansTable } from './TechniciansTable';
import { TicketDetailsModal } from '@/components/modals/TicketDetailsModal';
import { TechnicianStats } from '@/components/technician/TechnicianStats';
import { TechnicianLiveMapbox } from './TechnicianLiveMapbox';

interface TechnicianLocation {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
  accuracy: number | null;
  profile?: {
    id: string;
    full_name: string;
    phone: string | null;
  };
}

interface TechnicianTicket {
  id: string;
  ticket_number: string;
  issue_description: string;
  status: string;
  priority: string;
  technician_id: string | null;
  created_at: string;
  scheduled_date: string | null;
  notes: string | null;
  subscribers: {
    id: string;
    name: string;
    phone: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  technician_profile?: {
    full_name: string;
    phone: string | null;
  };
  distance?: number;
}

interface Technician {
  id: string;
  full_name: string;
  phone: string | null;
  username: string | null;
  created_at: string;
}

const TicketCard = ({ ticket, onOpenDetails }: { ticket: TechnicianTicket; onOpenDetails: (id: string) => void }) => {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      open: { label: 'مفتوحة', className: 'bg-blue-500 text-white' },
      in_progress: { label: 'قيد التنفيذ', className: 'bg-yellow-500 text-white' },
      resolved: { label: 'منجزة', className: 'bg-green-500 text-white' },
      closed: { label: 'مغلقة', className: 'bg-gray-500 text-white' },
    };
    const config = variants[status] || variants.open;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      low: { label: 'منخفضة', className: 'bg-blue-400 text-white' },
      medium: { label: 'متوسطة', className: 'bg-yellow-400 text-white' },
      high: { label: 'عالية', className: 'bg-orange-500 text-white' },
      urgent: { label: 'عاجلة', className: 'bg-red-500 text-white' },
    };
    const config = variants[priority] || variants.medium;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const ticketDistance = ticket.distance !== undefined && ticket.distance < 999999 
    ? ticket.distance.toFixed(2) 
    : null;

  return (
    <Card className="glass-card hover:shadow-glow transition-all duration-300 border-r-4 border-r-primary group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 border-2 border-primary/50 shadow-lg group-hover:scale-110 transition-transform">
              <AvatarFallback className="gradient-bg text-white text-lg font-bold">
                {ticket.subscribers?.name?.charAt(0) || <User className="h-7 w-7" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle 
                className="text-lg font-bold gradient-text cursor-pointer hover:underline"
                onClick={() => onOpenDetails(ticket.id)}
              >
                {ticket.subscribers?.name || 'غير محدد'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{ticket.ticket_number}</p>
              {ticket.technician_profile && (
                <p className="text-xs text-primary mt-1">الفني: {ticket.technician_profile.full_name}</p>
              )}
              {ticketDistance && (
                <p className="text-xs text-primary font-bold mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {ticketDistance} كم
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
    
      <CardContent className="space-y-3">
        <div className="glass-card p-4 rounded-xl space-y-3">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1">وصف المشكلة:</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{ticket.issue_description}</p>
            </div>
          </div>
          
          {ticket.subscribers?.address && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
              <p className="text-sm">{ticket.subscribers.address}</p>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-primary flex-shrink-0" />
            <a 
              href={`tel:${ticket.subscribers?.phone}`} 
              className="text-sm text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {ticket.subscribers?.phone || 'غير متوفر'}
            </a>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Clock className="h-5 w-5 text-primary flex-shrink-0" />
            <span>
              {new Date(ticket.created_at).toLocaleDateString('ar-IQ', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>

          {ticket.scheduled_date && (
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="font-medium text-primary">
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
            <div className="mt-2 p-3 glass-card rounded-lg">
              <p className="text-xs font-semibold text-muted-foreground mb-1">ملاحظات:</p>
              <p className="text-sm">{ticket.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const AdminTechnicianView = () => {
  const [technicianLocations, setTechnicianLocations] = useState<TechnicianLocation[]>([]);
  const [tickets, setTickets] = useState<TechnicianTicket[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [technicianFilter, setTechnicianFilter] = useState('all');
  const [activeView, setActiveView] = useState<'list' | 'map' | 'tickets' | 'workload' | 'cards' | 'tracking'>('list');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    
    const locationChannel = supabase
      .channel('admin_technician_locations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_locations' }, fetchLocations)
      .subscribe();

    const ticketChannel = supabase
      .channel('admin_technician_tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_tickets' }, fetchTickets)
      .subscribe();

    return () => {
      supabase.removeChannel(locationChannel);
      supabase.removeChannel(ticketChannel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchTechnicians(), fetchLocations(), fetchTickets()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    const { data: techRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'technician');

    if (techRoles && techRoles.length > 0) {
      const techIds = techRoles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone, username, created_at')
        .in('id', techIds);
      
      setTechnicians(profiles || []);
    }
  };

  const fetchLocations = async () => {
    const { data: locations } = await supabase
      .from('employee_locations')
      .select('*')
      .order('recorded_at', { ascending: false });

    if (locations) {
      const latestLocations = locations.reduce((acc: TechnicianLocation[], loc) => {
        if (!acc.find(l => l.user_id === loc.user_id)) {
          acc.push(loc);
        }
        return acc;
      }, []);

      const userIds = latestLocations.map(l => l.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', userIds);

      const locationsWithProfiles = latestLocations.map(loc => ({
        ...loc,
        profile: profiles?.find(p => p.id === loc.user_id)
      }));

      setTechnicianLocations(locationsWithProfiles);
    }
  };

  const fetchTickets = async () => {
    const { data } = await supabase
      .from('maintenance_tickets')
      .select('*, subscribers(id, name, phone, address, latitude, longitude)')
      .order('created_at', { ascending: false })
      .limit(200);

    if (data) {
      const techIds = [...new Set(data.filter(t => t.technician_id).map(t => t.technician_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', techIds as string[]);

      const ticketsWithTechs = data.map(ticket => ({
        ...ticket,
        technician_profile: profiles?.find(p => p.id === ticket.technician_id)
      }));

      setTickets(ticketsWithTechs);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
      'open': { label: 'مفتوح', variant: 'secondary', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
      'in_progress': { label: 'قيد العمل', variant: 'default', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
      'resolved': { label: 'محلول', variant: 'default', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
      'closed': { label: 'مغلق', variant: 'outline', className: 'bg-gray-500/10 text-gray-600 border-gray-500/20' },
    };
    const config = statusMap[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive'; className?: string }> = {
      'low': { label: 'منخفضة', variant: 'secondary', className: 'bg-gray-500/10 text-gray-600' },
      'medium': { label: 'متوسطة', variant: 'default', className: 'bg-blue-500/10 text-blue-600' },
      'high': { label: 'عالية', variant: 'destructive', className: 'bg-orange-500/10 text-orange-600' },
      'urgent': { label: 'عاجلة', variant: 'destructive', className: 'bg-red-500/10 text-red-600' },
    };
    const config = priorityMap[priority] || { label: priority, variant: 'secondary' as const };
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const isActiveRecently = (recordedAt: string) => {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return new Date(recordedAt) > fifteenMinutesAgo;
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  const openTicketDetails = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setDetailsModalOpen(true);
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesSearch = 
        ticket.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.subscribers?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.issue_description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
      const matchesTechnician = technicianFilter === 'all' || 
        (technicianFilter === 'unassigned' ? !ticket.technician_id : ticket.technician_id === technicianFilter);
      
      return matchesSearch && matchesStatus && matchesPriority && matchesTechnician;
    });
  }, [tickets, searchQuery, statusFilter, priorityFilter, technicianFilter]);

  const technicianWorkload = useMemo(() => {
    return technicians.map(tech => {
      const techTickets = tickets.filter(t => t.technician_id === tech.id);
      const openCount = techTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
      const completedCount = techTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
      const urgentCount = techTickets.filter(t => t.priority === 'urgent' || t.priority === 'high').length;
      const location = technicianLocations.find(l => l.user_id === tech.id);
      
      return {
        ...tech,
        openTickets: openCount,
        completedTickets: completedCount,
        urgentTickets: urgentCount,
        totalTickets: techTickets.length,
        isActive: location ? isActiveRecently(location.recorded_at) : false,
        lastLocation: location
      };
    });
  }, [technicians, tickets, technicianLocations]);

  const selectedTechnician = useMemo(() => {
    if (!selectedTechnicianId) return null;
    return technicians.find(t => t.id === selectedTechnicianId);
  }, [selectedTechnicianId, technicians]);

  const selectedTechnicianTickets = useMemo(() => {
    if (!selectedTechnicianId) return [];
    return tickets.filter(t => t.technician_id === selectedTechnicianId);
  }, [selectedTechnicianId, tickets]);

  const selectedTechnicianLocation = useMemo(() => {
    if (!selectedTechnicianId) return null;
    return technicianLocations.find(l => l.user_id === selectedTechnicianId);
  }, [selectedTechnicianId, technicianLocations]);

  const activeCount = technicianLocations.filter(l => isActiveRecently(l.recorded_at)).length;
  const openTicketsCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const unassignedCount = tickets.filter(t => !t.technician_id && (t.status === 'open' || t.status === 'in_progress')).length;
  const completedTicketsCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  const viewTechnicianDashboard = (techId: string) => {
    setSelectedTechnicianId(techId);
    setActiveView('cards');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (selectedTechnicianId && (activeView === 'cards' || activeView === 'tracking')) {
    const techOpenTickets = selectedTechnicianTickets.filter(t => t.status === 'open' || t.status === 'in_progress');
    const techCompletedTickets = selectedTechnicianTickets.filter(t => t.status === 'resolved' || t.status === 'closed');
    const techScheduledTickets = selectedTechnicianTickets.filter(t => t.scheduled_date);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => { setSelectedTechnicianId(null); setActiveView('list'); }}>
            <ArrowLeft className="h-4 w-4 ml-2" />
            رجوع
          </Button>
          <h2 className="text-2xl font-bold">لوحة الفني: {selectedTechnician?.full_name}</h2>
        </div>

        <Card className="glass-card shadow-glow border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6 flex-wrap">
              <Avatar className="h-20 w-20 border-4 border-primary shadow-glow">
                <AvatarFallback className="gradient-bg text-white text-2xl font-bold">
                  {selectedTechnician?.full_name?.charAt(0) || 'ف'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-[200px]">
                <h2 className="text-3xl font-bold gradient-text">
                  {selectedTechnician?.full_name || 'الفني'}
                </h2>
                <p className="text-sm text-muted-foreground font-medium mt-2 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {selectedTechnician?.phone || 'لا يوجد رقم هاتف'}
                </p>
                {selectedTechnicianLocation && (
                  <div className="flex items-center gap-2 mt-2">
                    <Activity className={`h-4 w-4 ${isActiveRecently(selectedTechnicianLocation.recorded_at) ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
                    <p className={`text-xs font-bold ${isActiveRecently(selectedTechnicianLocation.recorded_at) ? 'text-green-600' : 'text-gray-500'}`}>
                      {isActiveRecently(selectedTechnicianLocation.recorded_at) ? '🟢 نشط' : '⚫ غير نشط'} • 
                      {selectedTechnicianLocation.latitude.toFixed(4)}, {selectedTechnicianLocation.longitude.toFixed(4)}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4">
                <div className="text-center p-4 glass-card rounded-2xl min-w-[90px]">
                  <p className="text-3xl font-bold text-yellow-500">{techOpenTickets.length}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">جارية</p>
                </div>
                <div className="text-center p-4 glass-card rounded-2xl min-w-[90px]">
                  <p className="text-3xl font-bold text-green-500">{techCompletedTickets.length}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">مكتملة</p>
                </div>
                <div className="text-center p-4 glass-card rounded-2xl min-w-[90px]">
                  <p className="text-3xl font-bold text-blue-500">{techScheduledTickets.length}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">مجدولة</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <TechnicianStats
          totalTickets={selectedTechnicianTickets.length}
          openTickets={techOpenTickets.length}
          completedTickets={techCompletedTickets.length}
          scheduledTickets={techScheduledTickets.length}
        />

        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="space-y-4">
          <TabsList className="glass-card grid w-full grid-cols-3 h-14">
            <TabsTrigger value="cards" className="text-sm font-semibold data-[state=active]:gradient-bg data-[state=active]:text-white">
              📋 التذاكر ({selectedTechnicianTickets.length})
            </TabsTrigger>
            <TabsTrigger value="tracking" className="text-sm font-semibold data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
              🗺️ التتبع
            </TabsTrigger>
            <TabsTrigger value="list" className="text-sm font-semibold" onClick={() => setSelectedTechnicianId(null)}>
              ← الرجوع للقائمة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="space-y-4">
            <Tabs defaultValue="open" className="space-y-4">
              <TabsList className="glass-card">
                <TabsTrigger value="open">الجارية ({techOpenTickets.length})</TabsTrigger>
                <TabsTrigger value="completed">المكتملة ({techCompletedTickets.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="open" className="space-y-4">
                {techOpenTickets.length === 0 ? (
                  <Card className="glass-card border-dashed">
                    <CardContent className="pt-6 text-center py-16">
                      <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <p className="text-muted-foreground text-lg font-medium">لا توجد تذاكر جارية</p>
                    </CardContent>
                  </Card>
                ) : (
                  techOpenTickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} onOpenDetails={openTicketDetails} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                {techCompletedTickets.length === 0 ? (
                  <Card className="glass-card border-dashed">
                    <CardContent className="pt-6 text-center py-16">
                      <CheckCircle className="h-16 w-16 mx-auto text-success mb-4 opacity-50" />
                      <p className="text-muted-foreground text-lg font-medium">لا توجد تذاكر مكتملة</p>
                    </CardContent>
                  </Card>
                ) : (
                  techCompletedTickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} onOpenDetails={openTicketDetails} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4">
            <Card className="glass-card">
              <CardContent className="pt-6">
                {selectedTechnicianLocation ? (
                  <div className="space-y-4">
                    <div className={`p-4 glass-card rounded-xl border ${isActiveRecently(selectedTechnicianLocation.recorded_at) ? 'border-green-500/20' : 'border-gray-500/20'}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <Activity className={`h-5 w-5 ${isActiveRecently(selectedTechnicianLocation.recorded_at) ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
                        <p className={`font-bold ${isActiveRecently(selectedTechnicianLocation.recorded_at) ? 'text-green-500' : 'text-gray-500'}`}>
                          {isActiveRecently(selectedTechnicianLocation.recorded_at) ? '🟢 التتبع نشط' : '⚫ التتبع غير نشط'}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        الإحداثيات: <span className="font-mono font-bold">{selectedTechnicianLocation.latitude.toFixed(6)}, {selectedTechnicianLocation.longitude.toFixed(6)}</span>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        آخر تحديث: {new Date(selectedTechnicianLocation.recorded_at).toLocaleString('ar-IQ')}
                      </p>
                    </div>
                    
                    <div className="rounded-2xl overflow-hidden glass-card">
                      <iframe
                        width="100%"
                        height="400"
                        frameBorder="0"
                        style={{ border: 0 }}
                        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${selectedTechnicianLocation.latitude},${selectedTechnicianLocation.longitude}&zoom=16`}
                        allowFullScreen
                        title="موقع الفني"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline"
                        onClick={() => openGoogleMaps(selectedTechnicianLocation.latitude, selectedTechnicianLocation.longitude)}
                      >
                        🗺️ Google Maps
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => window.open(`https://waze.com/ul?ll=${selectedTechnicianLocation.latitude},${selectedTechnicianLocation.longitude}&navigate=yes`, '_blank')}
                      >
                        🧭 Waze
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <p className="text-muted-foreground text-lg font-medium">لا يوجد موقع مسجل لهذا الفني</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <TicketDetailsModal
          ticketId={selectedTicketId}
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          onTicketUpdated={fetchTickets}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveView('list')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{technicians.length}</p>
                <p className="text-sm text-muted-foreground">إجمالي الفنيين</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveView('map')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-success/10">
                <Activity className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">نشط الآن</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveView('tickets')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-warning/10">
                <Wrench className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{openTicketsCount}</p>
                <p className="text-sm text-muted-foreground">تذاكر جارية</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-destructive/20" onClick={() => { setActiveView('tickets'); setTechnicianFilter('unassigned'); }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unassignedCount}</p>
                <p className="text-sm text-muted-foreground">غير معينة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveView('workload')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-info/10">
                <CheckCircle className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedTicketsCount}</p>
                <p className="text-sm text-muted-foreground">مكتملة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant={activeView === 'list' ? 'default' : 'outline'} onClick={() => setActiveView('list')}>
            <Users className="h-4 w-4 ml-2" />
            الفنيين
          </Button>
          <Button variant={activeView === 'map' ? 'default' : 'outline'} onClick={() => setActiveView('map')}>
            <MapPin className="h-4 w-4 ml-2" />
            المواقع
          </Button>
          <Button variant={activeView === 'tickets' ? 'default' : 'outline'} onClick={() => setActiveView('tickets')}>
            <Wrench className="h-4 w-4 ml-2" />
            التذاكر
          </Button>
          <Button variant={activeView === 'workload' ? 'default' : 'outline'} onClick={() => setActiveView('workload')}>
            <ListTodo className="h-4 w-4 ml-2" />
            عبء العمل
          </Button>
          <Button variant="ghost" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {activeView === 'list' && (
        <div className="space-y-4">
          <TechniciansTable />
          
          <Card>
            <CardHeader>
              <CardTitle>لوحات الفنيين</CardTitle>
              <CardDescription>اضغط على اسم الفني لعرض لوحته الكاملة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {technicians.map(tech => {
                  const location = technicianLocations.find(l => l.user_id === tech.id);
                  const techTickets = tickets.filter(t => t.technician_id === tech.id);
                  const openCount = techTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
                  
                  return (
                    <Card 
                      key={tech.id} 
                      className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                      onClick={() => viewTechnicianDashboard(tech.id)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border-2 border-primary/30">
                            <AvatarFallback className="gradient-bg text-white">
                              {tech.full_name?.charAt(0) || 'ف'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{tech.full_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className={`h-2 w-2 rounded-full ${location && isActiveRecently(location.recorded_at) ? 'bg-green-500' : 'bg-gray-400'}`} />
                              <span className="text-xs text-muted-foreground">{openCount} تذاكر جارية</span>
                            </div>
                          </div>
                          <Eye className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeView === 'map' && (
        <div className="space-y-4">
          {/* Live Map with Mapbox */}
          <TechnicianLiveMapbox onSelectTechnician={viewTechnicianDashboard} />
          
          {/* Technicians List Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                قائمة الفنيين ومواقعهم
              </CardTitle>
              <CardDescription>تتبع مواقع الفنيين في الوقت الفعلي</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الفني</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>آخر تحديث</TableHead>
                    <TableHead>التذاكر الجارية</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {technicianLocations.map((location) => {
                    const techTickets = tickets.filter(t => t.technician_id === location.user_id && (t.status === 'open' || t.status === 'in_progress'));
                    return (
                      <TableRow key={location.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${isActiveRecently(location.recorded_at) ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                            {location.profile?.full_name || 'غير معروف'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {location.profile?.phone && (
                            <a href={`tel:${location.profile.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                              <Phone className="h-4 w-4" />
                              {location.profile.phone}
                            </a>
                          )}
                        </TableCell>
                        <TableCell>
                          {isActiveRecently(location.recorded_at) ? (
                            <Badge className="bg-green-500/10 text-green-600">🟢 نشط</Badge>
                          ) : (
                            <Badge variant="secondary">⚫ غير نشط</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(location.recorded_at).toLocaleString('ar-IQ')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{techTickets.length}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openGoogleMaps(location.latitude, location.longitude)}>
                              <Navigation className="h-4 w-4 ml-1" />
                              الخريطة
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => viewTechnicianDashboard(location.user_id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {technicianLocations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2 opacity-50" />
                        <p className="text-muted-foreground">لا توجد مواقع مسجلة للفنيين</p>
                        <p className="text-xs text-muted-foreground mt-1">سيتم تحديث المواقع تلقائياً عند تفعيل تتبع الموقع من تطبيق الفني</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeView === 'tickets' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              تذاكر الصيانة
            </CardTitle>
            <CardDescription>عرض وإدارة جميع تذاكر الصيانة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="open">مفتوح</SelectItem>
                  <SelectItem value="in_progress">قيد العمل</SelectItem>
                  <SelectItem value="resolved">محلول</SelectItem>
                  <SelectItem value="closed">مغلق</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="الأولوية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأولويات</SelectItem>
                  <SelectItem value="urgent">عاجلة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="low">منخفضة</SelectItem>
                </SelectContent>
              </Select>

              <Select value={technicianFilter} onValueChange={setTechnicianFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="الفني" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الفنيين</SelectItem>
                  <SelectItem value="unassigned">غير معينة</SelectItem>
                  {technicians.map(tech => (
                    <SelectItem key={tech.id} value={tech.id}>{tech.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم التذكرة</TableHead>
                  <TableHead>المشترك</TableHead>
                  <TableHead>المشكلة</TableHead>
                  <TableHead>الفني</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الأولوية</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.slice(0, 50).map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono">{ticket.ticket_number}</TableCell>
                    <TableCell>{ticket.subscribers?.name || 'غير محدد'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{ticket.issue_description}</TableCell>
                    <TableCell>{ticket.technician_profile?.full_name || 'غير معين'}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(ticket.created_at).toLocaleDateString('ar-IQ')}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => openTicketDetails(ticket.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeView === 'workload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              توزيع عبء العمل
            </CardTitle>
            <CardDescription>عرض توزيع التذاكر على الفنيين</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {technicianWorkload.map(tech => (
                <Card 
                  key={tech.id} 
                  className={`cursor-pointer hover:shadow-lg transition-all ${tech.isActive ? 'border-green-500/30' : ''}`}
                  onClick={() => viewTechnicianDashboard(tech.id)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className={tech.isActive ? 'bg-green-500 text-white' : 'bg-gray-300'}>
                          {tech.full_name?.charAt(0) || 'ف'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{tech.full_name}</p>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${tech.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <span className="text-xs text-muted-foreground">
                            {tech.isActive ? 'نشط' : 'غير نشط'}
                          </span>
                        </div>
                      </div>
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded bg-yellow-500/10">
                        <p className="text-lg font-bold text-yellow-600">{tech.openTickets}</p>
                        <p className="text-xs text-muted-foreground">جارية</p>
                      </div>
                      <div className="p-2 rounded bg-green-500/10">
                        <p className="text-lg font-bold text-green-600">{tech.completedTickets}</p>
                        <p className="text-xs text-muted-foreground">مكتملة</p>
                      </div>
                      <div className="p-2 rounded bg-red-500/10">
                        <p className="text-lg font-bold text-red-600">{tech.urgentTickets}</p>
                        <p className="text-xs text-muted-foreground">عاجلة</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <TicketDetailsModal
        ticketId={selectedTicketId}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onTicketUpdated={fetchTickets}
      />
    </div>
  );
};