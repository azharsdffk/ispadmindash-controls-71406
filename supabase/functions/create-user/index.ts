import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  roles: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the requesting user is an admin
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: requestingUser }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !requestingUser) {
      throw new Error('Unauthorized');
    }

    // Check if requesting user is admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      throw new Error('Only admins can create users');
    }

    const { email, password, fullName, phone, roles }: CreateUserRequest = await req.json();

    // Validate input
    if (!email || !password || !fullName || !roles || roles.length === 0) {
      throw new Error('Missing required fields');
    }

    // Create user using admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create the user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone: phone || null
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    if (!newUser.user) {
      throw new Error('User creation failed');
    }

    // Assign roles
    const roleInserts = roles.map(role => ({
      user_id: newUser.user.id,
      role: role
    }));

    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .insert(roleInserts);

    if (rolesError) {
      console.error('Error assigning roles:', rolesError);
      // Delete the created user if role assignment fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error('Failed to assign roles');
    }

    // Log the action
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: requestingUser.id,
        action: 'CREATE_USER',
        table_name: 'auth.users',
        record_id: newUser.user.id,
        new_data: {
          email,
          full_name: fullName,
          roles
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          full_name: fullName,
          roles
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-user function:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
