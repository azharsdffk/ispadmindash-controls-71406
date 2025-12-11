import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, MapPin, Wrench, Search, Eye, Activity, Clock, CheckCircle, 
  AlertTriangle, Navigation, Phone, User
} from 'lucide-react';
import { TechniciansTable } from './TechniciansTable';

interface TechnicianLocation {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
  accuracy: number | null;
  profile?: {
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
  technician_id: string;
  created_at: string;
  subscribers: {
    name: string;
    address: string | null;
  } | null;
}

export const AdminTechnicianView = () => {
  const [technicianLocations, setTechnicianLocations] = useState<TechnicianLocation[]>([]);
  const [technicianTickets, setTechnicianTickets] = useState<TechnicianTicket[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'list' | 'map' | 'tickets'>('list');

  useEffect(() => {
    fetchData();
    
    // Real-time updates for locations
    const locationChannel = supabase
      .channel('admin_technician_locations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'employee_locations'
      }, () => {
        fetchLocations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(locationChannel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTechnicians(),
        fetchLocations(),
        fetchTickets()
      ]);
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
        .select('*')
        .in('id', techIds);
      
      setTechnicians(profiles || []);
    }
  };

  const fetchLocations = async () => {
    // Get latest location for each technician
    const { data: locations } = await supabase
      .from('employee_locations')
      .select('*')
      .order('recorded_at', { ascending: false });

    if (locations) {
      // Get unique latest location per user
      const latestLocations = locations.reduce((acc: TechnicianLocation[], loc) => {
        if (!acc.find(l => l.user_id === loc.user_id)) {
          acc.push(loc);
        }
        return acc;
      }, []);

      // Fetch profiles for each technician
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
      .select('*, subscribers(name, address)')
      .not('technician_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    setTechnicianTickets(data || []);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'open': { label: 'مفتوح', variant: 'secondary' },
      'in_progress': { label: 'قيد العمل', variant: 'default' },
      'resolved': { label: 'محلول', variant: 'default' },
      'closed': { label: 'مغلق', variant: 'outline' },
    };
    const config = statusMap[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      'low': { label: 'منخفضة', variant: 'secondary' },
      'medium': { label: 'متوسطة', variant: 'default' },
      'high': { label: 'عالية', variant: 'destructive' },
      'urgent': { label: 'عاجلة', variant: 'destructive' },
    };
    const config = priorityMap[priority] || { label: priority, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isActiveRecently = (recordedAt: string) => {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return new Date(recordedAt) > fifteenMinutesAgo;
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  const activeCount = technicianLocations.filter(l => l.recorded_at && isActiveRecently(l.recorded_at)).length;
  const openTicketsCount = technicianTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-info/10">
                <CheckCircle className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {technicianTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length}
                </p>
                <p className="text-sm text-muted-foreground">تذاكر مكتملة</p>
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
            placeholder="بحث عن فني..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={activeView === 'list' ? 'default' : 'outline'} 
            onClick={() => setActiveView('list')}
          >
            <Users className="h-4 w-4 ml-2" />
            القائمة
          </Button>
          <Button 
            variant={activeView === 'map' ? 'default' : 'outline'} 
            onClick={() => setActiveView('map')}
          >
            <MapPin className="h-4 w-4 ml-2" />
            المواقع
          </Button>
          <Button 
            variant={activeView === 'tickets' ? 'default' : 'outline'} 
            onClick={() => setActiveView('tickets')}
          >
            <Wrench className="h-4 w-4 ml-2" />
            التذاكر
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
                  <TableHead>الدقة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {technicianLocations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
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
                    <TableCell>
                      {new Date(location.recorded_at).toLocaleString('ar-IQ')}
                    </TableCell>
                    <TableCell>
                      {location.accuracy ? `${location.accuracy.toFixed(0)}م` : '-'}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openGoogleMaps(location.latitude, location.longitude)}
                      >
                        <Navigation className="h-4 w-4 ml-1" />
                        عرض الموقع
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              تذاكر الفنيين
            </CardTitle>
            <CardDescription>جميع التذاكر المعينة للفنيين</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم التذكرة</TableHead>
                  <TableHead>المشترك</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>الأولوية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {technicianTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.ticket_number}</TableCell>
                    <TableCell>{ticket.subscribers?.name || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{ticket.subscribers?.address || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{ticket.issue_description}</TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>{new Date(ticket.created_at).toLocaleDateString('ar-IQ')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};