import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, 
  Clock, 
  User, 
  Wrench,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface Ticket {
  id: string;
  ticket_number: string;
  status: string;
  created_at: string;
  issue_type: string | null;
  issue_description: string;
  scheduled_date: string | null;
  resolved_at: string | null;
  notes: string | null;
  technician_id: string | null;
}

interface Technician {
  id: string;
  name: string;
  phone: string;
}

interface TicketDetailsModalProps {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  open: { label: 'مفتوح', color: 'bg-amber-500', icon: AlertCircle },
  in_progress: { label: 'قيد العمل', color: 'bg-blue-500', icon: Loader2 },
  resolved: { label: 'تم الحل', color: 'bg-emerald-500', icon: CheckCircle },
  closed: { label: 'مغلق', color: 'bg-muted', icon: CheckCircle },
};

const issueTypeLabels: Record<string, string> = {
  no_internet: 'انقطاع الإنترنت',
  slow_internet: 'إنترنت بطيء',
  intermittent: 'تقطعات متكررة',
  router_issue: 'مشكلة بالراوتر',
  billing: 'مشكلة بالفواتير',
  upgrade: 'طلب ترقية',
  emergency: 'طوارئ',
  other: 'أخرى',
};

export function TicketDetailsModal({ ticket, open, onClose }: TicketDetailsModalProps) {
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ticket?.technician_id) {
      loadTechnician(ticket.technician_id);
    } else {
      setTechnician(null);
    }
  }, [ticket?.technician_id]);

  const loadTechnician = async (techId: string) => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('technicians')
        .select('id, name, phone')
        .eq('id', techId)
        .single();
      
      if (data) {
        setTechnician(data);
      }
    } catch (error) {
      console.error('Error loading technician:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!ticket) return null;

  const status = statusConfig[ticket.status] || statusConfig.open;
  const StatusIcon = status.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              تفاصيل التكت
            </span>
            <Badge className={`${status.color} text-white`}>
              <StatusIcon className="h-3 w-3 ml-1" />
              {status.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4 pr-4">
            {/* Ticket Number */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">رقم التكت</p>
                <p className="text-2xl font-mono font-bold text-primary">{ticket.ticket_number}</p>
              </CardContent>
            </Card>

            {/* Issue Type & Description */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">نوع المشكلة</p>
                  <Badge variant="outline">
                    {issueTypeLabels[ticket.issue_type || ''] || ticket.issue_type || 'غير محدد'}
                  </Badge>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">وصف المشكلة</p>
                  <p className="text-sm">{ticket.issue_description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">تاريخ الإنشاء:</span>
                  <span className="text-sm font-medium">
                    {new Date(ticket.created_at).toLocaleDateString('ar-IQ', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                {ticket.scheduled_date && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">موعد الزيارة:</span>
                    <span className="text-sm font-medium">
                      {new Date(ticket.scheduled_date).toLocaleDateString('ar-IQ', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                
                {ticket.resolved_at && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm text-muted-foreground">تاريخ الحل:</span>
                    <span className="text-sm font-medium text-emerald-600">
                      {new Date(ticket.resolved_at).toLocaleDateString('ar-IQ', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assigned Technician */}
            {(ticket.technician_id || loading) && (
              <Card className="border-blue-500/30 bg-blue-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">الفني المكلف</span>
                  </div>
                  {loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>جاري التحميل...</span>
                    </div>
                  ) : technician ? (
                    <div>
                      <p className="font-bold">{technician.name}</p>
                      <p className="text-sm text-muted-foreground">{technician.phone}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">لم يتم تعيين فني بعد</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {ticket.notes && (
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">ملاحظات</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{ticket.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Status Timeline */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-3">سجل التحديثات</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">تم إنشاء التكت</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ticket.created_at).toLocaleDateString('ar-IQ')}
                      </p>
                    </div>
                  </div>
                  
                  {ticket.technician_id && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">تم تعيين فني</p>
                        <p className="text-xs text-muted-foreground">
                          {technician?.name || 'جاري التحميل...'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {ticket.resolved_at && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">تم حل المشكلة</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(ticket.resolved_at).toLocaleDateString('ar-IQ')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
