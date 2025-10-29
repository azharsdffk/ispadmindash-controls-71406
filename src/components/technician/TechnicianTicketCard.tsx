import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FileText, MapPin, Phone, Clock, Calendar, User, TrendingUp } from 'lucide-react';

interface Ticket {
  id: string;
  ticket_number: string;
  issue_description: string;
  status: string;
  priority: string;
  scheduled_date: string | null;
  created_at: string;
  notes: string | null;
  subscribers: {
    id: string;
    name: string;
    phone: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  distance?: number;
}

interface TechnicianTicketCardProps {
  ticket: Ticket;
  onOpenDetails: (ticketId: string) => void;
}

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

export const TechnicianTicketCard = ({ ticket, onOpenDetails }: TechnicianTicketCardProps) => {
  const ticketDistance = ticket.distance !== undefined && ticket.distance < 999999 
    ? ticket.distance.toFixed(2) 
    : null;

  return (
    <Card 
      className="glass-card hover:shadow-glow transition-all duration-300 border-r-4 border-r-primary cursor-pointer group"
      onClick={() => onOpenDetails(ticket.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 border-2 border-primary/50 shadow-lg group-hover:scale-110 transition-transform">
              <AvatarFallback className="gradient-bg text-white text-lg font-bold">
                {ticket.subscribers?.name?.charAt(0) || <User className="h-7 w-7" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg font-bold gradient-text">
                {ticket.subscribers?.name || 'غير محدد'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{ticket.ticket_number}</p>
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
