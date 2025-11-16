import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Users, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'subscriber' | 'technician';
}

export const MapView = () => {
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      // Execute queries in parallel with limits for better performance
      const [subscribersRes, techLocationsRes] = await Promise.all([
        supabase
          .from('subscribers')
          .select('id, name, latitude, longitude')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .limit(50), // Limit for performance
        supabase
          .from('employee_locations')
          .select(`
            id,
            latitude,
            longitude,
            user_id,
            profiles!inner(full_name)
          `)
          .order('recorded_at', { ascending: false })
          .limit(10)
      ]);

      if (subscribersRes.error) {
        console.error('Error fetching subscribers:', subscribersRes.error);
      }

      if (techLocationsRes.error) {
        console.error('Error fetching technician locations:', techLocationsRes.error);
      }

      const subscriberLocs: Location[] = (subscribersRes.data || []).map(s => ({
        id: s.id,
        name: s.name,
        latitude: Number(s.latitude),
        longitude: Number(s.longitude),
        type: 'subscriber' as const
      }));

      const techLocs: Location[] = (techLocationsRes.data || []).map((t: any) => ({
        id: t.id,
        name: t.profiles?.full_name || 'فني',
        latitude: Number(t.latitude),
        longitude: Number(t.longitude),
        type: 'technician' as const
      }));

      setLocations([...subscriberLocs, ...techLocs]);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]);
    }
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          خريطة توزيع المشتركين والفنيين
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-[400px] bg-muted rounded-lg overflow-hidden">
          {/* Placeholder for Map */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <MapPin className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                الخريطة التفاعلية - {locations.length} موقع
              </p>
              <div className="flex gap-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary"></div>
                  <span className="text-sm">الفنيين</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-success"></div>
                  <span className="text-sm">المشتركين</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location Stats */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
            <Wrench className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">فنيين نشطين</p>
              <p className="text-xl font-bold text-primary">
                {locations.filter(l => l.type === 'technician').length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg">
            <Users className="h-8 w-8 text-success" />
            <div>
              <p className="text-xs text-muted-foreground">مشتركين</p>
              <p className="text-xl font-bold text-success">
                {locations.filter(l => l.type === 'subscriber').length}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
