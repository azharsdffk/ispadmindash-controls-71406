import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Use environment variable for CORS origin, no wildcard fallback
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

// IP-based rate limiting with in-memory store (resets on function cold start)
const ipRateLimits = new Map<string, { count: number; firstAttempt: number; blockedUntil?: number }>();
const IP_RATE_LIMIT = 10; // max requests per window
const IP_RATE_WINDOW = 60 * 1000; // 1 minute window
const IP_BLOCK_DURATION = 15 * 60 * 1000; // 15 minute block

function checkIpRateLimit(ip: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const record = ipRateLimits.get(ip);
  
  if (!record) {
    ipRateLimits.set(ip, { count: 1, firstAttempt: now });
    return { allowed: true };
  }
  
  // Check if blocked
  if (record.blockedUntil && now < record.blockedUntil) {
    return { allowed: false, waitSeconds: Math.ceil((record.blockedUntil - now) / 1000) };
  }
  
  // Reset window if expired
  if (now - record.firstAttempt > IP_RATE_WINDOW) {
    ipRateLimits.set(ip, { count: 1, firstAttempt: now });
    return { allowed: true };
  }
  
  // Check limit
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

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIp = getClientIp(req);
  const userAgent = req.headers.get('user-agent') || 'unknown';

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // IP-based rate limiting check
    const ipCheck = checkIpRateLimit(clientIp);
    if (!ipCheck.allowed) {
      console.log(`IP rate limited: ${clientIp}`);
      
      // Log blocked attempt to security audit
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

    // تنسيق رقم الهاتف (9647xxxxxxxx)
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '964' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('964')) {
      formattedPhone = '964' + formattedPhone;
    }

    console.log('Processing OTP request for phone:', formattedPhone, 'from IP:', clientIp);

    // التحقق من rate limit (phone-based)
    const { data: rateLimitCheck, error: rateLimitError } = await supabase
      .rpc('check_otp_rate_limit', { p_phone: formattedPhone });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
      throw new Error('خطأ في التحقق من معدل الإرسال');
    }

    const rateLimit = rateLimitCheck?.[0];
    if (rateLimit && !rateLimit.can_send) {
      // Log phone rate limit hit
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

    // Log OTP send attempt
    await supabase.from('security_audit_logs').insert({
      action: 'otp_send_attempt',
      ip_address: clientIp,
      user_agent: userAgent,
      metadata: { phone: formattedPhone },
    });

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
        // Log failed OTP send
        await supabase.from('security_audit_logs').insert({
          action: 'otp_send_failed',
          ip_address: clientIp,
          user_agent: userAgent,
          metadata: { phone: formattedPhone, error: error.message },
        });
        
        throw new Error(error.message);
      }
      
      // تسجيل الإرسال
      await supabase.rpc('record_otp_sent', { p_phone: formattedPhone });
      
      // Log successful OTP send
      await supabase.from('security_audit_logs').insert({
        action: 'otp_send_success',
        ip_address: clientIp,
        user_agent: userAgent,
        metadata: { phone: formattedPhone, provider: 'local' },
      });
      
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

    // Log successful OTP send
    await supabase.from('security_audit_logs').insert({
      action: 'otp_send_success',
      ip_address: clientIp,
      user_agent: userAgent,
      metadata: { phone: formattedPhone, provider: 'twilio' },
    });

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
