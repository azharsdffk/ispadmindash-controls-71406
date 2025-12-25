import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

interface LocationUpdate {
  latitude: number;
  longitude: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { latitude, longitude }: LocationUpdate = await req.json();

    // Get all active geofence zones
    const { data: zones, error: zonesError } = await supabase
      .from('geofence_zones')
      .select('*')
      .eq('active', true);

    if (zonesError) throw zonesError;

    const notifications: any[] = [];

    for (const zone of zones || []) {
      const distance = calculateDistance(
        latitude,
        longitude,
        parseFloat(zone.center_lat),
        parseFloat(zone.center_lng)
      );

      const isInside = distance <= parseFloat(zone.radius_meters);

      // Check previous state
      const { data: lastEvent } = await supabase
        .from('geofence_events')
        .select('*')
        .eq('user_id', user.id)
        .eq('zone_id', zone.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const wasInside = lastEvent?.event_type === 'enter';

      // Detect state change
      if (isInside && !wasInside) {
        // Entered zone
        await supabase.from('geofence_events').insert({
          user_id: user.id,
          zone_id: zone.id,
          event_type: 'enter',
          latitude,
          longitude,
        });

        if (zone.notify_on_enter) {
          const notification = {
            user_id: user.id,
            title: `Entered Zone: ${zone.name}`,
            message: zone.notification_message || `You have entered ${zone.name}`,
            type: 'geofence',
            action_url: null,
          };

          await supabase.from('notifications').insert(notification);
          notifications.push(notification);
        }
      } else if (!isInside && wasInside) {
        // Exited zone
        await supabase.from('geofence_events').insert({
          user_id: user.id,
          zone_id: zone.id,
          event_type: 'exit',
          latitude,
          longitude,
        });

        if (zone.notify_on_exit) {
          const notification = {
            user_id: user.id,
            title: `Exited Zone: ${zone.name}`,
            message: `You have exited ${zone.name}`,
            type: 'geofence',
            action_url: null,
          };

          await supabase.from('notifications').insert(notification);
          notifications.push(notification);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, notifications }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in check-geofence:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
