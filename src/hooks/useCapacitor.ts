import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/AuthContext';
import { initializePushNotifications } from '@/services/capacitor/notifications';
import { startLocationTracking, stopLocationTracking } from '@/services/capacitor/geolocation';
import { initializeAppState } from '@/services/capacitor/app-state';

/**
 * Hook لإدارة وظائف Capacitor
 */
export const useCapacitor = () => {
  const { user } = useAuth();
  const [isNative, setIsNative] = useState(false);
  const [locationWatchId, setLocationWatchId] = useState<string | null>(null);

  useEffect(() => {
    // التحقق من البيئة
    setIsNative(Capacitor.isNativePlatform());

    // تهيئة حالة التطبيق
    if (Capacitor.isNativePlatform()) {
      initializeAppState();
    }
  }, []);

  useEffect(() => {
    if (!user || !isNative) return;

    // تهيئة الإشعارات
    initializePushNotifications(user.id);

    // بدء تتبع الموقع
    const startTracking = async () => {
      try {
        const watchId = await startLocationTracking(user.id);
        setLocationWatchId(watchId);
      } catch (error) {
        console.error('Failed to start location tracking:', error);
      }
    };

    startTracking();

    // تنظيف
    return () => {
      if (locationWatchId) {
        stopLocationTracking(locationWatchId);
      }
    };
  }, [user, isNative]);

  return {
    isNative,
    platform: Capacitor.getPlatform(),
    isAndroid: Capacitor.getPlatform() === 'android',
    isIOS: Capacitor.getPlatform() === 'ios'
  };
};
