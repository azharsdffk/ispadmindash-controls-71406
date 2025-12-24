import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  MapPin, Users, Navigation, AlertCircle, Clock, RefreshCcw,
  Search, LayoutGrid, List, Phone, ExternalLink, Activity,
  Signal, SignalLow, SignalZero, MoreVertical, Eye, Filter,
  Wifi, WifiOff, Timer, TrendingUp, TrendingDown, Gauge,
  Map, Target, Crosshair, Route, History, UserCheck, UserX
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, differenceInMinutes, differenceInHours, isToday, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

interface EmployeeLocation {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  recorded_at: string;
  device_info?: any;
  employee?: {
    full_name: string;
    position: string | null;
    phone: string;
  };
}

interface LocationHistory {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  recorded_at: string;
}

const EmployeeTracking = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [locations, setLocations] = useState<EmployeeLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllModal, setShowAllModal] = useState(false);
  const [showActiveModal, setShowActiveModal] = useState(false);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeLocation | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { isAdmin, loading: roleLoading } = useUserRole();

  // Filter and view states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!roleLoading && isAdmin) {
      fetchEmployeeLocations();
      const unsubscribe = subscribeToLocationUpdates();
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [roleLoading, isAdmin]);

  const logLocationAccess = async (queryType: string, recordsCount: number, accessedUserIds: string[] = []) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      for (const accessedUserId of accessedUserIds.length > 0 ? accessedUserIds : [null]) {
        await supabase.rpc('log_employee_location_access', {
          p_accessor_id: user.id,
          p_accessed_user_id: accessedUserId,
          p_query_type: queryType,
          p_records_count: recordsCount,
          p_user_agent: navigator.userAgent,
          p_metadata: { timestamp: new Date().toISOString() }
        });
      }
    } catch (error) {
      console.error('Error logging location access:', error);
    }
  };

  const fetchEmployeeLocations = async () => {
    try {
      setLoading(true);
      
      const { data: employeeData } = await supabase
        .from('employees')
        .select('user_id, full_name, position, phone');

      if (!employeeData) {
        setLoading(false);
        return;
      }

      const locationsWithEmployees: EmployeeLocation[] = [];
      const accessedUserIds: string[] = [];

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
          accessedUserIds.push(employee.user_id);
        }
      }

      setLocations(locationsWithEmployees);
      
      if (locationsWithEmployees.length > 0) {
        await logLocationAccess('bulk_view', locationsWithEmployees.length, accessedUserIds);
      }
    } catch (error) {
      console.error('Error fetching employee locations:', error);
      toast.error('فشل تحميل مواقع الموظفين');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationHistory = async (userId: string) => {
    try {
      setHistoryLoading(true);
      const { data, error } = await supabase
        .from('employee_locations')
        .select('id, latitude, longitude, accuracy, recorded_at')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLocationHistory(data || []);
      await logLocationAccess('history_view', data?.length || 0, [userId]);
    } catch (error) {
      console.error('Error fetching location history:', error);
      toast.error('فشل تحميل سجل المواقع');
    } finally {
      setHistoryLoading(false);
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

  // Statistics
  const stats = useMemo(() => {
    const now = new Date();
    const total = locations.length;
    
    const active = locations.filter(loc => {
      const diffMins = differenceInMinutes(now, parseISO(loc.recorded_at));
      return diffMins < 15;
    }).length;

    const idle = locations.filter(loc => {
      const diffMins = differenceInMinutes(now, parseISO(loc.recorded_at));
      return diffMins >= 15 && diffMins < 60;
    }).length;

    const inactive = locations.filter(loc => {
      const diffMins = differenceInMinutes(now, parseISO(loc.recorded_at));
      return diffMins >= 60;
    }).length;

    const highAccuracy = locations.filter(loc => loc.accuracy && loc.accuracy <= 10).length;
    const todayUpdates = locations.filter(loc => isToday(parseISO(loc.recorded_at))).length;

    const activeRate = total > 0 ? (active / total) * 100 : 0;

    return { total, active, idle, inactive, highAccuracy, todayUpdates, activeRate };
  }, [locations]);

  // Get unique positions
  const positions = useMemo(() => {
    const posSet = new Set(locations.map(loc => loc.employee?.position).filter(Boolean));
    return [...posSet];
  }, [locations]);

  // Filtered locations
  const filteredLocations = useMemo(() => {
    let filtered = [...locations];
    const now = new Date();

    // Tab filter
    if (activeTab === "active") {
      filtered = filtered.filter(loc => differenceInMinutes(now, parseISO(loc.recorded_at)) < 15);
    } else if (activeTab === "idle") {
      filtered = filtered.filter(loc => {
        const diff = differenceInMinutes(now, parseISO(loc.recorded_at));
        return diff >= 15 && diff < 60;
      });
    } else if (activeTab === "inactive") {
      filtered = filtered.filter(loc => differenceInMinutes(now, parseISO(loc.recorded_at)) >= 60);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(loc => {
        const diffMins = differenceInMinutes(now, parseISO(loc.recorded_at));
        if (statusFilter === "active") return diffMins < 15;
        if (statusFilter === "idle") return diffMins >= 15 && diffMins < 60;
        if (statusFilter === "inactive") return diffMins >= 60;
        return true;
      });
    }

    // Position filter
    if (positionFilter !== "all") {
      filtered = filtered.filter(loc => loc.employee?.position === positionFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(loc =>
        loc.employee?.full_name?.toLowerCase().includes(query) ||
        loc.employee?.phone?.includes(query) ||
        loc.employee?.position?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [locations, activeTab, statusFilter, positionFilter, searchQuery]);

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = parseISO(timestamp);
    const diffMins = differenceInMinutes(now, time);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    
    const diffHours = differenceInHours(now, time);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `منذ ${diffDays} يوم`;
  };

  const getStatusInfo = (timestamp: string) => {
    const now = new Date();
    const time = parseISO(timestamp);
    const diffMins = differenceInMinutes(now, time);

    if (diffMins < 15) {
      return {
        status: 'active',
        label: 'نشط',
        color: 'bg-green-500',
        textColor: 'text-green-600',
        bgLight: 'bg-green-100 dark:bg-green-900/30',
        icon: Signal
      };
    }
    if (diffMins < 60) {
      return {
        status: 'idle',
        label: 'متوسط',
        color: 'bg-yellow-500',
        textColor: 'text-yellow-600',
        bgLight: 'bg-yellow-100 dark:bg-yellow-900/30',
        icon: SignalLow
      };
    }
    return {
      status: 'inactive',
      label: 'غير نشط',
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgLight: 'bg-red-100 dark:bg-red-900/30',
      icon: SignalZero
    };
  };

  const getAccuracyBadge = (accuracy: number | null) => {
    if (!accuracy) return null;
    if (accuracy <= 10) {
      return <Badge variant="outline" className="bg-green-100 text-green-700 text-[10px]">دقة عالية ({accuracy.toFixed(0)}م)</Badge>;
    }
    if (accuracy <= 50) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-700 text-[10px]">دقة متوسطة ({accuracy.toFixed(0)}م)</Badge>;
    }
    return <Badge variant="outline" className="bg-red-100 text-red-700 text-[10px]">دقة منخفضة ({accuracy.toFixed(0)}م)</Badge>;
  };

  const openInMaps = async (lat: number, lng: number, userId?: string) => {
    if (userId) {
      await logLocationAccess('map_view', 1, [userId]);
    }
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  const openInWaze = async (lat: number, lng: number, userId?: string) => {
    if (userId) {
      await logLocationAccess('waze_view', 1, [userId]);
    }
    window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank');
  };

  const callPhone = (phone?: string) => {
    if (phone) {
      window.open(`tel:${phone}`);
    }
  };

  const openEmployeeHistory = (location: EmployeeLocation) => {
    setSelectedEmployee(location);
    fetchLocationHistory(location.user_id);
    setShowHistoryModal(true);
  };

  // Stat Card Component
  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color,
    onClick 
  }: { 
    title: string; 
    value: number | string; 
    subtitle?: string;
    icon: any; 
    color: string;
    onClick?: () => void;
  }) => (
    <Card 
      className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
      onClick={onClick}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full opacity-10 ${color}`} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Employee Card Component (Grid View)
  const EmployeeCard = ({ location }: { location: EmployeeLocation }) => {
    const statusInfo = getStatusInfo(location.recorded_at);
    const StatusIcon = statusInfo.icon;

    return (
      <Card 
        className={`group hover:shadow-lg transition-all duration-300 border-r-4`}
        style={{ borderRightColor: statusInfo.status === 'active' ? '#22c55e' : statusInfo.status === 'idle' ? '#eab308' : '#ef4444' }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${statusInfo.bgLight} flex items-center justify-center`}>
                <span className={`text-lg font-bold ${statusInfo.textColor}`}>
                  {location.employee?.full_name?.charAt(0) || '؟'}
                </span>
              </div>
              <div>
                <h3 className="font-semibold">{location.employee?.full_name || 'موظف'}</h3>
                <p className="text-xs text-muted-foreground">{location.employee?.position || '-'}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openInMaps(location.latitude, location.longitude, location.user_id)}>
                  <Navigation className="h-4 w-4 ml-2" />
                  فتح في خرائط جوجل
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openInWaze(location.latitude, location.longitude, location.user_id)}>
                  <Route className="h-4 w-4 ml-2" />
                  فتح في Waze
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {location.employee?.phone && (
                  <DropdownMenuItem onClick={() => callPhone(location.employee?.phone)}>
                    <Phone className="h-4 w-4 ml-2" />
                    اتصال
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => openEmployeeHistory(location)}>
                  <History className="h-4 w-4 ml-2" />
                  سجل المواقع
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className={`${statusInfo.bgLight} ${statusInfo.textColor} flex items-center gap-1`}>
              <StatusIcon className="h-3 w-3" />
              {statusInfo.label}
            </Badge>
            {getAccuracyBadge(location.accuracy)}
          </div>

          <Separator className="my-3" />

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-xs font-mono">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span>
            </div>
            
            {location.employee?.phone && (
              <button 
                onClick={() => callPhone(location.employee?.phone)}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                <span dir="ltr" className="text-xs">{location.employee.phone}</span>
              </button>
            )}

            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs">{getTimeAgo(location.recorded_at)}</span>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 text-xs"
              onClick={() => openInMaps(location.latitude, location.longitude, location.user_id)}
            >
              <Navigation className="h-3 w-3 ml-1" />
              عرض الموقع
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-xs"
              onClick={() => openEmployeeHistory(location)}
            >
              <History className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Employee Row Component (List View)
  const EmployeeRow = ({ location }: { location: EmployeeLocation }) => {
    const statusInfo = getStatusInfo(location.recorded_at);
    const StatusIcon = statusInfo.icon;

    return (
      <Card className={`border-r-4`} style={{ borderRightColor: statusInfo.status === 'active' ? '#22c55e' : statusInfo.status === 'idle' ? '#eab308' : '#ef4444' }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className={`w-10 h-10 rounded-full ${statusInfo.bgLight} flex items-center justify-center shrink-0`}>
                <span className={`font-bold ${statusInfo.textColor}`}>
                  {location.employee?.full_name?.charAt(0) || '؟'}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{location.employee?.full_name || 'موظف'}</h3>
                  <Badge variant="outline" className={`${statusInfo.bgLight} ${statusInfo.textColor} flex items-center gap-1 shrink-0`}>
                    <StatusIcon className="h-3 w-3" />
                    {statusInfo.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {location.employee?.position && <span>{location.employee.position}</span>}
                  <span className="font-mono">{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>
                  {getAccuracyBadge(location.accuracy)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
              <Clock className="h-3 w-3" />
              <span>{getTimeAgo(location.recorded_at)}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {location.employee?.phone && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => callPhone(location.employee?.phone)}>
                  <Phone className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openInMaps(location.latitude, location.longitude, location.user_id)}>
                <Navigation className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEmployeeHistory(location)}>
                <History className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">جاري تحميل بيانات التتبع...</p>
        </div>
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
              <AlertCircle className="h-4 w-4" />
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
        
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">تتبع الموظفين</h1>
                  <p className="text-sm text-muted-foreground">مراقبة مواقع الموظفين في الوقت الفعلي</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => fetchEmployeeLocations()} variant="outline" size="sm">
                  <RefreshCcw className="h-4 w-4 ml-1" />
                  تحديث
                </Button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard
                title="إجمالي الموظفين"
                value={stats.total}
                icon={Users}
                color="bg-primary"
                onClick={() => setActiveTab("all")}
              />
              <StatCard
                title="نشط الآن"
                value={stats.active}
                subtitle="آخر 15 دقيقة"
                icon={Signal}
                color="bg-green-500"
                onClick={() => setActiveTab("active")}
              />
              <StatCard
                title="نشاط متوسط"
                value={stats.idle}
                subtitle="15-60 دقيقة"
                icon={SignalLow}
                color="bg-yellow-500"
                onClick={() => setActiveTab("idle")}
              />
              <StatCard
                title="غير نشط"
                value={stats.inactive}
                subtitle="أكثر من ساعة"
                icon={SignalZero}
                color="bg-red-500"
                onClick={() => setActiveTab("inactive")}
              />
              <StatCard
                title="دقة عالية"
                value={stats.highAccuracy}
                subtitle="≤ 10 متر"
                icon={Target}
                color="bg-blue-500"
              />
              <StatCard
                title="نسبة النشاط"
                value={`${stats.activeRate.toFixed(0)}%`}
                icon={Activity}
                color="bg-purple-500"
              />
            </div>

            {/* Activity Progress */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">توزيع حالات النشاط</span>
                  <span className="text-xs text-muted-foreground">{stats.total} موظف</span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                  {stats.total > 0 && (
                    <>
                      <div 
                        className="bg-green-500 transition-all duration-500" 
                        style={{ width: `${(stats.active / stats.total) * 100}%` }} 
                        title={`نشط: ${stats.active}`}
                      />
                      <div 
                        className="bg-yellow-500 transition-all duration-500" 
                        style={{ width: `${(stats.idle / stats.total) * 100}%` }} 
                        title={`متوسط: ${stats.idle}`}
                      />
                      <div 
                        className="bg-red-500 transition-all duration-500" 
                        style={{ width: `${(stats.inactive / stats.total) * 100}%` }} 
                        title={`غير نشط: ${stats.inactive}`}
                      />
                    </>
                  )}
                </div>
                <div className="flex items-center gap-6 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> نشط ({stats.active})</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> متوسط ({stats.idle})</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> غير نشط ({stats.inactive})</span>
                </div>
              </CardContent>
            </Card>

            {/* Tabs and Filters */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <TabsList>
                  <TabsTrigger value="all">الكل ({stats.total})</TabsTrigger>
                  <TabsTrigger value="active" className="text-green-600">نشط ({stats.active})</TabsTrigger>
                  <TabsTrigger value="idle" className="text-yellow-600">متوسط ({stats.idle})</TabsTrigger>
                  <TabsTrigger value="inactive" className="text-red-600">غير نشط ({stats.inactive})</TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <Card className="mt-4">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="بحث بالاسم، الهاتف، المنصب..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pr-10"
                        />
                      </div>
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="حالة النشاط" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الحالات</SelectItem>
                        <SelectItem value="active">نشط</SelectItem>
                        <SelectItem value="idle">متوسط</SelectItem>
                        <SelectItem value="inactive">غير نشط</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={positionFilter} onValueChange={setPositionFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="المنصب" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع المناصب</SelectItem>
                        {positions.map(pos => (
                          <SelectItem key={pos} value={pos!}>{pos}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Content */}
              <TabsContent value={activeTab} className="mt-4">
                {filteredLocations.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-lg">لا توجد بيانات مواقع مطابقة</p>
                    </CardContent>
                  </Card>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredLocations.map(location => (
                      <EmployeeCard key={location.id} location={location} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredLocations.map(location => (
                      <EmployeeRow key={location.id} location={location} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Results Count */}
            {filteredLocations.length > 0 && (
              <p className="text-sm text-muted-foreground text-center">
                عرض {filteredLocations.length} من {stats.total} موظف
              </p>
            )}
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Location History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-2xl max-h-[80vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              سجل مواقع {selectedEmployee?.employee?.full_name || 'الموظف'}
            </DialogTitle>
            <DialogDescription>
              آخر 50 موقع مسجل
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : locationHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد سجلات مواقع
              </div>
            ) : (
              <div className="space-y-2 p-1">
                {locationHistory.map((loc, index) => (
                  <Card key={loc.id} className="border-r-2 border-r-primary/30">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-mono">{loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(loc.recorded_at), 'dd/MM/yyyy HH:mm:ss', { locale: ar })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {loc.accuracy && (
                            <span className="text-xs text-muted-foreground">دقة: {loc.accuracy.toFixed(0)}م</span>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => openInMaps(loc.latitude, loc.longitude)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeTracking;
