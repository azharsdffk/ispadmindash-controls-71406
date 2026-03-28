import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  FileText, MapPin, Phone, Clock, Calendar, User, TrendingUp,
  Loader2, CheckCircle, Navigation, Camera, Upload, Image as ImageIcon,
  Wrench, X, ChevronDown, ChevronUp
} from 'lucide-react';

interface Ticket {
  id: string;
  ticket_number: string;
  issue_description: string;
  issue_type?: string | null;
  status: string;
  priority: string;
  scheduled_date: string | null;
  created_at: string;
  notes: string | null;
  subscriber_id: string;
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
  technicianId?: string;
  onOpenDetails: (ticketId: string) => void;
  onStatusUpdated?: () => void;
}

const statusFlow = [
  { value: 'tech_assigned', label: 'مسندة', next: 'tech_on_the_way' },
  { value: 'tech_on_the_way', label: 'في الطريق', next: 'tech_arrived' },
  { value: 'tech_arrived', label: 'وصلت', next: 'in_progress' },
  { value: 'in_progress', label: 'قيد التنفيذ', next: 'resolved' },
  { value: 'open', label: 'مفتوحة', next: 'in_progress' },
  { value: 'resolved', label: 'منجزة', next: null },
  { value: 'closed', label: 'مغلقة', next: null },
];

const allStatuses = [
  { value: 'open', label: 'مفتوحة' },
  { value: 'tech_assigned', label: 'مسندة' },
  { value: 'tech_on_the_way', label: 'في الطريق' },
  { value: 'tech_arrived', label: 'وصلت' },
  { value: 'in_progress', label: 'قيد التنفيذ' },
  { value: 'resolved', label: 'منجزة' },
  { value: 'closed', label: 'مغلقة' },
];

const getStatusBadge = (status: string) => {
  const variants: Record<string, { label: string; className: string }> = {
    open: { label: 'مفتوحة', className: 'bg-blue-500/20 text-blue-700 border-blue-300' },
    in_progress: { label: 'قيد التنفيذ', className: 'bg-amber-500/20 text-amber-700 border-amber-300' },
    tech_on_the_way: { label: 'في الطريق', className: 'bg-orange-500/20 text-orange-700 border-orange-300' },
    tech_arrived: { label: 'وصلت', className: 'bg-cyan-500/20 text-cyan-700 border-cyan-300' },
    tech_assigned: { label: 'مسندة', className: 'bg-indigo-500/20 text-indigo-700 border-indigo-300' },
    resolved: { label: 'منجزة', className: 'bg-emerald-500/20 text-emerald-700 border-emerald-300' },
    closed: { label: 'مغلقة', className: 'bg-muted text-muted-foreground border-border' },
  };
  const config = variants[status] || variants.open;
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
};

const getPriorityBadge = (priority: string) => {
  const variants: Record<string, { label: string; className: string }> = {
    low: { label: 'منخفضة', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    medium: { label: 'متوسطة', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    high: { label: 'عالية', className: 'bg-orange-100 text-orange-700 border-orange-200' },
    urgent: { label: 'عاجلة', className: 'bg-red-100 text-red-700 border-red-200' },
  };
  const config = variants[priority] || variants.medium;
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
};

const getNextStatusAction = (status: string) => {
  const flow = statusFlow.find(s => s.value === status);
  if (!flow?.next) return null;
  const nextLabel: Record<string, string> = {
    tech_on_the_way: '🚗 ابدأ الرحلة',
    tech_arrived: '📍 وصلت للموقع',
    in_progress: '🔧 بدء العمل',
    resolved: '✅ إنهاء الصيانة',
  };
  return { value: flow.next, label: nextLabel[flow.next] || 'التالي' };
};

export const TechnicianTicketCard = ({ ticket, technicianId, onOpenDetails, onStatusUpdated }: TechnicianTicketCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [newStatus, setNewStatus] = useState(ticket.status);
  const [techNotes, setTechNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Report state
  const [diagnosis, setDiagnosis] = useState('');
  const [workPerformed, setWorkPerformed] = useState('');
  const [reportNotes, setReportNotes] = useState('');
  const [savingReport, setSavingReport] = useState(false);

  // Photo upload state
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const ticketDistance = ticket.distance !== undefined && ticket.distance < 999999
    ? ticket.distance.toFixed(1) : null;

  // Quick next-status action
  const handleQuickAdvance = async () => {
    const next = getNextStatusAction(ticket.status);
    if (!next) return;

    if (next.value === 'resolved') {
      setShowReport(true);
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('maintenance_tickets')
        .update({ status: next.value as any })
        .eq('id', ticket.id);
      if (error) throw error;
      toast.success('تم تحديث الحالة');
      onStatusUpdated?.();
    } catch (e: any) {
      toast.error('فشل التحديث: ' + e.message);
    } finally {
      setUpdating(false);
    }
  };

  // Manual status + notes update
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
      setExpanded(false);
      setTechNotes('');
      onStatusUpdated?.();
    } catch (e: any) {
      toast.error('فشل التحديث: ' + e.message);
    } finally {
      setUpdating(false);
    }
  };

  // Photo upload
  const handlePhotoUpload = async (files: FileList | null, type: 'before' | 'after') => {
    if (!files || files.length === 0) return;
    setUploadingPhoto(true);
    const uploaded: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop();
        const path = `${ticket.id}/${type}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage
          .from('technician-photos')
          .upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage
          .from('technician-photos')
          .getPublicUrl(path);
        uploaded.push(urlData.publicUrl);
      }
      if (type === 'before') setBeforePhotos(prev => [...prev, ...uploaded]);
      else setAfterPhotos(prev => [...prev, ...uploaded]);
      toast.success(`تم رفع ${uploaded.length} صورة`);
    } catch (e: any) {
      toast.error('فشل رفع الصورة: ' + e.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Save maintenance report
  const handleSaveReport = async () => {
    if (!workPerformed.trim()) {
      toast.error('يرجى كتابة العمل المنجز');
      return;
    }
    setSavingReport(true);
    try {
      // Insert report
      const { error: reportErr } = await (supabase.from('maintenance_reports') as any).insert({
        ticket_id: ticket.id,
        technician_id: technicianId,
        diagnosis,
        work_performed: workPerformed,
        before_photos: beforePhotos,
        after_photos: afterPhotos,
        notes: reportNotes,
        report_status: 'completed',
      });
      if (reportErr) throw reportErr;

      // Update ticket to resolved
      const { error: ticketErr } = await supabase
        .from('maintenance_tickets')
        .update({
          status: 'resolved' as any,
          resolved_at: new Date().toISOString(),
          notes: ticket.notes
            ? `${ticket.notes}\n---\nتقرير: ${workPerformed}`
            : `تقرير: ${workPerformed}`,
        })
        .eq('id', ticket.id);
      if (ticketErr) throw ticketErr;

      toast.success('تم حفظ التقرير وإنهاء الصيانة');
      setShowReport(false);
      onStatusUpdated?.();
    } catch (e: any) {
      toast.error('فشل حفظ التقرير: ' + e.message);
    } finally {
      setSavingReport(false);
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

  const nextAction = getNextStatusAction(ticket.status);
  const isActive = !['resolved', 'closed'].includes(ticket.status);

  return (
    <>
      <Card className={`overflow-hidden transition-all duration-300 hover:shadow-md ${
        ticket.priority === 'urgent' ? 'border-r-4 border-r-destructive' :
        ticket.priority === 'high' ? 'border-r-4 border-r-orange-500' :
        'border-r-4 border-r-primary'
      }`}>
        {/* Priority strip */}
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-12 w-12 border-2 border-primary/30 flex-shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {ticket.subscribers?.name?.charAt(0) || <User className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <CardTitle
                  className="text-base font-bold text-foreground cursor-pointer hover:text-primary transition-colors truncate"
                  onClick={() => onOpenDetails(ticket.id)}
                >
                  {ticket.subscribers?.name || 'غير محدد'}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{ticket.ticket_number}</p>
                {ticketDistance && (
                  <p className="text-xs text-primary font-semibold mt-0.5 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> {ticketDistance} كم
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap justify-end flex-shrink-0">
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {/* Issue summary */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              <p className="text-sm text-foreground leading-relaxed line-clamp-2">{ticket.issue_description}</p>
            </div>
            {ticket.subscribers?.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <p className="text-xs text-muted-foreground truncate">{ticket.subscribers.address}</p>
              </div>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(ticket.created_at).toLocaleDateString('ar-IQ')}
              </span>
              {ticket.scheduled_date && (
                <span className="flex items-center gap-1 text-primary font-medium">
                  <Calendar className="h-3 w-3" />
                  {new Date(ticket.scheduled_date).toLocaleDateString('ar-IQ')}
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 flex-wrap">
            {ticket.subscribers?.latitude && ticket.subscribers?.longitude && (
              <Button variant="outline" size="sm" onClick={openNavigation} className="text-xs">
                <Navigation className="h-3.5 w-3.5 ml-1" /> الملاحة
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => {
              if (ticket.subscribers?.phone) window.location.href = `tel:${ticket.subscribers.phone}`;
            }} className="text-xs">
              <Phone className="h-3.5 w-3.5 ml-1" /> اتصال
            </Button>
            <Button variant="outline" size="sm" onClick={() => onOpenDetails(ticket.id)} className="text-xs">
              <FileText className="h-3.5 w-3.5 ml-1" /> التفاصيل
            </Button>

            {/* Main next-step action */}
            {nextAction && isActive && (
              <Button
                size="sm"
                onClick={handleQuickAdvance}
                disabled={updating}
                className="text-xs flex-1 min-w-[120px]"
              >
                {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : nextAction.label}
              </Button>
            )}

            {/* Expand for manual controls */}
            {isActive && (
              <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="text-xs">
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
          </div>

          {/* Expanded: Manual status + notes + photos */}
          {expanded && (
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3 animate-in fade-in duration-200">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">تغيير الحالة</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allStatuses.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">ملاحظات</Label>
                <Textarea
                  placeholder="أضف ملاحظات..."
                  value={techNotes}
                  onChange={e => setTechNotes(e.target.value)}
                  className="min-h-[60px]"
                />
              </div>

              {/* Photo uploads */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input ref={beforeInputRef} type="file" accept="image/*" multiple hidden
                    onChange={e => handlePhotoUpload(e.target.files, 'before')} />
                  <Button variant="outline" size="sm" className="w-full text-xs"
                    onClick={() => beforeInputRef.current?.click()} disabled={uploadingPhoto}>
                    <Camera className="h-3.5 w-3.5 ml-1" /> صور قبل ({beforePhotos.length})
                  </Button>
                </div>
                <div>
                  <input ref={afterInputRef} type="file" accept="image/*" multiple hidden
                    onChange={e => handlePhotoUpload(e.target.files, 'after')} />
                  <Button variant="outline" size="sm" className="w-full text-xs"
                    onClick={() => afterInputRef.current?.click()} disabled={uploadingPhoto}>
                    <Camera className="h-3.5 w-3.5 ml-1" /> صور بعد ({afterPhotos.length})
                  </Button>
                </div>
              </div>

              {/* Photo previews */}
              {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
                <div className="flex gap-2 overflow-x-auto py-1">
                  {[...beforePhotos, ...afterPhotos].map((url, i) => (
                    <img key={i} src={url} alt="" className="h-16 w-16 rounded-lg object-cover border flex-shrink-0" />
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleStatusUpdate} disabled={updating} size="sm" className="flex-1">
                  {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ التحديث'}
                </Button>
                <Button
                  variant="secondary" size="sm"
                  onClick={() => setShowReport(true)}
                >
                  <Wrench className="h-3.5 w-3.5 ml-1" /> تقرير صيانة
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>إلغاء</Button>
              </div>
            </div>
          )}

          {/* Existing notes preview */}
          {ticket.notes && !expanded && (
            <div className="p-2 bg-muted/30 rounded text-xs text-muted-foreground line-clamp-2">
              <span className="font-semibold">ملاحظات:</span> {ticket.notes}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Report Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              تقرير صيانة - {ticket.ticket_number}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4" dir="rtl">
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p><span className="font-semibold">الزبون:</span> {ticket.subscribers?.name}</p>
              <p><span className="font-semibold">المشكلة:</span> {ticket.issue_description}</p>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">التشخيص</Label>
              <Textarea
                value={diagnosis}
                onChange={e => setDiagnosis(e.target.value)}
                placeholder="ما هي المشكلة التي وجدتها..."
                className="min-h-[60px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">العمل المنجز *</Label>
              <Textarea
                value={workPerformed}
                onChange={e => setWorkPerformed(e.target.value)}
                placeholder="ماذا تم إصلاحه أو تغييره..."
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">ملاحظات إضافية</Label>
              <Textarea
                value={reportNotes}
                onChange={e => setReportNotes(e.target.value)}
                placeholder="أي ملاحظات أخرى..."
              />
            </div>

            {/* Report photos */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input ref={beforeInputRef} type="file" accept="image/*" multiple hidden
                  onChange={e => handlePhotoUpload(e.target.files, 'before')} />
                <Button variant="outline" size="sm" className="w-full"
                  onClick={() => beforeInputRef.current?.click()} disabled={uploadingPhoto}>
                  <Camera className="h-4 w-4 ml-1" /> صور قبل ({beforePhotos.length})
                </Button>
              </div>
              <div>
                <input ref={afterInputRef} type="file" accept="image/*" multiple hidden
                  onChange={e => handlePhotoUpload(e.target.files, 'after')} />
                <Button variant="outline" size="sm" className="w-full"
                  onClick={() => afterInputRef.current?.click()} disabled={uploadingPhoto}>
                  <Camera className="h-4 w-4 ml-1" /> صور بعد ({afterPhotos.length})
                </Button>
              </div>
            </div>
            {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
              <div className="flex gap-2 overflow-x-auto py-1">
                {[...beforePhotos, ...afterPhotos].map((url, i) => (
                  <img key={i} src={url} alt="" className="h-20 w-20 rounded-lg object-cover border flex-shrink-0" />
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSaveReport} disabled={savingReport || !workPerformed.trim()} className="flex-1">
                {savingReport ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <CheckCircle className="h-4 w-4 ml-1" />}
                حفظ وإنهاء الصيانة
              </Button>
              <Button variant="outline" onClick={() => setShowReport(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
