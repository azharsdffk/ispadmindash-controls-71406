import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendOTPRequest {
  phone: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { phone }: SendOTPRequest = await req.json();

    // تنسيق رقم الهاتف (9647xxxxxxxx)
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '964' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('964')) {
      formattedPhone = '964' + formattedPhone;
    }

    console.log('Processing OTP request for phone:', formattedPhone);

    // التحقق من rate limit
    const { data: rateLimitCheck, error: rateLimitError } = await supabase
      .rpc('check_otp_rate_limit', { p_phone: formattedPhone });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
      throw new Error('خطأ في التحقق من معدل الإرسال');
    }

    const rateLimit = rateLimitCheck?.[0];
    if (rateLimit && !rateLimit.can_send) {
      return new Response(
        JSON.stringify({
          success: false,
          error: rateLimit.message,
          waitSeconds: rateLimit.wait_seconds,
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // إرسال OTP عبر Supabase Auth
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: `+${formattedPhone}`,
      options: {
        channel: 'sms',
      },
    });

    if (error) {
      console.error('Supabase OTP error:', error);
      
      // محاولة إرسال عبر SMS محلي كـ fallback
      const localSmsResult = await sendLocalSms(formattedPhone, supabase);
      
      if (!localSmsResult.success) {
        throw new Error(error.message);
      }
      
      // تسجيل الإرسال
      await supabase.rpc('record_otp_sent', { p_phone: formattedPhone });
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'تم إرسال رمز التحقق',
          provider: 'local',
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // تسجيل الإرسال الناجح
    await supabase.rpc('record_otp_sent', { p_phone: formattedPhone });

    console.log('OTP sent successfully via Supabase Auth');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم إرسال رمز التحقق',
        provider: 'twilio',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: unknown) {
    console.error('Error in send-otp:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء إرسال رمز التحقق';
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

// دالة لإرسال SMS عبر بوابة محلية
async function sendLocalSms(phone: string, supabase: any): Promise<{ success: boolean; messageId?: string }> {
  try {
    // توليد رمز OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // محاولة إرسال عبر Twilio كـ fallback
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.log('Twilio credentials not configured');
      return { success: false };
    }

    const message = `رمز التحقق الخاص بك هو: ${otp}\nصالح لمدة 5 دقائق`;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: `+${phone}`,
        From: twilioPhoneNumber,
        Body: message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Twilio error:', errorData);
      return { success: false };
    }

    const result = await response.json();
    
    // تسجيل في سجل SMS
    await supabase.from('sms_logs').insert({
      recipient_phone: phone,
      message: message,
      status: 'sent',
      provider: 'twilio',
      provider_message_id: result.sid,
      sent_at: new Date().toISOString(),
    });

    console.log('SMS sent via Twilio fallback');
    return { success: true, messageId: result.sid };

  } catch (error) {
    console.error('Local SMS error:', error);
    return { success: false };
  }
}
