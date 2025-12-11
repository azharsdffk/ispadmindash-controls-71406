import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type PackageRow = Database['public']['Tables']['packages']['Row'];
type PackageInsert = Database['public']['Tables']['packages']['Insert'];
type PackageUpdate = Database['public']['Tables']['packages']['Update'];

export type Package = PackageRow;

export const packagesApi = {
  async getAll(activeOnly: boolean = false) {
    let query = supabase
      .from('packages')
      .select('*')
      .order('monthly_price', { ascending: true });
    
    if (activeOnly) {
      query = query.eq('active', true);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as Package[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Package;
  },

  async getActive() {
    return this.getAll(true);
  },

  async create(pkg: PackageInsert) {
    const { data, error } = await supabase
      .from('packages')
      .insert(pkg)
      .select()
      .single();
    
    if (error) throw error;
    return data as Package;
  },

  async update(id: string, updates: PackageUpdate) {
    const { data, error } = await supabase
      .from('packages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Package;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async toggleActive(id: string, active: boolean) {
    return this.update(id, { active });
  }
};
