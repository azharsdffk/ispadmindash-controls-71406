import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT = {
  maxAttempts: 5,
  windowMinutes: 15,
  blockDurationMinutes: 60,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email address');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get client IP for rate limiting
    const ip_address = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const identifier = `${email}:${ip_address}`;

    // Check rate limiting
    const { data: rateLimit } = await supabase
      .from('rate_limit_attempts')
      .select('*')
      .eq('identifier', identifier)
      .eq('attempt_type', 'password_reset')
      .single();

    if (rateLimit) {
      // Check if blocked
      if (rateLimit.blocked_until && new Date(rateLimit.blocked_until) > new Date()) {
        throw new Error('Too many attempts. Please try again later.');
      }

      // Check rate limit window
      const windowStart = new Date(Date.now() - RATE_LIMIT.windowMinutes * 60 * 1000);
      if (new Date(rateLimit.first_attempt_at) > windowStart) {
        if (rateLimit.attempts >= RATE_LIMIT.maxAttempts) {
          // Block the identifier
          const blocked_until = new Date(Date.now() + RATE_LIMIT.blockDurationMinutes * 60 * 1000);
          await supabase
            .from('rate_limit_attempts')
            .update({ blocked_until, attempts: rateLimit.attempts + 1, last_attempt_at: new Date() })
            .eq('id', rateLimit.id);
          
          throw new Error('Too many attempts. Account locked for 1 hour.');
        }

        // Increment attempts
        await supabase
          .from('rate_limit_attempts')
          .update({ attempts: rateLimit.attempts + 1, last_attempt_at: new Date() })
          .eq('id', rateLimit.id);
      } else {
        // Reset window
        await supabase
          .from('rate_limit_attempts')
          .update({ 
            attempts: 1, 
            first_attempt_at: new Date(), 
            last_attempt_at: new Date(),
            blocked_until: null 
          })
          .eq('id', rateLimit.id);
      }
    } else {
      // Create new rate limit record
      await supabase
        .from('rate_limit_attempts')
        .insert({ identifier, attempt_type: 'password_reset', attempts: 1 });
    }

    // Generate reset token
    const token = crypto.randomUUID();
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const token_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Find user
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    const user = users?.find(u => u.email === email);

    if (!user) {
      // Don't reveal if user exists - always return success
      return new Response(
        JSON.stringify({ message: 'If an account exists, a reset link will be sent.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store token hash
    await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token_hash,
        expires_at,
      });

    // Send reset email via Supabase Auth
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${req.headers.get('origin')}/reset-password?token=${token}`,
    });

    if (resetError) {
      console.error('Error sending reset email:', resetError);
    }

    return new Response(
      JSON.stringify({ message: 'If an account exists, a reset link will be sent.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in password-reset-request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
