import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '*';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,username.ilike.%${search}%,address.ilike.%${search}%`);
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
