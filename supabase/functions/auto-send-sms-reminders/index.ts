import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSTarget {
  subscriberId: string;
  subscriberName: string;
  phone: string;
  amount?: number;
  dueDate?: string;
  ticketNumber?: string;
  issueType?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { type } = await req.json();

    console.log('Auto SMS Reminders triggered for type:', type);

    // Get SMS settings
    const { data: smsSettings } = await supabaseClient
      .from('sms_settings')
      .select('*')
      .eq('active', true)
      .single();

    if (!smsSettings) {
      console.log('SMS settings not configured or inactive');
      return new Response(
        JSON.stringify({ message: 'SMS not configured', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.log('Twilio credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Twilio not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    let targets: SMSTarget[] = [];
    let messageTemplate = '';

    if (type === 'payment_reminder') {
      // Get overdue invoices
      const today = new Date().toISOString().split('T')[0];
      const { data: overdueInvoices } = await supabaseClient
        .from('invoices')
        .select(`
          id,
          invoice_number,
          net_amount,
          due_date,
          subscriber_id,
          subscribers (
            id,
            name,
            phone
          )
        `)
        .eq('status', 'pending')
        .lte('due_date', today);

      targets = (overdueInvoices || []).map((inv: any) => ({
        subscriberId: inv.subscriber_id,
        subscriberName: inv.subscribers?.name || 'العميل',
        phone: inv.subscribers?.phone,
        amount: inv.net_amount,
        dueDate: inv.due_date
      })).filter(t => t.phone);

      // Get template
      const { data: template } = await supabaseClient
        .from('sms_templates')
        .select('message_template')
        .eq('template_key', 'payment_reminder')
        .eq('active', true)
        .single();

      messageTemplate = template?.message_template || 
        'عزيزي {name}، نذكرك بأن لديك فاتورة مستحقة بمبلغ {amount} دينار. يرجى السداد في أقرب وقت.';

    } else if (type === 'maintenance_update') {
      // Get tickets with recent updates
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentTickets } = await supabaseClient
        .from('maintenance_tickets')
        .select(`
          id,
          ticket_number,
          issue_type,
          status,
          subscriber_id,
          subscribers (
            id,
            name,
            phone
          )
        `)
        .gte('updated_at', yesterday)
        .in('status', ['in_progress', 'resolved']);

      targets = (recentTickets || []).map((ticket: any) => ({
        subscriberId: ticket.subscriber_id,
        subscriberName: ticket.subscribers?.name || 'العميل',
        phone: ticket.subscribers?.phone,
        ticketNumber: ticket.ticket_number,
        issueType: ticket.issue_type
      })).filter(t => t.phone);

      const { data: template } = await supabaseClient
        .from('sms_templates')
        .select('message_template')
        .eq('template_key', 'maintenance_update')
        .eq('active', true)
        .single();

      messageTemplate = template?.message_template || 
        'عزيزي {name}، تم تحديث حالة طلب الصيانة رقم {ticket}. تابع حالة طلبك من خلال التطبيق.';

    } else if (type === 'upcoming_due') {
      // Get invoices due in 3 days
      const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data: upcomingInvoices } = await supabaseClient
        .from('invoices')
        .select(`
          id,
          invoice_number,
          net_amount,
          due_date,
          subscriber_id,
          subscribers (
            id,
            name,
            phone
          )
        `)
        .eq('status', 'pending')
        .eq('due_date', threeDaysLater);

      targets = (upcomingInvoices || []).map((inv: any) => ({
        subscriberId: inv.subscriber_id,
        subscriberName: inv.subscribers?.name || 'العميل',
        phone: inv.subscribers?.phone,
        amount: inv.net_amount,
        dueDate: inv.due_date
      })).filter(t => t.phone);

      const { data: template } = await supabaseClient
        .from('sms_templates')
        .select('message_template')
        .eq('template_key', 'upcoming_due')
        .eq('active', true)
        .single();

      messageTemplate = template?.message_template || 
        'عزيزي {name}، تذكير بأن فاتورتك بمبلغ {amount} دينار ستستحق خلال 3 أيام. يرجى السداد لتجنب الانقطاع.';
    }

    console.log(`Found ${targets.length} targets for ${type}`);

    let sentCount = 0;
    const errors: string[] = [];

    for (const target of targets) {
      try {
        let message = messageTemplate
          .replace('{name}', target.subscriberName)
          .replace('{amount}', target.amount?.toLocaleString() || '')
          .replace('{due_date}', target.dueDate || '')
          .replace('{ticket}', target.ticketNumber || '');

        // Log SMS attempt
        const { data: smsLog, error: logError } = await supabaseClient
          .from('sms_logs')
          .insert({
            recipient_phone: target.phone,
            recipient_name: target.subscriberName,
            message: message,
            status: 'pending',
            provider: 'twilio'
          })
          .select()
          .single();

        // Send via Twilio
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

        const twilioResponse = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${twilioAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: target.phone,
            From: twilioPhoneNumber,
            Body: message,
          }).toString(),
        });

        const twilioData = await twilioResponse.json();

        if (twilioResponse.ok) {
          sentCount++;
          
          // Update log with success
          if (smsLog) {
            await supabaseClient
              .from('sms_logs')
              .update({
                status: 'sent',
                provider_message_id: twilioData.sid,
                sent_at: new Date().toISOString()
              })
              .eq('id', smsLog.id);
          }
        } else {
          console.error(`Failed to send to ${target.phone}:`, twilioData);
          errors.push(`${target.phone}: ${twilioData.message}`);
          
          if (smsLog) {
            await supabaseClient
              .from('sms_logs')
              .update({
                status: 'failed',
                error_message: twilioData.message
              })
              .eq('id', smsLog.id);
          }
        }
      } catch (error: any) {
        console.error(`Error sending SMS to ${target.phone}:`, error);
        errors.push(`${target.phone}: ${error?.message || 'Unknown error'}`);
      }
    }

    console.log(`Auto SMS completed: ${sentCount}/${targets.length} sent`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        total: targets.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in auto-send-sms-reminders:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});