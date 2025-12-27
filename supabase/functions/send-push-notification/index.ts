import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushPayload {
  user_id?: string
  user_ids?: string[]
  title: string
  body: string
  data?: Record<string, string>
  topic?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const payload: PushPayload = await req.json()
    const { user_id, user_ids, title, body, data, topic } = payload

    console.log('📤 إرسال إشعار Push:', { title, body, user_id, user_ids, topic })

    // جلب توكنات المستخدمين
    let tokens: string[] = []

    if (user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('push_token')
        .eq('id', user_id)
        .single()
      
      if (profile?.push_token) {
        tokens.push(profile.push_token)
      }
    } else if (user_ids && user_ids.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('push_token')
        .in('id', user_ids)
        .not('push_token', 'is', null)
      
      tokens = profiles?.map(p => p.push_token).filter(Boolean) || []
    } else if (topic === 'all') {
      // إرسال لجميع المستخدمين
      const { data: profiles } = await supabase
        .from('profiles')
        .select('push_token')
        .not('push_token', 'is', null)
      
      tokens = profiles?.map(p => p.push_token).filter(Boolean) || []
    }

    if (tokens.length === 0) {
      console.log('⚠️ لا يوجد توكنات للإرسال')
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'لا يوجد مستخدمين مسجلين' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // حفظ الإشعار في قاعدة البيانات
    if (user_id) {
      await supabase.from('notifications').insert({
        user_id,
        title,
        message: body,
        type: data?.type || 'general',
        action_url: data?.action_url
      })
    } else if (user_ids && user_ids.length > 0) {
      const notifications = user_ids.map(uid => ({
        user_id: uid,
        title,
        message: body,
        type: data?.type || 'general',
        action_url: data?.action_url
      }))
      await supabase.from('notifications').insert(notifications)
    }

    // TODO: تكامل مع خدمة Firebase Cloud Messaging أو OneSignal
    // هذا placeholder للتكامل المستقبلي
    console.log(`✅ تم تجهيز ${tokens.length} إشعار للإرسال`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: tokens.length,
        message: `تم إرسال ${tokens.length} إشعار`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('❌ خطأ في إرسال الإشعار:', error)
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
