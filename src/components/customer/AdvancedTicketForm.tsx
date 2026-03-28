import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Wrench, Send, Loader2, CheckCircle, Upload, X, Calendar, MapPin, Navigation } from 'lucide-react';

interface AdvancedTicketFormProps {
  subscriberId: string;
  agentId?: string | null;
  onSuccess: () => void;
}

const ticketTypes = [
  { value: 'no_internet', label: 'انقطاع الإنترنت' },
  { value: 'slow_internet', label: 'إنترنت بطيء' },
  { value: 'intermittent', label: 'تقطعات متكررة' },
  { value: 'router_issue', label: 'مشكلة بالراوتر' },
  { value: 'billing', label: 'مشكلة بالفواتير' },
  { value: 'upgrade', label: 'طلب ترقية الباقة' },
  { value: 'other', label: 'أخرى' },
];

const priorityOptions = [
  { value: 'low', label: 'منخفضة' },
  { value: 'medium', label: 'متوسطة' },
  { value: 'high', label: 'عالية' },
  { value: 'urgent', label: 'عاجلة' },
];

export function AdvancedTicketForm({ subscriberId, agentId, onSuccess }: AdvancedTicketFormProps) {
  const [ticketType, setTicketType] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [preferredTime, setPreferredTime] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locatingGPS, setLocatingGPS] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const maxSize = 10 * 1024 * 1024;
      return (isImage || isVideo) && file.size <= maxSize;
    });
    if (validFiles.length < files.length) {
      toast.error('بعض الملفات تم تجاهلها (الحد: صور/فيديو، 10MB)');
    }
    setAttachments(prev => [...prev, ...validFiles].slice(0, 5));
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('المتصفح لا يدعم تحديد الموقع');
      return;
    }
    setLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocatingGPS(false);
        toast.success('تم تحديد موقعك بنجاح');
      },
      (err) => {
        setLocatingGPS(false);
        toast.error('فشل تحديد الموقع. يمكنك إدخال العنوان يدوياً.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async () => {
    if (!ticketType) { toast.error('اختر نوع المشكلة'); return; }
    if (!description.trim()) { toast.error('اكتب وصفاً للمشكلة'); return; }

    setLoading(true);
    try {
      const ticketNum = `TKT-${Date.now().toString().slice(-8)}`;
      
      let notes = '';
      if (preferredTime) notes += `وقت الزيارة المفضل: ${preferredTime}\n`;
      if (manualAddress) notes += `العنوان: ${manualAddress}\n`;
      if (location) notes += `الموقع: https://www.google.com/maps?q=${location.lat},${location.lng}\n`;
      if (attachments.length > 0) notes += `عدد المرفقات: ${attachments.length}`;

      const { data, error } = await supabase
        .from('maintenance_tickets')
        .insert({
          subscriber_id: subscriberId,
          agent_id: agentId || null,
          ticket_number: ticketNum,
          issue_type: ticketType,
          issue_description: description,
          status: 'open',
          priority: priority as any,
          notes: notes || null,
          scheduled_date: preferredTime || null,
          latitude: location?.lat || null,
          longitude: location?.lng || null,
          location_address: manualAddress || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Upload attachments
      if (attachments.length > 0 && data) {
        for (const file of attachments) {
          const fileName = `${data.id}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('ticket-attachments')
            .upload(fileName, file);
          if (uploadError) console.error('Upload error:', uploadError);
        }
      }

      setTicketNumber(ticketNum);
      setSubmitted(true);
      toast.success('تم إرسال طلب الصيانة بنجاح');
      onSuccess();
    } catch (error: any) {
      console.error('Error submitting ticket:', error);
      toast.error('فشل إرسال الطلب: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-transparent shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-emerald-600 mb-2">تم استلام طلبك!</h3>
          <p className="text-muted-foreground mb-4">سيتم التواصل معك قريباً</p>
          <div className="bg-background/50 rounded-xl p-4 inline-block">
            <p className="text-sm text-muted-foreground">رقم الطلب</p>
            <p className="text-2xl font-mono font-bold text-primary">{ticketNumber}</p>
          </div>
          <Button 
            variant="outline" className="mt-6 w-full"
            onClick={() => {
              setSubmitted(false);
              setTicketType('');
              setDescription('');
              setPriority('medium');
              setPreferredTime('');
              setManualAddress('');
              setAttachments([]);
              setLocation(null);
            }}
          >
            إرسال طلب جديد
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-primary/20">
      <CardHeader className="pb-3 bg-gradient-to-l from-primary/10 to-transparent">
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          طلب صيانة جديد
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type */}
        <div className="space-y-2">
          <Label>نوع المشكلة *</Label>
          <Select value={ticketType} onValueChange={setTicketType}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="اختر نوع المشكلة..." />
            </SelectTrigger>
            <SelectContent>
              {ticketTypes.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label>وصف المشكلة *</Label>
          <Textarea
            placeholder="اكتب وصفاً تفصيلياً للمشكلة..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[120px] resize-none"
          />
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <Label>الأولوية</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4" /> الموقع
          </Label>
          <div className="flex gap-2">
            <Button 
              type="button" variant="outline" className="flex-1 h-12"
              onClick={getCurrentLocation} disabled={locatingGPS}
            >
              {locatingGPS ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Navigation className="h-4 w-4 ml-2" />
              )}
              {location ? 'تم تحديد الموقع ✅' : 'موقعي الحالي'}
            </Button>
          </div>
          <Input
            placeholder="أو أدخل العنوان يدوياً..."
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            className="h-12"
          />
          {location && (
            <p className="text-xs text-muted-foreground">
              📍 {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          )}
        </div>

        {/* Preferred Time */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" /> وقت الزيارة المفضل (اختياري)
          </Label>
          <Input
            type="datetime-local"
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
            className="h-12"
          />
        </div>

        {/* Attachments */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Upload className="h-4 w-4" /> إرفاق صور أو فيديو (اختياري)
          </Label>
          <div className="border-2 border-dashed border-border/50 rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
            <input
              type="file" accept="image/*,video/*" multiple
              onChange={handleFileChange} className="hidden" id="ticket-file-upload"
            />
            <label htmlFor="ticket-file-upload" className="cursor-pointer">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">اضغط لإضافة صور أو فيديو</p>
              <p className="text-xs text-muted-foreground mt-1">(الحد: 5 ملفات، 10MB لكل ملف)</p>
            </label>
          </div>
          
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-sm">
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeAttachment(index)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <Button 
          onClick={handleSubmit}
          disabled={loading || !ticketType || !description.trim()}
          className="w-full h-14 text-lg shadow-lg"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Send className="h-5 w-5 ml-2" />
              إرسال الطلب
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
