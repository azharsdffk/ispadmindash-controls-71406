import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - No authorization header" }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase clients
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify requesting user is authenticated
    const { data: { user: requestingUser }, error: authErr } = await supabaseClient.auth.getUser();
    if (authErr || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if requesting user is admin
    const { data: adminCheck, error: roleCheckErr } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('role', 'admin')
      .single();

    if (roleCheckErr || !adminCheck) {
      return new Response(
        JSON.stringify({ error: "Access denied - Admin only" }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request data
    const { user_id, role } = await req.json();

    if (!user_id || !role) {
      return new Response(
        JSON.stringify({ error: "user_id and role are required" }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate role
    const validRoles = ['admin', 'accountant', 'technician', 'client'];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: "Invalid role. Must be one of: admin, accountant, technician, client" }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert role (or do nothing if already exists)
    const { error: insertErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id, role });

    if (insertErr) {
      // If unique violation, role already exists - return success
      if (insertErr.code === '23505') {
        return new Response(
          JSON.stringify({ success: true, message: "Role already assigned" }), 
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw insertErr;
    }

    // Log the action
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: requestingUser.id,
        action: 'ASSIGN_ROLE',
        table_name: 'user_roles',
        record_id: user_id,
        new_data: { role }
      });

    return new Response(
      JSON.stringify({ success: true, message: "Role assigned successfully" }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error("Error in set-role function:", err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
