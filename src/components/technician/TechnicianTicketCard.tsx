import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, MapPin, Phone, Clock, Calendar, User, TrendingUp, Loader2, CheckCircle, Navigation } from 'lucide-react';

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
  onStatusUpdated?: () => void;
}

const statusOptions = [
  { value: 'open', label: 'مفتوحة' },
  { value: 'in_progress', label: 'قيد التنفيذ' },
  { value: 'tech_on_the_way', label: 'في الطريق' },
  { value: 'tech_arrived', label: 'وصلت' },
  { value: 'resolved', label: 'تم الحل' },
  { value: 'closed', label: 'مغلقة' },
];

const getStatusBadge = (status: string) => {
  const variants: Record<string, { label: string; className: string }> = {
    open: { label: 'مفتوحة', className: 'bg-blue-500 text-white' },
    in_progress: { label: 'قيد التنفيذ', className: 'bg-yellow-500 text-white' },
    tech_on_the_way: { label: 'في الطريق', className: 'bg-orange-500 text-white' },
    tech_arrived: { label: 'وصلت', className: 'bg-cyan-500 text-white' },
    resolved: { label: 'منجزة', className: 'bg-green-500 text-white' },
    closed: { label: 'مغلقة', className: 'bg-gray-500 text-white' },
    tech_assigned: { label: 'مسندة', className: 'bg-indigo-500 text-white' },
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

export const TechnicianTicketCard = ({ ticket, onOpenDetails, onStatusUpdated }: TechnicianTicketCardProps) => {
  const [showActions, setShowActions] = useState(false);
  const [newStatus, setNewStatus] = useState(ticket.status);
  const [techNotes, setTechNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const ticketDistance = ticket.distance !== undefined && ticket.distance < 999999 
    ? ticket.distance.toFixed(2) : null;

  const handleStatusUpdate = async () => {
    setUpdating(true);
    try {
      const updates: any = { status: newStatus };
      
      if (techNotes.trim()) {
        updates.notes = ticket.notes 
          ? `${ticket.notes}\n---\n${new Date().toLocaleDateString('ar-IQ')}: ${techNotes}`
          : `${new Date().toLocaleDateString('ar-IQ')}: ${techNotes}`;
      }
      
      if (newStatus === 'resolved' || newStatus === 'closed') {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('maintenance_tickets')
        .update(updates)
        .eq('id', ticket.id);

      if (error) throw error;

      toast.success('تم تحديث حالة التذكرة');
      setShowActions(false);
      setTechNotes('');
      onStatusUpdated?.();
    } catch (error: any) {
      toast.error('فشل التحديث: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const openNavigation = () => {
    if (ticket.subscribers?.latitude && ticket.subscribers?.longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${ticket.subscribers.latitude},${ticket.subscribers.longitude}`,
        '_blank'
      );
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-r-4 border-r-primary group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 border-2 border-primary/50 shadow-lg group-hover:scale-110 transition-transform">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                {ticket.subscribers?.name?.charAt(0) || <User className="h-7 w-7" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle 
                className="text-lg font-bold text-primary cursor-pointer hover:underline"
                onClick={() => onOpenDetails(ticket.id)}
              >
                {ticket.subscribers?.name || 'غير محدد'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{ticket.ticket_number}</p>
              {ticketDistance && (
                <p className="text-xs text-primary font-bold mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> {ticketDistance} كم
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
        <div className="p-4 rounded-xl border space-y-3">
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
            <a href={`tel:${ticket.subscribers?.phone}`} className="text-sm text-primary hover:underline"
               onClick={(e) => e.stopPropagation()}>
              {ticket.subscribers?.phone || 'غير متوفر'}
            </a>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Clock className="h-5 w-5 text-primary flex-shrink-0" />
            <span>{new Date(ticket.created_at).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>

          {ticket.scheduled_date && (
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="font-medium text-primary">
                موعد: {new Date(ticket.scheduled_date).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}

          {ticket.notes && (
            <div className="mt-2 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-semibold text-muted-foreground mb-1">ملاحظات:</p>
              <p className="text-sm whitespace-pre-wrap">{ticket.notes}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {ticket.subscribers?.latitude && ticket.subscribers?.longitude && (
            <Button variant="outline" size="sm" className="flex-1" onClick={openNavigation}>
              <Navigation className="h-4 w-4 ml-1" /> الملاحة
            </Button>
          )}
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onOpenDetails(ticket.id)}>
            <FileText className="h-4 w-4 ml-1" /> التفاصيل
          </Button>
          <Button 
            size="sm" className="flex-1"
            onClick={() => setShowActions(!showActions)}
          >
            <CheckCircle className="h-4 w-4 ml-1" /> تحديث
          </Button>
        </div>

        {/* Status Update Panel */}
        {showActions && (
          <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3 animate-in fade-in duration-200">
            <div className="space-y-2">
              <label className="text-sm font-semibold">تغيير الحالة</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">ملاحظات / تقرير صيانة</label>
              <Textarea 
                placeholder="أضف ملاحظات أو تقرير عمل..."
                value={techNotes}
                onChange={(e) => setTechNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleStatusUpdate} disabled={updating} className="flex-1">
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ التحديث'}
              </Button>
              <Button variant="outline" onClick={() => setShowActions(false)}>إلغاء</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
