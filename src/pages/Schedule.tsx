import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Plus, Clock, User, MapPin, Phone, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface ScheduleItem {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  status: string;
  priority: string;
  task_type: string | null;
  location: string | null;
  assigned_to: string | null;
  subscriber_id: string | null;
  subscriber?: {
    name: string;
    phone: string;
    address: string | null;
  };
  employee?: {
    full_name: string;
  };
}

const Schedule = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    task_type: 'maintenance',
    priority: 'medium',
    location: '',
    assigned_to: '',
    subscriber_id: '',
  });

  useEffect(() => {
    fetchScheduleItems();
    fetchEmployees();
    fetchSubscribers();
  }, [selectedDate]);

  const fetchScheduleItems = async () => {
    try {
      setLoading(true);
      
      const startOfDay = new Date(selectedDate || new Date());
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate || new Date());
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('schedule')
        .select('*')
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;

      // Fetch related data separately
      const itemsWithDetails = await Promise.all((data || []).map(async (item) => {
        let subscriber = null;
        let employee = null;

        if (item.subscriber_id) {
          const { data: subData } = await supabase
            .from('subscribers')
            .select('name, phone, address')
            .eq('id', item.subscriber_id)
            .single();
          subscriber = subData;
        }

        if (item.assigned_to) {
          const { data: empData } = await supabase
            .from('employees')
            .select('full_name')
            .eq('user_id', item.assigned_to)
            .single();
          employee = empData;
        }

        return { ...item, subscriber, employee };
      }));

      setScheduleItems(itemsWithDetails);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast.error('فشل تحميل الجدول');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('user_id, full_name')
        .eq('active', true);

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchSubscribers = async () => {
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('id, name, phone')
        .limit(100);

      if (error) throw error;
      setSubscribers(data || []);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const startDateTime = new Date(formData.start_time);
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(endDateTime.getHours() + 2); // Default 2 hour duration

      const { error } = await supabase
        .from('schedule')
        .insert({
          title: formData.title,
          description: formData.description || null,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          task_type: formData.task_type,
          priority: formData.priority,
          status: 'pending',
          location: formData.location || null,
          assigned_to: formData.assigned_to || null,
          subscriber_id: formData.subscriber_id || null,
        });

      if (error) throw error;

      toast.success('تم إضافة المهمة بنجاح');
      setAddTaskOpen(false);
      setFormData({
        title: '',
        description: '',
        start_time: '',
        task_type: 'maintenance',
        priority: 'medium',
        location: '',
        assigned_to: '',
        subscriber_id: '',
      });
      fetchScheduleItems();
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast.error(error.message || 'فشل إضافة المهمة');
    }
  };

  const updateTaskStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('schedule')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast.success('تم تحديث حالة المهمة');
      fetchScheduleItems();
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('فشل تحديث حالة المهمة');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      'pending': { label: 'معلق', variant: 'secondary' },
      'in_progress': { label: 'قيد التنفيذ', variant: 'default' },
      'completed': { label: 'مكتمل', variant: 'default' },
      'cancelled': { label: 'ملغي', variant: 'destructive' },
    };

    const config = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-destructive';
      case 'medium': return 'border-warning';
      case 'low': return 'border-success';
      default: return 'border-muted';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
        <div className="flex flex-1 w-full">
          <AppSidebar />
          <main className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-muted rounded" />
                <div className="h-8 w-44 bg-muted rounded" />
              </div>
              <div className="h-10 w-28 bg-muted rounded" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Calendar Skeleton */}
              <div className="lg:col-span-1 p-6 rounded-xl bg-card border animate-pulse">
                <div className="h-6 w-20 bg-muted rounded mb-4" />
                <div className="h-64 bg-muted/50 rounded" />
              </div>
              {/* Schedule Items Skeleton */}
              <div className="lg:col-span-3 space-y-4">
                <div className="p-6 rounded-xl bg-card border animate-pulse">
                  <div className="h-6 w-40 bg-muted rounded mb-2" />
                  <div className="h-4 w-28 bg-muted/50 rounded mb-6" />
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 rounded-lg border-l-4 border-muted bg-muted/20 animate-pulse">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="h-5 w-32 bg-muted rounded" />
                              <div className="h-5 w-16 bg-muted rounded-full" />
                            </div>
                            <div className="h-4 w-48 bg-muted/50 rounded" />
                            <div className="flex gap-4">
                              <div className="h-4 w-16 bg-muted/50 rounded" />
                              <div className="h-4 w-24 bg-muted/50 rounded" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <div className="h-8 w-8 bg-muted rounded" />
                            <div className="h-8 w-8 bg-muted rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">الجدولة والمواعيد</h1>
              </div>
              
              <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    إضافة مهمة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>إضافة مهمة جديدة</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">العنوان</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">الوصف</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="start_time">الوقت</Label>
                      <Input
                        id="start_time"
                        type="datetime-local"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="task_type">نوع المهمة</Label>
                      <Select value={formData.task_type} onValueChange={(value) => setFormData({ ...formData, task_type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="maintenance">صيانة</SelectItem>
                          <SelectItem value="installation">تركيب</SelectItem>
                          <SelectItem value="inspection">فحص</SelectItem>
                          <SelectItem value="meeting">اجتماع</SelectItem>
                          <SelectItem value="other">أخرى</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="priority">الأولوية</Label>
                      <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">منخفضة</SelectItem>
                          <SelectItem value="medium">متوسطة</SelectItem>
                          <SelectItem value="high">عالية</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="assigned_to">تعيين إلى</Label>
                      <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر موظف" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.user_id} value={emp.user_id}>
                              {emp.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="subscriber_id">المشترك</Label>
                      <Select value={formData.subscriber_id} onValueChange={(value) => setFormData({ ...formData, subscriber_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر مشترك (اختياري)" />
                        </SelectTrigger>
                        <SelectContent>
                          {subscribers.map((sub) => (
                            <SelectItem key={sub.id} value={sub.id}>
                              {sub.name} - {sub.phone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="location">الموقع</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>

                    <Button type="submit" className="w-full">إضافة المهمة</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Calendar */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">التقويم</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className={cn("rounded-md border pointer-events-auto")}
                    locale={ar}
                  />
                </CardContent>
              </Card>

              {/* Schedule Items */}
              <div className="lg:col-span-3 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      مهام يوم {selectedDate ? format(selectedDate, 'PPP', { locale: ar }) : 'اليوم'}
                    </CardTitle>
                    <CardDescription>
                      {scheduleItems.length} مهمة مجدولة
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {scheduleItems.length === 0 ? (
                      <div className="py-12 text-center">
                        <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">لا توجد مهام مجدولة لهذا اليوم</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {scheduleItems.map((item) => (
                          <Card key={item.id} className={cn("border-l-4", getPriorityColor(item.priority))}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">{item.title}</h3>
                                    {getStatusBadge(item.status)}
                                  </div>

                                  {item.description && (
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                  )}

                                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{format(new Date(item.start_time), 'p', { locale: ar })}</span>
                                    </div>

                                    {item.employee && (
                                      <div className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        <span>{item.employee.full_name}</span>
                                      </div>
                                    )}

                                    {item.subscriber && (
                                      <div className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        <span>{item.subscriber.name}</span>
                                      </div>
                                    )}

                                    {item.location && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        <span>{item.location}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  {item.status !== 'completed' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => updateTaskStatus(item.id, 'completed')}
                                    >
                                      <CheckCircle className="h-4 w-4 text-success" />
                                    </Button>
                                  )}
                                  {item.status !== 'cancelled' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => updateTaskStatus(item.id, 'cancelled')}
                                    >
                                      <XCircle className="h-4 w-4 text-destructive" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default Schedule;
