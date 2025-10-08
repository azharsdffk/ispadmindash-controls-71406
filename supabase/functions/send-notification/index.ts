import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '*';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  user_ids?: string[];
  role?: 'admin' | 'technician' | 'accountant' | 'client';
  title: string;
  message: string;
  type: string;
  action_url?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { user_ids, role, title, message, type, action_url }: NotificationRequest = await req.json();

    let targetUserIds: string[] = [];

    // If user_ids provided, use them directly
    if (user_ids && user_ids.length > 0) {
      targetUserIds = user_ids;
    } 
    // If role provided, get all users with that role
    else if (role) {
      const { data: roleUsers, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', role);

      if (roleError) {
        throw new Error('Failed to fetch users by role: ' + roleError.message);
      }

      targetUserIds = roleUsers?.map(r => r.user_id) || [];
    } else {
      throw new Error('Either user_ids or role must be provided');
    }

    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No users to notify',
          count: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create notifications for all target users
    const notifications = targetUserIds.map(userId => ({
      user_id: userId,
      title,
      message,
      type,
      action_url: action_url || null,
      read: false,
    }));

    const { data, error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (insertError) {
      throw new Error('Failed to create notifications: ' + insertError.message);
    }

    // Log the notification action
    await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'CREATE',
        table_name: 'notifications',
        new_data: {
          target_count: targetUserIds.length,
          title,
          type,
          role: role || null,
        },
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        count: data?.length || 0,
        message: `تم إرسال ${data?.length || 0} إشعار بنجاح`,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      }
    );
  } catch (error: any) {
    console.error('Error in send-notification:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
