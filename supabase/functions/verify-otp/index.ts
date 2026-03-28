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

    if (!phone || !code) {
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

      return new Response(
        JSON.stringify({ success: false, error: errorMessage, status: result.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ Verification approved
    console.log('[verify-otp] ✅ OTP verified successfully for:', formattedPhone);

    // Connect to Supabase with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const phoneDigits = formattedPhone.replace('+', '');
    const tempEmail = `${phoneDigits}@phone.local`;

    // Check if user exists by phone in profiles
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
      // Also check by email pattern (in case profile phone wasn't set)
      const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers();
      const existingByEmail = existingUsers?.find(u => u.email === tempEmail);

      if (existingByEmail) {
        userId = existingByEmail.id;
        console.log('[verify-otp] Existing user found by email:', userId);
        // Ensure profile phone is set
        await supabase.from('profiles').update({ phone: phoneDigits }).eq('id', userId);
      } else {
        // Create new user
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
        await supabase.from('profiles').update({ phone: phoneDigits }).eq('id', userId);

        // Assign default 'client' role (pending approval)
        await supabase.from('user_roles').upsert({
          user_id: userId,
          role: 'client',
          approved: false,
        }, { onConflict: 'user_id,role' });

        console.log('[verify-otp] Default client role assigned to new user');
      }
    }

    // Generate a magic link token for seamless frontend sign-in
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: tempEmail,
    });

    if (linkError || !linkData) {
      console.error('[verify-otp] Failed to generate magic link:', linkError);
      return new Response(
        JSON.stringify({ success: false, error: 'فشل في إنشاء الجلسة' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenHash = linkData.properties?.hashed_token;
    console.log('[verify-otp] Magic link token generated for user:', userId, '| hasToken:', !!tokenHash);

    // Log security event
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    try {
      await supabase.rpc('insert_user_security_log', {
        p_user_id: userId,
        p_ip_address: clientIp,
        p_user_agent: userAgent,
        p_login_method: 'phone_otp',
        p_login_status: 'success',
        p_event_type: 'login',
        p_metadata: { phone: formattedPhone, is_new_user: isNewUser },
      });
    } catch (logErr) {
      console.warn('[verify-otp] Security log failed (non-critical):', logErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        isNewUser,
        userId,
        email: tempEmail,
        tokenHash,
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
