import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type VoucherRow = Database['public']['Tables']['vouchers']['Row'];
type VoucherInsert = Database['public']['Tables']['vouchers']['Insert'];
type VoucherUpdate = Database['public']['Tables']['vouchers']['Update'];
type VoucherType = Database['public']['Enums']['voucher_type'];

export type Voucher = VoucherRow;

export const vouchersApi = {
  async getAll(limit?: number) {
    let query = supabase
      .from('vouchers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as Voucher[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Voucher;
  },

  async getByType(type: VoucherType, limit?: number) {
    let query = supabase
      .from('vouchers')
      .select('*')
      .eq('voucher_type', type)
      .order('created_at', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as Voucher[];
  },

  async create(voucher: VoucherInsert) {
    const { data, error } = await supabase
      .from('vouchers')
      .insert(voucher)
      .select()
      .single();
    
    if (error) throw error;
    return data as Voucher;
  },

  async update(id: string, updates: VoucherUpdate) {
    const { data, error } = await supabase
      .from('vouchers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Voucher;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('vouchers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async sumByType(type: VoucherType) {
    const { data, error } = await supabase
      .from('vouchers')
      .select('amount')
      .eq('voucher_type', type);
    
    if (error) throw error;
    return data?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;
  },

  async getTotalExpenses() {
    return this.sumByType('expense');
  }
};
