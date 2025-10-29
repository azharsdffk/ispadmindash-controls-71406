import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const SMSSettings = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    sender_name: "شركتك",
    sender_number: "",
    active: true
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('sms_settings')
        .upsert({
          provider: 'twilio',
          sender_name: settings.sender_name,
          sender_number: settings.sender_number,
          active: settings.active
        });

      if (error) throw error;
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('فشل حفظ الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>إعدادات SMS</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>اسم المرسل</Label>
          <Input
            value={settings.sender_name}
            onChange={(e) => setSettings({...settings, sender_name: e.target.value})}
            placeholder="شركتك"
          />
        </div>

        <div className="space-y-2">
          <Label>رقم المرسل</Label>
          <Input
            value={settings.sender_number}
            onChange={(e) => setSettings({...settings, sender_number: e.target.value})}
            placeholder="+964..."
            dir="ltr"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>تفعيل إرسال الرسائل</Label>
          <Switch
            checked={settings.active}
            onCheckedChange={(checked) => setSettings({...settings, active: checked})}
          />
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </CardContent>
    </Card>
  );
};
