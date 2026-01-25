import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MapPin,
  Clock,
  Route,
  User,
  Calendar,
  Download,
  RefreshCw,
  TrendingUp,
  Navigation,
  Gauge,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  LocationPoint,
  DailyRouteStats,
  calculateMultiDayStats,
  formatDistance,
  formatDuration,
} from '@/utils/distanceCalculations';

interface TechnicianInfo {
  id: string;
  user_id: string | null;
  name: string;
}

interface TechnicianRouteReportsProps {
  dateRange: { from: string; to: string };
}

interface SummaryStats {
  totalDistance: number;
  totalTime: number;
  totalDays: number;
  averageDistancePerDay: number;
  averageTimePerDay: number;
}

export const TechnicianRouteReports = ({ dateRange }: TechnicianRouteReportsProps) => {
  const [loading, setLoading] = useState(false);
  const [technicians, setTechnicians] = useState<TechnicianInfo[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string>('all');
  const [routeStats, setRouteStats] = useState<Map<string, DailyRouteStats[]>>(new Map());
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);

  // جلب قائمة الفنيين
  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const directResult = await supabase.from('technicians').select('*');
        if (directResult.data) {
          const filtered = directResult.data
            .filter((t) => t.available !== false)
            .map((t) => ({ id: t.id, user_id: t.user_id, name: t.name }));
          setTechnicians(filtered);
        }
      } catch (err) {
        console.error('Error fetching technicians:', err);
      }
    };

    fetchTechnicians();
  }, []);

  // جلب بيانات المسارات
  const fetchRouteData = async () => {
    setLoading(true);
    try {
      let data: Array<{
        id: string;
        user_id: string;
        latitude: number;
        longitude: number;
        recorded_at: string | null;
        accuracy: number | null;
        speed: number | null;
        heading: number | null;
      }> | null = null;

      if (selectedTechnician !== 'all') {
        const result = await supabase
          .from('employee_locations')
          .select('id, user_id, latitude, longitude, recorded_at, accuracy, speed, heading')
          .eq('user_id', selectedTechnician)
          .gte('recorded_at', `${dateRange.from}T00:00:00`)
          .lte('recorded_at', `${dateRange.to}T23:59:59`)
          .order('recorded_at', { ascending: true });
        
        if (result.error) throw result.error;
        data = result.data;
      } else {
        const result = await supabase
          .from('employee_locations')
          .select('id, user_id, latitude, longitude, recorded_at, accuracy, speed, heading')
          .gte('recorded_at', `${dateRange.from}T00:00:00`)
          .lte('recorded_at', `${dateRange.to}T23:59:59`)
          .order('recorded_at', { ascending: true });
        
        if (result.error) throw result.error;
        data = result.data;
      }

      // تجميع البيانات حسب المستخدم
      const userLocations = new Map<string, LocationPoint[]>();
      
      (data || []).forEach((loc) => {
        if (!userLocations.has(loc.user_id)) {
          userLocations.set(loc.user_id, []);
        }
        userLocations.get(loc.user_id)!.push({
          id: loc.id,
          latitude: loc.latitude,
          longitude: loc.longitude,
          recorded_at: loc.recorded_at || '',
          accuracy: loc.accuracy || undefined,
          speed: loc.speed || undefined,
          heading: loc.heading || undefined,
        });
      });

      // حساب الإحصائيات لكل مستخدم
      const statsMap = new Map<string, DailyRouteStats[]>();
      let grandTotalDistance = 0;
      let grandTotalTime = 0;
      let totalDays = 0;

      userLocations.forEach((locations, userId) => {
        const dailyStats = calculateMultiDayStats(locations);
        statsMap.set(userId, dailyStats);
        
        dailyStats.forEach((stat) => {
          grandTotalDistance += stat.totalDistance;
          grandTotalTime += stat.totalTime;
          totalDays++;
        });
      });

      setRouteStats(statsMap);
      setSummaryStats({
        totalDistance: grandTotalDistance,
        totalTime: grandTotalTime,
        totalDays,
        averageDistancePerDay: totalDays > 0 ? grandTotalDistance / totalDays : 0,
        averageTimePerDay: totalDays > 0 ? grandTotalTime / totalDays : 0,
      });

      toast.success('تم تحميل بيانات المسارات بنجاح');
    } catch (error) {
      console.error('Error fetching route data:', error);
      toast.error('حدث خطأ في جلب بيانات المسارات');
    } finally {
      setLoading(false);
    }
  };

  // تحميل البيانات عند تغيير الفلاتر
  useEffect(() => {
    fetchRouteData();
  }, [dateRange.from, dateRange.to, selectedTechnician]);

  // تصدير التقرير
  const handleExport = () => {
    const rows: string[] = ['التاريخ,الفني,المسافة (كم),الوقت (دقيقة),عدد النقاط,متوسط السرعة (كم/ساعة)'];
    
    routeStats.forEach((stats, userId) => {
      const techName = technicians.find(t => t.user_id === userId)?.name || userId;
      stats.forEach((stat) => {
        rows.push(
          `${stat.date},${techName},${stat.totalDistance.toFixed(2)},${stat.totalTime.toFixed(0)},${stat.pointsCount},${stat.averageSpeed.toFixed(1)}`
        );
      });
    });

    const csv = '\uFEFF' + rows.join('\n'); // BOM for Arabic support
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `technician-routes-${dateRange.from}-${dateRange.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير التقرير بنجاح');
  };

  // الحصول على اسم الفني
  const getTechnicianName = (userId: string) => {
    return technicians.find(t => t.user_id === userId)?.name || 'غير معروف';
  };

  return (
    <div className="space-y-6">
      {/* ملخص الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Route className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">المسافة الإجمالية</p>
                <p className="text-xl font-bold">
                  {summaryStats ? formatDistance(summaryStats.totalDistance) : '--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/50 rounded-lg">
                <Clock className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الوقت الإجمالي</p>
                <p className="text-xl font-bold">
                  {summaryStats ? formatDuration(summaryStats.totalTime) : '--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary rounded-lg">
                <Calendar className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">عدد الأيام</p>
                <p className="text-xl font-bold">{summaryStats?.totalDays || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">متوسط المسافة/يوم</p>
                <p className="text-xl font-bold">
                  {summaryStats ? formatDistance(summaryStats.averageDistancePerDay) : '--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <Gauge className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">متوسط الوقت/يوم</p>
                <p className="text-xl font-bold">
                  {summaryStats ? formatDuration(summaryStats.averageTimePerDay) : '--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* فلاتر */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            تقارير مسارات الفنيين
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-64">
              <Label>اختر الفني</Label>
              <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الفنيين" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفنيين</SelectItem>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.user_id}>
                      {tech.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={fetchRouteData} disabled={loading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>

            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              تصدير CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* جدول التفاصيل */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            تفاصيل المسارات اليومية
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : routeStats.size === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد بيانات مسارات للفترة المحددة</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الفني</TableHead>
                  <TableHead>المسافة</TableHead>
                  <TableHead>مدة التتبع</TableHead>
                  <TableHead>وقت البداية</TableHead>
                  <TableHead>وقت النهاية</TableHead>
                  <TableHead>عدد النقاط</TableHead>
                  <TableHead>متوسط السرعة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from(routeStats.entries()).flatMap(([userId, stats]) =>
                  stats.map((stat, index) => (
                    <TableRow key={`${userId}-${stat.date}-${index}`}>
                      <TableCell>
                        <Badge variant="outline">{stat.date}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {getTechnicianName(userId)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-primary">
                        {formatDistance(stat.totalDistance)}
                      </TableCell>
                      <TableCell className="text-accent-foreground">
                        {formatDuration(stat.totalTime)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {stat.startTime
                          ? new Date(stat.startTime).toLocaleTimeString('ar-IQ')
                          : '--'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {stat.endTime
                          ? new Date(stat.endTime).toLocaleTimeString('ar-IQ')
                          : '--'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{stat.pointsCount}</Badge>
                      </TableCell>
                      <TableCell>
                        {stat.averageSpeed > 0
                          ? `${stat.averageSpeed.toFixed(1)} كم/ساعة`
                          : '--'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
