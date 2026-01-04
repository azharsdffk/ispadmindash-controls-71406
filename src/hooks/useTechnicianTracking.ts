import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LocationState {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: Date;
}

interface TechnicianTrackingState {
  currentLocation: LocationState | null;
  isTracking: boolean;
  status: 'idle' | 'on_the_way' | 'arrived' | 'working';
  activeTicketId: string | null;
  error: string | null;
}

export function useTechnicianTracking(technicianId: string) {
  const [state, setState] = useState<TechnicianTrackingState>({
    currentLocation: null,
    isTracking: false,
    status: 'idle',
    activeTicketId: null,
    error: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateLocationInDB = useCallback(async (location: LocationState, status: string, ticketId?: string) => {
    try {
      const locationData = {
        technician_id: technicianId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        heading: location.heading,
        speed: location.speed,
        status,
        ticket_id: ticketId || null,
        updated_at: new Date().toISOString(),
      };

      // Upsert location
      const { error } = await supabase
        .from('technician_locations')
        .upsert(locationData, { onConflict: 'technician_id' });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }, [technicianId]);

  const startTracking = useCallback(async (ticketId: string, status: 'on_the_way' | 'working' = 'on_the_way') => {
    if (!navigator.geolocation) {
      toast.error('المتصفح لا يدعم تحديد الموقع');
      return false;
    }

    try {
      // Get initial position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const location: LocationState = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: new Date(),
      };

      setState(prev => ({
        ...prev,
        currentLocation: location,
        isTracking: true,
        status,
        activeTicketId: ticketId,
        error: null,
      }));

      // Update DB with initial location
      await updateLocationInDB(location, status, ticketId);

      // Start watching position
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newLocation: LocationState = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: new Date(),
          };

          setState(prev => ({
            ...prev,
            currentLocation: newLocation,
          }));
        },
        (error) => {
          console.error('Geolocation error:', error);
          setState(prev => ({ ...prev, error: error.message }));
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000,
        }
      );

      // Update DB every 30 seconds
      updateIntervalRef.current = setInterval(() => {
        setState(prev => {
          if (prev.currentLocation) {
            updateLocationInDB(prev.currentLocation, prev.status, ticketId);
          }
          return prev;
        });
      }, 30000);

      return true;
    } catch (error) {
      console.error('Error starting tracking:', error);
      toast.error('فشل في تفعيل التتبع');
      return false;
    }
  }, [updateLocationInDB]);

  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    // Update status to idle
    if (state.currentLocation) {
      await updateLocationInDB(state.currentLocation, 'idle');
    }

    setState(prev => ({
      ...prev,
      isTracking: false,
      status: 'idle',
      activeTicketId: null,
    }));
  }, [state.currentLocation, updateLocationInDB]);

  // Start journey to customer
  const startJourney = useCallback(async (ticketId: string, etaMinutes?: number) => {
    const success = await startTracking(ticketId, 'on_the_way');
    
    if (success) {
      // Update ticket status
      await supabase
        .from('maintenance_tickets')
        .update({ status: 'tech_on_the_way' })
        .eq('id', ticketId);

      // Create visit log
      const locationData = state.currentLocation ? {
        lat: state.currentLocation.latitude,
        lng: state.currentLocation.longitude,
      } : null;

      await supabase.from('visit_logs').upsert({
        ticket_id: ticketId,
        technician_id: technicianId,
        departed_at: new Date().toISOString(),
        departure_location: locationData,
        eta_minutes: etaMinutes || null,
      }, { onConflict: 'ticket_id' });

      // Log event
      await supabase.from('ticket_events').insert({
        ticket_id: ticketId,
        event_type: 'tech_on_the_way',
        event_data: { eta_minutes: etaMinutes },
        latitude: state.currentLocation?.latitude,
        longitude: state.currentLocation?.longitude,
        created_by: technicianId,
      });

      toast.success('تم بدء الرحلة - يتم تتبع موقعك الآن');
    }

    return success;
  }, [startTracking, state.currentLocation, technicianId]);

  // Check-in at customer location
  const checkIn = useCallback(async (ticketId: string) => {
    if (!state.currentLocation) {
      toast.error('لم يتم تحديد موقعك');
      return false;
    }

    try {
      // Update ticket status
      await supabase
        .from('maintenance_tickets')
        .update({ status: 'tech_arrived' })
        .eq('id', ticketId);

      // Update visit log
      await supabase.from('visit_logs').update({
        arrived_at: new Date().toISOString(),
        arrival_location: {
          lat: state.currentLocation.latitude,
          lng: state.currentLocation.longitude,
        },
        actual_travel_minutes: state.activeTicketId ? 
          Math.round((Date.now() - state.currentLocation.timestamp.getTime()) / 60000) : 
          null,
      }).eq('ticket_id', ticketId);

      // Log event
      await supabase.from('ticket_events').insert({
        ticket_id: ticketId,
        event_type: 'tech_arrived',
        latitude: state.currentLocation.latitude,
        longitude: state.currentLocation.longitude,
        created_by: technicianId,
      });

      // Update location status
      await updateLocationInDB(state.currentLocation, 'arrived', ticketId);

      setState(prev => ({ ...prev, status: 'arrived' }));

      toast.success('تم تسجيل الوصول بنجاح');
      return true;
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('فشل في تسجيل الوصول');
      return false;
    }
  }, [state.currentLocation, state.activeTicketId, technicianId, updateLocationInDB]);

  // Start work on ticket
  const startWork = useCallback(async (ticketId: string) => {
    try {
      // Update ticket status
      await supabase
        .from('maintenance_tickets')
        .update({ status: 'in_progress' })
        .eq('id', ticketId);

      // Update visit log
      await supabase.from('visit_logs').update({
        work_started_at: new Date().toISOString(),
      }).eq('ticket_id', ticketId);

      // Log event
      await supabase.from('ticket_events').insert({
        ticket_id: ticketId,
        event_type: 'in_progress',
        latitude: state.currentLocation?.latitude,
        longitude: state.currentLocation?.longitude,
        created_by: technicianId,
      });

      // Update location status
      if (state.currentLocation) {
        await updateLocationInDB(state.currentLocation, 'working', ticketId);
      }

      setState(prev => ({ ...prev, status: 'working' }));

      toast.success('تم بدء العمل');
      return true;
    } catch (error) {
      console.error('Error starting work:', error);
      toast.error('فشل في بدء العمل');
      return false;
    }
  }, [state.currentLocation, technicianId, updateLocationInDB]);

  // Complete work
  const completeWork = useCallback(async (
    ticketId: string, 
    notes?: string, 
    beforePhotos?: string[], 
    afterPhotos?: string[]
  ) => {
    try {
      // Update ticket status
      await supabase
        .from('maintenance_tickets')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          notes: notes || null,
        })
        .eq('id', ticketId);

      // Update visit log
      await supabase.from('visit_logs').update({
        completed_at: new Date().toISOString(),
        completion_location: state.currentLocation ? {
          lat: state.currentLocation.latitude,
          lng: state.currentLocation.longitude,
        } : null,
        notes,
        before_photos: beforePhotos,
        after_photos: afterPhotos,
      }).eq('ticket_id', ticketId);

      // Log event
      await supabase.from('ticket_events').insert({
        ticket_id: ticketId,
        event_type: 'resolved',
        event_data: { notes },
        latitude: state.currentLocation?.latitude,
        longitude: state.currentLocation?.longitude,
        created_by: technicianId,
      });

      // Stop tracking
      await stopTracking();

      toast.success('تم إنهاء الصيانة بنجاح');
      return true;
    } catch (error) {
      console.error('Error completing work:', error);
      toast.error('فشل في إنهاء العمل');
      return false;
    }
  }, [state.currentLocation, technicianId, stopTracking]);

  // Cleanup on unmount
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

  return {
    ...state,
    startJourney,
    checkIn,
    startWork,
    completeWork,
    stopTracking,
  };
}
