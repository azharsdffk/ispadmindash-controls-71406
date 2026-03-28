import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LocationSaveRequest {
  type: 'subscriber' | 'technician' | 'ticket';
  id: string;
  latitude: number;
  longitude: number;
  status?: string;
  location_address?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();

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

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Route based on path and method
    if (req.method === 'POST' && path === 'save') {
      return await handleSaveLocation(supabase, req, user.id);
    }

    if (req.method === 'GET') {
      switch (path) {
        case 'technicians':
          return await handleGetTechnicians(supabase);
        case 'subscribers':
          return await handleGetSubscribers(supabase);
        case 'tickets':
          return await handleGetTickets(supabase, url);
        case 'nearest':
          return await handleGetNearestTechnician(supabase, url);
        case 'all':
          return await handleGetAllMapData(supabase, url);
        default:
          throw new Error('Unknown endpoint');
      }
    }

    throw new Error('Method not allowed');
  } catch (error: any) {
    console.error('Map data error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// POST /map-data/save - Save location for any entity
async function handleSaveLocation(supabase: any, req: Request, userId: string) {
  const { type, id, latitude, longitude, status, location_address }: LocationSaveRequest = await req.json();

  if (!type || !id || latitude === undefined || longitude === undefined) {
    throw new Error('Missing required fields: type, id, latitude, longitude');
  }

  let result;

  switch (type) {
    case 'subscriber':
      const { data: subscriber, error: subError } = await supabase
        .from('subscribers')
        .update({ latitude, longitude })
        .eq('id', id)
        .select()
        .single();
      
      if (subError) throw subError;
      result = subscriber;
      break;

    case 'technician':
      const updates: any = { latitude, longitude };
      if (status) updates.status = status;
      
      const { data: technician, error: techError } = await supabase
        .from('technicians')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (techError) throw techError;
      result = technician;
      break;

    case 'ticket':
      const ticketUpdates: any = { latitude, longitude };
      if (location_address) ticketUpdates.location_address = location_address;
      
      const { data: ticket, error: ticketError } = await supabase
        .from('maintenance_tickets')
        .update(ticketUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (ticketError) throw ticketError;
      result = ticket;
      break;

    default:
      throw new Error('Invalid type');
  }

  // Log the operation
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action: 'UPDATE_LOCATION',
    table_name: type === 'subscriber' ? 'subscribers' : type === 'technician' ? 'technicians' : 'maintenance_tickets',
    record_id: id,
    new_data: { latitude, longitude, status, location_address }
  });

  return new Response(
    JSON.stringify({ success: true, data: result }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  );
}

// GET /map-data/technicians - Get all technicians with location
async function handleGetTechnicians(supabase: any) {
  const { data, error } = await supabase
    .from('technicians_map_view')
    .select('*')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  if (error) throw error;

  const technicians = data.map((t: any) => ({
    id: t.id,
    name: t.name,
    specialization: t.specialization,
    latitude: Number(t.latitude),
    longitude: Number(t.longitude),
    status: t.status || 'offline',
    available: t.available,
  }));

  return new Response(
    JSON.stringify({ success: true, technicians }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// GET /map-data/subscribers - Get all subscribers with location
async function handleGetSubscribers(supabase: any) {
  const { data, error } = await supabase
    .from('subscribers_map_view')
    .select('*')
    .limit(500);

  if (error) throw error;

  const subscribers = data.map((s: any) => ({
    id: s.id,
    name: s.name,
    address: s.address,
    latitude: Number(s.latitude),
    longitude: Number(s.longitude),
    agent_id: s.agent_id
  }));

  return new Response(
    JSON.stringify({ success: true, subscribers }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// GET /map-data/tickets - Get all tickets with location
async function handleGetTickets(supabase: any, url: URL) {
  const status = url.searchParams.get('status');
  const priority = url.searchParams.get('priority');

  let query = supabase
    .from('tickets_map_view')
    .select('*')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  if (status) {
    query = query.eq('status', status);
  }
  if (priority) {
    query = query.eq('priority', priority);
  }

  const { data, error } = await query.limit(200);

  if (error) throw error;

  const tickets = data.map((t: any) => ({
    id: t.id,
    ticket_number: t.ticket_number,
    issue_description: t.issue_description,
    priority: t.priority,
    status: t.status,
    scheduled_date: t.scheduled_date,
    latitude: Number(t.latitude),
    longitude: Number(t.longitude),
    location_address: t.location_address,
    subscriber_name: t.subscriber_name,
    subscriber_address: t.subscriber_address,
    technician_name: t.technician_name,
    technician_id: t.technician_id,
    created_at: t.created_at
  }));

  return new Response(
    JSON.stringify({ success: true, tickets }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// GET /map-data/nearest - Find nearest available technician
async function handleGetNearestTechnician(supabase: any, url: URL) {
  const lat = url.searchParams.get('lat');
  const lng = url.searchParams.get('lng');
  const maxDistance = url.searchParams.get('max_distance') || '50';

  if (!lat || !lng) {
    throw new Error('Missing required parameters: lat, lng');
  }

  const { data, error } = await supabase
    .rpc('find_nearest_technician', {
      target_lat: parseFloat(lat),
      target_lng: parseFloat(lng),
      max_distance_km: parseFloat(maxDistance)
    });

  if (error) throw error;

  const nearest = data && data.length > 0 ? {
    id: data[0].technician_id,
    name: data[0].technician_name,
    phone: data[0].phone,
    latitude: Number(data[0].latitude),
    longitude: Number(data[0].longitude),
    distance_km: Number(data[0].distance_km),
    status: data[0].status
  } : null;

  return new Response(
    JSON.stringify({ 
      success: true, 
      nearest_technician: nearest,
      all_nearby: data?.map((t: any) => ({
        id: t.technician_id,
        name: t.technician_name,
        phone: t.phone,
        latitude: Number(t.latitude),
        longitude: Number(t.longitude),
        distance_km: Number(t.distance_km),
        status: t.status
      })) || []
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// GET /map-data/all - Get all map data at once
async function handleGetAllMapData(supabase: any, url: URL) {
  const includeTechnicians = url.searchParams.get('technicians') !== 'false';
  const includeSubscribers = url.searchParams.get('subscribers') !== 'false';
  const includeTickets = url.searchParams.get('tickets') !== 'false';

  const results: any = {};

  // Execute queries in parallel
  const queries = [];

  if (includeTechnicians) {
    queries.push(
      supabase
        .from('technicians_map_view')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .then((res: any) => ({ type: 'technicians', ...res }))
    );
  }

  if (includeSubscribers) {
    queries.push(
      supabase
        .from('subscribers_map_view')
        .select('*')
        .limit(500)
        .then((res: any) => ({ type: 'subscribers', ...res }))
    );
  }

  if (includeTickets) {
    queries.push(
      supabase
        .from('tickets_map_view')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .in('status', ['open', 'in_progress', 'assigned'])
        .limit(200)
        .then((res: any) => ({ type: 'tickets', ...res }))
    );
  }

  const queryResults = await Promise.all(queries);

  for (const result of queryResults) {
    if (result.error) {
      console.error(`Error fetching ${result.type}:`, result.error);
      results[result.type] = [];
      continue;
    }

    switch (result.type) {
      case 'technicians':
        results.technicians = result.data.map((t: any) => ({
          id: t.id,
          name: t.name,
          phone: t.phone,
          specialization: t.specialization,
          latitude: Number(t.latitude),
          longitude: Number(t.longitude),
          status: t.status || 'offline',
          available: t.available,
          last_location_update: t.last_location_update
        }));
        break;
      case 'subscribers':
        results.subscribers = result.data.map((s: any) => ({
          id: s.id,
          name: s.name,
          phone: s.phone,
          address: s.address,
          latitude: Number(s.latitude),
          longitude: Number(s.longitude)
        }));
        break;
      case 'tickets':
        results.tickets = result.data.map((t: any) => ({
          id: t.id,
          ticket_number: t.ticket_number,
          issue_description: t.issue_description,
          priority: t.priority,
          status: t.status,
          latitude: Number(t.latitude),
          longitude: Number(t.longitude),
          subscriber_name: t.subscriber_name,
          technician_name: t.technician_name
        }));
        break;
    }
  }

  return new Response(
    JSON.stringify({ success: true, ...results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
