import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AgentRow = Database['public']['Tables']['agents']['Row'];
type AgentInsert = Database['public']['Tables']['agents']['Insert'];
type AgentUpdate = Database['public']['Tables']['agents']['Update'];

export type Agent = AgentRow;

export const agentsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('region', { ascending: true });
    
    if (error) throw error;
    return data as Agent[];
  },

  async getActive() {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('active', true)
      .order('region', { ascending: true });
    
    if (error) throw error;
    return data as Agent[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Agent;
  },

  async getByRegion(region: string) {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('region', region)
      .eq('active', true);
    
    if (error) throw error;
    return data as Agent[];
  },

  async create(agent: AgentInsert) {
    const { data, error } = await supabase
      .from('agents')
      .insert(agent)
      .select()
      .single();
    
    if (error) throw error;
    return data as Agent;
  },

  async update(id: string, updates: AgentUpdate) {
    const { data, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Agent;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async assignToSubscriber(subscriberId: string, agentId: string) {
    const { error } = await supabase
      .from('subscribers')
      .update({ agent_id: agentId })
      .eq('id', subscriberId);
    
    if (error) throw error;
  },

  async count() {
    const { count, error } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);
    
    if (error) throw error;
    return count || 0;
  }
};
