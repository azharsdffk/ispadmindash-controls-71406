import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type TicketRow = Database['public']['Tables']['maintenance_tickets']['Row'];
type TicketInsert = Database['public']['Tables']['maintenance_tickets']['Insert'];
type TicketUpdate = Database['public']['Tables']['maintenance_tickets']['Update'];
type TicketStatus = Database['public']['Enums']['ticket_status'];
type TicketPriority = Database['public']['Enums']['ticket_priority'];

export interface MaintenanceTicket extends TicketRow {
  subscribers?: {
    id: string;
    name: string;
    phone: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  technicians?: {
    name: string;
    phone: string;
  } | null;
}

export const ticketsApi = {
  async getAll(limit?: number) {
    let query = supabase
      .from('maintenance_tickets')
      .select(`
        *,
        subscribers (id, name, phone, address, latitude, longitude),
        technicians (name, phone)
      `)
      .order('created_at', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as MaintenanceTicket[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('maintenance_tickets')
      .select(`
        *,
        subscribers (id, name, phone, address, latitude, longitude),
        technicians (name, phone)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as MaintenanceTicket;
  },

  async getByTechnician(technicianId: string) {
    const { data, error } = await supabase
      .from('maintenance_tickets')
      .select(`
        *,
        subscribers (id, name, phone, address, latitude, longitude)
      `)
      .eq('technician_id', technicianId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as MaintenanceTicket[];
  },

  async getByStatus(status: TicketStatus, limit?: number) {
    let query = supabase
      .from('maintenance_tickets')
      .select(`
        *,
        subscribers (id, name, phone, address, latitude, longitude),
        technicians (name, phone)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as MaintenanceTicket[];
  },

  async getOpen(limit?: number) {
    let query = supabase
      .from('maintenance_tickets')
      .select(`
        *,
        subscribers (id, name, phone, address, latitude, longitude),
      technicians (name, phone)
      `)
      .in('status', ['new', 'open', 'accepted_by_agent', 'tech_assigned', 'tech_on_the_way', 'tech_arrived', 'in_progress'])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as MaintenanceTicket[];
  },

  async create(ticket: TicketInsert) {
    const { data, error } = await supabase
      .from('maintenance_tickets')
      .insert(ticket)
      .select()
      .single();
    
    if (error) throw error;
    return data as MaintenanceTicket;
  },

  async update(id: string, updates: TicketUpdate) {
    const { data, error } = await supabase
      .from('maintenance_tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as MaintenanceTicket;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('maintenance_tickets')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async count(status?: TicketStatus) {
    let query = supabase
      .from('maintenance_tickets')
      .select('*', { count: 'exact', head: true });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  },

  async countByStatus() {
    const [newCount, open, acceptedByAgent, techAssigned, techOnTheWay, techArrived, inProgress, resolved, closed] = await Promise.all([
      this.count('new'),
      this.count('open'),
      this.count('accepted_by_agent'),
      this.count('tech_assigned'),
      this.count('tech_on_the_way'),
      this.count('tech_arrived'),
      this.count('in_progress'),
      this.count('resolved'),
      this.count('closed')
    ]);
    
    const active = newCount + open + acceptedByAgent + techAssigned + techOnTheWay + techArrived + inProgress;
    return { 
      new: newCount, 
      open, 
      acceptedByAgent, 
      techAssigned, 
      techOnTheWay, 
      techArrived, 
      inProgress, 
      resolved, 
      closed, 
      active,
      total: active + resolved + closed 
    };
  },

  async updateStatus(id: string, status: TicketStatus) {
    return this.update(id, { status });
  },

  async assignTechnician(id: string, technicianId: string) {
    return this.update(id, { 
      technician_id: technicianId,
      status: 'tech_assigned'
    });
  }
};
