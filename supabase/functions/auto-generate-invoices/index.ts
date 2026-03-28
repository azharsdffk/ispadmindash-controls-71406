import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Contract {
  id: string
  subscriber_id: string
  monthly_fee: number
  currency: string
  status: string
  package_id: string | null
  subscriber: {
    name: string
    phone: string
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // --- AUTH CHECK: require admin role ---
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Authorization header required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid or expired token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check admin role using service client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin'])

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden: admin role required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('🔄 بدء عملية إنشاء الفواتير التلقائية...')

    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select(`
        id,
        subscriber_id,
        monthly_fee,
        currency,
        status,
        package_id,
        subscriber:subscribers(name, phone)
      `)
      .eq('status', 'active')

    if (contractsError) {
      console.error('❌ خطأ في جلب العقود:', contractsError)
      throw contractsError
    }

    console.log(`📋 تم العثور على ${contracts?.length || 0} عقد نشط`)

    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()
    const dueDate = new Date(currentYear, currentMonth, 0)
    const dueDateStr = dueDate.toISOString().split('T')[0]

    const results = {
      created: 0,
      skipped: 0,
      errors: 0,
      details: [] as string[]
    }

    for (const contract of (contracts || []) as unknown as Contract[]) {
      try {
        const monthStart = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0]
        const monthEnd = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]

        const { data: existingInvoice } = await supabase
          .from('invoices')
          .select('id')
          .eq('subscriber_id', contract.subscriber_id)
          .gte('issue_date', monthStart)
          .lte('issue_date', monthEnd)
          .single()

        if (existingInvoice) {
          results.skipped++
          continue
        }

        const { data: countData } = await supabase
          .from('invoices')
          .select('id', { count: 'exact', head: true })

        const invoiceCount = countData ? 1 : 1
        const invoiceNumber = `INV-${currentYear}${String(currentMonth).padStart(2, '0')}-${String(invoiceCount + results.created + 1).padStart(4, '0')}`

        const { error: insertError } = await supabase
          .from('invoices')
          .insert({
            subscriber_id: contract.subscriber_id,
            invoice_number: invoiceNumber,
            amount: contract.monthly_fee,
            net_amount: contract.monthly_fee,
            currency: contract.currency || 'IQD',
            status: 'pending',
            issue_date: currentDate.toISOString().split('T')[0],
            due_date: dueDateStr,
            discount: 0
          })

        if (insertError) {
          console.error(`❌ خطأ في إنشاء فاتورة:`, insertError)
          results.errors++
        } else {
          results.created++

          const { data: subscriberUser } = await supabase
            .from('subscriber_users')
            .select('user_id')
            .eq('subscriber_id', contract.subscriber_id)
            .single()

          if (subscriberUser) {
            await supabase
              .from('notifications')
              .insert({
                user_id: subscriberUser.user_id,
                title: 'فاتورة جديدة',
                message: `تم إصدار فاتورة شهرية بمبلغ ${contract.monthly_fee.toLocaleString()} ${contract.currency || 'IQD'}`,
                type: 'invoice',
                action_url: '/customer'
              })
          }
        }
      } catch (err) {
        console.error(`❌ خطأ غير متوقع للعقد ${contract.id}:`, err)
        results.errors++
      }
    }

    await supabase
      .from('import_logs')
      .insert({
        import_type: 'auto_invoice',
        source: 'admin_triggered',
        status: results.errors > 0 ? 'partial' : 'completed',
        records_imported: results.created,
        records_failed: results.errors
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: `تم إنشاء ${results.created} فاتورة، تم تخطي ${results.skipped}، أخطاء: ${results.errors}`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: unknown) {
    console.error('❌ خطأ عام:', error)
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
