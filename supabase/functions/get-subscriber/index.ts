import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Secure CORS configuration - use environment variable or default to project URL
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const ALLOWED_ORIGINS = [
  'https://lovable.dev',
  'https://*.lovable.dev',
  'https://*.lovableproject.com',
  SUPABASE_URL.replace('supabase.co', 'lovableproject.com'),
].filter(Boolean);

const getCorsHeaders = (origin: string | null) => {
  // Check if origin is allowed
  const isAllowed = origin && ALLOWED_ORIGINS.some(allowed => {
    if (allowed.includes('*')) {
      const pattern = new RegExp('^' + allowed.replace(/\*/g, '.*') + '$');
      return pattern.test(origin);
    }
    return allowed === origin;
  });
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0] || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
};

/**
 * Sanitize search input for ILIKE queries to prevent pattern injection
 * Escapes special ILIKE characters: %, _, \
 */
const sanitizeSearchInput = (input: string): string => {
  if (!input) return '';
  
  // Limit input length to prevent DoS
  const maxLength = 100;
  let sanitized = input.substring(0, maxLength);
  
  // Escape ILIKE special characters
  sanitized = sanitized.replace(/\\/g, '\\\\'); // Escape backslashes first
  sanitized = sanitized.replace(/%/g, '\\%');   // Escape percent
  sanitized = sanitized.replace(/_/g, '\\_');   // Escape underscore
  
  // Remove any null bytes or other control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  return sanitized;
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'غير مصرح - يرجى تسجيل الدخول' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'جلسة غير صالحة' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const serviceId = url.searchParams.get('service_id');
    const phone = url.searchParams.get('phone');
    const id = url.searchParams.get('id');
    const search = url.searchParams.get('search');

    console.log('📡 Get Subscriber Request:', { serviceId, phone, id, search, userId: user.id });

    let query = supabaseClient.from('subscribers').select('*');

    // Search by specific field
    if (id) {
      query = query.eq('id', id);
    } else if (serviceId) {
      // Search by username (service_id)
      query = query.eq('username', serviceId);
    } else if (phone) {
      // Search by phone
      query = query.eq('phone', phone);
    } else if (search) {
      // General search - search in name, phone, username, address
      // Sanitize input to prevent ILIKE pattern injection
      const sanitizedSearch = sanitizeSearchInput(search);
      query = query.or(`name.ilike.%${sanitizedSearch}%,phone.ilike.%${sanitizedSearch}%,username.ilike.%${sanitizedSearch}%,address.ilike.%${sanitizedSearch}%`);
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'يرجى توفير معيار بحث: service_id, phone, id, أو search' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: subscribers, error: dbError } = await query;

    if (dbError) {
      console.error('❌ Database error:', dbError);
      return new Response(
        JSON.stringify({ success: false, error: 'خطأ في قاعدة البيانات' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log access for audit
    if (subscribers && subscribers.length > 0) {
      const subscriberIds = subscribers.map((s: any) => s.id);
      for (const subId of subscriberIds) {
        try {
          await supabaseClient.from('pii_access_logs').insert({
            user_id: user.id,
            subscriber_id: subId,
            access_type: 'api_search',
            accessed_fields: ['name', 'phone', 'address', 'username', 'balance', 'plan'],
          });
        } catch (auditErr) {
          console.log('Audit log error:', auditErr);
        }
      }
    }

    // If searching by specific ID/serviceId/phone, return single result
    if (id || serviceId || phone) {
      if (!subscribers || subscribers.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'لم يتم العثور على المشترك',
            subscriber: null 
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Found subscriber:', subscribers[0].name);
      return new Response(
        JSON.stringify({ 
          success: true, 
          subscriber: subscribers[0],
          message: 'تم جلب بيانات المشترك بنجاح'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // General search - return array
    console.log(`✅ Found ${subscribers?.length || 0} subscribers`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        subscribers: subscribers || [],
        count: subscribers?.length || 0,
        message: `تم العثور على ${subscribers?.length || 0} مشترك`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'حدث خطأ غير متوقع' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
