import { useEffect, useState, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/AuthContext';
import { initializePushNotifications } from '@/services/capacitor/notifications';
import { startLocationTracking, stopLocationTracking } from '@/services/capacitor/geolocation';
import { initializeAppState } from '@/services/capacitor/app-state';
import { 
  initializeBackgroundGeolocation, 
  stopBackgroundGeolocation,
  isBackgroundGeolocationActive,
} from '@/services/capacitor/background-geolocation';

// Roles that should have location tracking enabled
const TRACKABLE_ROLES = ['technician', 'admin', 'super_admin', 'technical_manager'];

/**
 * Hook لإدارة وظائف Capacitor مع دعم تتبع الموقع في الخلفية
 */
export const useCapacitor = () => {
  const { user, roles } = useAuth();
  const [isNative, setIsNative] = useState(false);
  const [locationWatchId, setLocationWatchId] = useState<string | null>(null);
  const [isBackgroundTrackingActive, setIsBackgroundTrackingActive] = useState(false);
  const [backgroundPermissionStatus, setBackgroundPermissionStatus] = useState<string>('unknown');
  const isInitializedRef = useRef(false);

  // Check if user should be tracked based on role
  const shouldTrackUser = useCallback(() => {
    if (!user || !roles) return false;
    return roles.some(role => TRACKABLE_ROLES.includes(role));
  }, [user, roles]);

  // Initialize app state and check platform
  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());

    if (Capacitor.isNativePlatform()) {
      initializeAppState();
    }
  }, []);

  // Check background permission status (simplified since plugin handles permissions internally)
  const checkBackgroundPermissions = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    // Permissions are handled by the plugin when addWatcher is called
    setBackgroundPermissionStatus('prompt');
  }, []);

  // Start background location tracking
  const startBackgroundTracking = useCallback(async () => {
    if (!user || !isNative || !shouldTrackUser()) return false;

    try {
      const success = await initializeBackgroundGeolocation({
        userId: user.id,
        updateInterval: 60000, // 60 seconds
        distanceFilter: 50, // 50 meters
      });

      if (success) {
        setIsBackgroundTrackingActive(true);
        console.log('Background location tracking started');
      }

      return success;
    } catch (error) {
      console.error('Failed to start background tracking:', error);
      return false;
    }
  }, [user, isNative, shouldTrackUser]);

  // Stop background location tracking
  const stopBackgroundTracking = useCallback(async () => {
    try {
      await stopBackgroundGeolocation();
      setIsBackgroundTrackingActive(false);
      console.log('Background location tracking stopped');
      return true;
    } catch (error) {
      console.error('Failed to stop background tracking:', error);
      return false;
    }
  }, []);

  // Auto-start tracking on login for native platforms
  useEffect(() => {
    if (!user || !isNative || isInitializedRef.current) return;

    const initializeTracking = async () => {
      // Initialize push notifications
      await initializePushNotifications(user.id);

      // Check permissions
      await checkBackgroundPermissions();

      // Start background tracking if user should be tracked
      if (shouldTrackUser()) {
        isInitializedRef.current = true;
        
        // Small delay to ensure auth is complete
        setTimeout(async () => {
          const success = await startBackgroundTracking();
          
          // Fallback to foreground tracking if background fails
          if (!success) {
            try {
              const watchId = await startLocationTracking(user.id);
              setLocationWatchId(watchId);
            } catch (error) {
              console.error('Failed to start foreground location tracking:', error);
            }
          }
        }, 2000);
      }
    };

    initializeTracking();

    // Cleanup on unmount
    return () => {
      if (locationWatchId) {
        stopLocationTracking(locationWatchId);
      }
      if (isBackgroundGeolocationActive()) {
        stopBackgroundGeolocation();
      }
    };
  }, [user, isNative, shouldTrackUser, startBackgroundTracking, checkBackgroundPermissions]);

  // Reset when user logs out
  useEffect(() => {
    if (!user) {
      stopBackgroundTracking();
      if (locationWatchId) {
        stopLocationTracking(locationWatchId);
        setLocationWatchId(null);
      }
      isInitializedRef.current = false;
    }
  }, [user, locationWatchId, stopBackgroundTracking]);

  return {
    isNative,
    platform: Capacitor.getPlatform(),
    isAndroid: Capacitor.getPlatform() === 'android',
    isIOS: Capacitor.getPlatform() === 'ios',
    // Background tracking
    isBackgroundTrackingActive,
    backgroundPermissionStatus,
    startBackgroundTracking,
    stopBackgroundTracking,
    checkBackgroundPermissions,
  };
};
