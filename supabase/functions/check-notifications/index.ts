import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
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

    console.log('Checking for notifications to send...');

    const today = new Date();
    const notifications: any[] = [];

    // Check for expiring contracts
    const { data: expiringContracts } = await supabaseClient
      .from('contracts')
      .select(`
        *,
        subscribers (name, phone)
      `)
      .eq('status', 'active')
      .gte('end_date', today.toISOString().split('T')[0])
      .lte('end_date', new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (expiringContracts && expiringContracts.length > 0) {
      for (const contract of expiringContracts) {
        notifications.push({
          type: 'contract_expiry',
          to: contract.subscribers.phone,
          subscriber_name: contract.subscribers.name,
          variables: {
            name: contract.subscribers.name,
            contract_number: contract.contract_number,
            end_date: new Date(contract.end_date).toLocaleDateString('ar-IQ')
          }
        });
      }
    }

    // Check for overdue invoices
    const { data: overdueInvoices } = await supabaseClient
      .from('invoices')
      .select(`
        *,
        subscribers (name, phone)
      `)
      .in('status', ['pending', 'overdue'])
      .lte('due_date', today.toISOString().split('T')[0]);

    if (overdueInvoices && overdueInvoices.length > 0) {
      for (const invoice of overdueInvoices) {
        notifications.push({
          type: 'invoice_reminder',
          to: invoice.subscribers.phone,
          subscriber_name: invoice.subscribers.name,
          variables: {
            name: invoice.subscribers.name,
            amount: invoice.net_amount.toString() + ' IQD',
            due_date: new Date(invoice.due_date).toLocaleDateString('ar-IQ')
          }
        });
      }
    }

    // Check for upcoming maintenance
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { data: upcomingMaintenance } = await supabaseClient
      .from('maintenance_tickets')
      .select(`
        *,
        subscribers (name, phone),
        technicians (name)
      `)
      .eq('status', 'scheduled')
      .gte('scheduled_date', today.toISOString())
      .lte('scheduled_date', tomorrow.toISOString());

    if (upcomingMaintenance && upcomingMaintenance.length > 0) {
      for (const ticket of upcomingMaintenance) {
        notifications.push({
          type: 'maintenance_scheduled',
          to: ticket.subscribers.phone,
          subscriber_name: ticket.subscribers.name,
          variables: {
            name: ticket.subscribers.name,
            scheduled_date: new Date(ticket.scheduled_date).toLocaleDateString('ar-IQ'),
            technician_name: ticket.technicians?.name || 'سيتم تحديده'
          }
        });
      }
    }

    console.log(`Found ${notifications.length} notifications to send`);

    // Send notifications
    let sent = 0;
    let failed = 0;

    for (const notification of notifications) {
      try {
        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-sms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            to: notification.to,
            message: '', // Will be filled from template
            subscriber_name: notification.subscriber_name,
            template_key: notification.type,
            variables: notification.variables
          })
        });

        if (response.ok) {
          sent++;
        } else {
          failed++;
          console.error('Failed to send notification:', await response.text());
        }
      } catch (error) {
        failed++;
        console.error('Error sending notification:', error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        total: notifications.length,
        sent,
        failed,
        message: `Processed ${notifications.length} notifications. Sent: ${sent}, Failed: ${failed}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in check-notifications function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
