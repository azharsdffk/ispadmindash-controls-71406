import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import { 
  Ticket, 
  User, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Phone,
  MapPin,
  Wrench,
  UserPlus
} from 'lucide-react';

interface TicketWithDetails {
  id: string;
  ticket_number: string;
  issue_type: string | null;
  issue_description: string;
  status: string;
  priority: string;
  created_at: string;
  technician_id: string | null;
  subscriber: {
    id: string;
    name: string;
    phone: string;
    address: string | null;
    username: string | null;
  };
  technician?: {
    id: string;
    name: string;
    phone: string;
  } | null;
}

interface Technician {
  id: string;
  name: string;
  phone: string;
  available: boolean;
  specialization: string | null;
}

interface AgentStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  totalSubscribers: number;
}

export default function AgentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [stats, setStats] = useState<AgentStats>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    totalSubscribers: 0
  });
  const [selectedTicket, setSelectedTicket] = useState<TicketWithDetails | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTickets(),
        loadTechnicians(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_tickets')
        .select(`
          id,
          ticket_number,
          issue_type,
          issue_description,
          status,
          priority,
          created_at,
          technician_id,
          subscribers:subscriber_id (
            id,
            name,
            phone,
            address,
            username
          ),
          technicians:technician_id (
            id,
            name,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTickets = (data || []).map(ticket => ({
        ...ticket,
        subscriber: ticket.subscribers as any,
        technician: ticket.technicians as any
      }));

      setTickets(formattedTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  };

  const loadTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .eq('available', true);

      if (error) throw error;
      setTechnicians(data || []);
    } catch (error) {
      console.error('Error loading technicians:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data: ticketsData } = await supabase
        .from('maintenance_tickets')
        .select('status');

      const { count: subscribersCount } = await supabase
        .from('subscribers')
        .select('*', { count: 'exact', head: true });

      const openCount = ticketsData?.filter(t => t.status === 'open').length || 0;
      const inProgressCount = ticketsData?.filter(t => t.status === 'in_progress').length || 0;
      const resolvedCount = ticketsData?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0;

      setStats({
        totalTickets: ticketsData?.length || 0,
        openTickets: openCount,
        inProgressTickets: inProgressCount,
        resolvedTickets: resolvedCount,
        totalSubscribers: subscribersCount || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const assignTechnician = async () => {
    if (!selectedTicket || !selectedTechnician) {
      toast.error('الرجاء اختيار فني');
      return;
    }

    setAssigning(true);
    try {
      const { error } = await supabase
        .from('maintenance_tickets')
        .update({ 
          technician_id: selectedTechnician,
          status: 'in_progress'
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      toast.success('تم تعيين الفني بنجاح');
      setAssignDialogOpen(false);
      setSelectedTicket(null);
      setSelectedTechnician('');
      await loadData();
    } catch (error) {
      console.error('Error assigning technician:', error);
      toast.error('حدث خطأ في تعيين الفني');
    } finally {
      setAssigning(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive">جديد</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-500">قيد المعالجة</Badge>;
      case 'resolved':
      case 'closed':
        return <Badge className="bg-green-500">تم</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">عاجل</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">مرتفع</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">متوسط</Badge>;
      case 'low':
        return <Badge variant="secondary">منخفض</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getIssueLabel = (issueType: string | null) => {
    const issueTypes: Record<string, string> = {
      'no_internet': 'انقطاع الخدمة',
      'slow_internet': 'انترنت بطيء',
      'intermittent': 'تقطعات متكررة',
      'router_issue': 'مشكلة بالراوتر',
    };
    return issueType ? issueTypes[issueType] || issueType : '-';
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    if (filter === 'open') return ticket.status === 'open';
    if (filter === 'in_progress') return ticket.status === 'in_progress';
    if (filter === 'resolved') return ticket.status === 'resolved' || ticket.status === 'closed';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>لوحة تحكم الوكيل</title>
      </Helmet>

      <div className="min-h-screen bg-background p-4 md:p-6" dir="rtl">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">لوحة تحكم الوكيل</h1>
            <Button onClick={loadData} variant="outline" size="sm">
              تحديث
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Ticket className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalTickets}</p>
                    <p className="text-xs text-muted-foreground">إجمالي التذاكر</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.openTickets}</p>
                    <p className="text-xs text-muted-foreground">تذاكر جديدة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.inProgressTickets}</p>
                    <p className="text-xs text-muted-foreground">قيد المعالجة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.resolvedTickets}</p>
                    <p className="text-xs text-muted-foreground">تم حلها</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('all')}
            >
              الكل ({stats.totalTickets})
            </Button>
            <Button 
              variant={filter === 'open' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('open')}
            >
              جديدة ({stats.openTickets})
            </Button>
            <Button 
              variant={filter === 'in_progress' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('in_progress')}
            >
              قيد المعالجة ({stats.inProgressTickets})
            </Button>
            <Button 
              variant={filter === 'resolved' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('resolved')}
            >
              مكتملة ({stats.resolvedTickets})
            </Button>
          </div>

          {/* Tickets List */}
          <div className="space-y-3">
            {filteredTickets.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد تذاكر</p>
                </CardContent>
              </Card>
            ) : (
              filteredTickets.map((ticket) => (
                <Card key={ticket.id} className={ticket.status === 'open' ? 'border-red-500/50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      {/* Ticket Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold">{ticket.ticket_number}</span>
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                        
                        <p className="font-medium">{getIssueLabel(ticket.issue_type)}</p>
                        
                        {/* Subscriber Info */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {ticket.subscriber?.name || '-'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {ticket.subscriber?.phone || '-'}
                          </span>
                          {ticket.subscriber?.address && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {ticket.subscriber.address}
                            </span>
                          )}
                        </div>

                        {/* Assigned Technician */}
                        {ticket.technician && (
                          <div className="flex items-center gap-2 text-sm">
                            <Wrench className="h-3 w-3 text-primary" />
                            <span>الفني: <strong>{ticket.technician.name}</strong></span>
                            <span className="text-muted-foreground">({ticket.technician.phone})</span>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                          {new Date(ticket.created_at).toLocaleString('ar-IQ')}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {ticket.status === 'open' && !ticket.technician_id && (
                          <Dialog open={assignDialogOpen && selectedTicket?.id === ticket.id} onOpenChange={(open) => {
                            setAssignDialogOpen(open);
                            if (!open) {
                              setSelectedTicket(null);
                              setSelectedTechnician('');
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm"
                                onClick={() => setSelectedTicket(ticket)}
                              >
                                <UserPlus className="h-4 w-4 ml-1" />
                                تعيين فني
                              </Button>
                            </DialogTrigger>
                            <DialogContent dir="rtl">
                              <DialogHeader>
                                <DialogTitle>تعيين فني للتذكرة</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="p-3 bg-muted rounded-lg text-sm">
                                  <p><strong>التذكرة:</strong> {ticket.ticket_number}</p>
                                  <p><strong>العميل:</strong> {ticket.subscriber?.name}</p>
                                  <p><strong>المشكلة:</strong> {getIssueLabel(ticket.issue_type)}</p>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-sm font-medium">اختر الفني</label>
                                  <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="اختر فني..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {technicians.map((tech) => (
                                        <SelectItem key={tech.id} value={tech.id}>
                                          <div className="flex items-center gap-2">
                                            <span>{tech.name}</span>
                                            {tech.specialization && (
                                              <span className="text-xs text-muted-foreground">
                                                ({tech.specialization})
                                              </span>
                                            )}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <Button 
                                  className="w-full" 
                                  onClick={assignTechnician}
                                  disabled={!selectedTechnician || assigning}
                                >
                                  {assigning ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    'تعيين الفني'
                                  )}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

                        {ticket.subscriber?.phone && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.location.href = `tel:${ticket.subscriber.phone}`}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
