import { Geolocation } from '@capacitor/geolocation';
import { supabase } from '@/integrations/supabase/client';

/**
 * طلب إذن الوصول للموقع
 */
export const requestLocationPermission = async () => {
  try {
    const permission = await Geolocation.requestPermissions();
    return permission.location === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

/**
 * الحصول على الموقع الحالي
 */
export const getCurrentPosition = async () => {
  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
    
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp
    };
  } catch (error) {
    console.error('Error getting current position:', error);
    throw error;
  }
};

/**
 * تتبع الموقع وإرساله للسيرفر
 */
export const startLocationTracking = async (userId: string) => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    // تحديث الموقع كل 15 دقيقة
    const watchId = await Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      },
      async (position, err) => {
        if (err) {
          console.error('Error watching position:', err);
          return;
        }

        if (position) {
          // إرسال الموقع للسيرفر
          const { error } = await supabase
            .from('employee_locations')
            .insert({
              user_id: userId,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              device_info: {
                platform: 'mobile',
                timestamp: new Date().toISOString()
              }
            });

          if (error) {
            console.error('Error saving location:', error);
          } else {
            console.log('Location updated successfully');
          }
        }
      }
    );

    return watchId;
  } catch (error) {
    console.error('Error starting location tracking:', error);
    throw error;
  }
};

/**
 * إيقاف تتبع الموقع
 */
export const stopLocationTracking = async (watchId: string) => {
  try {
    await Geolocation.clearWatch({ id: watchId });
  } catch (error) {
    console.error('Error stopping location tracking:', error);
  }
};
