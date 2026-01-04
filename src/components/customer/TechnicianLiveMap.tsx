import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Phone, Car, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface TechnicianLocation {
  id: string;
  technician_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  status: string;
  updated_at: string;
}

interface TechnicianLiveMapProps {
  ticketId: string;
  technicianId: string;
  technicianName: string;
  technicianPhone: string;
  customerLocation: { lat: number; lng: number } | null;
  etaMinutes?: number | null;
}

export function TechnicianLiveMap({
  ticketId,
  technicianId,
  technicianName,
  technicianPhone,
  customerLocation,
  etaMinutes
}: TechnicianLiveMapProps) {
  const [techLocation, setTechLocation] = useState<TechnicianLocation | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Fetch initial location
    const fetchLocation = async () => {
      const { data } = await supabase
        .from('technician_locations')
        .select('*')
        .eq('technician_id', technicianId)
        .single();
      
      if (data) {
        setTechLocation(data);
        setLastUpdate(new Date(data.updated_at));
      }
    };

    fetchLocation();

    // Subscribe to real-time location updates
    const channel = supabase
      .channel(`tech-location-${technicianId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'technician_locations', 
          filter: `technician_id=eq.${technicianId}` 
        },
        (payload) => {
          const newLocation = payload.new as TechnicianLocation;
          setTechLocation(newLocation);
          setLastUpdate(new Date(newLocation.updated_at));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [technicianId]);

  const refreshLocation = async () => {
    setIsRefreshing(true);
    const { data } = await supabase
      .from('technician_locations')
      .select('*')
      .eq('technician_id', technicianId)
      .single();
    
    if (data) {
      setTechLocation(data);
      setLastUpdate(new Date(data.updated_at));
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `منذ ${seconds} ثانية`;
    if (seconds < 3600) return `منذ ${Math.floor(seconds / 60)} دقيقة`;
    return `منذ ${Math.floor(seconds / 3600)} ساعة`;
  };

  const formatETA = (minutes: number) => {
    if (minutes < 60) return `${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} ساعة و ${mins} دقيقة` : `${hours} ساعة`;
  };

  const getGoogleMapsUrl = () => {
    if (!techLocation) return '#';
    return `https://www.google.com/maps?q=${techLocation.latitude},${techLocation.longitude}`;
  };

  const getDirectionsUrl = () => {
    if (!techLocation || !customerLocation) return '#';
    return `https://www.google.com/maps/dir/${techLocation.latitude},${techLocation.longitude}/${customerLocation.lat},${customerLocation.lng}`;
  };

  const getStatusBadge = () => {
    switch (techLocation?.status) {
      case 'moving':
        return <Badge className="bg-orange-500 animate-pulse">في الطريق</Badge>;
      case 'arrived':
        return <Badge className="bg-green-500">وصل</Badge>;
      case 'working':
        return <Badge className="bg-purple-500">يعمل</Badge>;
      default:
        return <Badge variant="secondary">جاهز</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardHeader className="pb-3 bg-gradient-to-l from-orange-500/10 to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Car className="h-5 w-5 text-orange-500" />
            <span>تتبع الفني المباشر</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button
              size="icon"
              variant="ghost"
              onClick={refreshLocation}
              className={cn(isRefreshing && 'animate-spin')}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-4">
        {/* ETA Card */}
        {etaMinutes && (
          <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-orange-600 mb-1">
              <Clock className="h-5 w-5" />
              <span className="text-sm">الوقت المتوقع للوصول</span>
            </div>
            <div className="text-3xl font-bold text-orange-600">
              {formatETA(etaMinutes)}
            </div>
          </div>
        )}

        {/* Map Placeholder */}
        <div className="relative bg-muted rounded-lg h-48 overflow-hidden">
          {techLocation ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                <div className="relative w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg">
                  <Navigation 
                    className="h-8 w-8 text-primary-foreground" 
                    style={{ 
                      transform: techLocation.heading 
                        ? `rotate(${techLocation.heading}deg)` 
                        : 'none' 
                    }}
                  />
                </div>
              </div>
              
              <p className="mt-4 text-sm font-medium">{technicianName}</p>
              
              {techLocation.speed && techLocation.speed > 0 && (
                <p className="text-xs text-muted-foreground">
                  السرعة: {Math.round(techLocation.speed * 3.6)} كم/س
                </p>
              )}
              
              {lastUpdate && (
                <p className="text-xs text-muted-foreground mt-1">
                  آخر تحديث: {formatTimeAgo(lastUpdate)}
                </p>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">جاري تحميل الموقع...</p>
              </div>
            </div>
          )}
          
          {/* Decorative Map Grid */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {[...Array(10)].map((_, i) => (
                <line key={`h-${i}`} x1="0" y1={i * 10} x2="100" y2={i * 10} stroke="currentColor" strokeWidth="0.5" />
              ))}
              {[...Array(10)].map((_, i) => (
                <line key={`v-${i}`} x1={i * 10} y1="0" x2={i * 10} y2="100" stroke="currentColor" strokeWidth="0.5" />
              ))}
            </svg>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" asChild>
            <a href={getGoogleMapsUrl()} target="_blank" rel="noopener noreferrer">
              <MapPin className="h-4 w-4 ml-2" />
              عرض على الخريطة
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={`tel:${technicianPhone}`}>
              <Phone className="h-4 w-4 ml-2" />
              اتصال بالفني
            </a>
          </Button>
        </div>

        {/* Technician Info */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{technicianName}</p>
              <p className="text-xs text-muted-foreground">{technicianPhone}</p>
            </div>
          </div>
          {techLocation?.accuracy && (
            <Badge variant="outline" className="text-xs">
              دقة {Math.round(techLocation.accuracy)}م
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
