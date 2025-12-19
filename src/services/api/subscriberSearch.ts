import { supabase } from '@/integrations/supabase/client';

export interface Subscriber {
  id: string;
  name: string;
  phone: string;
  username?: string;
  address?: string;
  plan?: string;
  balance?: number;
  email?: string;
  created_at?: string;
}

export interface SearchResult {
  success: boolean;
  subscriber?: Subscriber;
  subscribers?: Subscriber[];
  count?: number;
  error?: string;
  message?: string;
}

/**
 * Search for a subscriber by service ID (username)
 */
export async function getSubscriberByServiceId(serviceId: string): Promise<SearchResult> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  
  if (!token) {
    return { success: false, error: 'يرجى تسجيل الدخول أولاً' };
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-subscriber?service_id=${encodeURIComponent(serviceId)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message || 'خطأ في الاتصال' };
  }
}

/**
 * Search for a subscriber by phone number
 */
export async function getSubscriberByPhone(phone: string): Promise<SearchResult> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  
  if (!token) {
    return { success: false, error: 'يرجى تسجيل الدخول أولاً' };
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-subscriber?phone=${encodeURIComponent(phone)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message || 'خطأ في الاتصال' };
  }
}

/**
 * Search subscribers by general query (name, phone, username, address)
 */
export async function searchSubscribers(query: string): Promise<SearchResult> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  
  if (!token) {
    return { success: false, error: 'يرجى تسجيل الدخول أولاً' };
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-subscriber?search=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message || 'خطأ في الاتصال' };
  }
}

/**
 * Smart search - automatically detects if input is phone or service ID
 */
export async function smartSearch(input: string): Promise<SearchResult> {
  const cleanInput = input.trim();
  
  // Check if it's a phone number
  if (/^(\+964|0)?7[3-9]\d{8}$/.test(cleanInput)) {
    return getSubscriberByPhone(cleanInput);
  }
  
  // Try service ID first, then general search if not found
  const result = await getSubscriberByServiceId(cleanInput);
  if (result.success && result.subscriber) {
    return result;
  }
  
  // Fall back to general search
  return searchSubscribers(cleanInput);
}
