import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendOTPRequest {
  to: string; // Phone number in international format (e.g., +9647701234567)
  channel?: 'sms' | 'call'; // Default: sms
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const serviceSid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

    if (!accountSid || !authToken || !serviceSid) {
      console.error('Missing Twilio configuration');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'خدمة التحقق غير متوفرة حالياً',
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { to, channel = 'sms' }: SendOTPRequest = await req.json();

    // Validate phone number format
    if (!to || typeof to !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'رقم الهاتف مطلوب',
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Ensure phone starts with +
    let formattedPhone = to.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    console.log('Sending OTP via Twilio Verify to:', formattedPhone);

    // Call Twilio Verify API
    const twilioUrl = `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`;

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: formattedPhone,
        Channel: channel,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Twilio Verify error:', result);
      
      // Handle specific Twilio errors
      let errorMessage = 'فشل في إرسال رمز التحقق';
      if (result.code === 60200) {
        errorMessage = 'رقم الهاتف غير صالح';
      } else if (result.code === 60203) {
        errorMessage = 'تم تجاوز الحد المسموح. يرجى المحاولة لاحقاً';
      } else if (result.code === 60212) {
        errorMessage = 'رقم الهاتف غير مدعوم';
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          code: result.code,
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Twilio Verify success:', result.status, result.sid);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم إرسال رمز التحقق',
        status: result.status,
        sid: result.sid,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: unknown) {
    console.error('Error in send-otp-verify:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
