import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, Users, Navigation, AlertCircle, Clock, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EmployeeLocation {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  recorded_at: string;
  employee?: {
    full_name: string;
    position: string | null;
    phone: string;
  };
}

const EmployeeTracking = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [locations, setLocations] = useState<EmployeeLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllModal, setShowAllModal] = useState(false);
  const [showActiveModal, setShowActiveModal] = useState(false);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const { isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!roleLoading && isAdmin) {
      fetchEmployeeLocations();
      subscribeToLocationUpdates();
    }
  }, [roleLoading, isAdmin]);

  const fetchEmployeeLocations = async () => {
    try {
      setLoading(true);
      
      // Get latest location for each employee
      const { data: employeeData } = await supabase
        .from('employees')
        .select('user_id, full_name, position, phone');

      if (!employeeData) {
        setLoading(false);
        return;
      }

      const locationsWithEmployees: EmployeeLocation[] = [];

      for (const employee of employeeData) {
        const { data: locationData } = await supabase
          .from('employee_locations')
          .select('*')
          .eq('user_id', employee.user_id)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .single();

        if (locationData) {
          locationsWithEmployees.push({
            ...locationData,
            employee: {
              full_name: employee.full_name,
              position: employee.position,
              phone: employee.phone,
            },
          });
        }
      }

      setLocations(locationsWithEmployees);
    } catch (error) {
      console.error('Error fetching employee locations:', error);
      toast.error('فشل تحميل مواقع الموظفين');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToLocationUpdates = () => {
    const channel = supabase
      .channel('location-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'employee_locations',
        },
        () => {
          fetchEmployeeLocations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `منذ ${diffDays} يوم`;
  };

  const getStatusColor = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMins = Math.floor((now.getTime() - time.getTime()) / 60000);

    if (diffMins < 15) return 'success';
    if (diffMins < 60) return 'warning';
    return 'destructive';
  };

  const openInMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
        <div className="flex flex-1 w-full">
          <AppSidebar />
          <main className="flex-1 p-6 overflow-y-auto">
            <Alert variant="destructive">
              <AlertDescription>
                ليس لديك صلاحية الوصول إلى هذه الصفحة
              </AlertDescription>
            </Alert>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1 w-full">
        <AppSidebar />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">تتبع الموظفين</h1>
                <p className="text-sm text-muted-foreground">
                  تتبع مواقع الموظفين في الوقت الفعلي
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card 
                className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setShowAllModal(true)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <Users className="h-5 w-5" />
                    إجمالي التتبع
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{locations.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">موظف مسجل في النظام</p>
                </CardContent>
              </Card>

              <Card 
                className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setShowActiveModal(true)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <Navigation className="h-5 w-5" />
                    نشط الآن
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                    {locations.filter(loc => {
                      const diffMins = Math.floor((new Date().getTime() - new Date(loc.recorded_at).getTime()) / 60000);
                      return diffMins < 15;
                    }).length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">موظف نشط خلال 15 دقيقة</p>
                </CardContent>
              </Card>

              <Card 
                className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setShowInactiveModal(true)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-700 dark:text-orange-400">
                    <Clock className="h-5 w-5" />
                    غير نشط
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                    {locations.filter(loc => {
                      const diffMins = Math.floor((new Date().getTime() - new Date(loc.recorded_at).getTime()) / 60000);
                      return diffMins >= 60;
                    }).length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">موظف غير نشط لأكثر من ساعة</p>
                </CardContent>
              </Card>
            </div>

            {/* Map Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  خريطة المواقع
                </CardTitle>
                <CardDescription>
                  عرض مواقع الموظفين على الخريطة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-12 text-center">
                  <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">
                    يتطلب مفتاح Mapbox API لعرض الخريطة التفاعلية
                  </p>
                  <p className="text-sm text-muted-foreground">
                    المواقع معروضة في القائمة أدناه
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Employee Locations List */}
            <Card>
              <CardHeader>
                <CardTitle>مواقع الموظفين</CardTitle>
                <CardDescription>
                  آخر موقع مسجل لكل موظف
                </CardDescription>
              </CardHeader>
              <CardContent>
                {locations.length === 0 ? (
                  <div className="py-12 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">لا توجد بيانات موقع متاحة</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {locations.map((location) => (
                      <Card key={location.id} className="border-l-4" style={{
                        borderLeftColor: `hsl(var(--${getStatusColor(location.recorded_at)}))`
                      }}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">
                                  {location.employee?.full_name || 'موظف'}
                                </h3>
                                <Badge variant={getStatusColor(location.recorded_at) as any}>
                                  {getTimeAgo(location.recorded_at)}
                                </Badge>
                              </div>
                              
                              {location.employee?.position && (
                                <p className="text-sm text-muted-foreground mb-1">
                                  {location.employee.position}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>
                                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                  </span>
                                </div>
                                
                                {location.accuracy && (
                                  <div>
                                    دقة: {location.accuracy.toFixed(0)}م
                                  </div>
                                )}
                              </div>
                              
                              <p className="text-xs text-muted-foreground mt-2">
                                آخر تحديث: {new Date(location.recorded_at).toLocaleString('ar-IQ')}
                              </p>
                            </div>
                            
                            <button
                              onClick={() => openInMaps(location.latitude, location.longitude)}
                              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                            >
                              <Navigation className="h-4 w-4" />
                              عرض
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* All Employees Modal */}
      <Dialog open={showAllModal} onOpenChange={setShowAllModal}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Users className="h-5 w-5" />
              إجمالي التتبع ({locations.length})
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 p-1">
              {locations.map((location) => (
                <Card key={location.id} className="border-r-4 border-r-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{location.employee?.full_name || 'موظف'}</h3>
                        <p className="text-sm text-muted-foreground">{location.employee?.position || '-'}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          آخر تحديث: {getTimeAgo(location.recorded_at)}
                        </p>
                      </div>
                      <Badge variant={getStatusColor(location.recorded_at) as any}>
                        {getStatusColor(location.recorded_at) === 'success' ? 'نشط' : getStatusColor(location.recorded_at) === 'warning' ? 'متوسط' : 'غير نشط'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {locations.length === 0 && (
                <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Active Employees Modal */}
      <Dialog open={showActiveModal} onOpenChange={setShowActiveModal}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <Navigation className="h-5 w-5" />
              الموظفين النشطين الآن
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 p-1">
              {locations.filter(loc => {
                const diffMins = Math.floor((new Date().getTime() - new Date(loc.recorded_at).getTime()) / 60000);
                return diffMins < 15;
              }).map((location) => (
                <Card key={location.id} className="border-r-4 border-r-emerald-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{location.employee?.full_name || 'موظف'}</h3>
                        <p className="text-sm text-muted-foreground">{location.employee?.position || '-'}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          آخر تحديث: {getTimeAgo(location.recorded_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => openInMaps(location.latitude, location.longitude)}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm flex items-center gap-1"
                      >
                        <Navigation className="h-3 w-3" />
                        عرض الموقع
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {locations.filter(loc => {
                const diffMins = Math.floor((new Date().getTime() - new Date(loc.recorded_at).getTime()) / 60000);
                return diffMins < 15;
              }).length === 0 && (
                <p className="text-center text-muted-foreground py-8">لا يوجد موظفين نشطين حالياً</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Inactive Employees Modal */}
      <Dialog open={showInactiveModal} onOpenChange={setShowInactiveModal}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Clock className="h-5 w-5" />
              الموظفين غير النشطين
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 p-1">
              {locations.filter(loc => {
                const diffMins = Math.floor((new Date().getTime() - new Date(loc.recorded_at).getTime()) / 60000);
                return diffMins >= 60;
              }).map((location) => (
                <Card key={location.id} className="border-r-4 border-r-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{location.employee?.full_name || 'موظف'}</h3>
                        <p className="text-sm text-muted-foreground">{location.employee?.position || '-'}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          آخر تحديث: {getTimeAgo(location.recorded_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => openInMaps(location.latitude, location.longitude)}
                        className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm flex items-center gap-1"
                      >
                        <MapPin className="h-3 w-3" />
                        آخر موقع
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {locations.filter(loc => {
                const diffMins = Math.floor((new Date().getTime() - new Date(loc.recorded_at).getTime()) / 60000);
                return diffMins >= 60;
              }).length === 0 && (
                <p className="text-center text-muted-foreground py-8">جميع الموظفين نشطين</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeTracking;
