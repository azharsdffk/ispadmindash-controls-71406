import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, code } = await req.json();

    console.log('[verify-otp] Start verification for phone:', phone);

    // Validate input
    if (!phone || !code) {
      console.log('[verify-otp] Missing phone or code');
      return new Response(
        JSON.stringify({ success: false, error: 'رقم الهاتف ورمز التحقق مطلوبان' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone to E.164
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

    console.log('[verify-otp] Formatted phone:', formattedPhone, '| Code length:', code.length);

    // Get Twilio credentials
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const serviceSid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

    if (!accountSid || !authToken || !serviceSid) {
      console.error('[verify-otp] Twilio credentials missing');
      return new Response(
        JSON.stringify({ success: false, error: 'خدمة التحقق غير متوفرة حالياً' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Twilio Verify VerificationCheck
    const twilioUrl = `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`;

    console.log('[verify-otp] Calling Twilio VerificationCheck...');

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: formattedPhone,
        Code: code,
      }),
    });

    const result = await twilioResponse.json();
    console.log('[verify-otp] Twilio response status:', twilioResponse.status, '| Verification status:', result.status);

    // Handle non-approved results
    if (!twilioResponse.ok || result.status !== 'approved') {
      let errorMessage = 'الرمز غير صحيح';
      if (result.status === 'pending') {
        errorMessage = 'الرمز غير صحيح. يرجى المحاولة مرة أخرى';
      } else if (result.status === 'expired') {
        errorMessage = 'انتهت صلاحية الرمز. يرجى طلب رمز جديد';
      } else if (result.status === 'max_attempts_reached') {
        errorMessage = 'تم تجاوز عدد المحاولات المسموحة. يرجى طلب رمز جديد';
      } else if (result.code === 20404) {
        errorMessage = 'لم يتم العثور على طلب تحقق. يرجى إعادة إرسال الرمز';
      }

      console.log('[verify-otp] Verification failed:', result.status || result.code);

      return new Response(
        JSON.stringify({ success: false, error: errorMessage, status: result.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ Verification approved
    console.log('[verify-otp] ✅ OTP verified successfully for:', formattedPhone);

    // Connect to Supabase to find/create user
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Strip + for DB storage
    const phoneDigits = formattedPhone.replace('+', '');

    // Check if user exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phoneDigits)
      .maybeSingle();

    let userId: string;
    let isNewUser = false;

    if (existingProfile) {
      userId = existingProfile.id;
      console.log('[verify-otp] Existing user found:', userId);
    } else {
      // Create new user
      const tempEmail = `${phoneDigits}@phone.local`;
      const tempPassword = crypto.randomUUID();

      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: tempEmail,
        password: tempPassword,
        email_confirm: true,
        phone: formattedPhone,
        phone_confirm: true,
        user_metadata: {
          phone: phoneDigits,
          full_name: 'مستخدم جديد',
        },
      });

      if (createError) {
        console.error('[verify-otp] Failed to create user:', createError);
        return new Response(
          JSON.stringify({ success: false, error: 'فشل في إنشاء الحساب' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = newUser.user.id;
      isNewUser = true;
      console.log('[verify-otp] New user created:', userId);

      // Update profile with phone
      await supabase
        .from('profiles')
        .update({ phone: phoneDigits })
        .eq('id', userId);
    }

    // Create session token
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    await supabase.from('sessions').insert({
      user_id: userId,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
      ip_address: clientIp,
      user_agent: userAgent,
      device_name: 'Phone Auth',
    });

    console.log('[verify-otp] Session created for user:', userId);

    return new Response(
      JSON.stringify({
        success: true,
        isNewUser,
        userId,
        sessionToken,
        message: isNewUser ? 'تم إنشاء حسابك بنجاح' : 'تم تسجيل الدخول بنجاح',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[verify-otp] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء التحقق';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
