import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Eye, Filter, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Ticket {
  id: string;
  ticket_number: string;
  issue_description: string;
  status: string;
  priority: string;
  created_at: string;
  subscriber_id: string;
  technician_id: string | null;
}

export const TicketsTable = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('admin-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_tickets' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Execute all queries in parallel
      const [ticketsRes, techRolesRes, subsRes] = await Promise.all([
        supabase
          .from('maintenance_tickets')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100), // Limit results for better performance
        supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'technician'),
        supabase
          .from('subscribers')
          .select('id, name, phone')
      ]);

      if (ticketsRes.error) {
        console.error('Error fetching tickets:', ticketsRes.error);
        toast.error('خطأ في تحميل التذاكر');
      }

      // Get technician profiles
      const techIds = techRolesRes.data?.map(r => r.user_id) || [];
      let techProfiles: any[] = [];
      
      if (techIds.length > 0) {
        const techRes = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', techIds);
        
        techProfiles = techRes.data || [];
      }

      setTickets(ticketsRes.data || []);
      setTechnicians(techProfiles);
      setSubscribers(subsRes.data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('خطأ في تحميل التذاكر');
      // Set empty arrays to prevent infinite loading
      setTickets([]);
      setTechnicians([]);
      setSubscribers([]);
    } finally {
      setLoading(false);
    }
  };

  const assignTechnician = async (ticketId: string, technicianId: string) => {
    try {
      const { error } = await supabase
        .from('maintenance_tickets')
        .update({ technician_id: technicianId, status: 'in_progress' as const })
        .eq('id', ticketId);

      if (error) throw error;
      toast.success('تم تعيين الفني بنجاح');
      fetchData();
    } catch (error) {
      console.error('Error assigning technician:', error);
      toast.error('خطأ في تعيين الفني');
    }
  };

  const updateStatus = async (ticketId: string, status: 'open' | 'in_progress' | 'closed' | 'resolved') => {
    try {
      const { error } = await supabase
        .from('maintenance_tickets')
        .update({ status })
        .eq('id', ticketId);

      if (error) throw error;
      toast.success('تم تحديث الحالة بنجاح');
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('خطأ في تحديث الحالة');
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.issue_description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      open: 'default',
      in_progress: 'secondary',
      closed: 'outline',
      resolved: 'outline',
    };
    const labels: Record<string, string> = {
      open: 'مفتوح',
      in_progress: 'قيد التنفيذ',
      closed: 'مغلق',
      resolved: 'تم الحل',
    };
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-500/10 text-green-500',
      medium: 'bg-yellow-500/10 text-yellow-500',
      high: 'bg-orange-500/10 text-orange-500',
      urgent: 'bg-red-500/10 text-red-500',
    };
    return <Badge className={colors[priority]}>{priority === 'low' ? 'منخفض' : priority === 'medium' ? 'متوسط' : priority === 'high' ? 'عالي' : 'عاجل'}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">إدارة التذاكر الفنية</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="open">مفتوح</SelectItem>
                <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                <SelectItem value="closed">مغلق</SelectItem>
                <SelectItem value="resolved">تم الحل</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم التذكرة</TableHead>
                <TableHead>المشترك</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الأولوية</TableHead>
                <TableHead>الفني</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => {
                const subscriber = subscribers.find(s => s.id === ticket.subscriber_id);
                const technician = technicians.find(t => t.id === ticket.technician_id);
                
                return (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.ticket_number}</TableCell>
                    <TableCell>{subscriber?.name || '-'}</TableCell>
                    <TableCell>{subscriber?.phone || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{ticket.issue_description}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell>
                      <Select
                        value={ticket.technician_id || ''}
                        onValueChange={(value) => assignTechnician(ticket.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="تعيين فني" />
                        </SelectTrigger>
                        <SelectContent>
                          {technicians.map((tech) => (
                            <SelectItem key={tech.id} value={tech.id}>
                              {tech.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{new Date(ticket.created_at).toLocaleDateString('ar-EG')}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="default" className="bg-primary text-white hover:bg-primary/90">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Select
                          value={ticket.status}
                          onValueChange={(value) => updateStatus(ticket.id, value as 'open' | 'in_progress' | 'closed' | 'resolved')}
                        >
                          <SelectTrigger className="w-32 border-2 border-primary/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">مفتوح</SelectItem>
                            <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                            <SelectItem value="closed">مغلق</SelectItem>
                            <SelectItem value="resolved">تم الحل</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
