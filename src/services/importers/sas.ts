import { supabase } from '@/integrations/supabase/client';

export interface SASSubscriber {
  id: string;
  full_name: string;
  mobile: string;
  email_address?: string;
  street_address?: string;
  service_plan?: string;
  account_balance: number;
}

/**
 * Import subscribers from SAS (Subscriber Acquisition System)
 * Handles CSV parsing and data transformation
 */
export const importFromSAS = async (
  csvData: string
): Promise<{ success: number; failed: number; errors: string[] }> => {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // Parse CSV data
    const lines = csvData.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows');
    }

    // Skip header row
    const dataLines = lines.slice(1);

    for (const line of dataLines) {
      try {
        // Parse CSV line (handle quoted fields)
        const columns = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const cleanColumns = columns.map(col => col.replace(/^"|"$/g, '').trim());

        if (cleanColumns.length < 3) {
          results.errors.push(`Invalid CSV line: ${line}`);
          results.failed++;
          continue;
        }

        const [id, full_name, mobile, email_address, street_address, service_plan, account_balance] = cleanColumns;

        // Validate required fields
        if (!full_name || !mobile) {
          results.errors.push(`Missing required fields in line: ${line}`);
          results.failed++;
          continue;
        }

        // Normalize phone number
        const normalizedPhone = mobile.replace(/\D/g, '');

        // Check for existing subscriber
        const { data: existing } = await supabase
          .from('subscribers')
          .select('id')
          .eq('phone', normalizedPhone)
          .single();

        const subscriberData = {
          name: full_name,
          phone: normalizedPhone,
          email: email_address || null,
          address: street_address || null,
          plan: service_plan || null,
          balance: parseFloat(account_balance) || 0,
        };

        if (existing) {
          // Update existing subscriber
          const { error: updateError } = await supabase
            .from('subscribers')
            .update(subscriberData)
            .eq('id', existing.id);

          if (updateError) {
            results.errors.push(`Failed to update ${full_name}: ${updateError.message}`);
            results.failed++;
          } else {
            results.success++;
          }
        } else {
          // Insert new subscriber
          const { error: insertError } = await supabase
            .from('subscribers')
            .insert(subscriberData);

          if (insertError) {
            results.errors.push(`Failed to insert ${full_name}: ${insertError.message}`);
            results.failed++;
          } else {
            results.success++;
          }
        }
      } catch (err: any) {
        results.errors.push(`Error processing line: ${err.message}`);
        results.failed++;
      }
    }

    // Log import operation
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('import_logs').insert({
        import_type: 'subscribers',
        source: 'sas',
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
