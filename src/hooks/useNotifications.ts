import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('المتصفح لا يدعم الإشعارات');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('تم تفعيل الإشعارات بنجاح');
        return true;
      } else if (result === 'denied') {
        toast.error('تم رفض إذن الإشعارات');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('حدث خطأ أثناء طلب إذن الإشعارات');
      return false;
    }
    return false;
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return;
    }

    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          dir: 'rtl',
          lang: 'ar',
          ...options,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        return notification;
      } catch (error) {
        console.error('Error creating notification:', error);
      }
    } else if (Notification.permission === 'default') {
      toast.info('يرجى السماح بالإشعارات أولاً');
    }
  };

  return {
    permission,
    requestPermission,
    sendNotification,
    isSupported: 'Notification' in window,
  };
};
