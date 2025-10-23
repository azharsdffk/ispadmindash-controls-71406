import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';
import { Wrench, CheckCircle, Clock, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

interface Ticket {
  id: string;
  ticket_number: string;
  issue_description: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  subscribers: {
    name: string;
    phone: string;
    address: string;
  };
}

const TechnicianDashboard = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTickets = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    
    try {
      // Fetch tickets
      const ticketsResponse = await supabase
        .from('maintenance_tickets')
        .select('id, ticket_number, issue_description, status, priority, created_at, subscriber_id')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });

      if (ticketsResponse.error) {
        console.error('Error fetching tickets:', ticketsResponse.error);
        toast.error('حدث خطأ أثناء جلب الطلبات');
        setLoading(false);
        return;
      }

      const ticketsData = ticketsResponse.data || [];
      const processedTickets: Ticket[] = [];

      // Fetch subscriber data for each ticket
      for (const ticket of ticketsData) {
        const subscriberResponse = await supabase
          .from('subscribers')
          .select('name, phone, address')
          .eq('id', ticket.subscriber_id)
          .single();

        processedTickets.push({
          id: ticket.id,
          ticket_number: ticket.ticket_number,
          issue_description: ticket.issue_description,
          status: ticket.status as TicketStatus,
          priority: ticket.priority as TicketPriority,
          created_at: ticket.created_at,
          subscribers: subscriberResponse.data || { name: '', phone: '', address: '' }
        });
      }

      setTickets(processedTickets);
    } catch (error) {
      console.error('Error:', error);
      toast.error('حدث خطأ أثناء جلب الطلبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user?.id]);

  const stats = {
    total: tickets.length,
    pending: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    completed: tickets.filter(t => t.status === 'resolved').length,
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const { error } = await supabase
        .from('maintenance_tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;

      toast.success('تم تحديث حالة الطلب بنجاح');
      fetchTickets();
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('حدث خطأ أثناء تحديث حالة الطلب');
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    const statusConfig = {
      open: { label: 'مفتوح', variant: 'secondary' as const },
      in_progress: { label: 'قيد التنفيذ', variant: 'default' as const },
      resolved: { label: 'تم الحل', variant: 'outline' as const },
      closed: { label: 'مغلق', variant: 'destructive' as const },
    };
    
    return <Badge variant={statusConfig[status].variant}>{statusConfig[status].label}</Badge>;
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    const priorityConfig = {
      low: { label: 'منخفضة', variant: 'outline' as const },
      medium: { label: 'متوسطة', variant: 'secondary' as const },
      high: { label: 'عالية', variant: 'default' as const },
      urgent: { label: 'عاجلة', variant: 'destructive' as const },
    };
    
    return <Badge variant={priorityConfig[priority].variant}>{priorityConfig[priority].label}</Badge>;
  };

  const renderTicket = (ticket: Ticket) => (
    <Card key={ticket.id}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{ticket.ticket_number}</h3>
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
            </div>
            <p className="text-sm text-muted-foreground">{ticket.issue_description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{ticket.subscribers?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(ticket.created_at).toLocaleDateString('ar-SA')}</span>
          </div>
        </div>

        <div className="flex gap-2">
          {ticket.status === 'open' && (
            <Button 
              size="sm"
              onClick={() => handleUpdateStatus(ticket.id, 'in_progress')}
            >
              بدء العمل
            </Button>
          )}
          {ticket.status === 'in_progress' && (
            <Button 
              size="sm"
              onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
            >
              إكمال الطلب
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <AppHeader 
          onOpenSettings={() => setSettingsOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">لوحة تحكم الفني</h1>
              <p className="text-muted-foreground">إدارة طلبات الصيانة المخصصة لك</p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">قيد الانتظار</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pending}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">قيد التنفيذ</CardTitle>
                  <Wrench className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.inProgress}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">مكتملة</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completed}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>طلبات الصيانة</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">الكل ({stats.total})</TabsTrigger>
                    <TabsTrigger value="pending">قيد الانتظار ({stats.pending})</TabsTrigger>
                    <TabsTrigger value="in_progress">قيد التنفيذ ({stats.inProgress})</TabsTrigger>
                    <TabsTrigger value="completed">مكتملة ({stats.completed})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-4 mt-4">
                    {tickets.map(renderTicket)}
                    {tickets.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        لا توجد طلبات صيانة مخصصة لك حالياً
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="pending" className="space-y-4 mt-4">
                    {tickets.filter(t => t.status === 'open').map(renderTicket)}
                  </TabsContent>

                  <TabsContent value="in_progress" className="space-y-4 mt-4">
                    {tickets.filter(t => t.status === 'in_progress').map(renderTicket)}
                  </TabsContent>

                  <TabsContent value="completed" className="space-y-4 mt-4">
                    {tickets.filter(t => t.status === 'resolved').map(renderTicket)}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TechnicianDashboard;
