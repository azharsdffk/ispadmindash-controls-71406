import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getCorsHeaders } from "../_shared/cors.ts";

interface VerifyOTPRequest {
  phone: string;
  otp: string;
}

// IP-based rate limiting
const ipRateLimits = new Map<string, { count: number; firstAttempt: number; blockedUntil?: number }>();
const IP_RATE_LIMIT = 20;
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
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'تم تجاوز الحد المسموح للطلبات',
          waitSeconds: ipCheck.waitSeconds,
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { phone, otp }: VerifyOTPRequest = await req.json();

    // Format phone for Iraq
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '964' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('964')) {
      formattedPhone = '964' + formattedPhone;
    }

    console.log('Verifying OTP for phone:', formattedPhone);

    // Check verification attempts
    const { data: attemptsCheck, error: attemptsError } = await supabase
      .rpc('check_verification_attempts', { p_phone: formattedPhone });

    if (attemptsError) {
      console.error('Attempts check error:', attemptsError);
    }

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

    // Use Twilio Verify API to check the OTP
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const serviceSid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

    if (!accountSid || !authToken || !serviceSid) {
      console.error('Twilio Verify credentials not configured');
      throw new Error('خدمة التحقق غير متوفرة حالياً');
    }

    const toE164 = `+${formattedPhone}`;
    const twilioUrl = `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`;

    console.log('Checking OTP via Twilio Verify for:', toE164);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: toE164,
        Code: otp,
      }),
    });

    const result = await response.json();

    if (!response.ok || result.status !== 'approved') {
      console.error('Twilio Verify check failed:', result);
      
      // Record failed attempt
      await supabase.rpc('record_failed_verification', { p_phone: formattedPhone });
      
      await supabase.from('security_audit_logs').insert({
        action: 'otp_verify_failed',
        ip_address: clientIp,
        user_agent: userAgent,
        metadata: { phone: formattedPhone, reason: result.status || 'invalid_code', twilio_status: result.status },
      });

      let errorMessage = 'الرمز غير صحيح';
      if (result.status === 'pending') {
        errorMessage = 'الرمز غير صحيح. يرجى المحاولة مرة أخرى';
      } else if (result.status === 'expired') {
        errorMessage = 'انتهت صلاحية الرمز. يرجى طلب رمز جديد';
      } else if (result.status === 'max_attempts_reached') {
        errorMessage = 'تم تجاوز عدد المحاولات المسموحة. يرجى طلب رمز جديد';
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          attemptsLeft: (attempts?.attempts_left || 5) - 1,
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('OTP verified successfully via Twilio Verify');

    // Clear verification attempts
    await supabase.rpc('clear_verification_attempts', { p_phone: formattedPhone });

    // Check if user exists with this phone
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', formattedPhone)
      .maybeSingle();

    let userId: string;
    let isNewUser = false;

    if (existingProfile) {
      userId = existingProfile.id;
    } else {
      // Create new user
      const tempEmail = `${formattedPhone}@phone.local`;
      const tempPassword = crypto.randomUUID();
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: tempEmail,
        password: tempPassword,
        email_confirm: true,
        phone: `+${formattedPhone}`,
        phone_confirm: true,
        user_metadata: {
          phone: formattedPhone,
          full_name: 'مستخدم جديد',
        },
      });

      if (createError) {
        console.error('Failed to create user:', createError);
        throw new Error('فشل في إنشاء الحساب');
      }

      userId = newUser.user.id;
      isNewUser = true;

      // Update profile with phone
      await supabase
        .from('profiles')
        .update({ phone: formattedPhone })
        .eq('id', userId);
    }

    // Create custom session in sessions table
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await supabase.from('sessions').insert({
      user_id: userId,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
      ip_address: clientIp,
      user_agent: userAgent,
      device_name: 'Phone Auth',
    });

    // Log success
    await supabase.from('security_audit_logs').insert({
      action: 'otp_verify_success',
      user_id: userId,
      ip_address: clientIp,
      user_agent: userAgent,
      metadata: { phone: formattedPhone, is_new_user: isNewUser, provider: 'twilio_verify' },
    });

    console.log('OTP verified successfully for:', formattedPhone, 'userId:', userId);

    return new Response(
      JSON.stringify({
        success: true,
        isNewUser,
        userId,
        sessionToken,
        message: isNewUser ? 'تم إنشاء حسابك بنجاح' : 'تم تسجيل الدخول بنجاح',
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
