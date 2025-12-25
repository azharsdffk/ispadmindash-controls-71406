import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubscriberData {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  username?: string;
  plan?: string;
  balance?: number;
}

function extractSubscribersFromMarkdown(markdown: string): SubscriberData[] {
  const subscribers: SubscriberData[] = [];
  
  console.log('Extracting subscribers from markdown, length:', markdown.length);
  
  // Try to find table data in markdown
  const tableRegex = /\|(.+)\|/g;
  const rows: string[] = [];
  let match;
  
  while ((match = tableRegex.exec(markdown)) !== null) {
    rows.push(match[1]);
  }
  
  console.log('Found table rows:', rows.length);
  
  if (rows.length > 2) {
    // Skip header and separator rows
    for (let i = 2; i < rows.length; i++) {
      const cells = rows[i].split('|').map(c => c.trim()).filter(c => c);
      if (cells.length >= 2) {
        const subscriber: SubscriberData = {
          name: cells[0] || '',
          phone: cells[1] || '',
          email: cells[2] || undefined,
          address: cells[3] || undefined,
          username: cells[4] || undefined,
          plan: cells[5] || undefined,
          balance: cells[6] ? parseFloat(cells[6]) : undefined,
        };
        if (subscriber.name && subscriber.phone) {
          subscribers.push(subscriber);
        }
      }
    }
  }
  
  // Also try to extract from JSON-like structures in the content
  const jsonPatterns = [
    /"name"\s*:\s*"([^"]+)"/gi,
    /"phone"\s*:\s*"([^"]+)"/gi,
    /"username"\s*:\s*"([^"]+)"/gi,
  ];
  
  // Try to find subscriber objects in JSON format
  const jsonObjectRegex = /\{[^{}]*"(?:name|username)"[^{}]*"phone"[^{}]*\}/gi;
  const jsonMatches = markdown.match(jsonObjectRegex);
  
  if (jsonMatches) {
    console.log('Found JSON objects:', jsonMatches.length);
    for (const jsonStr of jsonMatches) {
      try {
        const obj = JSON.parse(jsonStr);
        if ((obj.name || obj.username) && obj.phone) {
          subscribers.push({
            name: obj.name || obj.username || '',
            phone: obj.phone || '',
            email: obj.email,
            address: obj.address,
            username: obj.username,
            plan: obj.plan || obj.package,
            balance: obj.balance ? parseFloat(obj.balance) : undefined,
          });
        }
      } catch (e) {
        // Not valid JSON, skip
      }
    }
  }
  
  console.log('Extracted subscribers:', subscribers.length);
  return subscribers;
}

function extractSubscribersFromHtml(html: string): SubscriberData[] {
  const subscribers: SubscriberData[] = [];
  
  console.log('Extracting subscribers from HTML, length:', html.length);
  
  // Try to find table rows
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows: string[] = [];
  let match;
  
  while ((match = rowRegex.exec(html)) !== null) {
    rows.push(match[1]);
  }
  
  console.log('Found HTML table rows:', rows.length);
  
  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    const cells: string[] = [];
    let cellMatch;
    
    while ((cellMatch = cellRegex.exec(rows[i])) !== null) {
      // Strip HTML tags from cell content
      const cellContent = cellMatch[1].replace(/<[^>]*>/g, '').trim();
      cells.push(cellContent);
    }
    
    if (cells.length >= 2) {
      const subscriber: SubscriberData = {
        name: cells[0] || '',
        phone: cells[1] || '',
        email: cells[2] || undefined,
        address: cells[3] || undefined,
        username: cells[4] || undefined,
        plan: cells[5] || undefined,
        balance: cells[6] ? parseFloat(cells[6]) : undefined,
      };
      if (subscriber.name && subscriber.phone) {
        subscribers.push(subscriber);
      }
    }
  }
  
  // Also look for data in script tags (common in SPAs)
  const scriptDataRegex = /(?:subscribers|users|customers)\s*[=:]\s*(\[[\s\S]*?\])/gi;
  let scriptMatch;
  
  while ((scriptMatch = scriptDataRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(scriptMatch[1]);
      if (Array.isArray(data)) {
        for (const item of data) {
          if ((item.name || item.username) && item.phone) {
            subscribers.push({
              name: item.name || item.username || '',
              phone: item.phone || '',
              email: item.email,
              address: item.address,
              username: item.username,
              plan: item.plan || item.package,
              balance: item.balance ? parseFloat(item.balance) : undefined,
            });
          }
        }
      }
    } catch (e) {
      // Not valid JSON, skip
    }
  }
  
  console.log('Extracted subscribers from HTML:', subscribers.length);
  return subscribers;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication - this is a sensitive import operation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Supabase client early for auth verification
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Invalid authentication:', userError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log('Authenticated user:', userId);

    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping URL with Firecrawl:', formattedUrl);

    // Use Firecrawl to scrape the SPA
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown', 'html'],
        onlyMainContent: false,
        waitFor: 5000, // Wait for JavaScript to load
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Firecrawl request failed` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Firecrawl response received');

    // Extract subscribers from the scraped content
    let subscribers: SubscriberData[] = [];
    
    const markdown = data.data?.markdown || data.markdown || '';
    const html = data.data?.html || data.html || '';
    
    // Try markdown first
    if (markdown) {
      subscribers = extractSubscribersFromMarkdown(markdown);
    }
    
    // If no subscribers found, try HTML
    if (subscribers.length === 0 && html) {
      subscribers = extractSubscribersFromHtml(html);
    }

    if (subscribers.length === 0) {
      console.log('No subscribers found in scraped content');
      console.log('Markdown preview:', markdown.substring(0, 500));
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'لم يتم العثور على بيانات مشتركين في الصفحة. تأكد من أن الرابط يحتوي على جدول مشتركين.',
          debug: {
            markdownLength: markdown.length,
            htmlLength: html.length,
            markdownPreview: markdown.substring(0, 1000)
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // User already authenticated above, reuse supabase client and userId

    // Import subscribers to database
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const sub of subscribers) {
      try {
        // Normalize phone
        const normalizedPhone = sub.phone.replace(/\D/g, '');
        
        if (!normalizedPhone) {
          errors.push(`Invalid phone for ${sub.name}`);
          failedCount++;
          continue;
        }

        // Check for existing subscriber
        const { data: existing } = await supabase
          .from('subscribers')
          .select('id')
          .eq('phone', normalizedPhone)
          .single();

        const subscriberData = {
          name: sub.name,
          phone: normalizedPhone,
          email: sub.email || null,
          address: sub.address || null,
          username: sub.username || null,
          plan: sub.plan || null,
          balance: sub.balance || 0,
        };

        if (existing) {
          const { error } = await supabase
            .from('subscribers')
            .update(subscriberData)
            .eq('id', existing.id);
          
          if (error) {
            errors.push(`Failed to update ${sub.name}: ${error.message}`);
            failedCount++;
          } else {
            successCount++;
          }
        } else {
          const { error } = await supabase
            .from('subscribers')
            .insert(subscriberData);
          
          if (error) {
            errors.push(`Failed to insert ${sub.name}: ${error.message}`);
            failedCount++;
          } else {
            successCount++;
          }
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Error processing ${sub.name}: ${errorMessage}`);
        failedCount++;
      }
    }

    // Log the import (userId is always available since authentication is required)
    await supabase.from('import_logs').insert({
      import_type: 'subscribers',
      source: 'firecrawl_sas',
      records_imported: successCount,
      records_failed: failedCount,
      error_message: errors.length > 0 ? errors.join('\n') : null,
      status: failedCount === 0 ? 'completed' : 'completed_with_errors',
      imported_by: userId,
    });

    console.log(`Import complete: ${successCount} success, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          imported: successCount,
          failed: failedCount,
          total: subscribers.length,
          errors: errors.slice(0, 10), // Return first 10 errors
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in firecrawl-scrape:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
