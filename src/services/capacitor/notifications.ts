import { PushNotifications } from '@capacitor/push-notifications';
import type { ActionPerformed, PushNotificationSchema, Token } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';

/**
 * تهيئة الإشعارات
 */
export const initializePushNotifications = async (userId: string) => {
  try {
    // طلب الإذن
    const permission = await PushNotifications.requestPermissions();
    
    if (permission.receive === 'granted') {
      // تسجيل للحصول على Token
      await PushNotifications.register();
    }

    // الاستماع للـ Token
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, token: ' + token.value);
      
      // حفظ الـ Token في قاعدة البيانات
      await supabase
        .from('profiles')
        .update({ 
          // يمكن إضافة عمود push_token في جدول profiles
        })
        .eq('id', userId);
    });

    // الاستماع لأخطاء التسجيل
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // الاستماع للإشعارات الواردة
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Push notification received: ', notification);
      }
    );

    // الاستماع لإجراءات الإشعارات
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        console.log('Push notification action performed', notification);
      }
    );
  } catch (error) {
    console.error('Error initializing push notifications:', error);
  }
};

/**
 * إرسال إشعار محلي
 */
export const sendLocalNotification = async (title: string, body: string) => {
  try {
    await PushNotifications.createChannel({
      id: 'general',
      name: 'General Notifications',
      description: 'General notifications',
      importance: 5,
      visibility: 1,
      sound: 'default'
    });

    // Note: Local notifications require @capacitor/local-notifications
    // This is just a placeholder for the structure
    console.log('Local notification:', { title, body });
  } catch (error) {
    console.error('Error sending local notification:', error);
  }
};
