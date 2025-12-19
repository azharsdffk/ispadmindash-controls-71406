import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendSMSRequest {
  to: string;
  message: string;
  subscriber_name?: string;
  template_key?: string;
  variables?: Record<string, string>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check - require valid user token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has permission to send SMS (admin or has send_sms permission)
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const hasAdminRole = roles?.some(r => r.role === 'admin');
    
    // Also check permissions table for send_sms permission
    const { data: hasPermission } = await supabaseClient
      .rpc('has_permission', { _user_id: user.id, _permission_name: 'send_sms' });

    if (!hasAdminRole && !hasPermission) {
      console.error('User lacks SMS permission:', user.id);
      return new Response(
        JSON.stringify({ error: 'You do not have permission to send SMS' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { to, message, subscriber_name, template_key, variables } = await req.json() as SendSMSRequest;

    // Validate input
    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: 'Phone number and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending SMS to:', to, 'by user:', user.id);

    // Get Twilio credentials
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error('Twilio credentials not configured');
    }

    // Process template if template_key is provided
    let finalMessage = message;
    if (template_key && variables) {
      const { data: template } = await supabaseClient
        .from('sms_templates')
        .select('message_template')
        .eq('template_key', template_key)
        .eq('active', true)
        .single();

      if (template) {
        finalMessage = template.message_template;
        // Replace variables
        Object.entries(variables).forEach(([key, value]) => {
          finalMessage = finalMessage.replace(new RegExp(`{${key}}`, 'g'), value);
        });
      }
    }

    // Log SMS attempt with user ID
    const { data: smsLog, error: logError } = await supabaseClient
      .from('sms_logs')
      .insert({
        recipient_phone: to,
        recipient_name: subscriber_name || null,
        message: finalMessage,
        status: 'pending',
        provider: 'twilio',
        created_by: user.id
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating SMS log:', logError);
    }

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${twilioAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: twilioPhoneNumber,
        Body: finalMessage,
      }).toString(),
    });

    const twilioData = await twilioResponse.json();

    if (twilioResponse.ok) {
      console.log('SMS sent successfully:', twilioData.sid, 'by user:', user.id);
      
      // Update log with success
      if (smsLog) {
        await supabaseClient
          .from('sms_logs')
          .update({
            status: 'sent',
            provider_message_id: twilioData.sid,
            sent_at: new Date().toISOString()
          })
          .eq('id', smsLog.id);
      }

      // Log security audit
      await supabaseClient
        .from('security_audit_logs')
        .insert({
          user_id: user.id,
          action: 'SEND_SMS',
          resource_type: 'sms',
          resource_id: smsLog?.id,
          metadata: { recipient: to, message_id: twilioData.sid }
        });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message_id: twilioData.sid,
          status: twilioData.status 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } else {
      console.error('Twilio error:', twilioData);
      
      // Update log with failure
      if (smsLog) {
        await supabaseClient
          .from('sms_logs')
          .update({
            status: 'failed',
            error_message: twilioData.message || 'Unknown error'
          })
          .eq('id', smsLog.id);
      }

      throw new Error(twilioData.message || 'Failed to send SMS');
    }

  } catch (error) {
    console.error('Error in send-sms function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
