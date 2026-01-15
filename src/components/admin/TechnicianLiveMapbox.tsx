import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MapPin, RefreshCw, Phone, Navigation, Activity, Clock, 
  Eye, ChevronLeft, ChevronRight, Maximize2, Minimize2,
  User, Locate
} from 'lucide-react';

interface TechnicianLocation {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
  accuracy: number | null;
  profile?: {
    id: string;
    full_name: string;
    phone: string | null;
  };
}

interface TechnicianLiveMapboxProps {
  onSelectTechnician?: (techId: string) => void;
  mapboxToken?: string;
}

export const TechnicianLiveMapbox = ({ onSelectTechnician, mapboxToken }: TechnicianLiveMapboxProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  
  const [locations, setLocations] = useState<TechnicianLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedTech, setSelectedTech] = useState<TechnicianLocation | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [token, setToken] = useState(mapboxToken || '');
  const [tokenInput, setTokenInput] = useState('');

  const isActiveRecently = (recordedAt: string) => {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return new Date(recordedAt) > fifteenMinutesAgo;
  };

  const fetchLocations = useCallback(async () => {
    try {
      const { data: locations } = await supabase
        .from('employee_locations')
        .select('*')
        .order('recorded_at', { ascending: false });

      if (locations) {
        const latestLocations = locations.reduce((acc: TechnicianLocation[], loc) => {
          if (!acc.find(l => l.user_id === loc.user_id)) {
            acc.push(loc);
          }
          return acc;
        }, []);

        const userIds = latestLocations.map(l => l.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', userIds);

        const locationsWithProfiles = latestLocations.map(loc => ({
          ...loc,
          profile: profiles?.find(p => p.id === loc.user_id)
        }));

        setLocations(locationsWithProfiles);
        setLastUpdate(new Date());
        updateMarkers(locationsWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMarkers = useCallback((newLocations: TechnicianLocation[]) => {
    if (!map.current) return;

    // Remove old markers that are not in new locations
    markersRef.current.forEach((marker, id) => {
      if (!newLocations.find(l => l.id === id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add or update markers
    newLocations.forEach(loc => {
      const isActive = isActiveRecently(loc.recorded_at);
      
      if (markersRef.current.has(loc.id)) {
        // Update existing marker position
        markersRef.current.get(loc.id)?.setLngLat([loc.longitude, loc.latitude]);
      } else {
        // Create new marker
        const el = document.createElement('div');
        el.className = 'technician-marker';
        el.innerHTML = `
          <div class="relative cursor-pointer group">
            <div class="w-10 h-10 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'} flex items-center justify-center text-white font-bold shadow-lg border-2 border-white transition-transform group-hover:scale-110">
              ${loc.profile?.full_name?.charAt(0) || 'ف'}
            </div>
            ${isActive ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>' : ''}
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-background/90 px-2 py-0.5 rounded text-xs font-medium shadow opacity-0 group-hover:opacity-100 transition-opacity">
              ${loc.profile?.full_name || 'فني'}
            </div>
          </div>
        `;

        el.addEventListener('click', () => {
          setSelectedTech(loc);
          map.current?.flyTo({
            center: [loc.longitude, loc.latitude],
            zoom: 16,
            duration: 1000
          });
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([loc.longitude, loc.latitude])
          .addTo(map.current!);

        markersRef.current.set(loc.id, marker);
      }
    });
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !token) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [44.366, 33.315], // Baghdad coordinates
      zoom: 10,
      attributionControl: false
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-left');
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true
      }),
      'top-left'
    );

    fetchLocations();

    // Set up real-time subscription
    const channel = supabase
      .channel('admin_live_locations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_locations' }, () => {
        fetchLocations();
      })
      .subscribe();

    // Auto-refresh every 30 seconds
    const refreshInterval = setInterval(fetchLocations, 30000);

    return () => {
      map.current?.remove();
      supabase.removeChannel(channel);
      clearInterval(refreshInterval);
    };
  }, [token, fetchLocations]);

  const flyToTechnician = (loc: TechnicianLocation) => {
    setSelectedTech(loc);
    map.current?.flyTo({
      center: [loc.longitude, loc.latitude],
      zoom: 16,
      duration: 1000
    });
  };

  const fitAllMarkers = () => {
    if (!map.current || locations.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    locations.forEach(loc => {
      bounds.extend([loc.longitude, loc.latitude]);
    });

    map.current.fitBounds(bounds, {
      padding: 50,
      duration: 1000
    });
  };

  const filteredLocations = locations.filter(loc =>
    loc.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.profile?.phone?.includes(searchQuery)
  );

  const activeCount = locations.filter(l => isActiveRecently(l.recorded_at)).length;

  if (!token) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            خريطة تتبع الفنيين الحية
          </CardTitle>
          <CardDescription>أدخل مفتاح Mapbox لتفعيل الخريطة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            للحصول على مفتاح Mapbox، قم بزيارة{' '}
            <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              mapbox.com
            </a>{' '}
            وأنشئ حساباً مجانياً ثم انسخ Public Token من لوحة التحكم.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="أدخل Mapbox Public Token"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => setToken(tokenInput)} disabled={!tokenInput}>
              تفعيل الخريطة
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`glass-card overflow-hidden transition-all duration-300 ${fullscreen ? 'fixed inset-4 z-50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              خريطة تتبع الفنيين الحية
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-1">
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                {activeCount} فني نشط
              </span>
              <span className="flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3" />
                آخر تحديث: {lastUpdate.toLocaleTimeString('ar-IQ')}
              </span>
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchLocations} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={fitAllMarkers}>
              <Locate className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setFullscreen(!fullscreen)}>
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative">
        <div className="flex h-[500px]">
          {/* Sidebar */}
          <div className={`bg-background/95 backdrop-blur-sm border-l transition-all duration-300 overflow-hidden ${sidebarOpen ? 'w-80' : 'w-0'}`}>
            <div className="p-3 border-b">
              <Input
                placeholder="بحث عن فني..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="overflow-y-auto h-[calc(100%-50px)]">
              {filteredLocations.map(loc => (
                <div
                  key={loc.id}
                  className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedTech?.id === loc.id ? 'bg-primary/10 border-r-2 border-r-primary' : ''}`}
                  onClick={() => flyToTechnician(loc)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={`${isActiveRecently(loc.recorded_at) ? 'bg-green-500' : 'bg-gray-400'} text-white`}>
                        {loc.profile?.full_name?.charAt(0) || 'ف'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{loc.profile?.full_name || 'فني'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={isActiveRecently(loc.recorded_at) ? 'default' : 'secondary'} className={`text-xs ${isActiveRecently(loc.recorded_at) ? 'bg-green-500' : ''}`}>
                          {isActiveRecently(loc.recorded_at) ? 'نشط' : 'غير نشط'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(loc.recorded_at).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <Activity className={`h-4 w-4 ${isActiveRecently(loc.recorded_at) ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
                  </div>
                </div>
              ))}
              {filteredLocations.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>لا يوجد فنيين</p>
                </div>
              )}
            </div>
          </div>

          {/* Toggle Sidebar Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-12 px-1 bg-background/80 rounded-l-none"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>

          {/* Map Container */}
          <div ref={mapContainer} className="flex-1 relative" />

          {/* Selected Technician Info */}
          {selectedTech && (
            <div className="absolute bottom-4 left-4 right-4 mx-auto max-w-md z-10">
              <Card className="glass-card shadow-glow border-primary/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-primary">
                      <AvatarFallback className={`${isActiveRecently(selectedTech.recorded_at) ? 'bg-green-500' : 'bg-gray-400'} text-white text-lg`}>
                        {selectedTech.profile?.full_name?.charAt(0) || 'ف'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg">{selectedTech.profile?.full_name || 'فني'}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={isActiveRecently(selectedTech.recorded_at) ? 'default' : 'secondary'} className={isActiveRecently(selectedTech.recorded_at) ? 'bg-green-500' : ''}>
                          {isActiveRecently(selectedTech.recorded_at) ? '🟢 نشط' : '⚫ غير نشط'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(selectedTech.recorded_at).toLocaleString('ar-IQ')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        {selectedTech.latitude.toFixed(6)}, {selectedTech.longitude.toFixed(6)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {selectedTech.profile?.phone && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={`tel:${selectedTech.profile.phone}`}>
                            <Phone className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(`https://www.google.com/maps?q=${selectedTech.latitude},${selectedTech.longitude}`, '_blank')}
                      >
                        <Navigation className="h-4 w-4" />
                      </Button>
                      {onSelectTechnician && (
                        <Button size="sm" onClick={() => onSelectTechnician(selectedTech.user_id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </CardContent>

      <style>{`
        .technician-marker {
          z-index: 1;
        }
        .mapboxgl-popup-content {
          padding: 0;
          border-radius: 12px;
          overflow: hidden;
        }
      `}</style>
    </Card>
  );
};
