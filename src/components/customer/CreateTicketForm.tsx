import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wrench, Send, CheckCircle } from "lucide-react";

interface CreateTicketFormProps {
  subscriberId: string;
  onSuccess?: () => void;
}

export const CreateTicketForm = ({ subscriberId, onSuccess }: CreateTicketFormProps) => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    issue_type: "",
    issue_description: "",
    priority: "medium"
  });

  const issueTypes = [
    { value: "no_connection", label: "لا يوجد اتصال" },
    { value: "slow_speed", label: "بطء في السرعة" },
    { value: "intermittent", label: "انقطاع متكرر" },
    { value: "router_issue", label: "مشكلة في الراوتر" },
    { value: "billing", label: "استفسار عن الفاتورة" },
    { value: "upgrade", label: "طلب ترقية الباقة" },
    { value: "other", label: "أخرى" }
  ];

  const handleSubmit = async () => {
    if (!formData.issue_type || !formData.issue_description.trim()) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setLoading(true);
    try {
      // Generate ticket number
      const { data: ticketNumber } = await supabase
        .rpc('generate_ticket_number');

      const { error } = await supabase
        .from('maintenance_tickets')
        .insert({
          subscriber_id: subscriberId,
          ticket_number: ticketNumber || `TKT-${Date.now()}`,
          issue_type: formData.issue_type,
          issue_description: formData.issue_description,
          priority: formData.priority as 'low' | 'medium' | 'high',
          status: 'open'
        });

      if (error) throw error;

      setSubmitted(true);
      toast.success("تم إرسال طلب الصيانة بنجاح");
      onSuccess?.();

      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          issue_type: "",
          issue_description: "",
          priority: "medium"
        });
      }, 3000);

    } catch (error: any) {
      console.error('Error creating ticket:', error);
      toast.error("فشل إرسال الطلب: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-green-500/50 bg-green-500/5">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-600 mb-2">تم إرسال طلبك بنجاح!</h3>
          <p className="text-muted-foreground">سيتم التواصل معك قريباً</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          طلب صيانة جديد
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>نوع المشكلة *</Label>
          <Select 
            value={formData.issue_type} 
            onValueChange={(v) => setFormData({ ...formData, issue_type: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر نوع المشكلة" />
            </SelectTrigger>
            <SelectContent>
              {issueTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>الأولوية</Label>
          <Select 
            value={formData.priority} 
            onValueChange={(v) => setFormData({ ...formData, priority: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">منخفضة</SelectItem>
              <SelectItem value="medium">متوسطة</SelectItem>
              <SelectItem value="high">عالية</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>وصف المشكلة *</Label>
          <Textarea
            value={formData.issue_description}
            onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
            placeholder="اشرح المشكلة بالتفصيل..."
            rows={4}
            className="resize-none"
          />
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={loading} 
          className="w-full"
        >
          <Send className="h-4 w-4 ml-2" />
          {loading ? "جاري الإرسال..." : "إرسال الطلب"}
        </Button>
      </CardContent>
    </Card>
  );
};