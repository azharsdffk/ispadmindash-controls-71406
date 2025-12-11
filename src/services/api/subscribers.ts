import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type SubscriberRow = Database['public']['Tables']['subscribers']['Row'];
type SubscriberInsert = Database['public']['Tables']['subscribers']['Insert'];
type SubscriberUpdate = Database['public']['Tables']['subscribers']['Update'];

export type Subscriber = SubscriberRow;

export const subscribersApi = {
  async getAll(limit?: number) {
    let query = supabase
      .from('subscribers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as Subscriber[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('subscribers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Subscriber;
  },

  async getByPhone(phone: string) {
    const { data, error } = await supabase
      .from('subscribers')
      .select('*')
      .or(`phone.ilike.%${phone}%,username.ilike.%${phone}%`)
      .single();
    
    if (error) throw error;
    return data as Subscriber;
  },

  async create(subscriber: SubscriberInsert) {
    const { data, error } = await supabase
      .from('subscribers')
      .insert(subscriber)
      .select()
      .single();
    
    if (error) throw error;
    return data as Subscriber;
  },

  async update(id: string, updates: SubscriberUpdate) {
    const { data, error } = await supabase
      .from('subscribers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Subscriber;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('subscribers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async count() {
    const { count, error } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count || 0;
  }
};
