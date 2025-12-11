import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type InvoiceRow = Database['public']['Tables']['invoices']['Row'];
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
type InvoiceUpdate = Database['public']['Tables']['invoices']['Update'];
type InvoiceStatus = Database['public']['Enums']['invoice_status'];

export interface Invoice extends InvoiceRow {
  subscribers?: {
    name: string;
    phone: string;
    address: string | null;
  };
}

export const invoicesApi = {
  async getAll(limit?: number) {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        subscribers (name, phone, address)
      `)
      .order('created_at', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as Invoice[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        subscribers (name, phone, address)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Invoice;
  },

  async getBySubscriber(subscriberId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('subscriber_id', subscriberId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Invoice[];
  },

  async getByStatus(status: NonNullable<InvoiceStatus>, limit?: number) {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        subscribers (name, phone, address)
      `)
      .eq('status', status)
      .order('due_date', { ascending: true });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as Invoice[];
  },

  async getPending(limit?: number) {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        subscribers (name, phone, address)
      `)
      .in('status', ['pending', 'overdue'])
      .order('due_date', { ascending: true });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as Invoice[];
  },

  async create(invoice: InvoiceInsert) {
    const { data, error } = await supabase
      .from('invoices')
      .insert(invoice)
      .select()
      .single();
    
    if (error) throw error;
    return data as Invoice;
  },

  async update(id: string, updates: InvoiceUpdate) {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Invoice;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async count(status?: NonNullable<InvoiceStatus>) {
    let query = supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  },

  async sumByStatus(status: NonNullable<InvoiceStatus>) {
    const { data, error } = await supabase
      .from('invoices')
      .select('net_amount')
      .eq('status', status);
    
    if (error) throw error;
    return data?.reduce((sum, inv) => sum + (inv.net_amount || 0), 0) || 0;
  }
};
