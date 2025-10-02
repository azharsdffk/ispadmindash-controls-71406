import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export const EmployeeLocationTracker = () => {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const { toast } = useToast();

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from("employee_locations")
        .select(`
          *,
          profiles!inner(full_name)
        `)
        .order("recorded_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLocations(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل تحميل مواقع الموظفين",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();

    // Subscribe to real-time location updates
    const channel = supabase
      .channel("employee-locations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "employee_locations",
        },
        () => {
          loadLocations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast({
        title: "غير مدعوم",
        description: "المتصفح لا يدعم تحديد الموقع",
        variant: "destructive",
      });
      return;
    }

    setTracking(true);

    navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { error } = await supabase.from("employee_locations").insert({
            user_id: user.id,
            latitude,
            longitude,
            accuracy,
            device_info: {
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString(),
            },
          });

          if (error) throw error;
        } catch (error: any) {
          console.error("Error saving location:", error);
        }
      },
      (error) => {
        toast({
          title: "خطأ",
          description: "فشل الحصول على الموقع",
          variant: "destructive",
        });
        setTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">تتبع مواقع الموظفين</h2>
        <Button
          onClick={startTracking}
          disabled={tracking}
          variant={tracking ? "secondary" : "default"}
        >
          <Navigation className="ml-2 h-4 w-4" />
          {tracking ? "التتبع نشط" : "بدء التتبع"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {locations.map((location) => (
          <Card key={location.id} className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{location.profiles?.full_name}</h3>
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>خط العرض: {location.latitude?.toFixed(6)}</p>
                <p>خط الطول: {location.longitude?.toFixed(6)}</p>
                <p>الدقة: {location.accuracy?.toFixed(0)} متر</p>
                <p className="text-xs">
                  {new Date(location.recorded_at).toLocaleString("ar-IQ")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
                  window.open(url, "_blank");
                }}
              >
                فتح في الخريطة
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {locations.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          لا توجد مواقع مسجلة حالياً
        </div>
      )}
    </div>
  );
};
