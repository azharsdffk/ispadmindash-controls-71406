import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TicketEvent {
  id: string;
  ticket_id: string;
  event_type: string;
  event_data: unknown;
  created_at: string;
}

interface TechnicianLocation {
  id: string;
  technician_id: string;
  latitude: number;
  longitude: number;
  status: string;
  updated_at: string;
}

interface VisitLog {
  id: string;
  ticket_id: string;
  departed_at: string | null;
  arrived_at: string | null;
  completed_at: string | null;
  eta_minutes: number | null;
  customer_rating: number | null;
}

interface TicketRealtimeState {
  events: TicketEvent[];
  techLocation: TechnicianLocation | null;
  visitLog: VisitLog | null;
  isLoading: boolean;
}

export function useTicketRealtime(ticketId: string, technicianId?: string | null) {
  const [state, setState] = useState<TicketRealtimeState>({
    events: [],
    techLocation: null,
    visitLog: null,
    isLoading: true,
  });

  const fetchInitialData = useCallback(async () => {
    try {
      // Fetch events
      const { data: events } = await supabase
        .from('ticket_events')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      // Fetch visit log
      const { data: visitLog } = await supabase
        .from('visit_logs')
        .select('*')
        .eq('ticket_id', ticketId)
        .maybeSingle();

      // Fetch technician location if assigned
      let techLocation = null;
      if (technicianId) {
        const { data } = await supabase
          .from('technician_locations')
          .select('*')
          .eq('technician_id', technicianId)
          .maybeSingle();
        techLocation = data;
      }

      setState({
        events: events || [],
        techLocation,
        visitLog,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching ticket realtime data:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [ticketId, technicianId]);

  useEffect(() => {
    fetchInitialData();

    // Subscribe to ticket events
    const eventsChannel = supabase
      .channel(`ticket-events-${ticketId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'ticket_events', 
          filter: `ticket_id=eq.${ticketId}` 
        },
        (payload) => {
          const newEvent = payload.new as TicketEvent;
          setState(prev => ({
            ...prev,
            events: [...prev.events, newEvent],
          }));

          // Show notification for important events
          const eventLabels: Record<string, string> = {
            'accepted_by_agent': 'تم قبول طلبك من الوكيل',
            'tech_assigned': 'تم تعيين فني لطلبك',
            'tech_on_the_way': 'الفني في الطريق إليك',
            'tech_arrived': 'وصل الفني للموقع',
            'in_progress': 'جاري العمل على حل المشكلة',
            'resolved': 'تم إنهاء الصيانة بنجاح',
          };

          if (eventLabels[newEvent.event_type]) {
            toast.success(eventLabels[newEvent.event_type]);
          }
        }
      )
      .subscribe();

    // Subscribe to visit log changes
    const visitChannel = supabase
      .channel(`visit-log-${ticketId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'visit_logs', 
          filter: `ticket_id=eq.${ticketId}` 
        },
        (payload) => {
          setState(prev => ({
            ...prev,
            visitLog: payload.new as VisitLog,
          }));
        }
      )
      .subscribe();

    // Subscribe to technician location if assigned
    let locationChannel: ReturnType<typeof supabase.channel> | null = null;
    if (technicianId) {
      locationChannel = supabase
        .channel(`tech-location-${technicianId}`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'technician_locations', 
            filter: `technician_id=eq.${technicianId}` 
          },
          (payload) => {
            setState(prev => ({
              ...prev,
              techLocation: payload.new as TechnicianLocation,
            }));
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(visitChannel);
      if (locationChannel) {
        supabase.removeChannel(locationChannel);
      }
    };
  }, [ticketId, technicianId, fetchInitialData]);

  const submitRating = async (rating: number, feedback: string) => {
    try {
      const { error } = await supabase
        .from('visit_logs')
        .update({ 
          customer_rating: rating, 
          customer_feedback: feedback 
        })
        .eq('ticket_id', ticketId);

      if (error) throw error;

      toast.success('شكراً لتقييمك!');
      fetchInitialData();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('حدث خطأ أثناء إرسال التقييم');
    }
  };

  return {
    ...state,
    submitRating,
    refresh: fetchInitialData,
  };
}
