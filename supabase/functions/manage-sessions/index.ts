import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'غير مصرح' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, sessionId, sessionToken, deviceName, ipAddress, userAgent, expiresAt } = await req.json();

    console.log(`Session action: ${action} for user: ${user.id}`);

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (action === 'revoke' && sessionId) {
      // Revoke specific session
      const { error: revokeError } = await supabaseAdmin
        .from('sessions')
        .update({ revoked: true })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (revokeError) {
        console.error('Error revoking session:', revokeError);
        throw revokeError;
      }

      // Log security event
      await supabaseAdmin.rpc('log_security_event', {
        p_user_id: user.id,
        p_action: 'SESSION_REVOKED',
        p_resource_type: 'session',
        p_resource_id: sessionId,
        p_metadata: { session_id: sessionId },
      });

      return new Response(
        JSON.stringify({ success: true, message: 'تم إنهاء الجلسة' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'revoke_all') {
      // Revoke all sessions for user
      const { error: revokeError } = await supabaseAdmin
        .from('sessions')
        .update({ revoked: true })
        .eq('user_id', user.id)
        .eq('revoked', false);

      if (revokeError) {
        console.error('Error revoking all sessions:', revokeError);
        throw revokeError;
      }

      // Log security event
      await supabaseAdmin.rpc('log_security_event', {
        p_user_id: user.id,
        p_action: 'ALL_SESSIONS_REVOKED',
        p_resource_type: 'session',
        p_metadata: { revoke_all: true },
      });

      // Sign out user
      await supabaseClient.auth.signOut();

      return new Response(
        JSON.stringify({ success: true, message: 'تم إنهاء جميع الجلسات' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'create') {
      // Create new session (called during login)
      // Check if multiple sessions are allowed
      const { data: settings } = await supabaseAdmin
        .from('user_security_settings')
        .select('allow_multiple_sessions')
        .eq('user_id', user.id)
        .single();

      // If multiple sessions not allowed, revoke existing sessions
      if (settings && !settings.allow_multiple_sessions) {
        await supabaseAdmin
          .from('sessions')
          .update({ revoked: true })
          .eq('user_id', user.id)
          .eq('revoked', false);
      }

      // Create new session
      const { data: newSession, error: sessionError } = await supabaseAdmin
        .from('sessions')
        .insert({
          user_id: user.id,
          session_token: sessionToken,
          device_name: deviceName,
          ip_address: ipAddress,
          user_agent: userAgent,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Error creating session:', sessionError);
        throw sessionError;
      }

      // Log security event
      await supabaseAdmin.rpc('log_security_event', {
        p_user_id: user.id,
        p_action: 'SESSION_CREATED',
        p_resource_type: 'session',
        p_resource_id: newSession.id,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_metadata: { device_name: deviceName },
      });

      return new Response(
        JSON.stringify({ success: true, session: newSession }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'إجراء غير صالح' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in manage-sessions function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
