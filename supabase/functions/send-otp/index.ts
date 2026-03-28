import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Parse request
    const body = await req.json();
    console.log('[send-otp] Raw request body:', JSON.stringify(body));

    const { phone } = body;

    if (!phone) {
      console.log('[send-otp] ERROR: phone is missing from request');
      return new Response(
        JSON.stringify({ success: false, error: 'رقم الهاتف مطلوب' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[send-otp] Phone BEFORE formatting:', phone);

    // 2. Format phone to E.164 (+9647xxxxxxxxx)
    let formattedPhone = phone.replace(/[^0-9+]/g, '');
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+964' + formattedPhone.substring(1);
      } else if (formattedPhone.startsWith('964')) {
        formattedPhone = '+' + formattedPhone;
      } else {
        formattedPhone = '+964' + formattedPhone;
      }
    }

    console.log('[send-otp] Phone AFTER formatting:', formattedPhone);

    // 3. Validate format
    if (!/^\+9647\d{8,9}$/.test(formattedPhone)) {
      console.log('[send-otp] ERROR: Invalid phone format:', formattedPhone);
      return new Response(
        JSON.stringify({ success: false, error: 'رقم الهاتف غير صالح. استخدم +9647XXXXXXXXX' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Get Twilio credentials
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const serviceSid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

    console.log('[send-otp] Twilio creds check - SID:', !!accountSid, '| Token:', !!authToken, '| Service:', !!serviceSid);

    if (!accountSid || !authToken || !serviceSid) {
      console.error('[send-otp] ERROR: Missing Twilio credentials');
      return new Response(
        JSON.stringify({ success: false, error: 'خدمة التحقق غير متوفرة حالياً. يرجى التواصل مع الدعم الفني' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Call Twilio Verify API
    const twilioUrl = `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`;

    console.log('[send-otp] Calling Twilio Verify API...');
    console.log('[send-otp] URL:', twilioUrl);
    console.log('[send-otp] To:', formattedPhone, '| Channel: sms');

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: formattedPhone,
        Channel: 'sms',
      }),
    });

    const result = await twilioResponse.json();

    console.log('[send-otp] Twilio HTTP status:', twilioResponse.status);
    console.log('[send-otp] Twilio response:', JSON.stringify(result));

    // 6. Handle Twilio errors
    if (!twilioResponse.ok) {
      let errorMessage = 'فشل في إرسال رمز التحقق';
      if (result.code === 60200) errorMessage = 'رقم الهاتف غير صالح';
      else if (result.code === 60203) errorMessage = 'تم تجاوز الحد المسموح. يرجى المحاولة لاحقاً';
      else if (result.code === 60212) errorMessage = 'رقم الهاتف غير مدعوم في هذه المنطقة';
      else if (result.code === 60223) errorMessage = 'هذا الرقم غير قادر على استلام رسائل SMS';

      console.error('[send-otp] Twilio error code:', result.code, '| message:', result.message);

      return new Response(
        JSON.stringify({ success: false, error: errorMessage, twilioCode: result.code }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Success
    console.log('[send-otp] ✅ OTP sent successfully! SID:', result.sid, '| Status:', result.status);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم إرسال رمز التحقق بنجاح',
        status: result.status,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[send-otp] UNEXPECTED ERROR:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء إرسال رمز التحقق';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
