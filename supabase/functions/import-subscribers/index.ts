import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '*';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(userId);
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + 60000 });
    return true;
  }
  
  if (limit.count >= 10) {
    return false;
  }
  
  limit.count++;
  return true;
}

// Sanitize CSV values to prevent CSV injection
function sanitizeCSVValue(value: string): string {
  if (!value) return value;
  
  // Remove leading characters that could trigger formulas
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
  let sanitized = value.trim();
  
  while (dangerousChars.some(char => sanitized.startsWith(char))) {
    sanitized = sanitized.substring(1);
  }
  
  // Remove potential command injection patterns
  sanitized = sanitized
    .replace(/\|/g, '')
    .replace(/;/g, '')
    .replace(/`/g, '')
    .replace(/\$/g, '');
  
  return sanitized;
}

function validatePhone(phone: string): boolean {
  return /^(\+964|0)?7[3-9]\d{8}$/.test(phone);
}

function validateEmail(email: string): boolean {
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateCoordinates(lat?: number, lng?: number): boolean {
  if (lat !== undefined && (lat < -90 || lat > 90)) return false;
  if (lng !== undefined && (lng < -180 || lng > 180)) return false;
  return true;
}

// Scrape data from SAS page
async function scrapeSASData(url: string): Promise<any[]> {
  console.log('🔍 Fetching SAS page:', url);
  
  try {
    // Try to fetch with headers that mimic a browser
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log('📄 HTML length:', html.length);
    
    const subscribers: any[] = [];
    
    // Try multiple patterns for table extraction
    // Pattern 1: Standard table rows
    const tableRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    
    let matches = html.match(tableRegex);
    console.log('📊 Found table rows:', matches?.length || 0);
    
    if (matches && matches.length > 1) {
      // Skip first row (headers)
      for (let i = 1; i < matches.length; i++) {
        const row = matches[i];
        const cells: string[] = [];
        let cellMatch;
        const cellRegexCopy = new RegExp(cellRegex.source, cellRegex.flags);
        
        while ((cellMatch = cellRegexCopy.exec(row)) !== null) {
          const cellContent = cellMatch[1].replace(/<[^>]+>/g, '').trim();
          cells.push(cellContent);
        }
        
        console.log(`Row ${i} cells:`, cells.length, cells);
        
        if (cells.length >= 2) { // At least name and phone
          subscribers.push({
            name: sanitizeCSVValue(cells[0] || ''),
            phone: sanitizeCSVValue(cells[1] || ''),
            email: sanitizeCSVValue(cells[2] || ''),
            address: sanitizeCSVValue(cells[3] || ''),
            plan: sanitizeCSVValue(cells[4] || ''),
            balance: parseFloat(cells[5]) || 0,
          });
        }
      }
    }
    
    // If no table found, try JSON data in script tags
    if (subscribers.length === 0) {
      console.log('⚠️ No table data found, checking for JSON...');
      const jsonRegex = /(?:subscribers|data)\s*[:=]\s*(\[[\s\S]*?\])/gi;
      const jsonMatch = jsonRegex.exec(html);
      
      if (jsonMatch) {
        try {
          const jsonData = JSON.parse(jsonMatch[1]);
          console.log('📦 Found JSON data:', jsonData.length, 'items');
          return jsonData;
        } catch (e) {
          console.log('❌ Failed to parse JSON:', e);
        }
      }
    }
    
    console.log(`✅ Scraped ${subscribers.length} subscribers from SAS`);
    
    if (subscribers.length === 0) {
      throw new Error('لم يتم العثور على بيانات مشتركين في الصفحة. تأكد من الرابط أو استخدم تصدير CSV.');
    }
    
    return subscribers;
  } catch (error: any) {
    console.error('❌ SAS scraping error:', error);
    throw error;
  }
}

// Scrape data from National Project page
async function scrapeNationalProjectData(url: string): Promise<any[]> {
  console.log('🔍 Fetching National Project page:', url);
  
  try {
    // Try to fetch with headers that mimic a browser
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log('📄 HTML length:', html.length);
    
    const subscribers: any[] = [];
    
    // Try multiple patterns for table extraction
    const tableRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    
    let matches = html.match(tableRegex);
    console.log('📊 Found table rows:', matches?.length || 0);
    
    if (matches && matches.length > 1) {
      // Skip first row (headers)
      for (let i = 1; i < matches.length; i++) {
        const row = matches[i];
        const cells: string[] = [];
        let cellMatch;
        const cellRegexCopy = new RegExp(cellRegex.source, cellRegex.flags);
        
        while ((cellMatch = cellRegexCopy.exec(row)) !== null) {
          const cellContent = cellMatch[1].replace(/<[^>]+>/g, '').trim();
          cells.push(cellContent);
        }
        
        console.log(`Row ${i} cells:`, cells.length, cells);
        
        if (cells.length >= 2) { // At least name and phone
          subscribers.push({
            name: sanitizeCSVValue(cells[0] || ''),
            phone: sanitizeCSVValue(cells[1] || ''),
            email: sanitizeCSVValue(cells[2] || ''),
            address: sanitizeCSVValue(cells[3] || ''),
            plan: sanitizeCSVValue(cells[4] || ''),
            balance: parseFloat(cells[5]) || 0,
          });
        }
      }
    }
    
    // If no table found, try JSON data
    if (subscribers.length === 0) {
      console.log('⚠️ No table data found, checking for JSON...');
      const jsonRegex = /(?:subscribers|data)\s*[:=]\s*(\[[\s\S]*?\])/gi;
      const jsonMatch = jsonRegex.exec(html);
      
      if (jsonMatch) {
        try {
          const jsonData = JSON.parse(jsonMatch[1]);
          console.log('📦 Found JSON data:', jsonData.length, 'items');
          return jsonData;
        } catch (e) {
          console.log('❌ Failed to parse JSON:', e);
        }
      }
    }
    
    console.log(`✅ Scraped ${subscribers.length} subscribers from National Project`);
    
    if (subscribers.length === 0) {
      throw new Error('لم يتم العثور على بيانات مشتركين في الصفحة. تأكد من الرابط أو استخدم تصدير CSV.');
    }
    
    return subscribers;
  } catch (error: any) {
    console.error('❌ National Project scraping error:', error);
    throw error;
  }
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

    // Rate limiting check
    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
        const headers = lines[0].split(',').map((h: string) => sanitizeCSVValue(h.trim().toLowerCase()));
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',');
          const subscriber: any = {};
          
          headers.forEach((header: string, index: number) => {
            const value = sanitizeCSVValue(values[index]?.trim() || '');
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

          // Validate data
          if (!subscriber.name || !subscriber.phone) {
            failed++;
            errors.push(`Row ${i}: Missing required fields`);
            continue;
          }

          if (!validatePhone(subscriber.phone)) {
            failed++;
            errors.push(`Row ${i}: Invalid phone number`);
            continue;
          }

          if (subscriber.email && !validateEmail(subscriber.email)) {
            failed++;
            errors.push(`Row ${i}: Invalid email`);
            continue;
          }

          if (!validateCoordinates(subscriber.latitude, subscriber.longitude)) {
            failed++;
            errors.push(`Row ${i}: Invalid coordinates`);
            continue;
          }

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
          }
        }
      } else if (url) {
        // URL import - scrape data directly from the page
        console.log(`📥 Starting import from ${source} URL:`, url);
        
        let subscribersData: any[] = [];
        
        try {
          if (source === 'sas') {
            subscribersData = await scrapeSASData(url);
          } else if (source === 'national_project') {
            subscribersData = await scrapeNationalProjectData(url);
          }
        } catch (scrapeError: any) {
          console.error('❌ Scraping failed:', scrapeError);
          throw new Error(`فشل سحب البيانات من الصفحة: ${scrapeError?.message || 'خطأ غير معروف'}`);
        }

        // Process scraped data
        for (const subscriber of subscribersData) {
          try {
            // Validate data
            if (!subscriber.name || !subscriber.phone) {
              failed++;
              errors.push(`بيانات ناقصة للمشترك`);
              continue;
            }

            if (!validatePhone(subscriber.phone)) {
              failed++;
              errors.push(`رقم هاتف غير صحيح: ${subscriber.phone}`);
              continue;
            }

            if (subscriber.email && !validateEmail(subscriber.email)) {
              failed++;
              errors.push(`بريد إلكتروني غير صحيح: ${subscriber.email}`);
              continue;
            }

            // Check for existing subscriber by phone
            const { data: existing } = await supabaseClient
              .from('subscribers')
              .select('id')
              .eq('phone', subscriber.phone)
              .maybeSingle();

            if (existing) {
              // Update existing subscriber
              const { error: updateError } = await supabaseClient
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
                failed++;
                errors.push(`فشل تحديث ${subscriber.name}: ${updateError.message}`);
              } else {
                imported++;
              }
            } else {
              // Insert new subscriber
              const { error: insertError } = await supabaseClient
                .from('subscribers')
                .insert({
                  name: subscriber.name,
                  phone: subscriber.phone,
                  email: subscriber.email,
                  address: subscriber.address,
                  plan: subscriber.plan,
                  balance: subscriber.balance || 0,
                  created_by: user.id,
                });

              if (insertError) {
                failed++;
                errors.push(`فشل إضافة ${subscriber.name}: ${insertError.message}`);
              } else {
                imported++;
              }
            }
          } catch (err: any) {
            failed++;
            errors.push(`خطأ في معالجة المشترك: ${err.message}`);
          }
        }
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