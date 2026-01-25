import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  MapPin, RefreshCw, Phone, Navigation, Activity, Clock, 
  Eye, ChevronLeft, ChevronRight, Maximize2, Minimize2,
  User, Locate, Route, History, Zap, Signal, MapIcon,
  Layers, Target, TrendingUp, Users
} from 'lucide-react';

interface TechnicianLocation {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
  accuracy: number | null;
  heading?: number | null;
  speed?: number | null;
  profile?: {
    id: string;
    full_name: string;
    phone: string | null;
  };
}

interface LocationHistory {
  id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
  accuracy: number | null;
}

interface TechnicianLiveMapboxProps {
  onSelectTechnician?: (techId: string) => void;
  mapboxToken?: string;
}

export const TechnicianLiveMapbox = ({ onSelectTechnician, mapboxToken }: TechnicianLiveMapboxProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const routeLayersRef = useRef<Set<string>>(new Set());
  
  const [locations, setLocations] = useState<TechnicianLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedTech, setSelectedTech] = useState<TechnicianLocation | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [token, setToken] = useState(mapboxToken || '');
  const [tokenInput, setTokenInput] = useState('');
  const [mapStyle, setMapStyle] = useState('streets-v12');
  const [showRoutes, setShowRoutes] = useState(false);
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [followMode, setFollowMode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('list');

  const mapStyles = [
    { id: 'streets-v12', name: 'شوارع', icon: MapIcon },
    { id: 'satellite-streets-v12', name: 'قمر صناعي', icon: Layers },
    { id: 'dark-v11', name: 'داكن', icon: Target },
  ];

  const isActiveRecently = (recordedAt: string) => {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return new Date(recordedAt) > fifteenMinutesAgo;
  };

  const isActiveNow = (recordedAt: string) => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    return new Date(recordedAt) > twoMinutesAgo;
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

        // If following a technician, fly to their location
        if (followMode) {
          const followedTech = locationsWithProfiles.find(l => l.user_id === followMode);
          if (followedTech && map.current) {
            map.current.flyTo({
              center: [followedTech.longitude, followedTech.latitude],
              zoom: 17,
              duration: 500
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  }, [followMode]);

  const fetchLocationHistory = async (userId: string) => {
    setHistoryLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('employee_locations')
        .select('id, latitude, longitude, recorded_at, accuracy')
        .eq('user_id', userId)
        .gte('recorded_at', today.toISOString())
        .order('recorded_at', { ascending: true });

      if (data) {
        setLocationHistory(data);
        drawRoute(data);
      }
    } catch (error) {
      console.error('Error fetching location history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const drawRoute = (history: LocationHistory[]) => {
    if (!map.current || history.length < 2) return;

    // Remove existing route layers
    routeLayersRef.current.forEach(layerId => {
      if (map.current?.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
      if (map.current?.getSource(layerId)) {
        map.current.removeSource(layerId);
      }
    });
    routeLayersRef.current.clear();

    const coordinates = history.map(h => [h.longitude, h.latitude]);
    const routeId = `route-${Date.now()}`;

    map.current.addSource(routeId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates
        }
      }
    });

    // Add gradient route line
    map.current.addLayer({
      id: routeId,
      type: 'line',
      source: routeId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3b82f6',
        'line-width': 4,
        'line-opacity': 0.8
      }
    });

    // Add animated dots for route points
    const dotsId = `dots-${Date.now()}`;
    map.current.addSource(dotsId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: history.map((h, i) => ({
          type: 'Feature',
          properties: { index: i, time: h.recorded_at },
          geometry: {
            type: 'Point',
            coordinates: [h.longitude, h.latitude]
          }
        }))
      }
    });

    map.current.addLayer({
      id: dotsId,
      type: 'circle',
      source: dotsId,
      paint: {
        'circle-radius': 5,
        'circle-color': '#60a5fa',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    routeLayersRef.current.add(routeId);
    routeLayersRef.current.add(dotsId);

    // Fit bounds to show the entire route
    const bounds = new mapboxgl.LngLatBounds();
    coordinates.forEach(coord => bounds.extend(coord as [number, number]));
    map.current.fitBounds(bounds, { padding: 50, duration: 1000 });
  };

  const clearRoute = () => {
    routeLayersRef.current.forEach(layerId => {
      if (map.current?.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
      if (map.current?.getSource(layerId)) {
        map.current.removeSource(layerId);
      }
    });
    routeLayersRef.current.clear();
    setLocationHistory([]);
    setShowRoutes(false);
  };

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
      const isLive = isActiveNow(loc.recorded_at);
      
      if (markersRef.current.has(loc.id)) {
        // Update existing marker position with animation
        const marker = markersRef.current.get(loc.id);
        marker?.setLngLat([loc.longitude, loc.latitude]);
        
        // Update marker element class for live status
        const el = marker?.getElement();
        if (el) {
          const statusIndicator = el.querySelector('.status-indicator');
          if (statusIndicator) {
            statusIndicator.className = `status-indicator absolute -top-1 -right-1 w-4 h-4 rounded-full ${isLive ? 'bg-green-400 animate-ping' : isActive ? 'bg-yellow-400' : 'bg-gray-400'}`;
          }
        }
      } else {
        // Create new marker with enhanced design
        const el = document.createElement('div');
        el.className = 'technician-marker';
        el.innerHTML = `
          <div class="relative cursor-pointer group transform transition-all duration-300 hover:scale-110">
            <div class="w-12 h-12 rounded-full ${isLive ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/50' : isActive ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 'bg-gradient-to-br from-gray-400 to-gray-600'} flex items-center justify-center text-white font-bold shadow-lg border-3 border-white">
              ${loc.profile?.full_name?.charAt(0) || 'ف'}
            </div>
            <div class="status-indicator absolute -top-1 -right-1 w-4 h-4 rounded-full ${isLive ? 'bg-green-400 animate-ping' : isActive ? 'bg-yellow-400' : 'bg-gray-400'}"></div>
            <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/95 px-3 py-1.5 rounded-lg text-xs font-medium shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 text-white border border-white/10">
              <div class="font-bold">${loc.profile?.full_name || 'فني'}</div>
              <div class="text-[10px] text-gray-300 flex items-center gap-1 justify-center">
                ${isLive ? '🟢 متصل الآن' : isActive ? '🟡 نشط' : '⚫ غير متصل'}
              </div>
            </div>
          </div>
        `;

        el.addEventListener('click', () => {
          setSelectedTech(loc);
          setFollowMode(null);
          map.current?.flyTo({
            center: [loc.longitude, loc.latitude],
            zoom: 17,
            duration: 1000,
            pitch: 45
          });
        });

        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
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
      style: `mapbox://styles/mapbox/${mapStyle}`,
      center: [44.366, 33.315], // Baghdad coordinates
      zoom: 11,
      pitch: 0,
      bearing: 0,
      attributionControl: false
    });

    map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-left');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-left');
    map.current.addControl(new mapboxgl.ScaleControl({ maxWidth: 100 }), 'bottom-left');

    fetchLocations();

    // Set up real-time subscription
    const channel = supabase
      .channel('admin_live_locations_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_locations' }, () => {
        fetchLocations();
      })
      .subscribe();

    // Auto-refresh every 10 seconds for more real-time feel
    const refreshInterval = setInterval(fetchLocations, 10000);

    return () => {
      map.current?.remove();
      supabase.removeChannel(channel);
      clearInterval(refreshInterval);
    };
  }, [token, mapStyle, fetchLocations]);

  const changeMapStyle = (style: string) => {
    setMapStyle(style);
    if (map.current) {
      map.current.setStyle(`mapbox://styles/mapbox/${style}`);
    }
  };

  const flyToTechnician = (loc: TechnicianLocation) => {
    setSelectedTech(loc);
    clearRoute();
    map.current?.flyTo({
      center: [loc.longitude, loc.latitude],
      zoom: 17,
      duration: 1000,
      pitch: 45
    });
  };

  const toggleFollowMode = (userId: string) => {
    if (followMode === userId) {
      setFollowMode(null);
    } else {
      setFollowMode(userId);
      const tech = locations.find(l => l.user_id === userId);
      if (tech && map.current) {
        map.current.flyTo({
          center: [tech.longitude, tech.latitude],
          zoom: 17,
          duration: 1000
        });
      }
    }
  };

  const showTechnicianRoute = async (loc: TechnicianLocation) => {
    setSelectedTech(loc);
    setShowRoutes(true);
    await fetchLocationHistory(loc.user_id);
  };

  const fitAllMarkers = () => {
    if (!map.current || locations.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    locations.forEach(loc => {
      bounds.extend([loc.longitude, loc.latitude]);
    });

    map.current.fitBounds(bounds, {
      padding: 80,
      duration: 1000,
      pitch: 0
    });
  };

  const filteredLocations = locations.filter(loc =>
    loc.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.profile?.phone?.includes(searchQuery)
  );

  const activeCount = locations.filter(l => isActiveRecently(l.recorded_at)).length;
  const liveCount = locations.filter(l => isActiveNow(l.recorded_at)).length;

  if (!token) {
    return (
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-blue-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <MapPin className="h-5 w-5 text-blue-400" />
            خريطة تتبع الفنيين التفاعلية
          </CardTitle>
          <CardDescription className="text-blue-200/70">أدخل مفتاح Mapbox لتفعيل الخريطة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-blue-200/60">
            للحصول على مفتاح Mapbox مجاني، قم بزيارة{' '}
            <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              mapbox.com
            </a>{' '}
            وأنشئ حساباً ثم انسخ Public Token.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="أدخل Mapbox Public Token"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="flex-1 bg-slate-700/50 border-blue-500/30 text-white"
            />
            <Button onClick={() => setToken(tokenInput)} disabled={!tokenInput} className="bg-blue-600 hover:bg-blue-700">
              تفعيل الخريطة
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-slate-800 to-slate-900 border-blue-500/30 overflow-hidden transition-all duration-300 ${fullscreen ? 'fixed inset-2 z-50' : ''}`}>
      <CardHeader className="pb-2 border-b border-blue-500/20">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <MapPin className="h-5 w-5 text-blue-400" />
              </div>
              خريطة تتبع الفنيين التفاعلية
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-2 text-blue-200/70">
              <span className="flex items-center gap-1.5 bg-green-500/20 px-2 py-1 rounded-full">
                <Zap className="h-3 w-3 text-green-400" />
                <span className="text-green-300 font-medium">{liveCount}</span> متصل الآن
              </span>
              <span className="flex items-center gap-1.5 bg-yellow-500/20 px-2 py-1 rounded-full">
                <Signal className="h-3 w-3 text-yellow-400" />
                <span className="text-yellow-300 font-medium">{activeCount}</span> نشط
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <Clock className="h-3 w-3 text-blue-300" />
                {lastUpdate.toLocaleTimeString('ar-IQ')}
              </span>
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Map Style Buttons */}
            <div className="flex gap-1 bg-slate-700/50 p-1 rounded-lg">
              {mapStyles.map(style => (
                <Button 
                  key={style.id}
                  variant={mapStyle === style.id ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => changeMapStyle(style.id)}
                  className={`h-8 px-2 ${mapStyle === style.id ? 'bg-blue-600' : 'text-blue-200 hover:bg-slate-600'}`}
                >
                  <style.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={fetchLocations} disabled={loading} className="border-blue-500/30 text-blue-200 hover:bg-blue-500/20">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={fitAllMarkers} className="border-blue-500/30 text-blue-200 hover:bg-blue-500/20">
              <Users className="h-4 w-4" />
            </Button>
            {showRoutes && (
              <Button variant="outline" size="sm" onClick={clearRoute} className="border-red-500/30 text-red-300 hover:bg-red-500/20">
                <Route className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setFullscreen(!fullscreen)} className="border-blue-500/30 text-blue-200 hover:bg-blue-500/20">
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative">
        <div className={`flex ${fullscreen ? 'h-[calc(100vh-180px)]' : 'h-[600px]'}`}>
          {/* Sidebar */}
          <div className={`bg-slate-800/95 backdrop-blur-sm border-l border-blue-500/20 transition-all duration-300 overflow-hidden ${sidebarOpen ? 'w-80' : 'w-0'}`}>
            <div className="p-3 border-b border-blue-500/20">
              <Input
                placeholder="🔍 بحث عن فني..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 bg-slate-700/50 border-blue-500/30 text-white placeholder:text-blue-200/50"
              />
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full bg-slate-700/30 p-1 rounded-none border-b border-blue-500/20">
                <TabsTrigger value="list" className="flex-1 text-xs data-[state=active]:bg-blue-600">
                  <Users className="h-3 w-3 ml-1" />
                  الفنيين
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-1 text-xs data-[state=active]:bg-blue-600">
                  <History className="h-3 w-3 ml-1" />
                  السجل
                </TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="m-0">
                <ScrollArea className="h-[calc(100%-110px)]">
                  {filteredLocations.map(loc => {
                    const isLive = isActiveNow(loc.recorded_at);
                    const isActive = isActiveRecently(loc.recorded_at);
                    const isFollowing = followMode === loc.user_id;
                    
                    return (
                      <div
                        key={loc.id}
                        className={`p-3 border-b border-blue-500/10 cursor-pointer hover:bg-blue-500/10 transition-all ${selectedTech?.id === loc.id ? 'bg-blue-500/20 border-r-2 border-r-blue-400' : ''} ${isFollowing ? 'ring-2 ring-green-400 ring-inset' : ''}`}
                        onClick={() => flyToTechnician(loc)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-11 w-11 border-2 border-white/20">
                              <AvatarFallback className={`${isLive ? 'bg-gradient-to-br from-green-400 to-green-600' : isActive ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 'bg-gradient-to-br from-gray-400 to-gray-600'} text-white font-bold`}>
                                {loc.profile?.full_name?.charAt(0) || 'ف'}
                              </AvatarFallback>
                            </Avatar>
                            {isLive && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800 animate-pulse" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-white">{loc.profile?.full_name || 'فني'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                className={`text-[10px] px-1.5 py-0 ${isLive ? 'bg-green-500/30 text-green-300 border-green-500/50' : isActive ? 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50' : 'bg-gray-500/30 text-gray-300 border-gray-500/50'}`}
                              >
                                {isLive ? '🟢 متصل' : isActive ? '🟡 نشط' : '⚫ غير متصل'}
                              </Badge>
                              <span className="text-[10px] text-blue-200/60">
                                {new Date(loc.recorded_at).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className={`h-7 w-7 p-0 ${isFollowing ? 'text-green-400 bg-green-500/20' : 'text-blue-300 hover:bg-blue-500/20'}`}
                              onClick={(e) => { e.stopPropagation(); toggleFollowMode(loc.user_id); }}
                              title={isFollowing ? 'إيقاف المتابعة' : 'متابعة مباشرة'}
                            >
                              <Target className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 w-7 p-0 text-blue-300 hover:bg-blue-500/20"
                              onClick={(e) => { e.stopPropagation(); showTechnicianRoute(loc); }}
                              title="عرض المسار"
                            >
                              <Route className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredLocations.length === 0 && (
                    <div className="p-8 text-center text-blue-200/50">
                      <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>لا يوجد فنيين</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="history" className="m-0 p-3">
                {selectedTech ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-2 bg-blue-500/20 rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-600 text-white text-xs">
                          {selectedTech.profile?.full_name?.charAt(0) || 'ف'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white font-medium text-sm">{selectedTech.profile?.full_name}</span>
                    </div>
                    {historyLoading ? (
                      <div className="flex justify-center py-8">
                        <RefreshCw className="h-6 w-6 text-blue-400 animate-spin" />
                      </div>
                    ) : locationHistory.length > 0 ? (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                          {locationHistory.map((h, i) => (
                            <div key={h.id} className="flex items-center gap-2 p-2 bg-slate-700/30 rounded text-xs">
                              <div className={`w-2 h-2 rounded-full ${i === locationHistory.length - 1 ? 'bg-green-400' : 'bg-blue-400'}`} />
                              <span className="text-blue-200/70">{new Date(h.recorded_at).toLocaleTimeString('ar-IQ')}</span>
                              <span className="text-white/50 font-mono text-[10px]">
                                {h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="text-center text-blue-200/50 py-8 text-sm">لا يوجد سجل لهذا اليوم</p>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-blue-200/50 py-8 text-sm">اختر فني لعرض سجل الحركة</p>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Toggle Sidebar Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-16 px-1 bg-slate-800/90 rounded-l-none border-l-0 border border-blue-500/30 text-blue-200 hover:bg-blue-500/20"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>

          {/* Map Container */}
          <div ref={mapContainer} className="flex-1 relative" />

          {/* Follow Mode Indicator */}
          {followMode && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
              <Badge className="bg-green-500/90 text-white px-4 py-2 text-sm animate-pulse shadow-lg">
                <Target className="h-4 w-4 ml-2 inline" />
                وضع المتابعة المباشرة نشط
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-5 w-5 p-0 mr-2 text-white hover:bg-green-600"
                  onClick={() => setFollowMode(null)}
                >
                  ✕
                </Button>
              </Badge>
            </div>
          )}

          {/* Selected Technician Info */}
          {selectedTech && (
            <div className="absolute bottom-4 left-4 right-4 mx-auto max-w-lg z-10">
              <Card className="bg-slate-900/95 backdrop-blur-sm border-blue-500/30 shadow-xl shadow-blue-500/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-16 w-16 border-3 border-blue-400 shadow-lg">
                        <AvatarFallback className={`${isActiveNow(selectedTech.recorded_at) ? 'bg-gradient-to-br from-green-400 to-green-600' : isActiveRecently(selectedTech.recorded_at) ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 'bg-gradient-to-br from-gray-400 to-gray-600'} text-white text-xl font-bold`}>
                          {selectedTech.profile?.full_name?.charAt(0) || 'ف'}
                        </AvatarFallback>
                      </Avatar>
                      {isActiveNow(selectedTech.recorded_at) && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-slate-900 animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-white">{selectedTech.profile?.full_name || 'فني'}</h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={`${isActiveNow(selectedTech.recorded_at) ? 'bg-green-500/30 text-green-300' : isActiveRecently(selectedTech.recorded_at) ? 'bg-yellow-500/30 text-yellow-300' : 'bg-gray-500/30 text-gray-300'}`}>
                          {isActiveNow(selectedTech.recorded_at) ? '🟢 متصل الآن' : isActiveRecently(selectedTech.recorded_at) ? '🟡 نشط' : '⚫ غير متصل'}
                        </Badge>
                        <span className="text-xs text-blue-200/60">
                          {new Date(selectedTech.recorded_at).toLocaleString('ar-IQ')}
                        </span>
                      </div>
                      <p className="text-[10px] text-blue-200/50 mt-1.5 font-mono bg-slate-800 px-2 py-0.5 rounded inline-block">
                        📍 {selectedTech.latitude.toFixed(6)}, {selectedTech.longitude.toFixed(6)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {selectedTech.profile?.phone && (
                        <Button size="sm" variant="outline" asChild className="border-green-500/50 text-green-300 hover:bg-green-500/20">
                          <a href={`tel:${selectedTech.profile.phone}`}>
                            <Phone className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(`https://www.google.com/maps?q=${selectedTech.latitude},${selectedTech.longitude}`, '_blank')}
                        className="border-blue-500/50 text-blue-300 hover:bg-blue-500/20"
                      >
                        <Navigation className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => showTechnicianRoute(selectedTech)}
                        className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                      >
                        <Route className="h-4 w-4" />
                      </Button>
                      {onSelectTechnician && (
                        <Button size="sm" onClick={() => onSelectTechnician(selectedTech.user_id)} className="bg-blue-600 hover:bg-blue-700">
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
        .technician-marker:hover {
          z-index: 10;
        }
        .mapboxgl-popup-content {
          padding: 0;
          border-radius: 12px;
          overflow: hidden;
          background: rgb(15 23 42 / 0.95);
          border: 1px solid rgb(59 130 246 / 0.3);
        }
        .mapboxgl-ctrl-group {
          background: rgb(30 41 59 / 0.95) !important;
          border: 1px solid rgb(59 130 246 / 0.3) !important;
        }
        .mapboxgl-ctrl-group button {
          background-color: transparent !important;
        }
        .mapboxgl-ctrl-group button:hover {
          background-color: rgb(59 130 246 / 0.2) !important;
        }
        .mapboxgl-ctrl-icon {
          filter: invert(1) brightness(0.8);
        }
      `}</style>
    </Card>
  );
};
