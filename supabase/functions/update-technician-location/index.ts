import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  status?: 'online' | 'offline' | 'busy' | 'available';
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { latitude, longitude, accuracy, speed, heading, status }: LocationUpdate = await req.json();

    if (latitude === undefined || longitude === undefined) {
      throw new Error('Missing required fields: latitude, longitude');
    }

    // Save to employee_locations for tracking history
    const { error: locationError } = await supabase
      .from('employee_locations')
      .insert({
        user_id: user.id,
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
        device_info: {
          updated_via: 'api',
          timestamp: new Date().toISOString()
        }
      });

    if (locationError) {
      console.error('Error saving location:', locationError);
    }

    // Update technician status if specified
    if (status) {
      const { error: techError } = await supabase
        .from('technicians')
        .update({ 
          status,
          latitude,
          longitude
        })
        .eq('user_id', user.id);

      if (techError) {
        console.error('Error updating technician:', techError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Location updated successfully',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('Location update error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
