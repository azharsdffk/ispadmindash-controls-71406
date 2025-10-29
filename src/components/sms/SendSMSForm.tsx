import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send } from "lucide-react";

export const SendSMSForm = () => {
  const [loading, setLoading] = useState(false);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    subscriber_id: "",
    phone: "",
    message: "",
    template_id: ""
  });

  useEffect(() => {
    fetchSubscribers();
    fetchTemplates();
  }, []);

  const fetchSubscribers = async () => {
    const { data } = await supabase
      .from('subscribers')
      .select('id, name, phone')
      .order('name');
    setSubscribers(data || []);
  };

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from('sms_templates')
      .select('*')
      .eq('active', true)
      .order('name');
    setTemplates(data || []);
  };

  const handleSubscriberChange = (subscriberId: string) => {
    const subscriber = subscribers.find(s => s.id === subscriberId);
    setFormData({
      ...formData,
      subscriber_id: subscriberId,
      phone: subscriber?.phone || ""
    });
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setFormData({
      ...formData,
      template_id: templateId,
      message: template?.message_template || ""
    });
  };

  const handleSend = async () => {
    if (!formData.phone || !formData.message) {
      toast.error('يرجى إدخال رقم الهاتف والرسالة');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: formData.phone,
          message: formData.message,
          subscriber_name: subscribers.find(s => s.id === formData.subscriber_id)?.name
        }
      });

      if (error) throw error;

      toast.success('تم إرسال الرسالة بنجاح');
      setFormData({
        subscriber_id: "",
        phone: "",
        message: "",
        template_id: ""
      });
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      toast.error('فشل إرسال الرسالة: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>إرسال رسالة SMS</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>المشترك</Label>
            <Select value={formData.subscriber_id} onValueChange={handleSubscriberChange}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المشترك" />
              </SelectTrigger>
              <SelectContent>
                {subscribers.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name} - {sub.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>رقم الهاتف</Label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="+964..."
              dir="ltr"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>قالب الرسالة (اختياري)</Label>
          <Select value={formData.template_id} onValueChange={handleTemplateChange}>
            <SelectTrigger>
              <SelectValue placeholder="اختر قالب جاهز" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>نص الرسالة</Label>
          <Textarea
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            placeholder="اكتب رسالتك هنا..."
            rows={5}
            maxLength={160}
          />
          <p className="text-sm text-muted-foreground text-left">
            {formData.message.length} / 160
          </p>
        </div>

        <Button onClick={handleSend} disabled={loading} className="w-full">
          <Send className="h-4 w-4 ml-2" />
          {loading ? "جاري الإرسال..." : "إرسال الرسالة"}
        </Button>
      </CardContent>
    </Card>
  );
};
