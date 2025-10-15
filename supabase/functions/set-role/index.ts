// ✅ Edge Function لتعيين الأدوار للمستخدمين
// محدثة مع:
// - دعم Deno 0.190.0
// - تحقق من صلاحيات المدير من جدول user_roles
// - تحديث الأدوار في الجدول الصحيح user_roles
// - إضافة CORS headers
// - معالجة حالة الدور المكرر مسبقاً

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// إعداد CORS Headers لتفادي مشاكل الاستدعاء من المتصفح
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // تهيئة عميل Supabase باستخدام المفتاح السري (Service Role)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // قراءة البيانات المرسلة من الطلب
    const { user_id, new_role } = await req.json();

    if (!user_id || !new_role) {
      return new Response(JSON.stringify({ error: "user_id و new_role مطلوبة" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // التحقق من المستخدم الذي يقوم بالطلب
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    const { data: authUser, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser?.user) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const currentUserId = authUser.user.id;

    // التحقق من أن المستخدم الحالي مدير
    const { data: roleCheck, error: roleErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUserId)
      .single();

    if (roleErr || !roleCheck || roleCheck.role !== "admin") {
      return new Response(JSON.stringify({ error: "صلاحية مرفوضة، المدير فقط يمكنه تعيين الأدوار" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // التحقق إن كان للمستخدم نفس الدور مسبقًا
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user_id)
      .maybeSingle();

    if (existingRole && existingRole.role === new_role) {
      return new Response(
        JSON.stringify({ message: "الدور موجود مسبقًا، لم يتم أي تغيير" }),
        { status: 200, headers: corsHeaders }
      );
    }

    // إذا كان الدور موجود مسبقًا لكن مختلف، نقوم بالتحديث
    if (existingRole) {
      const { error: updateErr } = await supabase
        .from("user_roles")
        .update({ role: new_role })
        .eq("user_id", user_id);

      if (updateErr) throw updateErr;
    } else {
      // إذا لم يكن للمستخدم دور، نقوم بإضافته
      const { error: insertErr } = await supabase
        .from("user_roles")
        .insert([{ user_id, role: new_role }]);

      if (insertErr) throw insertErr;
    }

    return new Response(
      JSON.stringify({ success: true, message: `تم تعيين الدور (${new_role}) بنجاح للمستخدم ${user_id}` }),
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    console.error("❌ خطأ:", err);
    const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير معروف';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: corsHeaders }
    );
  }
});
