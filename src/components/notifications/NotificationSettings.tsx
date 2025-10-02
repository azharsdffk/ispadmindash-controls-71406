import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNotifications } from "@/hooks/useNotifications";
import { useState, useEffect } from "react";

export const NotificationSettings = () => {
  const { permission, requestPermission, sendNotification, isSupported } = useNotifications();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    setNotificationsEnabled(permission === 'granted');
  }, [permission]);

  const handleToggleNotifications = async () => {
    if (permission === 'granted') {
      setNotificationsEnabled(false);
    } else {
      const granted = await requestPermission();
      if (granted) {
        setNotificationsEnabled(true);
        sendNotification('تم تفعيل الإشعارات', {
          body: 'سوف تتلقى إشعارات حول التحديثات المهمة',
        });
      }
    }
  };

  const handleTestNotification = () => {
    sendNotification('إشعار تجريبي', {
      body: 'هذا إشعار تجريبي من نظام الإدارة',
    });
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            الإشعارات
          </CardTitle>
          <CardDescription>
            متصفحك لا يدعم الإشعارات
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          الإشعارات
        </CardTitle>
        <CardDescription>
          إدارة إعدادات الإشعارات الخاصة بك
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications-toggle">تفعيل الإشعارات</Label>
            <p className="text-sm text-muted-foreground">
              تلقي إشعارات حول الأحداث المهمة
            </p>
          </div>
          <Switch
            id="notifications-toggle"
            checked={notificationsEnabled}
            onCheckedChange={handleToggleNotifications}
          />
        </div>

        {notificationsEnabled && (
          <Button
            variant="outline"
            onClick={handleTestNotification}
            className="w-full"
          >
            إرسال إشعار تجريبي
          </Button>
        )}

        <div className="text-xs text-muted-foreground">
          {permission === 'granted' && '✓ الإشعارات مفعلة'}
          {permission === 'denied' && '✗ تم رفض الإشعارات'}
          {permission === 'default' && 'لم يتم طلب الإذن بعد'}
        </div>
      </CardContent>
    </Card>
  );
};
