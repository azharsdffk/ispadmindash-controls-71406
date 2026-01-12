import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'https://sxmkrmidebylykaefmsl.lovableproject.com';

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigins = [
    ALLOWED_ORIGIN,
    'http://localhost:5173',
    'http://localhost:8080',
  ];
  
  const isAllowed = allowedOrigins.some(allowed => origin === allowed || origin.endsWith('.lovableproject.com'));
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

interface SendOTPRequest {
  phone: string;
}

// IP-based rate limiting
const ipRateLimits = new Map<string, { count: number; firstAttempt: number; blockedUntil?: number }>();
const IP_RATE_LIMIT = 10;
const IP_RATE_WINDOW = 60 * 1000;
const IP_BLOCK_DURATION = 15 * 60 * 1000;

function checkIpRateLimit(ip: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const record = ipRateLimits.get(ip);
  
  if (!record) {
    ipRateLimits.set(ip, { count: 1, firstAttempt: now });
    return { allowed: true };
  }
  
  if (record.blockedUntil && now < record.blockedUntil) {
    return { allowed: false, waitSeconds: Math.ceil((record.blockedUntil - now) / 1000) };
  }
  
  if (now - record.firstAttempt > IP_RATE_WINDOW) {
    ipRateLimits.set(ip, { count: 1, firstAttempt: now });
    return { allowed: true };
  }
  
  if (record.count >= IP_RATE_LIMIT) {
    record.blockedUntil = now + IP_BLOCK_DURATION;
    return { allowed: false, waitSeconds: Math.ceil(IP_BLOCK_DURATION / 1000) };
  }
  
  record.count++;
  return { allowed: true };
}

function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         req.headers.get('cf-connecting-ip') ||
         'unknown';
}

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIp = getClientIp(req);
  const userAgent = req.headers.get('user-agent') || 'unknown';

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // IP rate limiting
    const ipCheck = checkIpRateLimit(clientIp);
    if (!ipCheck.allowed) {
      console.log(`IP rate limited: ${clientIp}`);
      
      await supabase.from('security_audit_logs').insert({
        action: 'otp_send_ip_blocked',
        ip_address: clientIp,
        user_agent: userAgent,
        metadata: { reason: 'ip_rate_limit', wait_seconds: ipCheck.waitSeconds },
      });
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'تم تجاوز الحد المسموح للطلبات. يرجى المحاولة لاحقاً',
          waitSeconds: ipCheck.waitSeconds,
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { phone }: SendOTPRequest = await req.json();

    // Format phone number
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '964' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('964')) {
      formattedPhone = '964' + formattedPhone;
    }

    console.log('Processing OTP request for phone:', formattedPhone, 'from IP:', clientIp);

    // Phone-based rate limit check
    const { data: rateLimitCheck, error: rateLimitError } = await supabase
      .rpc('check_otp_rate_limit', { p_phone: formattedPhone });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
      throw new Error('خطأ في التحقق من معدل الإرسال');
    }

    const rateLimit = rateLimitCheck?.[0];
    if (rateLimit && !rateLimit.can_send) {
      await supabase.from('security_audit_logs').insert({
        action: 'otp_send_phone_blocked',
        ip_address: clientIp,
        user_agent: userAgent,
        metadata: { phone: formattedPhone, reason: 'phone_rate_limit', wait_seconds: rateLimit.wait_seconds },
      });
      
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

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete old OTPs for this phone
    await supabase
      .from('phone_otps')
      .delete()
      .eq('phone', formattedPhone);

    // Store new OTP
    const { error: insertError } = await supabase
      .from('phone_otps')
      .insert({
        phone: formattedPhone,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Failed to store OTP:', insertError);
      throw new Error('فشل في حفظ رمز التحقق');
    }

    // Send SMS via Twilio
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumberRaw = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumberRaw) {
      console.error('Twilio credentials not configured');
      throw new Error('خدمة الرسائل غير متوفرة حالياً');
    }

    // Normalize to E.164
    const toE164 = `+${formattedPhone}`;
    const fromE164 = twilioPhoneNumberRaw.startsWith('+') ? twilioPhoneNumberRaw : `+${twilioPhoneNumberRaw}`;

    if (toE164 === fromE164) {
      console.error('Twilio misconfiguration: TO and FROM are identical', { toE164, fromE164 });
      throw new Error('إعدادات الرسائل غير صحيحة حالياً. يرجى تغيير رقم الإرسال (TWILIO_PHONE_NUMBER)');
    }

    const message = `رمز التحقق الخاص بك هو: ${otpCode}\nصالح لمدة 5 دقائق`;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: toE164,
        From: fromE164,
        Body: message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Twilio error:', errorData);
      
      // Delete the stored OTP since SMS failed
      await supabase
        .from('phone_otps')
        .delete()
        .eq('phone', formattedPhone);
      
      throw new Error('فشل في إرسال الرسالة النصية');
    }

    const result = await response.json();

    // Log SMS
    await supabase.from('sms_logs').insert({
      recipient_phone: formattedPhone,
      message: message,
      status: 'sent',
      provider: 'twilio',
      provider_message_id: result.sid,
      sent_at: new Date().toISOString(),
    });

    // Record OTP sent
    await supabase.rpc('record_otp_sent', { p_phone: formattedPhone });

    // Log success
    await supabase.from('security_audit_logs').insert({
      action: 'otp_send_success',
      ip_address: clientIp,
      user_agent: userAgent,
      metadata: { phone: formattedPhone, provider: 'twilio' },
    });

    console.log('OTP sent successfully via Twilio');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم إرسال رمز التحقق',
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
