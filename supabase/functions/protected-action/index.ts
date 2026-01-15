import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProtectedActionRequest {
  action: string;
  resource_type: string;
  resource_id?: string;
  required_permission: string | string[];
  data?: any;
  expected_version?: number;
}

// دالة للتحقق من الصلاحيات
async function checkPermission(
  supabaseClient: any,
  userId: string,
  requiredPermissions: string[],
  requireAll: boolean = false
): Promise<{ hasPermission: boolean; roles: string[]; userPermissions: string[] }> {
  // جلب أدوار المستخدم
  const { data: userRoles } = await supabaseClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  const roles = userRoles?.map((r: any) => r.role) || [];

  // المدراء العامين لديهم كل الصلاحيات
  if (roles.includes("super_admin") || roles.includes("admin")) {
    return { hasPermission: true, roles, userPermissions: ["*"] };
  }

  // جلب صلاحيات الأدوار
  const { data: rolePermissions } = await supabaseClient
    .from("role_permissions")
    .select(`
      permission_id,
      permissions!inner (name)
    `)
    .in("role", roles);

  const userPermissions = rolePermissions?.map((rp: any) => rp.permissions?.name).filter(Boolean) || [];

  let hasPermission: boolean;
  if (requireAll) {
    hasPermission = requiredPermissions.every(p => userPermissions.includes(p));
  } else {
    hasPermission = requiredPermissions.some(p => userPermissions.includes(p));
  }

  return { hasPermission, roles, userPermissions };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // التحقق من المستخدم
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "غير مصرح - يرجى تسجيل الدخول" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "جلسة غير صالحة" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { 
      action, 
      resource_type, 
      resource_id, 
      required_permission, 
      data,
      expected_version 
    }: ProtectedActionRequest = await req.json();

    const permissions = Array.isArray(required_permission) ? required_permission : [required_permission];

    // التحقق من الصلاحيات
    const { hasPermission, roles, userPermissions } = await checkPermission(
      supabaseClient,
      user.id,
      permissions,
      false
    );

    if (!hasPermission) {
      // تسجيل محاولة الوصول غير المصرح
      await supabaseClient.from("sensitive_operations_log").insert({
        user_id: user.id,
        action: `unauthorized_${action}`,
        resource_type,
        resource_id: resource_id || null,
        new_data: { 
          attempted_action: action,
          required_permissions: permissions,
          user_permissions: userPermissions,
          denied: true
        }
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "ليس لديك صلاحية تنفيذ هذا الإجراء",
          code: "PERMISSION_DENIED"
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // التحقق من الإصدار (Optimistic Locking)
    if (expected_version !== undefined && resource_id) {
      const { data: versionCheck } = await supabaseClient
        .rpc("check_version", {
          p_table_name: resource_type,
          p_record_id: resource_id,
          p_expected_version: expected_version
        });

      if (!versionCheck) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "تم تعديل هذا السجل من قبل مستخدم آخر. يرجى تحديث الصفحة والمحاولة مرة أخرى.",
            code: "VERSION_CONFLICT"
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // تسجيل العملية
    await supabaseClient.from("sensitive_operations_log").insert({
      user_id: user.id,
      action,
      resource_type,
      resource_id: resource_id || null,
      new_data: { 
        action_data: data,
        roles,
        permissions_used: permissions
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "تم التحقق من الصلاحيات بنجاح",
        userId: user.id,
        roles,
        userPermissions
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in protected-action:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});