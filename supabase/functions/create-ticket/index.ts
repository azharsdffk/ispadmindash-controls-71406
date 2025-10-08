import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '*';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateTicketRequest {
  subscriber_id: string;
  issue_description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight
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

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { subscriber_id, issue_description, priority, location }: CreateTicketRequest = await req.json();

    if (!subscriber_id || !issue_description) {
      throw new Error('subscriber_id and issue_description are required');
    }

    // Get subscriber data for snapshot
    const { data: subscriber, error: subscriberError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('id', subscriber_id)
      .single();

    if (subscriberError || !subscriber) {
      throw new Error('Subscriber not found');
    }

    // Generate ticket number
    const { data: ticketNumberData } = await supabase
      .rpc('generate_ticket_number');
    
    const ticketNumber = ticketNumberData || `TKT-${Date.now()}`;

    // Build notes with location data
    let notes = '';
    if (location) {
      notes = `الموقع: https://www.google.com/maps?q=${location.latitude},${location.longitude}\n`;
      notes += `دقة الموقع: ${location.accuracy || 'غير محدد'} متر\n`;
      notes += `تم التسجيل بواسطة: ${user.email}\n`;
      notes += `التاريخ: ${new Date().toLocaleString('ar-IQ')}`;
    }

    // Create maintenance ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('maintenance_tickets')
      .insert({
        ticket_number: ticketNumber,
        subscriber_id: subscriber_id,
        issue_description: issue_description,
        priority: priority || 'medium',
        status: 'open',
        technician_id: user.id,
        created_by: user.id,
        notes: notes,
      })
      .select()
      .single();

    if (ticketError) {
      console.error('Error creating ticket:', ticketError);
      throw new Error('Failed to create ticket: ' + ticketError.message);
    }

    // Log to audit trail
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'CREATE',
        table_name: 'maintenance_tickets',
        record_id: ticket.id,
        new_data: {
          ticket_number: ticketNumber,
          subscriber_name: subscriber.name,
          subscriber_phone: subscriber.phone,
          issue: issue_description,
          priority: priority || 'medium',
          location: location || null,
        },
      });

    if (auditError) {
      console.error('Error logging audit:', auditError);
    }

    // Send notification to admins
    const { data: admins } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.user_id,
        type: 'maintenance_ticket',
        title: 'تذكرة صيانة جديدة',
        message: `تم إنشاء تذكرة صيانة جديدة رقم ${ticketNumber} للمشترك ${subscriber.name}`,
        action_url: `/maintenance?ticket=${ticket.id}`,
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        console.error('Error creating notifications:', notifError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ticket: ticket,
        message: 'تم إنشاء تذكرة الصيانة بنجاح',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      }
    );
  } catch (error: any) {
    console.error('Error in create-ticket:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
