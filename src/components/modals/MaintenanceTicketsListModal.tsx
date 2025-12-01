import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Wrench, User, Calendar, AlertTriangle } from "lucide-react";

interface Ticket {
  id: string;
  ticket_number: string;
  issue_description: string;
  issue_type: string | null;
  status: string;
  priority: string;
  scheduled_date: string | null;
  created_at: string;
  subscriber: {
    name: string;
    phone: string;
    address: string | null;
  } | null;
}

interface MaintenanceTicketsListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MaintenanceTicketsListModal = ({ open, onOpenChange }: MaintenanceTicketsListModalProps) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (open) {
      fetchTickets();
    }
  }, [open]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('maintenance_tickets')
        .select(`
          id,
          ticket_number,
          issue_description,
          issue_type,
          status,
          priority,
          scheduled_date,
          created_at,
          subscriber:subscribers(name, phone, address)
        `)
        .in('status', ['open', 'in_progress'])
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.subscriber?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.issue_description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">مفتوحة</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">قيد التنفيذ</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30">تم الحل</Badge>;
      case 'closed':
        return <Badge variant="secondary">مغلقة</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />عاجل</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 hover:bg-orange-600">عالي</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">متوسط</Badge>;
      case 'low':
        return <Badge variant="secondary">منخفض</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const urgentCount = filteredTickets.filter(t => t.priority === 'urgent' || t.priority === 'high').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wrench className="h-6 w-6 text-destructive" />
            تذاكر الصيانة المفتوحة
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث برقم التذكرة أو اسم المشترك..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>

          {urgentCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                {urgentCount} تذكرة عاجلة تحتاج اهتمام فوري
              </span>
            </div>
          )}

          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد تذاكر صيانة مفتوحة
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{ticket.ticket_number}</span>
                          {getStatusBadge(ticket.status)}
                        </div>
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      
                      <p className="text-sm text-foreground line-clamp-2">{ticket.issue_description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {ticket.subscriber?.name || 'غير محدد'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(ticket.created_at).toLocaleDateString('ar-IQ')}
                        </div>
                      </div>

                      {ticket.subscriber?.address && (
                        <p className="text-xs text-muted-foreground">
                          العنوان: {ticket.subscriber.address}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="text-sm text-muted-foreground text-center">
            عدد التذاكر: {filteredTickets.length}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
