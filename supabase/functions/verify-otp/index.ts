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

interface VerifyOTPRequest {
  phone: string;
  otp: string;
}

// IP-based rate limiting with in-memory store
const ipRateLimits = new Map<string, { count: number; firstAttempt: number; blockedUntil?: number }>();
const IP_RATE_LIMIT = 20; // max requests per window
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
      
      // Log blocked attempt
      await supabase.from('security_audit_logs').insert({
        action: 'otp_verify_ip_blocked',
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

    const { phone, otp }: VerifyOTPRequest = await req.json();

    // تنسيق رقم الهاتف
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '964' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('964')) {
      formattedPhone = '964' + formattedPhone;
    }

    console.log('Verifying OTP for phone:', formattedPhone, 'from IP:', clientIp);

    // التحقق من محاولات الإدخال (phone-based)
    const { data: attemptCheck, error: attemptError } = await supabase
      .rpc('check_verification_attempts', { p_phone: formattedPhone });

    if (attemptError) {
      console.error('Attempt check error:', attemptError);
      throw new Error('خطأ في التحقق من المحاولات');
    }

    const attempt = attemptCheck?.[0];
    if (attempt && !attempt.can_verify) {
      // Log phone rate limit hit
      await supabase.from('security_audit_logs').insert({
        action: 'otp_verify_phone_blocked',
        ip_address: clientIp,
        user_agent: userAgent,
        metadata: { phone: formattedPhone, reason: 'phone_rate_limit' },
      });
      
      return new Response(
        JSON.stringify({
          success: false,
          error: attempt.message,
          attemptsLeft: 0,
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Log verification attempt
    await supabase.from('security_audit_logs').insert({
      action: 'otp_verify_attempt',
      ip_address: clientIp,
      user_agent: userAgent,
      metadata: { phone: formattedPhone },
    });

    // التحقق من OTP عبر Supabase Auth
    const { data, error } = await supabase.auth.verifyOtp({
      phone: `+${formattedPhone}`,
      token: otp,
      type: 'sms',
    });

    if (error) {
      console.error('OTP verification error:', error);
      
      // تسجيل محاولة فاشلة
      await supabase.rpc('record_failed_verification', { p_phone: formattedPhone });
      
      // Log failed verification
      await supabase.from('security_audit_logs').insert({
        action: 'otp_verify_failed',
        ip_address: clientIp,
        user_agent: userAgent,
        metadata: { phone: formattedPhone, error: 'invalid_otp' },
      });
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'رمز التحقق غير صحيح',
          attemptsLeft: attempt ? attempt.attempts_left - 1 : 4,
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // مسح المحاولات بعد النجاح
    await supabase.rpc('clear_verification_attempts', { p_phone: formattedPhone });

    // التحقق مما إذا كان المستخدم جديد
    const isNewUser = !data.user?.created_at || 
      (new Date().getTime() - new Date(data.user.created_at).getTime()) < 60000;

    // إنشاء ملف شخصي للمستخدمين الجدد
    if (isNewUser && data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          full_name: 'مستخدم جديد',
          phone: formattedPhone,
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    // Log successful verification
    await supabase.from('security_audit_logs').insert({
      action: 'otp_verify_success',
      user_id: data.user?.id,
      ip_address: clientIp,
      user_agent: userAgent,
      metadata: { phone: formattedPhone, is_new_user: isNewUser },
    });

    console.log('OTP verified successfully, user:', data.user?.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم التحقق بنجاح',
        session: data.session,
        user: data.user,
        isNewUser,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: unknown) {
    console.error('Error in verify-otp:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء التحقق';
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
