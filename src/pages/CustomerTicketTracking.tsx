import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, RefreshCw, MessageCircle, Phone, 
  MapPin, FileText, Clock, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LiveTicketTimeline } from '@/components/customer/LiveTicketTimeline';
import { TechnicianLiveMap } from '@/components/customer/TechnicianLiveMap';
import { useTicketRealtime } from '@/hooks/useTicketRealtime';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type TicketStatus = Database['public']['Enums']['ticket_status'];

interface MaintenanceTicket {
  id: string;
  ticket_number: string;
  status: TicketStatus;
  issue_type: string | null;
  issue_description: string;
  created_at: string;
  scheduled_date: string | null;
  resolved_at: string | null;
  notes: string | null;
  technician_id: string | null;
  subscriber_id: string;
  subscribers: {
    id: string;
    name: string;
    phone: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  technicians: {
    id: string;
    name: string;
    phone: string;
  } | null;
}

export default function CustomerTicketTracking() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<MaintenanceTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { events, visitLog, techLocation, submitRating, refresh } = useTicketRealtime(
    ticketId || '',
    ticket?.technician_id
  );

  useEffect(() => {
    if (!ticketId) {
      setError('رقم الطلب غير صحيح');
      setIsLoading(false);
      return;
    }

    const fetchTicket = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('maintenance_tickets')
          .select(`
            *,
            subscribers (id, name, phone, address, latitude, longitude),
            technicians (id, name, phone)
          `)
          .eq('id', ticketId)
          .single();

        if (fetchError) throw fetchError;
        setTicket(data as MaintenanceTicket);
      } catch (err) {
        console.error('Error fetching ticket:', err);
        setError('لم يتم العثور على الطلب');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTicket();

    // Subscribe to ticket changes
    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'maintenance_tickets', filter: `id=eq.${ticketId}` },
        (payload) => {
          setTicket(prev => prev ? { ...prev, ...payload.new } : null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  const showLiveMap = ticket && 
    ['tech_on_the_way', 'tech_assigned'].includes(ticket.status || '') && 
    ticket.technicians;

  const customerLocation = ticket?.subscribers?.latitude && ticket?.subscribers?.longitude
    ? { lat: ticket.subscribers.latitude, lng: ticket.subscribers.longitude }
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{error || 'خطأ'}</h2>
            <p className="text-muted-foreground mb-4">
              لم نتمكن من العثور على تفاصيل هذا الطلب
            </p>
            <Button onClick={() => navigate('/my-portal')}>
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للبوابة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusInfo = (status: string | null) => {
    const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
      'new': { label: 'طلب جديد', color: 'text-gray-600', bgColor: 'bg-gray-100' },
      'open': { label: 'تم الاستلام', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
      'accepted_by_agent': { label: 'قيد المراجعة', color: 'text-blue-600', bgColor: 'bg-blue-100' },
      'tech_assigned': { label: 'تم تعيين فني', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
      'tech_on_the_way': { label: 'الفني في الطريق', color: 'text-orange-600', bgColor: 'bg-orange-100' },
      'tech_arrived': { label: 'الفني وصل', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
      'in_progress': { label: 'جاري العمل', color: 'text-purple-600', bgColor: 'bg-purple-100' },
      'resolved': { label: 'تم الإنهاء', color: 'text-green-600', bgColor: 'bg-green-100' },
      'closed': { label: 'مغلق', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    };
    return statusMap[status || ''] || statusMap['new'];
  };

  const statusInfo = getStatusInfo(ticket.status);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate('/my-portal')}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="font-semibold">تتبع الطلب</h1>
            <p className="text-xs text-muted-foreground font-mono">{ticket.ticket_number}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={refresh}>
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Status Banner */}
        <div className={cn(
          'rounded-xl p-4 text-center',
          statusInfo.bgColor
        )}>
          <Badge className={cn('mb-2', statusInfo.color, 'bg-white/50')}>
            {statusInfo.label}
          </Badge>
          <h2 className="font-semibold">{ticket.issue_description}</h2>
          {ticket.subscribers?.address && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <MapPin className="h-3 w-3" />
              {ticket.subscribers.address}
            </p>
          )}
        </div>

        {/* Live Map for Technician Tracking */}
        {showLiveMap && ticket.technicians && (
          <TechnicianLiveMap
            ticketId={ticket.id}
            technicianId={ticket.technician_id!}
            technicianName={ticket.technicians.name}
            technicianPhone={ticket.technicians.phone}
            customerLocation={customerLocation}
            etaMinutes={visitLog?.eta_minutes}
          />
        )}

        {/* Live Timeline */}
        <LiveTicketTimeline
          ticket={{
            id: ticket.id,
            ticket_number: ticket.ticket_number,
            status: ticket.status || 'open',
            issue_type: ticket.issue_type,
            issue_description: ticket.issue_description,
            created_at: ticket.created_at || new Date().toISOString(),
            scheduled_date: ticket.scheduled_date,
            resolved_at: ticket.resolved_at,
            notes: ticket.notes,
            technician_id: ticket.technician_id,
          }}
          technician={ticket.technicians}
          onRatingSubmit={submitRating}
        />

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {ticket.technicians && (
                <>
                  <Button variant="outline" className="h-auto py-3" asChild>
                    <a href={`tel:${ticket.technicians.phone}`}>
                      <div className="flex flex-col items-center gap-1">
                        <Phone className="h-5 w-5 text-primary" />
                        <span className="text-xs">اتصال بالفني</span>
                      </div>
                    </a>
                  </Button>
                  <Button variant="outline" className="h-auto py-3" asChild>
                    <a 
                      href={`https://wa.me/${ticket.technicians.phone.replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <MessageCircle className="h-5 w-5 text-green-500" />
                        <span className="text-xs">واتساب</span>
                      </div>
                    </a>
                  </Button>
                </>
              )}
              {!ticket.technicians && (
                <div className="col-span-2 text-center py-4 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">سيتم تعيين فني قريباً</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Completion Summary */}
        {(ticket.status === 'resolved' || ticket.status === 'closed') && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                ملخص الصيانة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {visitLog?.arrived_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">وقت الوصول:</span>
                  <span>{new Date(visitLog.arrived_at).toLocaleString('ar-IQ')}</span>
                </div>
              )}
              {visitLog?.completed_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">وقت الانتهاء:</span>
                  <span>{new Date(visitLog.completed_at).toLocaleString('ar-IQ')}</span>
                </div>
              )}
              {ticket.notes && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">ملاحظات الفني:</p>
                  <p className="text-sm">{ticket.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
