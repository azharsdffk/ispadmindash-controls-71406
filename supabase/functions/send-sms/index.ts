import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { to, message, subscriber_name, template_key, variables } = await req.json() as SendSMSRequest;

    console.log('Sending SMS to:', to);

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

    // Log SMS attempt
    const { data: smsLog, error: logError } = await supabaseClient
      .from('sms_logs')
      .insert({
        recipient_phone: to,
        recipient_name: subscriber_name || null,
        message: finalMessage,
        status: 'pending',
        provider: 'twilio'
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
      console.log('SMS sent successfully:', twilioData.sid);
      
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
