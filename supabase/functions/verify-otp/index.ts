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

    // Format phone
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

    // Get stored OTP from phone_otps table
    const { data: otpRecord, error: otpError } = await supabase
      .from('phone_otps')
      .select('*')
      .eq('phone', formattedPhone)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError) {
      console.error('OTP lookup error:', otpError);
      throw new Error('خطأ في التحقق من الرمز');
    }

    if (!otpRecord) {
      // Record failed attempt
      await supabase.rpc('record_failed_verification', { p_phone: formattedPhone });
      
      await supabase.from('security_audit_logs').insert({
        action: 'otp_verify_failed',
        ip_address: clientIp,
        user_agent: userAgent,
        metadata: { phone: formattedPhone, reason: 'otp_not_found_or_expired' },
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'الرمز غير صالح أو منتهي الصلاحية',
          attemptsLeft: attempts?.attempts_left || 4,
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify OTP
    if (otpRecord.otp_code !== otp) {
      // Record failed attempt
      await supabase.rpc('record_failed_verification', { p_phone: formattedPhone });
      
      await supabase.from('security_audit_logs').insert({
        action: 'otp_verify_failed',
        ip_address: clientIp,
        user_agent: userAgent,
        metadata: { phone: formattedPhone, reason: 'wrong_otp' },
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'الرمز غير صحيح',
          attemptsLeft: (attempts?.attempts_left || 5) - 1,
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // OTP is correct - mark as verified
    await supabase
      .from('phone_otps')
      .update({ verified: true })
      .eq('id', otpRecord.id);

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
    let session = null;

    if (existingProfile) {
      userId = existingProfile.id;
      
      // Generate sign-in link for existing user
      const { data: signInData, error: signInError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: `${formattedPhone}@phone.local`,
      });
      
      if (!signInError && signInData) {
        // Get the session by signing in
        const { data: sessionData } = await supabase.auth.admin.getUserById(userId);
        if (sessionData?.user) {
          // Create a session for the user
          const { data: tokenData } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: sessionData.user.email || `${formattedPhone}@phone.local`,
          });
          session = tokenData;
        }
      }
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
      metadata: { phone: formattedPhone, is_new_user: isNewUser },
    });

    console.log('OTP verified successfully for:', formattedPhone, 'userId:', userId);

    // Clean up old OTPs
    await supabase.rpc('cleanup_expired_otps');

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
