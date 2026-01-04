import { useEffect, useState } from 'react';
import { 
  CheckCircle, Clock, Loader2, Wrench, AlertCircle, 
  Send, UserCheck, Navigation, MapPin, Star, 
  Phone, MessageCircle, Car
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface TicketEvent {
  id: string;
  ticket_id: string;
  event_type: string;
  event_data: unknown;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

interface Technician {
  id: string;
  name: string;
  phone: string;
}

interface VisitLog {
  id: string;
  departed_at: string | null;
  arrived_at: string | null;
  completed_at: string | null;
  eta_minutes: number | null;
  customer_rating: number | null;
}

interface LiveTicketTimelineProps {
  ticket: {
    id: string;
    ticket_number: string;
    status: string;
    issue_type: string | null;
    issue_description: string;
    created_at: string;
    scheduled_date?: string | null;
    resolved_at?: string | null;
    notes?: string | null;
    technician_id?: string | null;
  };
  technician?: Technician | null;
  onRatingSubmit?: (rating: number, feedback: string) => void;
}

const statusSteps = [
  { key: 'new', label: 'طلب جديد', icon: Send, color: 'text-gray-500', description: 'تم إنشاء الطلب' },
  { key: 'open', label: 'تم الاستلام', icon: AlertCircle, color: 'text-yellow-500', description: 'بانتظار القبول' },
  { key: 'accepted_by_agent', label: 'استلام الوكيل', icon: UserCheck, color: 'text-blue-500', description: 'تم قبول الطلب من الوكيل' },
  { key: 'tech_assigned', label: 'تعيين الفني', icon: Wrench, color: 'text-indigo-500', description: 'تم تعيين فني للطلب' },
  { key: 'tech_on_the_way', label: 'الفني في الطريق', icon: Car, color: 'text-orange-500', description: 'الفني متوجه إليك' },
  { key: 'tech_arrived', label: 'وصول الفني', icon: MapPin, color: 'text-cyan-500', description: 'وصل الفني للموقع' },
  { key: 'in_progress', label: 'جاري العمل', icon: Navigation, color: 'text-purple-500', description: 'الفني يعمل على حل المشكلة' },
  { key: 'resolved', label: 'تم الانتهاء', icon: CheckCircle, color: 'text-green-500', description: 'تم حل المشكلة' },
];

export function LiveTicketTimeline({ ticket, technician, onRatingSubmit }: LiveTicketTimelineProps) {
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [visitLog, setVisitLog] = useState<VisitLog | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  useEffect(() => {
    // Fetch initial events
    const fetchEvents = async () => {
      const { data } = await supabase
        .from('ticket_events')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });
      
      if (data) setEvents(data);
    };

    // Fetch visit log
    const fetchVisitLog = async () => {
      const { data } = await supabase
        .from('visit_logs')
        .select('*')
        .eq('ticket_id', ticket.id)
        .single();
      
      if (data) setVisitLog(data);
    };

    fetchEvents();
    fetchVisitLog();

    // Subscribe to real-time events
    const channel = supabase
      .channel(`ticket-events-${ticket.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ticket_events', filter: `ticket_id=eq.${ticket.id}` },
        (payload) => {
          setEvents(prev => [...prev, payload.new as TicketEvent]);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visit_logs', filter: `ticket_id=eq.${ticket.id}` },
        (payload) => {
          setVisitLog(payload.new as VisitLog);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticket.id]);

  const getCurrentStepIndex = () => {
    const index = statusSteps.findIndex(s => s.key === ticket.status);
    return index >= 0 ? index : 0;
  };

  const currentStep = getCurrentStepIndex();

  const getIssueLabel = (issueType: string | null) => {
    const issues: Record<string, string> = {
      'no_internet': 'انقطاع الخدمة',
      'slow_internet': 'انترنت بطيء',
      'intermittent': 'تقطعات متكررة',
      'router_issue': 'مشكلة بالراوتر',
      'emergency': '🚨 طوارئ',
      'new_installation': 'تركيب جديد',
      'other': 'أخرى',
    };
    return issueType ? issues[issueType] || issueType : '-';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-IQ', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatETA = (minutes: number) => {
    if (minutes < 60) return `${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} ساعة و ${mins} دقيقة` : `${hours} ساعة`;
  };

  const handleRatingSubmit = () => {
    if (rating > 0 && onRatingSubmit) {
      onRatingSubmit(rating, feedback);
    }
  };

  const isCompleted = ticket.status === 'resolved' || ticket.status === 'closed';
  const showTechnicianCard = technician && ['tech_assigned', 'tech_on_the_way', 'tech_arrived', 'in_progress'].includes(ticket.status);

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardHeader className="pb-3 bg-gradient-to-l from-primary/10 to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">{ticket.ticket_number}</span>
          </CardTitle>
          <Badge 
            variant={isCompleted ? 'default' : 'secondary'}
            className={cn(
              isCompleted && 'bg-green-500',
              ticket.status === 'tech_on_the_way' && 'bg-orange-500 animate-pulse'
            )}
          >
            {getIssueLabel(ticket.issue_type)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-6">
        {/* ETA Banner */}
        {ticket.status === 'tech_on_the_way' && visitLog?.eta_minutes && (
          <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30 rounded-lg p-4 text-center animate-pulse">
            <div className="flex items-center justify-center gap-2 text-orange-600 mb-1">
              <Car className="h-5 w-5" />
              <span className="font-semibold">الفني في الطريق</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {formatETA(visitLog.eta_minutes)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">الوقت المتوقع للوصول</p>
          </div>
        )}

        {/* Technician Card */}
        {showTechnicianCard && (
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{technician.name}</p>
                  <p className="text-sm text-muted-foreground">فني الصيانة</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="outline" asChild>
                  <a href={`tel:${technician.phone}`}>
                    <Phone className="h-4 w-4" />
                  </a>
                </Button>
                <Button size="icon" variant="outline" asChild>
                  <a href={`https://wa.me/${technician.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="relative">
          {/* Progress Line Background */}
          <div className="absolute right-3 top-4 bottom-4 w-0.5 bg-muted rounded-full" />
          
          {/* Progress Line Active */}
          <div 
            className="absolute right-3 top-4 w-0.5 bg-primary rounded-full transition-all duration-700"
            style={{ height: `${(currentStep / (statusSteps.length - 1)) * 100}%`, maxHeight: 'calc(100% - 2rem)' }}
          />

          <div className="space-y-4">
            {statusSteps.map((step, index) => {
              const isStepCompleted = index <= currentStep;
              const isCurrent = index === currentStep;
              const StepIcon = step.icon;
              const eventForStep = events.find(e => e.event_type === step.key);

              return (
                <div key={step.key} className="flex items-start gap-4 relative">
                  <div 
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center z-10 transition-all duration-500',
                      isStepCompleted ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-muted text-muted-foreground',
                      isCurrent && !isCompleted && 'ring-4 ring-primary/30 animate-pulse'
                    )}
                  >
                    {isCurrent && !isCompleted ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className={cn(
                      'font-medium text-sm',
                      !isStepCompleted && 'text-muted-foreground'
                    )}>
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                    {eventForStep && (
                      <p className="text-xs text-primary mt-1 font-medium">
                        {formatDate(eventForStep.created_at)}
                      </p>
                    )}
                    {index === 0 && !eventForStep && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(ticket.created_at)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rating Section */}
        {isCompleted && !visitLog?.customer_rating && onRatingSubmit && (
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="text-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h4 className="font-semibold">تم إنهاء الصيانة بنجاح!</h4>
              <p className="text-sm text-muted-foreground">كيف كانت تجربتك؟</p>
            </div>
            
            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="transition-transform hover:scale-110"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star 
                    className={cn(
                      'h-8 w-8 transition-colors',
                      (hoveredRating || rating) >= star 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-muted-foreground'
                    )} 
                  />
                </button>
              ))}
            </div>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="أضف ملاحظاتك (اختياري)..."
              className="w-full p-3 rounded-lg bg-background border resize-none h-20 text-sm"
            />

            <Button 
              onClick={handleRatingSubmit} 
              className="w-full mt-3"
              disabled={rating === 0}
            >
              إرسال التقييم
            </Button>
          </div>
        )}

        {/* Already Rated */}
        {visitLog?.customer_rating && (
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star}
                  className={cn(
                    'h-5 w-5',
                    visitLog.customer_rating! >= star 
                      ? 'text-yellow-400 fill-yellow-400' 
                      : 'text-muted-foreground'
                  )} 
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">شكراً لتقييمك!</p>
          </div>
        )}

        {/* Notes */}
        {ticket.notes && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">ملاحظات الفني:</p>
            <p className="text-sm">{ticket.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
