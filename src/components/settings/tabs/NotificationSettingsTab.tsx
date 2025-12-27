import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { 
  Bell, Mail, MessageSquare, Smartphone, 
  BellRing, Volume2, VolumeX, Send
} from "lucide-react";

export const NotificationSettingsTab = () => {
  const { user } = useAuth();
  const { permission, requestPermission, sendNotification, isSupported } = useNotifications();
  
  const [settings, setSettings] = useState({
    pushEnabled: permission === 'granted',
    smsEnabled: true,
    emailEnabled: true,
    inAppEnabled: true,
    soundEnabled: true,
    ticketNotifications: true,
    paymentNotifications: true,
    systemNotifications: true,
  });

  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      pushEnabled: permission === 'granted',
    }));
  }, [permission]);

  const handlePushToggle = async () => {
    if (permission === 'granted') {
      setSettings(prev => ({ ...prev, pushEnabled: false }));
      toast.info('تم إيقاف إشعارات المتصفح');
    } else {
      const granted = await requestPermission();
      if (granted) {
        setSettings(prev => ({ ...prev, pushEnabled: true }));
        sendNotification('تم تفعيل الإشعارات', {
          body: 'ستتلقى إشعارات حول التحديثات المهمة',
        });
      }
    }
  };

  const handleTestNotification = () => {
    sendNotification('إشعار تجريبي', {
      body: 'هذا إشعار تجريبي للتأكد من عمل الإشعارات',
    });
  };

  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast.success('تم حفظ الإعداد');
  };

  return (
    <div className="space-y-6">
      {/* قنوات الإشعارات */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-primary" />
            قنوات الإشعارات
          </CardTitle>
          <CardDescription>اختر كيف تريد استلام الإشعارات</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* إشعارات المتصفح */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BellRing className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label>إشعارات المتصفح</Label>
                <p className="text-sm text-muted-foreground">
                  {!isSupported 
                    ? 'متصفحك لا يدعم الإشعارات' 
                    : permission === 'denied' 
                      ? 'تم حظر الإشعارات من المتصفح'
                      : 'إشعارات فورية على سطح المكتب'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {settings.pushEnabled && (
                <Button variant="outline" size="sm" onClick={handleTestNotification}>
                  <Send className="h-4 w-4 ml-1" />
                  تجربة
                </Button>
              )}
              <Switch
                checked={settings.pushEnabled}
                onCheckedChange={handlePushToggle}
                disabled={!isSupported || permission === 'denied'}
              />
            </div>
          </div>

          {/* إشعارات SMS */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <MessageSquare className="h-5 w-5 text-success" />
              </div>
              <div>
                <Label>إشعارات SMS</Label>
                <p className="text-sm text-muted-foreground">رسائل نصية على الهاتف</p>
              </div>
            </div>
            <Switch
              checked={settings.smsEnabled}
              onCheckedChange={(value) => updateSetting('smsEnabled', value)}
            />
          </div>

          {/* إشعارات البريد */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <Mail className="h-5 w-5 text-info" />
              </div>
              <div>
                <Label>إشعارات البريد الإلكتروني</Label>
                <p className="text-sm text-muted-foreground">رسائل على بريدك الإلكتروني</p>
              </div>
            </div>
            <Switch
              checked={settings.emailEnabled}
              onCheckedChange={(value) => updateSetting('emailEnabled', value)}
            />
          </div>

          {/* إشعارات التطبيق */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Smartphone className="h-5 w-5 text-warning" />
              </div>
              <div>
                <Label>إشعارات داخل التطبيق</Label>
                <p className="text-sm text-muted-foreground">إشعارات في شريط التنبيهات</p>
              </div>
            </div>
            <Switch
              checked={settings.inAppEnabled}
              onCheckedChange={(value) => updateSetting('inAppEnabled', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* أنواع الإشعارات */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Volume2 className="h-5 w-5 text-primary" />
            أنواع الإشعارات
          </CardTitle>
          <CardDescription>اختر الأحداث التي تريد الإشعار عنها</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/40">
            <Label>إشعارات التذاكر والصيانة</Label>
            <Switch
              checked={settings.ticketNotifications}
              onCheckedChange={(value) => updateSetting('ticketNotifications', value)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border/40">
            <Label>إشعارات المدفوعات والفواتير</Label>
            <Switch
              checked={settings.paymentNotifications}
              onCheckedChange={(value) => updateSetting('paymentNotifications', value)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border/40">
            <Label>إشعارات النظام والتحديثات</Label>
            <Switch
              checked={settings.systemNotifications}
              onCheckedChange={(value) => updateSetting('systemNotifications', value)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border/40">
            <div className="flex items-center gap-2">
              {settings.soundEnabled ? (
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
              <Label>صوت الإشعارات</Label>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(value) => updateSetting('soundEnabled', value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
