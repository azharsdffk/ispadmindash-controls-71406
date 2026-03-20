import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getCorsHeaders } from "../_shared/cors.ts";

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

    // Format phone number for Iraq
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

    // Use Twilio Verify API
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const serviceSid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

    if (!accountSid || !authToken || !serviceSid) {
      console.error('Twilio Verify credentials not configured');
      throw new Error('خدمة التحقق غير متوفرة حالياً. يرجى التواصل مع الدعم الفني');
    }

    // Call Twilio Verify API to send OTP
    const twilioUrl = `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`;
    const toE164 = `+${formattedPhone}`;

    console.log('Sending OTP via Twilio Verify to:', toE164);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: toE164,
        Channel: 'sms',
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Twilio Verify error:', result);
      
      // Handle specific Twilio errors
      let errorMessage = 'فشل في إرسال رمز التحقق';
      if (result.code === 60200) {
        errorMessage = 'رقم الهاتف غير صالح';
      } else if (result.code === 60203) {
        errorMessage = 'تم تجاوز الحد المسموح. يرجى المحاولة لاحقاً';
      } else if (result.code === 60212) {
        errorMessage = 'رقم الهاتف غير مدعوم في هذه المنطقة';
      } else if (result.code === 60223) {
        errorMessage = 'هذا الرقم غير قادر على استلام رسائل SMS';
      }

      await supabase.from('security_audit_logs').insert({
        action: 'otp_send_failed',
        ip_address: clientIp,
        user_agent: userAgent,
        metadata: { phone: formattedPhone, twilio_error: result.code, message: result.message },
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          code: result.code,
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Twilio Verify success:', result.status, result.sid);

    // Record OTP sent
    await supabase.rpc('record_otp_sent', { p_phone: formattedPhone });

    // Log SMS
    await supabase.from('sms_logs').insert({
      recipient_phone: formattedPhone,
      message: 'OTP sent via Twilio Verify',
      status: 'sent',
      provider: 'twilio_verify',
      provider_message_id: result.sid,
      sent_at: new Date().toISOString(),
    });

    // Log success
    await supabase.from('security_audit_logs').insert({
      action: 'otp_send_success',
      ip_address: clientIp,
      user_agent: userAgent,
      metadata: { phone: formattedPhone, provider: 'twilio_verify', sid: result.sid },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم إرسال رمز التحقق',
        status: result.status,
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
