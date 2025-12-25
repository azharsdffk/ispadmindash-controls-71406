import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyOTPRequest {
  phone: string;
  otp: string;
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

    const { phone, otp }: VerifyOTPRequest = await req.json();

    // تنسيق رقم الهاتف
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '964' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('964')) {
      formattedPhone = '964' + formattedPhone;
    }

    console.log('Verifying OTP for phone:', formattedPhone);

    // التحقق من محاولات الإدخال
    const { data: attemptCheck, error: attemptError } = await supabase
      .rpc('check_verification_attempts', { p_phone: formattedPhone });

    if (attemptError) {
      console.error('Attempt check error:', attemptError);
      throw new Error('خطأ في التحقق من المحاولات');
    }

    const attempt = attemptCheck?.[0];
    if (attempt && !attempt.can_verify) {
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
