import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  action: 'list_users' | 'assign_role' | 'remove_role';
  userId?: string;
  role?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('لم يتم تقديم رمز المصادقة');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the user from the auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('فشل التحقق من المستخدم');
    }

    // Check if user is admin - using service role to bypass RLS
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    console.log('User ID:', user.id);
    console.log('Roles found:', roles);
    console.log('Roles error:', rolesError);

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      throw new Error('فشل في التحقق من الصلاحيات');
    }

    const isAdmin = roles?.some(r => r.role === 'admin');
    console.log('Is Admin:', isAdmin);

    if (!isAdmin) {
      throw new Error('ليس لديك صلاحية الوصول - يجب أن تكون مديراً');
    }

    const body: RequestBody = await req.json();
    const { action, userId, role } = body;

    if (action === 'list_users') {
      // List all users with their profiles and roles
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        throw authError;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*');

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('*');

      const usersWithData = authUsers.users.map(authUser => {
        const profile = profiles?.find(p => p.id === authUser.id);
        return {
          id: authUser.id,
          email: authUser.email || '',
          full_name: profile?.full_name || 'غير محدد',
          created_at: authUser.created_at,
          roles: userRoles?.filter(r => r.user_id === authUser.id).map(r => r.role) || []
        };
      });

      return new Response(
        JSON.stringify({ users: usersWithData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'assign_role' && userId && role) {
      // Validate role
      const validRoles = ['admin', 'accountant', 'technician', 'client'];
      if (!validRoles.includes(role)) {
        throw new Error('دور غير صالح');
      }

      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) {
        if (error.code === '23505') { // Unique violation - role already exists
          // Return success since the desired state is already achieved
          return new Response(
            JSON.stringify({ success: true, message: 'الدور موجود بالفعل' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw error;
      }

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'ASSIGN_ROLE',
          table_name: 'user_roles',
          record_id: userId,
          new_data: { role }
        });

      return new Response(
        JSON.stringify({ success: true, message: 'تم تعيين الدور بنجاح' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'remove_role' && userId && role) {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'REMOVE_ROLE',
          table_name: 'user_roles',
          record_id: userId,
          old_data: { role }
        });

      return new Response(
        JSON.stringify({ success: true, message: 'تم إزالة الدور بنجاح' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('إجراء غير صالح');

  } catch (error) {
    console.error('Error in manage-user-roles:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
