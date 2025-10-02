import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { source, url, content, filename } = await req.json();
    
    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    // Get current user
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token || '');

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Create import log
    const { data: importLog, error: logError } = await supabaseClient
      .from('import_logs')
      .insert({
        source,
        import_type: 'subscribers',
        status: 'pending',
        imported_by: user.id,
      })
      .select()
      .single();

    if (logError) throw logError;

    try {
      if (source === 'file' && content) {
        // Parse CSV/Excel file
        const lines = content.split('\n');
        const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',');
          const subscriber: any = {};
          
          headers.forEach((header: string, index: number) => {
            const value = values[index]?.trim();
            if (header.includes('name') || header.includes('اسم')) {
              subscriber.name = value;
            } else if (header.includes('phone') || header.includes('هاتف')) {
              subscriber.phone = value;
            } else if (header.includes('email') || header.includes('بريد')) {
              subscriber.email = value;
            } else if (header.includes('address') || header.includes('عنوان')) {
              subscriber.address = value;
            } else if (header.includes('plan') || header.includes('باقة')) {
              subscriber.plan = value;
            } else if (header.includes('lat') || header.includes('عرض')) {
              subscriber.latitude = parseFloat(value) || null;
            } else if (header.includes('lon') || header.includes('طول')) {
              subscriber.longitude = parseFloat(value) || null;
            }
          });

          if (subscriber.name && subscriber.phone) {
            const { error } = await supabaseClient
              .from('subscribers')
              .insert({
                ...subscriber,
                created_by: user.id,
              });

            if (error) {
              failed++;
              errors.push(`Row ${i}: ${error.message}`);
            } else {
              imported++;
            }
          } else {
            failed++;
            errors.push(`Row ${i}: Missing required fields`);
          }
        }
      } else if (url) {
        // Fetch data from URL
        const response = await fetch(url);
        const html = await response.text();
        
        // Simple parsing - in production, use a proper HTML parser
        // This is a placeholder that would need actual implementation
        console.log('URL import not yet implemented for:', source);
        errors.push('URL import feature is under development');
      }

      // Update import log
      await supabaseClient
        .from('import_logs')
        .update({
          records_imported: imported,
          records_failed: failed,
          status: failed > 0 && imported === 0 ? 'failed' : 'completed',
          error_message: errors.length > 0 ? errors.join('\n') : null,
        })
        .eq('id', importLog.id);

      return new Response(
        JSON.stringify({ 
          imported, 
          failed, 
          errors: errors.slice(0, 10) // Return first 10 errors
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Update log with error
      await supabaseClient
        .from('import_logs')
        .update({
          status: 'failed',
          error_message: errorMessage,
        })
        .eq('id', importLog.id);
      
      throw error;
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
