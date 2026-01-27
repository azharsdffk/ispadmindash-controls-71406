import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  MapPin, RefreshCw, Users, Wrench, Ticket, Clock, 
  Layers, ChevronLeft, ChevronRight, Target, Eye,
  Phone, Navigation, Filter, Loader2, AlertCircle
} from 'lucide-react';
import { mapDataApi, MapTechnician, MapSubscriber, MapTicket } from '@/services/api/mapData';

const MAPBOX_TOKEN = 'pk.eyJ1IjoibG92YWJsZWRldiIsImEiOiJjbHRxaW9lNXgwMWRuMmlxcjB0ZW1jMnJuIn0.a0InJyADm4qEZlvVS9cS7Q';

interface UnifiedDashboardMapProps {
  mapboxToken?: string;
  onSelectTechnician?: (tech: MapTechnician) => void;
  onSelectSubscriber?: (sub: MapSubscriber) => void;
  onSelectTicket?: (ticket: MapTicket) => void;
}

type EntityType = 'technicians' | 'subscribers' | 'tickets';

interface Filters {
  technicians: boolean;
  subscribers: boolean;
  tickets: boolean;
  ticketStatus: string;
  ticketPriority: string;
}

export const UnifiedDashboardMap = ({
  mapboxToken = MAPBOX_TOKEN,
  onSelectTechnician,
  onSelectSubscriber,
  onSelectTicket,
}: UnifiedDashboardMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  const [technicians, setTechnicians] = useState<MapTechnician[]>([]);
  const [subscribers, setSubscribers] = useState<MapSubscriber[]>([]);
  const [tickets, setTickets] = useState<MapTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<EntityType>('technicians');
  const [mapStyle, setMapStyle] = useState('streets-v12');

  const [filters, setFilters] = useState<Filters>({
    technicians: true,
    subscribers: true,
    tickets: true,
    ticketStatus: '',
    ticketPriority: '',
  });

  const mapStyles = [
    { id: 'streets-v12', name: 'شوارع' },
    { id: 'satellite-streets-v12', name: 'قمر صناعي' },
    { id: 'dark-v11', name: 'داكن' },
  ];

  const priorityColors: Record<string, string> = {
    urgent: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
  };

  const statusColors: Record<string, string> = {
    online: '#22c55e',
    available: '#22c55e',
    busy: '#f97316',
    offline: '#6b7280',
  };

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      const [techs, subs, tix] = await Promise.all([
        mapDataApi.getTechnicians(),
        mapDataApi.getSubscribers(),
        mapDataApi.getTickets({
          status: filters.ticketStatus || undefined,
          priority: filters.ticketPriority || undefined,
        }),
      ]);

      setTechnicians(techs);
      setSubscribers(subs);
      setTickets(tix);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching map data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters.ticketStatus, filters.ticketPriority]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: `mapbox://styles/mapbox/${mapStyle}`,
      center: [44.366, 33.315],
      zoom: 10,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-left');

    map.current.on('load', () => {
      fetchData();
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // Update markers when data changes
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    // Add technician markers
    if (filters.technicians) {
      technicians.forEach(tech => {
        const el = document.createElement('div');
        el.className = 'cursor-pointer';
        el.innerHTML = `
          <div class="relative group">
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white" 
                 style="background: ${statusColors[tech.status] || statusColors.offline}">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
              ${tech.name}
            </div>
          </div>
        `;

        el.addEventListener('click', () => {
          onSelectTechnician?.(tech);
          map.current?.flyTo({ center: [tech.longitude, tech.latitude], zoom: 16 });
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([tech.longitude, tech.latitude])
          .addTo(map.current!);

        markersRef.current.set(`tech-${tech.id}`, marker);
      });
    }

    // Add subscriber markers
    if (filters.subscribers) {
      subscribers.forEach(sub => {
        const el = document.createElement('div');
        el.className = 'cursor-pointer';
        el.innerHTML = `
          <div class="relative group">
            <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg border-2 border-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
              ${sub.name}
            </div>
          </div>
        `;

        el.addEventListener('click', () => {
          onSelectSubscriber?.(sub);
          map.current?.flyTo({ center: [sub.longitude, sub.latitude], zoom: 16 });
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([sub.longitude, sub.latitude])
          .addTo(map.current!);

        markersRef.current.set(`sub-${sub.id}`, marker);
      });
    }

    // Add ticket markers
    if (filters.tickets) {
      tickets.forEach(ticket => {
        const color = priorityColors[ticket.priority] || priorityColors.medium;
        const el = document.createElement('div');
        el.className = 'cursor-pointer';
        el.innerHTML = `
          <div class="relative group">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg border-2 border-white" 
                 style="background: ${color}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 5v2"/>
                <path d="M15 11v2"/>
                <path d="M15 17v2"/>
                <path d="M5 5h14a2 2 0 0 1 1.414.586A2 2 0 0 1 21 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2"/>
              </svg>
            </div>
            <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
              ${ticket.ticket_number}
            </div>
          </div>
        `;

        el.addEventListener('click', () => {
          onSelectTicket?.(ticket);
          map.current?.flyTo({ center: [ticket.longitude, ticket.latitude], zoom: 16 });
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([ticket.longitude, ticket.latitude])
          .addTo(map.current!);

        markersRef.current.set(`ticket-${ticket.id}`, marker);
      });
    }
  }, [technicians, subscribers, tickets, filters, onSelectTechnician, onSelectSubscriber, onSelectTicket]);

  // Refresh data periodically
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const fitAllMarkers = () => {
    if (!map.current) return;

    const bounds = new mapboxgl.LngLatBounds();
    let hasPoints = false;

    if (filters.technicians) {
      technicians.forEach(t => {
        bounds.extend([t.longitude, t.latitude]);
        hasPoints = true;
      });
    }
    if (filters.subscribers) {
      subscribers.forEach(s => {
        bounds.extend([s.longitude, s.latitude]);
        hasPoints = true;
      });
    }
    if (filters.tickets) {
      tickets.forEach(t => {
        bounds.extend([t.longitude, t.latitude]);
        hasPoints = true;
      });
    }

    if (hasPoints) {
      map.current.fitBounds(bounds, { padding: 50, duration: 1000 });
    }
  };

  const changeMapStyle = (style: string) => {
    setMapStyle(style);
    if (map.current) {
      map.current.setStyle(`mapbox://styles/mapbox/${style}`);
    }
  };

  // Filter items for sidebar
  const filteredTechnicians = technicians.filter(t =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.phone?.includes(searchQuery)
  );

  const filteredSubscribers = subscribers.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone?.includes(searchQuery)
  );

  const filteredTickets = tickets.filter(t =>
    t.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subscriber_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              خريطة النظام الموحدة
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-1">
              <Badge variant="outline" className="gap-1">
                <Wrench className="h-3 w-3" />
                {technicians.length} فني
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {subscribers.length} مشترك
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Ticket className="h-3 w-3" />
                {tickets.length} تذكرة
              </Badge>
              <span className="text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lastUpdate.toLocaleTimeString('ar-IQ')}
              </span>
            </CardDescription>
          </div>

          <div className="flex gap-2">
            {/* Map style selector */}
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              {mapStyles.map(style => (
                <Button
                  key={style.id}
                  variant={mapStyle === style.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => changeMapStyle(style.id)}
                >
                  {style.name}
                </Button>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={fitAllMarkers}>
              <Target className="h-4 w-4 ml-1" />
              عرض الكل
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ml-1 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className={`border-l transition-all duration-300 ${sidebarOpen ? 'w-80' : 'w-0'} overflow-hidden bg-muted/30`}>
            <div className="p-3 space-y-3">
              {/* Search */}
              <Input
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={filters.technicians}
                    onCheckedChange={(checked) => setFilters(f => ({ ...f, technicians: !!checked }))}
                  />
                  <Wrench className="h-4 w-4 text-green-500" />
                  الفنيين
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={filters.subscribers}
                    onCheckedChange={(checked) => setFilters(f => ({ ...f, subscribers: !!checked }))}
                  />
                  <Users className="h-4 w-4 text-blue-500" />
                  المشتركين
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={filters.tickets}
                    onCheckedChange={(checked) => setFilters(f => ({ ...f, tickets: !!checked }))}
                  />
                  <Ticket className="h-4 w-4 text-orange-500" />
                  التذاكر
                </label>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EntityType)}>
                <TabsList className="w-full">
                  <TabsTrigger value="technicians" className="flex-1">
                    <Wrench className="h-4 w-4 ml-1" />
                    {technicians.length}
                  </TabsTrigger>
                  <TabsTrigger value="subscribers" className="flex-1">
                    <Users className="h-4 w-4 ml-1" />
                    {subscribers.length}
                  </TabsTrigger>
                  <TabsTrigger value="tickets" className="flex-1">
                    <Ticket className="h-4 w-4 ml-1" />
                    {tickets.length}
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[400px] mt-2">
                  <TabsContent value="technicians" className="m-0 space-y-2">
                    {filteredTechnicians.map(tech => (
                      <div
                        key={tech.id}
                        className="p-2 rounded-lg border bg-background cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => {
                          onSelectTechnician?.(tech);
                          map.current?.flyTo({ center: [tech.longitude, tech.latitude], zoom: 16 });
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{tech.name}</span>
                          <Badge 
                            variant={tech.status === 'online' ? 'default' : 'secondary'}
                            style={{ backgroundColor: statusColors[tech.status] }}
                            className="text-white"
                          >
                            {tech.status === 'online' ? 'متصل' : tech.status === 'busy' ? 'مشغول' : 'غير متصل'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <Phone className="h-3 w-3" />
                          {tech.phone}
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="subscribers" className="m-0 space-y-2">
                    {filteredSubscribers.slice(0, 50).map(sub => (
                      <div
                        key={sub.id}
                        className="p-2 rounded-lg border bg-background cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => {
                          onSelectSubscriber?.(sub);
                          map.current?.flyTo({ center: [sub.longitude, sub.latitude], zoom: 16 });
                        }}
                      >
                        <div className="font-medium">{sub.name}</div>
                        <div className="text-sm text-muted-foreground">{sub.address}</div>
                      </div>
                    ))}
                    {subscribers.length > 50 && (
                      <p className="text-xs text-center text-muted-foreground py-2">
                        عرض 50 من {subscribers.length} مشترك
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="tickets" className="m-0 space-y-2">
                    {filteredTickets.map(ticket => (
                      <div
                        key={ticket.id}
                        className="p-2 rounded-lg border bg-background cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => {
                          onSelectTicket?.(ticket);
                          map.current?.flyTo({ center: [ticket.longitude, ticket.latitude], zoom: 16 });
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{ticket.ticket_number}</span>
                          <Badge 
                            style={{ backgroundColor: priorityColors[ticket.priority] }}
                            className="text-white"
                          >
                            {ticket.priority === 'urgent' ? 'عاجل' : ticket.priority === 'high' ? 'مرتفع' : ticket.priority === 'medium' ? 'متوسط' : 'منخفض'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{ticket.subscriber_name}</div>
                        <div className="text-xs text-muted-foreground truncate">{ticket.issue_description}</div>
                      </div>
                    ))}
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </div>
          </div>

          {/* Sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute z-10 mt-2 mr-2 bg-background shadow"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>

          {/* Map */}
          <div ref={mapContainer} className="flex-1 relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-background/95 p-3 rounded-lg shadow-lg z-10">
              <h4 className="font-medium text-sm mb-2">المفتاح</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  <span>فني متصل</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500" />
                  <span>مشترك</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500" />
                  <span>تذكرة عاجلة</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-500" />
                  <span>تذكرة متوسطة</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnifiedDashboardMap;
