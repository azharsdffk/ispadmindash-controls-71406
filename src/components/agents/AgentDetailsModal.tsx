import { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import {
  User, Phone, MapPin, MessageCircle, Send, Clock, Building2, Activity,
  ExternalLink, Copy, Globe, Briefcase, Calendar, TrendingUp, TrendingDown,
  CheckCircle, XCircle, AlertCircle, Timer, Users, Ticket, Wrench,
  Star, Award, BarChart3, PieChart, Loader2, Mail, Hash
} from 'lucide-react';
import type { Agent } from '@/services/api/agents';

interface AgentWithStats extends Agent {
  subscribersCount?: number;
  ticketsCount?: number;
}

interface AgentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: AgentWithStats | null;
}

interface DetailedStats {
  totalSubscribers: number;
  activeSubscribers: number;
  suspendedSubscribers: number;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  inProgressTickets: number;
  techAssignedTickets: number;
  avgResolutionTime: number | null;
  totalRevenue: number;
  thisMonthRevenue: number;
  recentSubscribers: Array<{ id: string; name: string; created_at: string }>;
  recentTickets: Array<{ id: string; ticket_number: string; status: string; issue_type: string; created_at: string }>;
}

export function AgentDetailsModal({ open, onOpenChange, agent }: AgentDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DetailedStats | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (open && agent) {
      loadDetailedStats();
    }
  }, [open, agent?.id]);

  const loadDetailedStats = async () => {
    if (!agent) return;
    
    setLoading(true);
    try {
      // Fetch subscribers statistics
      const totalSubsRes = await supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('agent_id', agent.id);
      const recentSubsRes = await supabase.from('subscribers').select('id, name, created_at').eq('agent_id', agent.id).order('created_at', { ascending: false }).limit(5);
      
      const totalSubscribers = totalSubsRes.count || 0;
      const activeSubscribers = totalSubscribers; // Default to total
      const suspendedSubscribers = 0;
      const recentSubscribers = recentSubsRes.data || [];

      // Fetch tickets statistics
      const totalTicketsRes = await supabase.from('maintenance_tickets').select('*', { count: 'exact', head: true }).eq('agent_id', agent.id);
      const openTicketsRes = await supabase.from('maintenance_tickets').select('*', { count: 'exact', head: true }).eq('agent_id', agent.id).eq('status', 'open');
      const resolvedTicketsRes = await supabase.from('maintenance_tickets').select('*', { count: 'exact', head: true }).eq('agent_id', agent.id).eq('status', 'resolved');
      const inProgressTicketsRes = await supabase.from('maintenance_tickets').select('*', { count: 'exact', head: true }).eq('agent_id', agent.id).eq('status', 'in_progress');
      const techAssignedTicketsRes = await supabase.from('maintenance_tickets').select('*', { count: 'exact', head: true }).eq('agent_id', agent.id).eq('status', 'tech_assigned');
      const recentTicketsRes = await supabase.from('maintenance_tickets').select('id, ticket_number, status, issue_type, created_at').eq('agent_id', agent.id).order('created_at', { ascending: false }).limit(5);
      const resolvedTicketsDataRes = await supabase.from('maintenance_tickets').select('created_at, resolved_at').eq('agent_id', agent.id).eq('status', 'resolved').not('resolved_at', 'is', null);

      const totalTickets = totalTicketsRes.count;
      const openTickets = openTicketsRes.count;
      const resolvedTickets = resolvedTicketsRes.count;
      const inProgressTickets = inProgressTicketsRes.count;
      const techAssignedTickets = techAssignedTicketsRes.count;
      const recentTickets = recentTicketsRes.data;
      const resolvedTicketsData = resolvedTicketsDataRes.data;

      // Calculate average resolution time
      let avgResolutionTime: number | null = null;
      if (resolvedTicketsData && resolvedTicketsData.length > 0) {
        const totalTime = resolvedTicketsData.reduce((sum, ticket) => {
          if (ticket.resolved_at && ticket.created_at) {
            const created = new Date(ticket.created_at).getTime();
            const resolved = new Date(ticket.resolved_at).getTime();
            return sum + (resolved - created);
          }
          return sum;
        }, 0);
        avgResolutionTime = totalTime / resolvedTicketsData.length / (1000 * 60 * 60); // Hours
      }

      // Fetch revenue data
      const subscriberIds = recentSubscribers?.map(s => s.id) || [];
      let totalRevenue = 0;
      let thisMonthRevenue = 0;

      if (subscriberIds.length > 0) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: allPayments } = await supabase
          .from('payments')
          .select('amount, payment_date')
          .in('subscriber_id', subscriberIds);

        if (allPayments) {
          totalRevenue = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
          thisMonthRevenue = allPayments
            .filter(p => new Date(p.payment_date) >= startOfMonth)
            .reduce((sum, p) => sum + (p.amount || 0), 0);
        }
      }

      setStats({
        totalSubscribers: totalSubscribers || 0,
        activeSubscribers: activeSubscribers || 0,
        suspendedSubscribers: suspendedSubscribers || 0,
        totalTickets: totalTickets || 0,
        openTickets: openTickets || 0,
        resolvedTickets: resolvedTickets || 0,
        inProgressTickets: inProgressTickets || 0,
        techAssignedTickets: techAssignedTickets || 0,
        avgResolutionTime,
        totalRevenue,
        thisMonthRevenue,
        recentSubscribers: recentSubscribers || [],
        recentTickets: recentTickets || []
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('خطأ في تحميل الإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${label}`);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      open: { label: 'مفتوحة', variant: 'destructive' },
      in_progress: { label: 'قيد التنفيذ', variant: 'default' },
      scheduled: { label: 'مجدولة', variant: 'outline' },
      resolved: { label: 'محلولة', variant: 'secondary' }
    };
    const config = statusConfig[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!agent) return null;

  const resolutionRate = stats && stats.totalTickets > 0 
    ? ((stats.resolvedTickets / stats.totalTickets) * 100).toFixed(0) 
    : '0';

  const activeRate = stats && stats.totalSubscribers > 0
    ? ((stats.activeSubscribers / stats.totalSubscribers) * 100).toFixed(0)
    : '0';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-4xl max-h-[90vh]" dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-primary-foreground text-xl font-bold">
              {agent.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-xl">{agent.name}</span>
                <Badge variant={agent.active ? 'default' : 'secondary'} className="text-xs">
                  {agent.active ? 'نشط' : 'غير نشط'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                <MapPin className="h-3 w-3" />
                {agent.region}
                {agent.created_at && (
                  <>
                    <span>•</span>
                    <span>منذ {formatDistanceToNow(new Date(agent.created_at), { locale: ar, addSuffix: false })}</span>
                  </>
                )}
              </p>
            </div>
          </AlertDialogTitle>
        </AlertDialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
                <TabsTrigger value="contact">التواصل</TabsTrigger>
                <TabsTrigger value="subscribers">المشتركين</TabsTrigger>
                <TabsTrigger value="tickets">التذاكر</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="text-2xl font-bold">{stats?.totalSubscribers || 0}</p>
                          <p className="text-xs text-muted-foreground">إجمالي المشتركين</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                        <div>
                          <p className="text-2xl font-bold">{stats?.activeSubscribers || 0}</p>
                          <p className="text-xs text-muted-foreground">مشترك نشط</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Ticket className="h-8 w-8 text-orange-500" />
                        <div>
                          <p className="text-2xl font-bold">{stats?.totalTickets || 0}</p>
                          <p className="text-xs text-muted-foreground">إجمالي التذاكر</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-purple-500" />
                        <div>
                          <p className="text-2xl font-bold">{stats?.totalRevenue?.toLocaleString() || 0}</p>
                          <p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        نسبة حل التذاكر
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-3xl font-bold text-primary">{resolutionRate}%</span>
                          <span className="text-sm text-muted-foreground">
                            {stats?.resolvedTickets || 0} / {stats?.totalTickets || 0}
                          </span>
                        </div>
                        <Progress value={Number(resolutionRate)} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <PieChart className="h-4 w-4" />
                        نسبة المشتركين النشطين
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-3xl font-bold text-green-500">{activeRate}%</span>
                          <span className="text-sm text-muted-foreground">
                            {stats?.activeSubscribers || 0} / {stats?.totalSubscribers || 0}
                          </span>
                        </div>
                        <Progress value={Number(activeRate)} className="h-2 [&>div]:bg-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tickets Status Overview */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">حالة التذاكر</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-3 rounded-lg bg-red-500/10">
                        <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
                        <p className="text-xl font-bold">{stats?.openTickets || 0}</p>
                        <p className="text-xs text-muted-foreground">مفتوحة</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-blue-500/10">
                        <Wrench className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                        <p className="text-xl font-bold">{stats?.inProgressTickets || 0}</p>
                        <p className="text-xs text-muted-foreground">قيد التنفيذ</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-amber-500/10">
                        <Timer className="h-6 w-6 text-amber-500 mx-auto mb-1" />
                        <p className="text-xl font-bold">{stats?.techAssignedTickets || 0}</p>
                        <p className="text-xs text-muted-foreground">معين للفني</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-green-500/10">
                        <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-1" />
                        <p className="text-xl font-bold">{stats?.resolvedTickets || 0}</p>
                        <p className="text-xs text-muted-foreground">محلولة</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Info */}
                {stats?.avgResolutionTime !== null && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Timer className="h-8 w-8 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">متوسط وقت حل التذاكر</p>
                          <p className="text-2xl font-bold">
                            {stats.avgResolutionTime < 24 
                              ? `${stats.avgResolutionTime.toFixed(1)} ساعة`
                              : `${(stats.avgResolutionTime / 24).toFixed(1)} يوم`
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Contact Tab */}
              <TabsContent value="contact" className="space-y-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">معلومات الاتصال</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Phone */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-primary" />
                        <span>الهاتف</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium" dir="ltr">{agent.phone}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(agent.phone, 'رقم الهاتف')}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(`tel:${agent.phone}`)}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* WhatsApp */}
                    {agent.whatsapp && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-5 w-5 text-green-600" />
                          <span>واتساب</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-green-600" dir="ltr">{agent.whatsapp}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(agent.whatsapp!, 'رقم الواتساب')}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => window.open(`https://wa.me/${agent.whatsapp?.replace(/\D/g, '')}`, '_blank')}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Telegram */}
                    {agent.telegram && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
                        <div className="flex items-center gap-2">
                          <Send className="h-5 w-5 text-blue-600" />
                          <span>تلغرام</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-blue-600">{agent.telegram}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(agent.telegram!, 'حساب التلغرام')}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={() => window.open(`https://t.me/${agent.telegram?.replace('@', '')}`, '_blank')}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">الموقع والعنوان</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Region */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <span>المنطقة</span>
                      </div>
                      <span className="font-medium">{agent.region}</span>
                    </div>

                    {/* Address */}
                    {agent.address && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <span>العنوان التفصيلي</span>
                        </div>
                        <p className="text-sm pr-7">{agent.address}</p>
                      </div>
                    )}

                    {/* Map Location */}
                    {agent.latitude && agent.longitude && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Globe className="h-5 w-5 text-primary" />
                          <span>إحداثيات الموقع</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-muted-foreground" dir="ltr">
                            {agent.latitude.toFixed(6)}, {agent.longitude.toFixed(6)}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(`https://www.google.com/maps?q=${agent.latitude},${agent.longitude}`, '_blank')}
                          >
                            <MapPin className="h-4 w-4 ml-1" />
                            الخريطة
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">معلومات إضافية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Working Hours */}
                    {agent.working_hours && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-primary" />
                          <span>أوقات العمل</span>
                        </div>
                        <span className="font-medium">{agent.working_hours}</span>
                      </div>
                    )}

                    {/* Notes */}
                    {agent.notes && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Briefcase className="h-5 w-5 text-muted-foreground" />
                          <span>ملاحظات</span>
                        </div>
                        <p className="text-sm pr-7">{agent.notes}</p>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                      {agent.created_at && (
                        <div className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Calendar className="h-4 w-4" />
                            <span className="text-xs">تاريخ الإنشاء</span>
                          </div>
                          <p className="text-sm font-medium">
                            {format(new Date(agent.created_at), 'dd MMMM yyyy', { locale: ar })}
                          </p>
                        </div>
                      )}
                      {agent.updated_at && (
                        <div className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Calendar className="h-4 w-4" />
                            <span className="text-xs">آخر تحديث</span>
                          </div>
                          <p className="text-sm font-medium">
                            {format(new Date(agent.updated_at), 'dd MMMM yyyy', { locale: ar })}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Agent ID */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Hash className="h-5 w-5 text-muted-foreground" />
                        <span className="text-muted-foreground">معرف الوكيل</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{agent.id}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(agent.id, 'معرف الوكيل')}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Subscribers Tab */}
              <TabsContent value="subscribers" className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <Card className="bg-blue-500/10 border-blue-500/20">
                    <CardContent className="p-4 text-center">
                      <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{stats?.totalSubscribers || 0}</p>
                      <p className="text-xs text-muted-foreground">إجمالي المشتركين</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-500/10 border-green-500/20">
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{stats?.activeSubscribers || 0}</p>
                      <p className="text-xs text-muted-foreground">نشط</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-500/10 border-amber-500/20">
                    <CardContent className="p-4 text-center">
                      <XCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{stats?.suspendedSubscribers || 0}</p>
                      <p className="text-xs text-muted-foreground">معلق</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">آخر المشتركين المضافين</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats?.recentSubscribers && stats.recentSubscribers.length > 0 ? (
                      <div className="space-y-2">
                        {stats.recentSubscribers.map((subscriber) => (
                          <div key={subscriber.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <span className="font-medium">{subscriber.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(subscriber.created_at), { locale: ar, addSuffix: true })}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">لا يوجد مشتركين</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-green-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">إيرادات هذا الشهر</p>
                          <p className="text-2xl font-bold">{stats?.thisMonthRevenue?.toLocaleString() || 0} د.ع</p>
                        </div>
                      </div>
                      <Separator orientation="vertical" className="h-12" />
                      <div className="flex items-center gap-3">
                        <Award className="h-8 w-8 text-purple-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                          <p className="text-2xl font-bold">{stats?.totalRevenue?.toLocaleString() || 0} د.ع</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tickets Tab */}
              <TabsContent value="tickets" className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  <Card className="bg-red-500/10 border-red-500/20">
                    <CardContent className="p-3 text-center">
                      <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
                      <p className="text-xl font-bold">{stats?.openTickets || 0}</p>
                      <p className="text-xs text-muted-foreground">مفتوحة</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-500/10 border-blue-500/20">
                    <CardContent className="p-3 text-center">
                      <Wrench className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                      <p className="text-xl font-bold">{stats?.inProgressTickets || 0}</p>
                      <p className="text-xs text-muted-foreground">قيد التنفيذ</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-500/10 border-amber-500/20">
                    <CardContent className="p-3 text-center">
                      <Timer className="h-6 w-6 text-amber-500 mx-auto mb-1" />
                      <p className="text-xl font-bold">{stats?.techAssignedTickets || 0}</p>
                      <p className="text-xs text-muted-foreground">معين للفني</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-500/10 border-green-500/20">
                    <CardContent className="p-3 text-center">
                      <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-1" />
                      <p className="text-xl font-bold">{stats?.resolvedTickets || 0}</p>
                      <p className="text-xs text-muted-foreground">محلولة</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">آخر التذاكر</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats?.recentTickets && stats.recentTickets.length > 0 ? (
                      <div className="space-y-2">
                        {stats.recentTickets.map((ticket) => (
                          <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                                <Ticket className="h-4 w-4 text-orange-500" />
                              </div>
                              <div>
                                <span className="font-medium font-mono text-sm">{ticket.ticket_number}</span>
                                {ticket.issue_type && (
                                  <p className="text-xs text-muted-foreground">{ticket.issue_type}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(ticket.status)}
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(ticket.created_at), { locale: ar, addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">لا توجد تذاكر</p>
                    )}
                  </CardContent>
                </Card>

                {stats?.avgResolutionTime !== null && stats?.avgResolutionTime !== undefined && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Timer className="h-10 w-10 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">متوسط وقت حل التذاكر</p>
                          <p className="text-3xl font-bold">
                            {stats.avgResolutionTime < 24 
                              ? `${stats.avgResolutionTime.toFixed(1)} ساعة`
                              : `${(stats.avgResolutionTime / 24).toFixed(1)} يوم`
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </ScrollArea>

        <AlertDialogFooter>
          <AlertDialogCancel>إغلاق</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
