import { supabase } from '@/integrations/supabase/client';
import { calculateDistance } from '@/utils/distanceCalculations';

export interface MapTechnician {
  id: string;
  name: string;
  phone?: string;
  specialization?: string;
  latitude: number;
  longitude: number;
  status: string;
  available: boolean;
  last_location_update?: string;
  speed?: number;
  heading?: number;
}

export interface MapSubscriber {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  latitude: number;
  longitude: number;
  agent_id?: string;
}

export interface MapTicket {
  id: string;
  ticket_number: string;
  issue_description: string;
  priority: string;
  status: string;
  scheduled_date?: string;
  latitude: number;
  longitude: number;
  location_address?: string;
  subscriber_name?: string;
  subscriber_phone?: string;
  subscriber_address?: string;
  technician_name?: string;
  technician_id?: string;
  created_at: string;
}

export interface AllMapData {
  technicians: MapTechnician[];
  subscribers: MapSubscriber[];
  tickets: MapTicket[];
}

export const mapDataApi = {
  // Get all technicians with locations
  async getTechnicians(): Promise<MapTechnician[]> {
    try {
      const { data, error } = await supabase
        .from('technicians_map_view')
        .select('*');

      if (error) throw error;

      return (data || [])
        .filter(t => t.latitude && t.longitude)
        .map(t => ({
          id: t.id,
          name: t.name,
          specialization: t.specialization,
          latitude: Number(t.latitude),
          longitude: Number(t.longitude),
          status: t.status || 'offline',
          available: t.available ?? true,
        }));
    } catch (error) {
      console.error('Error fetching technicians:', error);
      return [];
    }
  },

  // Get all subscribers with locations
  async getSubscribers(limit = 500): Promise<MapSubscriber[]> {
    try {
      const { data, error } = await supabase
        .from('subscribers_map_view')
        .select('*')
        .limit(limit);

      if (error) throw error;

      return (data || []).map(s => ({
        id: s.id,
        name: s.name,
        address: s.address,
        latitude: Number(s.latitude),
        longitude: Number(s.longitude),
        agent_id: s.agent_id,
      }));
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      return [];
    }
  },

  // Get tickets with locations
  async getTickets(filters?: { status?: string; priority?: string }): Promise<MapTicket[]> {
    try {
      let query = supabase
        .from('tickets_map_view')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (filters?.status) {
        query = query.eq('status', filters.status as any);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority as any);
      }

      const { data, error } = await query.limit(200);

      if (error) throw error;

      return (data || []).map(t => ({
        id: t.id,
        ticket_number: t.ticket_number,
        issue_description: t.issue_description,
        priority: t.priority,
        status: t.status,
        scheduled_date: t.scheduled_date,
        latitude: Number(t.latitude),
        longitude: Number(t.longitude),
        location_address: t.location_address,
        subscriber_name: t.subscriber_name,
        subscriber_address: t.subscriber_address,
        technician_name: t.technician_name,
        technician_id: t.technician_id,
        created_at: t.created_at,
      }));
    } catch (error) {
      console.error('Error fetching tickets:', error);
      return [];
    }
  },

  // Get all map data at once
  async getAllMapData(options?: {
    includeTechnicians?: boolean;
    includeSubscribers?: boolean;
    includeTickets?: boolean;
  }): Promise<AllMapData> {
    const opts = {
      includeTechnicians: true,
      includeSubscribers: true,
      includeTickets: true,
      ...options,
    };

    const results = await Promise.all([
      opts.includeTechnicians ? this.getTechnicians() : Promise.resolve([]),
      opts.includeSubscribers ? this.getSubscribers() : Promise.resolve([]),
      opts.includeTickets ? this.getTickets() : Promise.resolve([]),
    ]);

    return {
      technicians: results[0],
      subscribers: results[1],
      tickets: results[2],
    };
  },

  // Find nearest technicians using local Haversine calculation
  async findNearestTechnicians(
    lat: number,
    lng: number,
    maxDistanceKm = 50
  ): Promise<(MapTechnician & { distance_km: number })[]> {
    const technicians = await this.getTechnicians();

    return technicians
      .filter(t => t.available && (t.status === 'online' || t.status === 'available'))
      .map(t => ({
        ...t,
        distance_km: calculateDistance(lat, lng, t.latitude, t.longitude),
      }))
      .filter(t => t.distance_km <= maxDistanceKm)
      .sort((a, b) => a.distance_km - b.distance_km);
  },

  // Use database function to find nearest technician
  async findNearestTechnicianDB(
    lat: number,
    lng: number,
    maxDistanceKm = 50
  ): Promise<(MapTechnician & { distance_km: number }) | null> {
    try {
      const { data, error } = await supabase.rpc('find_nearest_technician', {
        target_lat: lat,
        target_lng: lng,
        max_distance_km: maxDistanceKm,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const t = data[0];
        return {
          id: t.technician_id,
          name: t.technician_name,
          phone: t.phone,
          latitude: Number(t.latitude),
          longitude: Number(t.longitude),
          status: t.status || 'online',
          available: true,
          distance_km: Number(t.distance_km),
        };
      }

      return null;
    } catch (error) {
      console.error('Error finding nearest technician:', error);
      return null;
    }
  },

  // Save location for an entity
  async saveLocation(
    type: 'subscriber' | 'technician' | 'ticket',
    id: string,
    latitude: number,
    longitude: number,
    extra?: { status?: string; location_address?: string }
  ): Promise<boolean> {
    try {
      let table: string;
      const updates: any = { latitude, longitude };

      switch (type) {
        case 'subscriber':
          table = 'subscribers';
          break;
        case 'technician':
          table = 'technicians';
          if (extra?.status) updates.status = extra.status;
          break;
        case 'ticket':
          table = 'maintenance_tickets';
          if (extra?.location_address) updates.location_address = extra.location_address;
          break;
        default:
          throw new Error('Invalid type');
      }

      const { error } = await supabase
        .from(table as any)
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving location:', error);
      return false;
    }
  },

  // Update current user's location (for technicians)
  async updateMyLocation(
    latitude: number,
    longitude: number,
    extra?: { accuracy?: number; speed?: number; heading?: number; status?: string }
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save to employee_locations
      const { error: locError } = await supabase.from('employee_locations').insert({
        user_id: user.id,
        latitude,
        longitude,
        accuracy: extra?.accuracy,
        speed: extra?.speed,
        heading: extra?.heading,
        device_info: {
          source: 'web',
          timestamp: new Date().toISOString(),
        },
      });

      if (locError) {
        console.error('Error saving location:', locError);
      }

      // Update technician status if specified
      if (extra?.status) {
        await supabase
          .from('technicians')
          .update({ status: extra.status, latitude, longitude })
          .eq('user_id', user.id);
      }

      return true;
    } catch (error) {
      console.error('Error updating location:', error);
      return false;
    }
  },
};

export default mapDataApi;
