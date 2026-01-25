import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: Date;
}

interface AutoTrackingState {
  isTracking: boolean;
  currentLocation: LocationData | null;
  lastUpdate: Date | null;
  error: string | null;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
}

const TRACKING_INTERVAL = 60000; // Update every 60 seconds
const STORAGE_KEY = 'auto_location_tracking_enabled';

export function useAutoLocationTracking(userId: string | null, userRole: string | null) {
  const [state, setState] = useState<AutoTrackingState>({
    isTracking: false,
    currentLocation: null,
    lastUpdate: null,
    error: null,
    permissionStatus: 'unknown',
  });

  const watchIdRef = useRef<number | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Check if tracking should be enabled for this user role
  const shouldTrack = useCallback(() => {
    if (!userId || !userRole) return false;
    // Only track technicians and employees
    const trackableRoles = ['technician', 'admin', 'super_admin', 'technical_manager'];
    return trackableRoles.includes(userRole);
  }, [userId, userRole]);

  // Check if user has enabled auto tracking
  const isAutoTrackingEnabled = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== 'false'; // Default to enabled
  }, []);

  // Save location to database
  const saveLocationToDb = useCallback(async (location: LocationData) => {
    if (!userId) return;

    try {
      const { error } = await supabase.from('employee_locations').insert({
        user_id: userId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        heading: location.heading,
        speed: location.speed,
        device_info: {
          platform: navigator.platform || 'web',
          userAgent: navigator.userAgent.substring(0, 100),
          timestamp: location.timestamp.toISOString(),
        },
      });

      if (error) {
        console.error('Error saving location:', error);
        return false;
      }

      setState(prev => ({
        ...prev,
        lastUpdate: new Date(),
      }));

      return true;
    } catch (error) {
      console.error('Error saving location:', error);
      return false;
    }
  }, [userId]);

  // Check and request permission
  const checkPermission = useCallback(async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, permissionStatus: 'denied', error: 'Geolocation not supported' }));
      return false;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setState(prev => ({ ...prev, permissionStatus: permission.state as 'granted' | 'denied' | 'prompt' }));
      
      if (permission.state === 'denied') {
        return false;
      }
      
      return true;
    } catch {
      // Fallback for browsers that don't support permissions API
      return true;
    }
  }, []);

  // Get current position
  const getCurrentPosition = useCallback((): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: new Date(),
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000,
        }
      );
    });
  }, []);

  // Start tracking
  const startTracking = useCallback(async () => {
    if (!shouldTrack() || !isAutoTrackingEnabled()) {
      return false;
    }

    const hasPermission = await checkPermission();
    if (!hasPermission) {
      setState(prev => ({ ...prev, error: 'لم يتم منح إذن الموقع' }));
      return false;
    }

    try {
      // Get initial position
      const initialLocation = await getCurrentPosition();
      
      setState(prev => ({
        ...prev,
        isTracking: true,
        currentLocation: initialLocation,
        error: null,
        permissionStatus: 'granted',
      }));

      // Save initial location
      await saveLocationToDb(initialLocation);

      // Start watching position
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: new Date(),
          };

          setState(prev => ({
            ...prev,
            currentLocation: newLocation,
          }));
        },
        (error) => {
          console.error('Geolocation watch error:', error);
          setState(prev => ({ 
            ...prev, 
            error: error.message,
          }));
        },
        {
          enableHighAccuracy: true,
          maximumAge: 30000,
          timeout: 15000,
        }
      );

      // Periodic database update
      updateIntervalRef.current = setInterval(async () => {
        const currentState = await new Promise<LocationData | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              heading: pos.coords.heading,
              speed: pos.coords.speed,
              timestamp: new Date(),
            }),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
          );
        });

        if (currentState) {
          await saveLocationToDb(currentState);
        }
      }, TRACKING_INTERVAL);

      console.log('Auto location tracking started');
      return true;
    } catch (error) {
      console.error('Error starting auto tracking:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'فشل في تفعيل تتبع الموقع',
        isTracking: false,
      }));
      return false;
    }
  }, [shouldTrack, isAutoTrackingEnabled, checkPermission, getCurrentPosition, saveLocationToDb]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isTracking: false,
    }));

    console.log('Auto location tracking stopped');
  }, []);

  // Toggle auto tracking setting
  const setAutoTrackingEnabled = useCallback((enabled: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(enabled));
    
    if (enabled && !state.isTracking && shouldTrack()) {
      startTracking();
      toast.success('تم تفعيل تتبع الموقع التلقائي');
    } else if (!enabled && state.isTracking) {
      stopTracking();
      toast.info('تم إيقاف تتبع الموقع التلقائي');
    }
  }, [state.isTracking, shouldTrack, startTracking, stopTracking]);

  // Request permission manually
  const requestPermission = useCallback(async () => {
    try {
      await getCurrentPosition();
      setState(prev => ({ ...prev, permissionStatus: 'granted' }));
      return true;
    } catch {
      setState(prev => ({ ...prev, permissionStatus: 'denied' }));
      return false;
    }
  }, [getCurrentPosition]);

  // Auto-start tracking when user logs in
  useEffect(() => {
    if (userId && userRole && !isInitializedRef.current) {
      isInitializedRef.current = true;
      
      if (shouldTrack() && isAutoTrackingEnabled()) {
        // Small delay to ensure auth is complete
        const timer = setTimeout(() => {
          startTracking();
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [userId, userRole, shouldTrack, isAutoTrackingEnabled, startTracking]);

  // Stop tracking on unmount or when user changes
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  // Reset when user logs out
  useEffect(() => {
    if (!userId) {
      stopTracking();
      isInitializedRef.current = false;
    }
  }, [userId, stopTracking]);

  return {
    ...state,
    isAutoTrackingEnabled: isAutoTrackingEnabled(),
    startTracking,
    stopTracking,
    setAutoTrackingEnabled,
    requestPermission,
  };
}