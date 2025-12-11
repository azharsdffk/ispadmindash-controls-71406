import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, MapPin, Wrench, Search, Eye, Activity, Clock, CheckCircle, 
  AlertTriangle, Navigation, Phone, User, ListTodo, Calendar, 
  ExternalLink, RefreshCw
} from 'lucide-react';
import { TechniciansTable } from './TechniciansTable';
import { TicketDetailsModal } from '@/components/modals/TicketDetailsModal';
import { toast } from 'sonner';

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
}

interface Technician {
  id: string;
  full_name: string;
  phone: string | null;
  username: string | null;
  created_at: string;
}

// حساب المسافة بين نقطتين GPS
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
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
  const [activeView, setActiveView] = useState<'list' | 'map' | 'tickets' | 'workload'>('list');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

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
      // Get technician profiles
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

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesSearch = 
        ticket.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.subscribers?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.issue_description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
      const matchesTechnician = technicianFilter === 'all' || ticket.technician_id === technicianFilter;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesTechnician;
    });
  }, [tickets, searchQuery, statusFilter, priorityFilter, technicianFilter]);

  // Calculate workload per technician
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

  const activeCount = technicianLocations.filter(l => isActiveRecently(l.recorded_at)).length;
  const openTicketsCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const unassignedCount = tickets.filter(t => !t.technician_id && (t.status === 'open' || t.status === 'in_progress')).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
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
                <p className="text-2xl font-bold">
                  {tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length}
                </p>
                <p className="text-sm text-muted-foreground">مكتملة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Controls */}
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

      {/* Technicians List View */}
      {activeView === 'list' && <TechniciansTable />}

      {/* Map/Locations View */}
      {activeView === 'map' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              مواقع الفنيين
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
                          <div className={`h-2 w-2 rounded-full ${isActiveRecently(location.recorded_at) ? 'bg-green-500' : 'bg-gray-400'}`} />
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
                          <Badge className="bg-success/10 text-success border-success/20">
                            <Activity className="h-3 w-3 ml-1" />
                            نشط
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 ml-1" />
                            غير نشط
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(location.recorded_at).toLocaleString('ar-IQ')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{techTickets.length} تذكرة</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openGoogleMaps(location.latitude, location.longitude)}>
                          <Navigation className="h-4 w-4 ml-1" />
                          الموقع
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {technicianLocations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      لا توجد بيانات مواقع متاحة
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Tickets View */}
      {activeView === 'tickets' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  تذاكر الصيانة
                </CardTitle>
                <CardDescription>جميع التذاكر مع إمكانية التصفية</CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="open">مفتوح</SelectItem>
                    <SelectItem value="in_progress">قيد العمل</SelectItem>
                    <SelectItem value="resolved">محلول</SelectItem>
                    <SelectItem value="closed">مغلق</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="الأولوية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="urgent">عاجلة</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="low">منخفضة</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={technicianFilter} onValueChange={setTechnicianFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="الفني" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="unassigned">غير معينة</SelectItem>
                    {technicians.map(tech => (
                      <SelectItem key={tech.id} value={tech.id}>{tech.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم التذكرة</TableHead>
                  <TableHead>المشترك</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>الفني</TableHead>
                  <TableHead>الأولوية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets
                  .filter(t => technicianFilter === 'unassigned' ? !t.technician_id : true)
                  .map((ticket) => (
                  <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{ticket.ticket_number}</TableCell>
                    <TableCell>
                      <div>
                        <p>{ticket.subscribers?.name || '-'}</p>
                        <p className="text-xs text-muted-foreground">{ticket.subscribers?.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{ticket.issue_description}</TableCell>
                    <TableCell>
                      {ticket.technician_profile?.full_name || (
                        <span className="text-destructive">غير معين</span>
                      )}
                    </TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell className="text-sm">{new Date(ticket.created_at).toLocaleDateString('ar-IQ')}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openTicketDetails(ticket.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {ticket.subscribers?.latitude && (
                          <Button variant="ghost" size="sm" onClick={() => openGoogleMaps(ticket.subscribers!.latitude!, ticket.subscribers!.longitude!)}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Workload View */}
      {activeView === 'workload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              عبء العمل للفنيين
            </CardTitle>
            <CardDescription>توزيع التذاكر على الفنيين</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {technicianWorkload.map((tech) => (
                <Card key={tech.id} className={`${tech.isActive ? 'border-green-500/30' : 'border-gray-300/30'}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${tech.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                        <div>
                          <p className="font-semibold">{tech.full_name}</p>
                          <p className="text-xs text-muted-foreground">{tech.phone || '-'}</p>
                        </div>
                      </div>
                      <Badge variant={tech.isActive ? 'default' : 'secondary'}>
                        {tech.isActive ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 rounded bg-yellow-500/10 text-center">
                        <p className="text-lg font-bold text-yellow-600">{tech.openTickets}</p>
                        <p className="text-xs text-muted-foreground">جارية</p>
                      </div>
                      <div className="p-2 rounded bg-green-500/10 text-center">
                        <p className="text-lg font-bold text-green-600">{tech.completedTickets}</p>
                        <p className="text-xs text-muted-foreground">مكتملة</p>
                      </div>
                      <div className="p-2 rounded bg-red-500/10 text-center">
                        <p className="text-lg font-bold text-red-600">{tech.urgentTickets}</p>
                        <p className="text-xs text-muted-foreground">عاجلة</p>
                      </div>
                      <div className="p-2 rounded bg-blue-500/10 text-center">
                        <p className="text-lg font-bold text-blue-600">{tech.totalTickets}</p>
                        <p className="text-xs text-muted-foreground">الإجمالي</p>
                      </div>
                    </div>
                    {tech.lastLocation && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-4"
                        onClick={() => openGoogleMaps(tech.lastLocation!.latitude, tech.lastLocation!.longitude)}
                      >
                        <MapPin className="h-4 w-4 ml-2" />
                        عرض الموقع
                      </Button>
                    )}
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