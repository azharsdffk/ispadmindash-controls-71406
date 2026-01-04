import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Wrench, 
  Send, 
  Loader2, 
  CheckCircle,
  Upload,
  X,
  Calendar
} from 'lucide-react';

interface AdvancedTicketFormProps {
  subscriberId: string;
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

export function AdvancedTicketForm({ subscriberId, onSuccess }: AdvancedTicketFormProps) {
  const [ticketType, setTicketType] = useState('');
  const [description, setDescription] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const maxSize = 10 * 1024 * 1024; // 10MB
      return (isImage || isVideo) && file.size <= maxSize;
    });
    setAttachments(prev => [...prev, ...validFiles].slice(0, 5));
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!ticketType) {
      toast.error('الرجاء اختيار نوع المشكلة');
      return;
    }
    if (!description.trim()) {
      toast.error('الرجاء وصف المشكلة');
      return;
    }

    setLoading(true);
    try {
      // Generate ticket number
      const ticketNum = `TKT-${Date.now().toString().slice(-8)}`;
      
      // Build notes with preferred time
      let notes = '';
      if (preferredTime) {
        notes += `وقت الزيارة المفضل: ${preferredTime}\n`;
      }
      if (attachments.length > 0) {
        notes += `عدد المرفقات: ${attachments.length}`;
      }

      const { data, error } = await supabase
        .from('maintenance_tickets')
        .insert({
          subscriber_id: subscriberId,
          ticket_number: ticketNum,
          issue_type: ticketType,
          issue_description: description,
          status: 'open',
          priority: 'medium',
          notes: notes || null,
          scheduled_date: preferredTime || null
        })
        .select()
        .single();

      if (error) throw error;

      // Upload attachments if any
      if (attachments.length > 0 && data) {
        for (const file of attachments) {
          const fileName = `${data.id}/${Date.now()}-${file.name}`;
          await supabase.storage
            .from('ticket-attachments')
            .upload(fileName, file);
        }
      }

      setTicketNumber(ticketNum);
      setSubmitted(true);
      toast.success('تم إرسال طلب الصيانة بنجاح');
      onSuccess();
    } catch (error) {
      console.error('Error submitting ticket:', error);
      toast.error('حدث خطأ في إرسال الطلب');
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
            <p className="text-sm text-muted-foreground">رقم التكت</p>
            <p className="text-2xl font-mono font-bold text-primary">{ticketNumber}</p>
          </div>
          <Button 
            variant="outline" 
            className="mt-6 w-full"
            onClick={() => {
              setSubmitted(false);
              setTicketType('');
              setDescription('');
              setPreferredTime('');
              setAttachments([]);
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
        {/* Ticket Type */}
        <div className="space-y-2">
          <Label>نوع المشكلة *</Label>
          <Select value={ticketType} onValueChange={setTicketType}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="اختر نوع المشكلة..." />
            </SelectTrigger>
            <SelectContent>
              {ticketTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
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

        {/* Preferred Time */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            وقت الزيارة المفضل (اختياري)
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
            <Upload className="h-4 w-4" />
            إرفاق صور أو فيديو (اختياري)
          </Label>
          <div className="border-2 border-dashed border-border/50 rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                اضغط لإضافة صور أو فيديو
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                (الحد الأقصى: 5 ملفات، 10MB لكل ملف)
              </p>
            </label>
          </div>
          
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {attachments.map((file, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-sm"
                >
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => removeAttachment(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
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
