import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type PaymentRow = Database['public']['Tables']['payments']['Row'];
type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
type PaymentUpdate = Database['public']['Tables']['payments']['Update'];

export interface Payment extends PaymentRow {
  subscribers?: {
    name: string;
    phone: string;
  };
}

export const paymentsApi = {
  async getAll(limit?: number) {
    let query = supabase
      .from('payments')
      .select(`
        *,
        subscribers (name, phone)
      `)
      .order('created_at', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as Payment[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        subscribers (name, phone)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Payment;
  },

  async getBySubscriber(subscriberId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('subscriber_id', subscriberId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Payment[];
  },

  async getByDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        subscribers (name, phone)
      `)
      .gte('payment_date', startDate)
      .lte('payment_date', endDate)
      .order('payment_date', { ascending: false });
    
    if (error) throw error;
    return data as Payment[];
  },

  async create(payment: PaymentInsert) {
    const { data, error } = await supabase
      .from('payments')
      .insert(payment)
      .select()
      .single();
    
    if (error) throw error;
    return data as Payment;
  },

  async update(id: string, updates: PaymentUpdate) {
    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Payment;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async sumByDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('amount')
      .gte('payment_date', startDate)
      .lte('payment_date', endDate);
    
    if (error) throw error;
    return data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  },

  async getTotalRevenue() {
    const { data, error } = await supabase
      .from('payments')
      .select('amount');
    
    if (error) throw error;
    return data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  }
};
