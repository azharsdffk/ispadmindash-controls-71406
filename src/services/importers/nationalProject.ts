import { supabase } from '@/integrations/supabase/client';

export interface NationalProjectSubscriber {
  subscriber_id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  plan?: string;
  balance: number;
}

/**
 * Import subscribers from National Project external source
 * Handles deduplication and conflict resolution
 */
export const importFromNationalProject = async (
  apiUrl: string,
  apiKey?: string
): Promise<{ success: number; failed: number; errors: string[] }> => {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // Fetch data from National Project API
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(apiUrl, { headers });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data: NationalProjectSubscriber[] = await response.json();

    // Process each subscriber
    for (const subscriber of data) {
      try {
        // Validate required fields
        if (!subscriber.name || !subscriber.phone) {
          results.errors.push(`Invalid data for subscriber ${subscriber.subscriber_id}: missing name or phone`);
          results.failed++;
          continue;
        }

        // Check for existing subscriber by phone (unique identifier)
        const { data: existing } = await supabase
          .from('subscribers')
          .select('id')
          .eq('phone', subscriber.phone)
          .single();

        if (existing) {
          // Update existing subscriber
          const { error: updateError } = await supabase
            .from('subscribers')
            .update({
              name: subscriber.name,
              email: subscriber.email,
              address: subscriber.address,
              plan: subscriber.plan,
              balance: subscriber.balance,
            })
            .eq('id', existing.id);

          if (updateError) {
            results.errors.push(`Failed to update ${subscriber.name}: ${updateError.message}`);
            results.failed++;
          } else {
            results.success++;
          }
        } else {
          // Insert new subscriber
          const { error: insertError } = await supabase
            .from('subscribers')
            .insert({
              name: subscriber.name,
              phone: subscriber.phone,
              email: subscriber.email,
              address: subscriber.address,
              plan: subscriber.plan,
              balance: subscriber.balance || 0,
            });

          if (insertError) {
            results.errors.push(`Failed to insert ${subscriber.name}: ${insertError.message}`);
            results.failed++;
          } else {
            results.success++;
          }
        }
      } catch (err: any) {
        results.errors.push(`Error processing subscriber ${subscriber.subscriber_id}: ${err.message}`);
        results.failed++;
      }
    }

    // Log import operation
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('import_logs').insert({
        import_type: 'subscribers',
        source: 'national_project',
        records_imported: results.success,
        records_failed: results.failed,
        error_message: results.errors.length > 0 ? results.errors.join('\n') : null,
        status: results.failed === 0 ? 'completed' : 'completed_with_errors',
        imported_by: user.id,
      });
    }

    return results;
  } catch (error: any) {
    results.errors.push(`Import failed: ${error.message}`);
    results.failed = -1;
    return results;
  }
};
