import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Bell, BellOff, Smartphone, Mail, MessageSquare, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { initializePushNotifications } from '@/services/capacitor/notifications';
import { useCapacitor } from '@/hooks/useCapacitor';

interface NotificationSettings {
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
}

export const PushNotificationSettings = () => {
  const { user } = useAuth();
  const { isNative } = useCapacitor();
  const [settings, setSettings] = useState<NotificationSettings>({
    push_enabled: true,
    email_enabled: true,
    sms_enabled: true
  });
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_settings, push_token')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data?.notification_settings && typeof data.notification_settings === 'object') {
        const ns = data.notification_settings as Record<string, unknown>;
        setSettings({
          push_enabled: Boolean(ns.push_enabled ?? true),
          email_enabled: Boolean(ns.email_enabled ?? true),
          sms_enabled: Boolean(ns.sms_enabled ?? true)
        });
      }
      if (data?.push_token) {
        setPushToken(data.push_token);
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const settingsJson = {
        push_enabled: settings.push_enabled,
        email_enabled: settings.email_enabled,
        sms_enabled: settings.sms_enabled
      };
      
      const { error } = await supabase
        .from('profiles')
        .update({
          notification_settings: JSON.parse(JSON.stringify(settingsJson)),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('تم حفظ إعدادات الإشعارات');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('فشل في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const registerForPush = async () => {
    if (!user || !isNative) return;
    
    setRegistering(true);
    try {
      await initializePushNotifications(user.id);
      toast.success('تم تسجيل الجهاز للإشعارات');
      await fetchSettings();
    } catch (error) {
      console.error('Error registering for push:', error);
      toast.error('فشل في تسجيل الإشعارات');
    } finally {
      setRegistering(false);
    }
  };

  const sendTestNotification = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: user.id,
          title: 'إشعار تجريبي',
          body: 'هذا إشعار تجريبي للتأكد من عمل النظام',
          data: { type: 'test' }
        }
      });

      if (error) throw error;
      toast.success('تم إرسال الإشعار التجريبي');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('فشل في إرسال الإشعار التجريبي');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            إعدادات الإشعارات
          </CardTitle>
          <CardDescription>
            تحكم في كيفية استلام الإشعارات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* حالة التسجيل */}
          <div className="p-4 rounded-lg bg-muted">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5" />
                <div>
                  <p className="font-medium">إشعارات الجهاز</p>
                  <p className="text-sm text-muted-foreground">
                    {isNative ? 'تطبيق موبايل' : 'متصفح ويب'}
                  </p>
                </div>
              </div>
              {pushToken ? (
                <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  مسجل
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-600">
                  <XCircle className="h-3 w-3" />
                  غير مسجل
                </Badge>
              )}
            </div>
            
            {isNative && !pushToken && (
              <Button 
                onClick={registerForPush} 
                disabled={registering}
                className="mt-3 w-full"
                variant="outline"
              >
                {registering ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <Bell className="h-4 w-4 ml-2" />
                )}
                تفعيل إشعارات الدفع
              </Button>
            )}
          </div>

          {/* أنواع الإشعارات */}
          <div className="space-y-4">
            <h4 className="font-medium">قنوات الإشعارات</h4>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label>إشعارات الدفع (Push)</Label>
              </div>
              <Switch
                checked={settings.push_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, push_enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label>البريد الإلكتروني</Label>
              </div>
              <Switch
                checked={settings.email_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, email_enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <Label>رسائل SMS</Label>
              </div>
              <Switch
                checked={settings.sms_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, sms_enabled: checked })}
              />
            </div>
          </div>

          {/* أزرار */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              حفظ الإعدادات
            </Button>
            <Button variant="outline" onClick={sendTestNotification}>
              إرسال إشعار تجريبي
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
