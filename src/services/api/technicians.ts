import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type TechnicianRow = Database['public']['Tables']['technicians']['Row'];
type TechnicianInsert = Database['public']['Tables']['technicians']['Insert'];
type TechnicianUpdate = Database['public']['Tables']['technicians']['Update'];

export type Technician = TechnicianRow;

export const techniciansApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('technicians')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data as Technician[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('technicians')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Technician;
  },

  async getAvailable() {
    const { data, error } = await supabase
      .from('technicians')
      .select('*')
      .eq('available', true)
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data as Technician[];
  },

  async create(technician: TechnicianInsert) {
    const { data, error } = await supabase
      .from('technicians')
      .insert(technician)
      .select()
      .single();
    
    if (error) throw error;
    return data as Technician;
  },

  async update(id: string, updates: TechnicianUpdate) {
    const { data, error } = await supabase
      .from('technicians')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Technician;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('technicians')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async toggleAvailability(id: string, available: boolean) {
    return this.update(id, { available });
  }
};
