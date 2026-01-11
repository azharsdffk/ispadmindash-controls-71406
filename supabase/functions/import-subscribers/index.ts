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

// Advanced scraping function for SAS and National Project pages
async function scrapeWebPage(url: string, source: string): Promise<any[]> {
  console.log(`🔍 Fetching ${source} page:`, url);
  
  try {
    // Try to fetch with headers that mimic a browser
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
      }
    });
    
    if (!response.ok) {
      throw new Error(`فشل الاتصال بالصفحة: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log('📄 HTML length:', html.length);
    
    const subscribers: any[] = [];
    
    // Pattern 1: Try to find JSON data in various formats
    const jsonPatterns = [
      /(?:var\s+)?(?:subscribers|data|users|customers|records|items|list)\s*[:=]\s*(\[[\s\S]*?\]);?/gi,
      /"(?:subscribers|data|users|customers|records)"\s*:\s*(\[[\s\S]*?\])/gi,
      /JSON\.parse\s*\(\s*'(\[[\s\S]*?\])'\s*\)/gi,
      /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});?/gi,
      /window\.__DATA__\s*=\s*(\{[\s\S]*?\});?/gi,
    ];
    
    for (const pattern of jsonPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        try {
          let jsonStr = match[1];
          // Clean up the JSON string
          jsonStr = jsonStr.replace(/'/g, '"').replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
          const jsonData = JSON.parse(jsonStr);
          
          let dataArray = Array.isArray(jsonData) ? jsonData : 
                         jsonData.subscribers || jsonData.data || jsonData.users || 
                         jsonData.customers || jsonData.records || jsonData.items || [];
          
          if (Array.isArray(dataArray) && dataArray.length > 0) {
            console.log(`📦 Found JSON data with ${dataArray.length} items`);
            
            for (const item of dataArray) {
              const subscriber = extractSubscriberFromObject(item);
              if (subscriber.name && subscriber.phone) {
                subscribers.push(subscriber);
              }
            }
            
            if (subscribers.length > 0) {
              console.log(`✅ Extracted ${subscribers.length} subscribers from JSON`);
              return subscribers;
            }
          }
        } catch (e) {
          // Continue to next pattern
        }
      }
    }
    
    // Pattern 2: Extract from HTML tables with various structures
    const tablePatterns = [
      /<table[^>]*class="[^"]*(?:data|subscribers|users|grid|list)[^"]*"[^>]*>([\s\S]*?)<\/table>/gi,
      /<table[^>]*id="[^"]*(?:data|subscribers|users|grid|list)[^"]*"[^>]*>([\s\S]*?)<\/table>/gi,
      /<table[^>]*>([\s\S]*?)<\/table>/gi,
    ];
    
    for (const tablePattern of tablePatterns) {
      const tableMatches = html.match(tablePattern);
      if (tableMatches) {
        for (const tableHtml of tableMatches) {
          const extracted = extractFromTable(tableHtml);
          if (extracted.length > 0) {
            console.log(`✅ Extracted ${extracted.length} subscribers from table`);
            subscribers.push(...extracted);
          }
        }
        if (subscribers.length > 0) break;
      }
    }
    
    // Pattern 3: Try to find data in div/list structures
    if (subscribers.length === 0) {
      const listPatterns = [
        /<div[^>]*class="[^"]*(?:subscriber|user|customer|card|item|row)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
        /<li[^>]*class="[^"]*(?:subscriber|user|customer|item)[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
      ];
      
      for (const listPattern of listPatterns) {
        const items = html.matchAll(listPattern);
        for (const item of items) {
          const subscriber = extractFromHtmlContent(item[1]);
          if (subscriber.name && subscriber.phone) {
            subscribers.push(subscriber);
          }
        }
        if (subscribers.length > 0) break;
      }
    }
    
    // Pattern 4: Generic extraction from any visible content
    if (subscribers.length === 0) {
      // Try to find phone numbers and associated names
      const phoneRegex = /(?:07[3-9]\d{8}|\+9647[3-9]\d{8})/g;
      const phones = html.match(phoneRegex) || [];
      
      if (phones.length > 0) {
        console.log(`📱 Found ${phones.length} phone numbers in page`);
        
        // Try to extract context around each phone
        for (const phone of phones) {
          const phoneIndex = html.indexOf(phone);
          const context = html.substring(Math.max(0, phoneIndex - 200), phoneIndex + phone.length + 50);
          
          // Look for a name near the phone
          const nameMatch = context.match(/(?:الاسم|name|اسم)[:\s]*([^\n<>]{3,50})/i) ||
                           context.match(/>([^<]{3,50})</);
          
          if (nameMatch) {
            const name = nameMatch[1].replace(/<[^>]+>/g, '').trim();
            if (name && !name.match(/^\d+$/)) {
              subscribers.push({
                name: sanitizeCSVValue(name),
                phone: sanitizeCSVValue(phone),
              });
            }
          }
        }
      }
    }
    
    console.log(`✅ Total scraped: ${subscribers.length} subscribers from ${source}`);
    
    if (subscribers.length === 0) {
      throw new Error('لم يتم العثور على بيانات مشتركين في الصفحة. تأكد من أن الرابط صحيح ويحتوي على جدول بيانات المشتركين.');
    }
    
    // Remove duplicates based on phone
    const uniqueSubscribers = Array.from(
      new Map(subscribers.map(s => [s.phone, s])).values()
    );
    
    return uniqueSubscribers;
  } catch (error: any) {
    console.error(`❌ ${source} scraping error:`, error);
    throw error;
  }
}

// Extract subscriber data from a generic object
function extractSubscriberFromObject(obj: any): any {
  const subscriber: any = {};
  
  // Name field variations
  subscriber.name = obj.name || obj.full_name || obj.fullName || obj.subscriber_name || 
                   obj.اسم || obj.الاسم || obj.اسم_المشترك || '';
  
  // Phone field variations  
  subscriber.phone = obj.phone || obj.mobile || obj.phone_number || obj.phoneNumber ||
                    obj.هاتف || obj.رقم_الهاتف || obj.موبايل || obj.telephone || '';
  
  // Email field variations
  subscriber.email = obj.email || obj.email_address || obj.بريد || obj.البريد_الالكتروني || '';
  
  // Address field variations
  subscriber.address = obj.address || obj.عنوان || obj.العنوان || obj.location || obj.الموقع || '';
  
  // Plan field variations
  subscriber.plan = obj.plan || obj.package || obj.subscription || obj.باقة || obj.الباقة || '';
  
  // Balance field variations
  subscriber.balance = parseFloat(obj.balance || obj.رصيد || obj.الرصيد || '0') || 0;
  
  // Clean values
  subscriber.name = sanitizeCSVValue(String(subscriber.name || '').trim());
  subscriber.phone = sanitizeCSVValue(String(subscriber.phone || '').trim());
  subscriber.email = sanitizeCSVValue(String(subscriber.email || '').trim());
  subscriber.address = sanitizeCSVValue(String(subscriber.address || '').trim());
  subscriber.plan = sanitizeCSVValue(String(subscriber.plan || '').trim());
  
  return subscriber;
}

// Extract subscribers from HTML table
function extractFromTable(tableHtml: string): any[] {
  const subscribers: any[] = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  
  const rows = tableHtml.match(rowRegex) || [];
  
  // First row might be headers
  let headers: string[] = [];
  if (rows.length > 0) {
    const headerCells: string[] = [];
    let cellMatch;
    const firstRowRegex = new RegExp(cellRegex.source, cellRegex.flags);
    const firstRow = rows[0] as string;
    while ((cellMatch = firstRowRegex.exec(firstRow)) !== null) {
      headerCells.push(cellMatch[1].replace(/<[^>]+>/g, '').trim().toLowerCase());
    }
    
    // Check if first row looks like headers
    const headerKeywords = ['name', 'phone', 'email', 'اسم', 'هاتف', 'بريد', 'عنوان', 'موبايل'];
    if (headerCells.some(h => headerKeywords.some(k => h.includes(k)))) {
      headers = headerCells;
    }
  }
  
  const startIndex = headers.length > 0 ? 1 : 0;
  
  for (let i = startIndex; i < rows.length; i++) {
    const cells: string[] = [];
    let cellMatch;
    const cellRegexCopy = new RegExp(cellRegex.source, cellRegex.flags);
    
    while ((cellMatch = cellRegexCopy.exec(rows[i])) !== null) {
      const content = cellMatch[1].replace(/<[^>]+>/g, '').trim();
      cells.push(content);
    }
    
    if (cells.length >= 2) {
      const subscriber: any = {};
      
      if (headers.length > 0) {
        // Map by headers
        headers.forEach((header, index) => {
          const value = cells[index] || '';
          if (header.includes('name') || header.includes('اسم')) {
            subscriber.name = value;
          } else if (header.includes('phone') || header.includes('mobile') || header.includes('هاتف') || header.includes('موبايل')) {
            subscriber.phone = value;
          } else if (header.includes('email') || header.includes('بريد')) {
            subscriber.email = value;
          } else if (header.includes('address') || header.includes('عنوان')) {
            subscriber.address = value;
          } else if (header.includes('plan') || header.includes('باقة') || header.includes('package')) {
            subscriber.plan = value;
          } else if (header.includes('balance') || header.includes('رصيد')) {
            subscriber.balance = parseFloat(value) || 0;
          }
        });
      } else {
        // Guess based on content
        for (const cell of cells) {
          if (/^(\+964|0)?7[3-9]\d{8}$/.test(cell.replace(/\s/g, ''))) {
            subscriber.phone = cell;
          } else if (cell.includes('@')) {
            subscriber.email = cell;
          } else if (!subscriber.name && cell.length > 2 && !cell.match(/^\d+$/)) {
            subscriber.name = cell;
          }
        }
      }
      
      if (subscriber.name && subscriber.phone) {
        subscriber.name = sanitizeCSVValue(subscriber.name);
        subscriber.phone = sanitizeCSVValue(subscriber.phone);
        subscriber.email = sanitizeCSVValue(subscriber.email || '');
        subscriber.address = sanitizeCSVValue(subscriber.address || '');
        subscriber.plan = sanitizeCSVValue(subscriber.plan || '');
        subscribers.push(subscriber);
      }
    }
  }
  
  return subscribers;
}

// Extract subscriber from HTML content block
function extractFromHtmlContent(html: string): any {
  const subscriber: any = {};
  
  // Try to find phone
  const phoneMatch = html.match(/(?:07[3-9]\d{8}|\+9647[3-9]\d{8})/);
  if (phoneMatch) {
    subscriber.phone = sanitizeCSVValue(phoneMatch[0]);
  }
  
  // Try to find email
  const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    subscriber.email = sanitizeCSVValue(emailMatch[0]);
  }
  
  // Try to find name
  const namePatterns = [
    /(?:الاسم|name|اسم)[:\s]*([^\n<>]{3,50})/i,
    /<[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)</i,
  ];
  
  for (const pattern of namePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      subscriber.name = sanitizeCSVValue(match[1].trim());
      break;
    }
  }
  
  // Ensure all values are sanitized before returning
  subscriber.name = subscriber.name ? sanitizeCSVValue(String(subscriber.name)) : '';
  subscriber.phone = subscriber.phone ? sanitizeCSVValue(String(subscriber.phone)) : '';
  subscriber.email = subscriber.email ? sanitizeCSVValue(String(subscriber.email)) : '';
  
  return subscriber;
}

// Scrape data from SAS page
async function scrapeSASData(url: string): Promise<any[]> {
  return scrapeWebPage(url, 'SAS');
}

// Scrape data from National Project page
async function scrapeNationalProjectData(url: string): Promise<any[]> {
  return scrapeWebPage(url, 'National Project');
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