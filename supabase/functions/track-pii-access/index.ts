import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '*';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PIIAccessRequest {
  subscriber_id: string;
  accessed_fields: string[];
  access_type: 'view' | 'edit' | 'export';
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

    const { subscriber_id, accessed_fields, access_type }: PIIAccessRequest = await req.json();

    // Get client IP and user agent
    const ip_address = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    const user_agent = req.headers.get('user-agent');

    // Log PII access
    const { error: logError } = await supabase
      .from('pii_access_logs')
      .insert({
        user_id: user.id,
        subscriber_id,
        accessed_fields,
        access_type,
        ip_address,
        user_agent,
      });

    if (logError) {
      console.error('Error logging PII access:', logError);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in track-pii-access:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});