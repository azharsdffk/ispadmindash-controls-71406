import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Search, Loader2, Target, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MapLocationPickerProps {
  onLocationSelect: (location: { latitude: number; longitude: number; address?: string }) => void;
  initialLocation?: { latitude: number; longitude: number };
  mapboxToken?: string;
  className?: string;
  height?: string;
}

const MAPBOX_TOKEN = 'pk.eyJ1IjoibG92YWJsZWRldiIsImEiOiJjbHRxaW9lNXgwMWRuMmlxcjB0ZW1jMnJuIn0.a0InJyADm4qEZlvVS9cS7Q';

export const MapLocationPicker = ({ 
  onLocationSelect, 
  initialLocation,
  mapboxToken = MAPBOX_TOKEN,
  className = '',
  height = '400px'
}: MapLocationPickerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(
    initialLocation || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const { toast } = useToast();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    const initialCenter: [number, number] = initialLocation 
      ? [initialLocation.longitude, initialLocation.latitude]
      : [44.366, 33.315]; // Default: Baghdad

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: initialLocation ? 15 : 11,
      attributionControl: false
    });

    // Add controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

    // Create marker
    marker.current = new mapboxgl.Marker({
      color: '#3b82f6',
      draggable: true
    });

    // If initial location, add marker
    if (initialLocation) {
      marker.current.setLngLat([initialLocation.longitude, initialLocation.latitude]).addTo(map.current);
    }

    // Handle marker drag end
    marker.current.on('dragend', () => {
      const lngLat = marker.current?.getLngLat();
      if (lngLat) {
        const loc = { latitude: lngLat.lat, longitude: lngLat.lng };
        setSelectedLocation(loc);
        onLocationSelect(loc);
      }
    });

    // Handle map click
    map.current.on('click', (e) => {
      const loc = { latitude: e.lngLat.lat, longitude: e.lngLat.lng };
      setSelectedLocation(loc);
      onLocationSelect(loc);
      
      if (marker.current && map.current) {
        marker.current.setLngLat([e.lngLat.lng, e.lngLat.lat]).addTo(map.current);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken, initialLocation, onLocationSelect]);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: 'غير مدعوم',
        description: 'المتصفح لا يدعم تحديد الموقع',
        variant: 'destructive'
      });
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        
        setSelectedLocation(loc);
        onLocationSelect(loc);

        if (marker.current && map.current) {
          marker.current.setLngLat([loc.longitude, loc.latitude]).addTo(map.current);
          map.current.flyTo({
            center: [loc.longitude, loc.latitude],
            zoom: 16,
            duration: 1000
          });
        }

        setGettingLocation(false);
        toast({
          title: 'تم تحديد الموقع',
          description: 'تم الحصول على موقعك الحالي بنجاح'
        });
      },
      (error) => {
        setGettingLocation(false);
        toast({
          title: 'خطأ',
          description: 'فشل الحصول على الموقع: ' + error.message,
          variant: 'destructive'
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [onLocationSelect, toast]);

  // Search for location
  const searchLocation = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxToken}&country=iq&language=ar`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        const loc = { latitude: lat, longitude: lng, address: data.features[0].place_name };
        
        setSelectedLocation(loc);
        onLocationSelect(loc);

        if (marker.current && map.current) {
          marker.current.setLngLat([lng, lat]).addTo(map.current);
          map.current.flyTo({
            center: [lng, lat],
            zoom: 16,
            duration: 1000
          });
        }
      } else {
        toast({
          title: 'لم يتم العثور',
          description: 'لم يتم العثور على موقع مطابق',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'خطأ',
        description: 'فشل البحث عن الموقع',
        variant: 'destructive'
      });
    } finally {
      setSearching(false);
    }
  }, [searchQuery, mapboxToken, onLocationSelect, toast]);

  // Clear selection
  const clearSelection = () => {
    setSelectedLocation(null);
    marker.current?.remove();
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-primary" />
          تحديد الموقع على الخريطة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Search bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن موقع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
              className="pr-10"
            />
          </div>
          <Button onClick={searchLocation} disabled={searching || !searchQuery.trim()} size="icon" variant="outline">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
          <Button onClick={getCurrentLocation} disabled={gettingLocation} size="icon" variant="outline">
            {gettingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
          </Button>
        </div>

        {/* Map container */}
        <div 
          ref={mapContainer} 
          className="rounded-lg overflow-hidden border"
          style={{ height }}
        />

        {/* Selected location info */}
        {selectedLocation && (
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm">
                {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const url = `https://www.google.com/maps?q=${selectedLocation.latitude},${selectedLocation.longitude}`;
                  window.open(url, '_blank');
                }}
              >
                <Navigation className="h-4 w-4 ml-1" />
                فتح في Google Maps
              </Button>
              <Button size="sm" variant="ghost" onClick={clearSelection}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <p className="text-xs text-muted-foreground text-center">
          انقر على الخريطة لتحديد الموقع، أو استخدم البحث، أو اضغط على زر الموقع الحالي
        </p>
      </CardContent>
    </Card>
  );
};

export default MapLocationPicker;
