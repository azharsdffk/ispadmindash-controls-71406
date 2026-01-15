import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckPermissionRequest {
  permission: string | string[];
  require_all?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
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
        JSON.stringify({ error: "Authorization header required", hasPermission: false }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token", hasPermission: false }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { permission, require_all = false }: CheckPermissionRequest = await req.json();
    const permissions = Array.isArray(permission) ? permission : [permission];

    // التحقق من أدوار المستخدم
    const { data: userRoles, error: rolesError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch roles", hasPermission: false }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const roles = userRoles?.map(r => r.role) || [];

    // المدراء العامين لديهم كل الصلاحيات
    if (roles.includes("super_admin") || roles.includes("admin")) {
      return new Response(
        JSON.stringify({ hasPermission: true, roles }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // جلب صلاحيات الأدوار
    const { data: rolePermissions, error: permError } = await supabaseClient
      .from("role_permissions")
      .select(`
        permission_id,
        permissions!inner (name)
      `)
      .in("role", roles);

    if (permError) {
      console.error("Error fetching permissions:", permError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch permissions", hasPermission: false }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPermissions = rolePermissions?.map((rp: any) => rp.permissions?.name).filter(Boolean) || [];

    // التحقق من الصلاحيات المطلوبة
    let hasPermission: boolean;
    if (require_all) {
      hasPermission = permissions.every(p => userPermissions.includes(p));
    } else {
      hasPermission = permissions.some(p => userPermissions.includes(p));
    }

    // تسجيل محاولة الوصول
    await supabaseClient.from("sensitive_operations_log").insert({
      user_id: user.id,
      action: "permission_check",
      resource_type: "permissions",
      new_data: { 
        requested_permissions: permissions, 
        require_all, 
        result: hasPermission,
        user_permissions: userPermissions
      }
    });

    return new Response(
      JSON.stringify({ 
        hasPermission, 
        roles,
        userPermissions,
        requestedPermissions: permissions
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in check-permission:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage, hasPermission: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});