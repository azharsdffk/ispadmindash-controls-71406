import { Capacitor, registerPlugin } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import type { BackgroundGeolocationPlugin, Location, CallbackError } from '@capacitor-community/background-geolocation';

// Register the plugin
const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

// Background Geolocation Configuration
interface BackgroundGeolocationConfig {
  userId: string;
  updateInterval?: number; // in milliseconds
  distanceFilter?: number; // in meters
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: Date;
}

let watchCallbackId: string | null = null;
let backgroundUpdateInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Initialize background geolocation tracking for mobile
 */
export const initializeBackgroundGeolocation = async (config: BackgroundGeolocationConfig) => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Background geolocation only available on native platforms');
    return false;
  }

  try {
    // Configure background geolocation
    watchCallbackId = await BackgroundGeolocation.addWatcher(
      {
        backgroundMessage: 'جاري تتبع موقعك للعمل',
        backgroundTitle: 'تتبع الموقع نشط',
        requestPermissions: true,
        stale: false,
        distanceFilter: config.distanceFilter || 50, // minimum distance (meters) before update
      },
      async (location?: Location, error?: CallbackError) => {
        if (error) {
          if (error.code === 'NOT_AUTHORIZED') {
            console.error('Background location not authorized');
          }
          return;
        }

        if (location) {
          await saveLocationToDatabase({
            userId: config.userId,
            location: {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
              heading: location.bearing || null,
              speed: location.speed || null,
              timestamp: new Date(location.time || Date.now()),
            },
          });
        }
      }
    );

    console.log('Background geolocation watcher started with ID:', watchCallbackId);

    // Also set up periodic updates as a fallback
    backgroundUpdateInterval = setInterval(async () => {
      try {
        const { Geolocation } = await import('@capacitor/geolocation');
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });

        await saveLocationToDatabase({
          userId: config.userId,
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: new Date(position.timestamp),
          },
        });
      } catch (err) {
        console.error('Periodic location update failed:', err);
      }
    }, config.updateInterval || 60000); // Default: every 60 seconds

    return true;
  } catch (error) {
    console.error('Failed to initialize background geolocation:', error);
    return false;
  }
};

/**
 * Stop background geolocation tracking
 */
export const stopBackgroundGeolocation = async () => {
  try {
    if (watchCallbackId) {
      await BackgroundGeolocation.removeWatcher({ id: watchCallbackId });
      watchCallbackId = null;
      console.log('Background geolocation watcher stopped');
    }

    if (backgroundUpdateInterval) {
      clearInterval(backgroundUpdateInterval);
      backgroundUpdateInterval = null;
    }

    return true;
  } catch (error) {
    console.error('Failed to stop background geolocation:', error);
    return false;
  }
};

/**
 * Save location data to the database
 */
const saveLocationToDatabase = async ({
  userId,
  location,
}: {
  userId: string;
  location: LocationData;
}) => {
  try {
    const { error } = await supabase.from('employee_locations').insert({
      user_id: userId,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      heading: location.heading,
      speed: location.speed,
      device_info: {
        platform: Capacitor.getPlatform(),
        isNative: true,
        backgroundTracking: true,
        timestamp: location.timestamp.toISOString(),
      },
    });

    if (error) {
      console.error('Error saving background location:', error);
      return false;
    }

    console.log('Background location saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving background location:', error);
    return false;
  }
};

/**
 * Check if background geolocation is currently active
 */
export const isBackgroundGeolocationActive = () => {
  return watchCallbackId !== null;
};

/**
 * Open location settings on the device
 */
export const openLocationSettings = async () => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await BackgroundGeolocation.openSettings();
  } catch (error) {
    console.error('Failed to open location settings:', error);
  }
};
