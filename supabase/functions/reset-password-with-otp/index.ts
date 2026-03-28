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
  
  const isAllowed = allowedOrigins.some(allowed => origin === allowed || origin.endsWith('.lovableproject.com') || origin.endsWith('.lovable.app'));
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

interface ResetPasswordRequest {
  phone: string;
  otp: string;
  newPassword: string;
}

// IP-based rate limiting
const ipRateLimits = new Map<string, { count: number; firstAttempt: number; blockedUntil?: number }>();
const IP_RATE_LIMIT = 10;
const IP_RATE_WINDOW = 60 * 1000;
const IP_BLOCK_DURATION = 30 * 60 * 1000;

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

// Password validation
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل' };
  }
  return { valid: true };
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
        action: 'password_reset_ip_blocked',
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

    const { phone, otp, newPassword }: ResetPasswordRequest = await req.json();

    // Validate inputs
    if (!phone || !otp || !newPassword) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'جميع الحقول مطلوبة',
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: passwordValidation.error,
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Format phone
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '964' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('964')) {
      formattedPhone = '964' + formattedPhone;
    }

    console.log('Password reset attempt for phone:', formattedPhone);

    // Check verification attempts
    const { data: attemptsCheck } = await supabase
      .rpc('check_verification_attempts', { p_phone: formattedPhone });

    const attempts = attemptsCheck?.[0];
    if (attempts && !attempts.can_verify) {
      return new Response(
        JSON.stringify({
          success: false,
          error: attempts.message,
          attemptsLeft: 0,
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify OTP using secure database function (never exposes raw OTP)
    const { data: verifyResult, error: verifyError } = await supabase
      .rpc('verify_phone_otp', { p_phone: formattedPhone, p_code: otp });

    if (verifyError) {
      console.error('OTP verify error:', verifyError);
      throw new Error('خطأ في التحقق من الرمز');
    }

    const otpCheck = verifyResult?.[0];

    if (!otpCheck || !otpCheck.is_valid) {
      await supabase.rpc('record_failed_verification', { p_phone: formattedPhone });
      
      await supabase.from('security_audit_logs').insert({
        action: 'password_reset_otp_failed',
        ip_address: clientIp,
        user_agent: userAgent,
        metadata: { phone: formattedPhone, reason: otpCheck?.error_message || 'otp_invalid' },
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: otpCheck?.error_message || 'الرمز غير صالح أو منتهي الصلاحية',
          attemptsLeft: (attempts?.attempts_left || 5) - 1,
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // OTP verified successfully by the secure function

    // Clear verification attempts
    await supabase.rpc('clear_verification_attempts', { p_phone: formattedPhone });

    // Find user by phone number
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', formattedPhone)
      .maybeSingle();

    if (!existingProfile) {
      await supabase.from('security_audit_logs').insert({
        action: 'password_reset_user_not_found',
        ip_address: clientIp,
        user_agent: userAgent,
        metadata: { phone: formattedPhone },
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'لم يتم العثور على حساب مرتبط بهذا الرقم',
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = existingProfile.id;

    // Update user password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      
      await supabase.from('security_audit_logs').insert({
        action: 'password_reset_failed',
        user_id: userId,
        ip_address: clientIp,
        user_agent: userAgent,
        metadata: { phone: formattedPhone, error: updateError.message },
      });

      throw new Error('فشل في تحديث كلمة المرور');
    }

    // Revoke all existing sessions for security
    await supabase
      .from('sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('revoked_at', null);

    // Log success
    await supabase.from('security_audit_logs').insert({
      action: 'password_reset_success',
      user_id: userId,
      ip_address: clientIp,
      user_agent: userAgent,
      metadata: { phone: formattedPhone, method: 'phone_otp' },
    });

    console.log('Password reset successful for userId:', userId);

    // Clean up old OTPs
    await supabase.rpc('cleanup_expired_otps');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: unknown) {
    console.error('Error in reset-password-with-otp:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء إعادة تعيين كلمة المرور';
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
