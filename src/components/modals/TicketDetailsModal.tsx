import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MapPin,
  Phone,
  Mail,
  User,
  FileText,
  Calendar,
  Clock,
  Navigation,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface TicketDetailsModalProps {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTicketUpdated?: () => void;
}

interface TicketDetails {
  id: string;
  ticket_number: string;
  issue_description: string;
  status: string;
  priority: string;
  scheduled_date: string | null;
  created_at: string;
  resolved_at: string | null;
  notes: string | null;
  issue_type: string | null;
  subscriber_id: string;
  subscribers: {
    id: string;
    name: string;
    phone: string;
    phone_secondary: string | null;
    email: string | null;
    address: string | null;
    address_notes: string | null;
    username: string | null;
    latitude: number | null;
    longitude: number | null;
    plan: string | null;
    balance: number | null;
    status_comment: string | null;
  };
}

export const TicketDetailsModal = ({
  ticketId,
  open,
  onOpenChange,
  onTicketUpdated
}: TicketDetailsModalProps) => {
  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportText, setReportText] = useState('');
  const [issueType, setIssueType] = useState('');
  const [customIssue, setCustomIssue] = useState('');
  const [updating, setUpdating] = useState(false);

  const issueTypeOptions = [
    'ضعف في الخدمة',
    'انقطاع الخدمة',
    'فصالات في الخدمة',
    'ديبي عالي',
    'كيبل مقطوع',
    'أونيو عاطل',
    'برمجة راوتر',
    'برمجة أونيو',
    'تغيير مكان المنظومة',
    'فيشة مكسورة',
    'ترتيب الكابينة',
    'مشكلة أخرى'
  ];

  useEffect(() => {
    if (open && ticketId) {
      fetchTicketDetails();
    }
  }, [open, ticketId]);

  const fetchTicketDetails = async () => {
    if (!ticketId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('maintenance_tickets')
        .select(`
          id,
          ticket_number,
          issue_description,
          status,
          priority,
          scheduled_date,
          created_at,
          resolved_at,
          notes,
          issue_type,
          subscriber_id,
          subscribers (
            id,
            name,
            phone,
            phone_secondary,
            email,
            address,
            address_notes,
            username,
            latitude,
            longitude,
            plan,
            balance,
            status_comment
          )
        `)
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      setTicket(data);
      setReportText(data.notes || '');
      
      // Set issue type
      if (data.issue_type) {
        if (issueTypeOptions.includes(data.issue_type)) {
          setIssueType(data.issue_type);
          setCustomIssue('');
        } else {
          setIssueType('مشكلة أخرى');
          setCustomIssue(data.issue_type);
        }
      }
    } catch (error) {
      console.error('خطأ في جلب تفاصيل التذكرة:', error);
      toast.error('فشل تحميل التفاصيل');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!ticket) return;

    setUpdating(true);
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('maintenance_tickets')
        .update(updateData)
        .eq('id', ticket.id);

      if (error) throw error;
      toast.success('✅ تم تحديث حالة التذكرة');
      fetchTicketDetails();
      onTicketUpdated?.();
    } catch (error) {
      console.error('خطأ في تحديث الحالة:', error);
      toast.error('فشل تحديث الحالة');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveReport = async () => {
    if (!ticket) return;

    const finalIssueType = issueType === 'مشكلة أخرى' ? customIssue : issueType;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('maintenance_tickets')
        .update({ 
          notes: reportText,
          issue_type: finalIssueType || null
        })
        .eq('id', ticket.id);

      if (error) throw error;
      toast.success('✅ تم حفظ التقرير ونوع المشكلة');
      fetchTicketDetails();
      onTicketUpdated?.();
    } catch (error) {
      console.error('خطأ في حفظ التقرير:', error);
      toast.error('فشل حفظ التقرير');
    } finally {
      setUpdating(false);
    }
  };

  const openInWaze = () => {
    if (!ticket?.subscribers?.latitude || !ticket?.subscribers?.longitude) {
      toast.error('لا توجد إحداثيات GPS');
      return;
    }
    window.open(
      `https://waze.com/ul?ll=${ticket.subscribers.latitude},${ticket.subscribers.longitude}&navigate=yes`,
      '_blank'
    );
  };

  const openInGoogleMaps = () => {
    if (!ticket?.subscribers?.latitude || !ticket?.subscribers?.longitude) {
      toast.error('لا توجد إحداثيات GPS');
      return;
    }
    window.open(
      `https://www.google.com/maps?q=${ticket.subscribers.latitude},${ticket.subscribers.longitude}`,
      '_blank'
    );
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            تفاصيل التذكرة
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : ticket ? (
          <div className="space-y-6">
            {/* معلومات التذكرة الأساسية */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border border-primary/20">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    {ticket.ticket_number}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    تاريخ الفتح: {new Date(ticket.created_at).toLocaleDateString('ar-IQ', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(ticket.status)}
                  {getPriorityBadge(ticket.priority)}
                </div>
              </div>

              <div className="bg-background/50 p-4 rounded-lg">
                <Label className="text-sm font-semibold mb-2 block">وصف المشكلة:</Label>
                <p className="text-foreground leading-relaxed">{ticket.issue_description}</p>
              </div>

              {ticket.scheduled_date && (
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium">
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

              {ticket.resolved_at && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">
                    تم الإنجاز: {new Date(ticket.resolved_at).toLocaleDateString('ar-IQ', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
            </div>

            <Separator />

            {/* معلومات المشترك */}
            <div className="bg-gradient-to-r from-sky-500/10 to-blue-500/5 p-6 rounded-lg border border-sky-500/20">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-sky-600" />
                معلومات المشترك
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-sky-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">الاسم الكامل</p>
                    <p className="text-sm font-semibold text-foreground">{ticket.subscribers.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-sky-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">رقم الهاتف</p>
                    <a
                      href={`tel:${ticket.subscribers.phone}`}
                      className="text-sm font-semibold text-sky-600 hover:underline"
                    >
                      {ticket.subscribers.phone}
                    </a>
                  </div>
                </div>

                {ticket.subscribers.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-sky-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
                      <a
                        href={`mailto:${ticket.subscribers.email}`}
                        className="text-sm font-semibold text-sky-600 hover:underline"
                      >
                        {ticket.subscribers.email}
                      </a>
                    </div>
                  </div>
                )}

                {ticket.subscribers.username && (
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-sky-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">اسم المستخدم</p>
                      <p className="text-sm font-semibold text-foreground">{ticket.subscribers.username}</p>
                    </div>
                  </div>
                )}

                {ticket.subscribers.plan && (
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-sky-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">الباقة</p>
                      <p className="text-sm font-semibold text-foreground">{ticket.subscribers.plan}</p>
                    </div>
                  </div>
                )}

                {ticket.subscribers.balance !== null && (
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-sky-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">الرصيد</p>
                      <p className={`text-sm font-semibold ${ticket.subscribers.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {ticket.subscribers.balance.toLocaleString('ar-IQ')} د.ع
                      </p>
                    </div>
                  </div>
                )}

                {ticket.subscribers.phone_secondary && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-sky-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">رقم هاتف إضافي</p>
                      <a
                        href={`tel:${ticket.subscribers.phone_secondary}`}
                        className="text-sm font-semibold text-sky-600 hover:underline"
                      >
                        {ticket.subscribers.phone_secondary}
                      </a>
                    </div>
                  </div>
                )}

                {ticket.subscribers.address && (
                  <div className="col-span-full flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-sky-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">العنوان</p>
                      <p className="text-sm font-semibold text-foreground">{ticket.subscribers.address}</p>
                      {ticket.subscribers.address_notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="font-medium">ملاحظات:</span> {ticket.subscribers.address_notes}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {ticket.subscribers.status_comment && (
                  <div className="col-span-full flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-sky-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">ملاحظات الحالة</p>
                      <p className="text-sm font-semibold text-foreground">{ticket.subscribers.status_comment}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* أزرار التنقل */}
              {ticket.subscribers.latitude && ticket.subscribers.longitude && (
                <div className="mt-4 flex gap-3">
                  <Button
                    onClick={openInWaze}
                    variant="outline"
                    className="flex-1"
                  >
                    <Navigation className="h-4 w-4 ml-2" />
                    فتح في Waze
                  </Button>
                  <Button
                    onClick={openInGoogleMaps}
                    variant="outline"
                    className="flex-1"
                  >
                    <ExternalLink className="h-4 w-4 ml-2" />
                    فتح في Google Maps
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* نوع المشكلة */}
            <div className="space-y-3">
              <Label className="text-base font-bold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                نوع المشكلة / سبب الصيانة
              </Label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="اختر نوع المشكلة" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {issueTypeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {issueType === 'مشكلة أخرى' && (
                <Textarea
                  value={customIssue}
                  onChange={(e) => setCustomIssue(e.target.value)}
                  placeholder="أدخل وصف المشكلة"
                  className="min-h-[80px] resize-none bg-background"
                  dir="rtl"
                />
              )}
            </div>

            <Separator />

            {/* تقرير الصيانة */}
            <div className="space-y-3">
              <Label htmlFor="report" className="text-base font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                تقرير الصيانة
              </Label>
              <Textarea
                id="report"
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="اكتب تقرير الصيانة هنا..."
                className="min-h-[120px] resize-none bg-background"
                dir="rtl"
              />
              <Button
                onClick={handleSaveReport}
                disabled={updating}
                className="w-full"
              >
                {updating ? 'جاري الحفظ...' : 'حفظ التقرير ونوع المشكلة'}
              </Button>
            </div>

            <Separator />

            {/* إجراءات التذكرة */}
            <div className="space-y-3">
              <Label className="text-base font-bold">تحديث حالة التذكرة</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleUpdateStatus('in_progress')}
                  disabled={updating || ticket.status === 'in_progress'}
                  variant="outline"
                  className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                >
                  <Clock className="h-4 w-4 ml-2" />
                  قيد التنفيذ
                </Button>
                <Button
                  onClick={() => handleUpdateStatus('resolved')}
                  disabled={updating || ticket.status === 'resolved'}
                  variant="outline"
                  className="border-green-500 text-green-700 hover:bg-green-50"
                >
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                  إنجاز التذكرة
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            لم يتم العثور على التذكرة
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
