import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Helmet } from 'react-helmet-async';
import { AdvancedTicketForm } from '@/components/customer/AdvancedTicketForm';
import { TicketDetailsModal } from '@/components/customer/TicketDetailsModal';
import { CustomerNotifications } from '@/components/customer/CustomerNotifications';
import { 
  User, FileText, DollarSign, Wrench, Package, CreditCard, 
  CheckCircle, Clock, Plus, Bell, Home, RefreshCw, Loader2,
  Wifi, WifiOff, MapPin, Phone, Calendar, Eye, AlertCircle,
  Shield, Navigation
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Subscriber {
  id: string;
  name: string;
  phone: string;
  username: string | null;
  address: string | null;
  agent_id: string | null;
  status_comment: string | null;
  status: string | null;
  balance: number;
  plan: string | null;
  email: string | null;
  updated_at: string | null;
}

interface Contract {
  id: string;
  status: string;
  end_date: string;
  monthly_fee: number;
  package: { name: string; speed_mbps: number } | null;
}

interface Agent {
  id: string;
  name: string;
  phone: string;
  whatsapp: string | null;
  telegram: string | null;
  region: string;
}

interface Ticket {
  id: string;
  ticket_number: string;
  status: string;
  priority: string | null;
  created_at: string;
  issue_type: string | null;
  issue_description: string;
  scheduled_date: string | null;
  resolved_at: string | null;
  notes: string | null;
  technician_id: string | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  net_amount: number | null;
  status: string | null;
  issue_date: string;
  due_date: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'جديد', color: 'bg-gray-500' },
  open: { label: 'مفتوح', color: 'bg-amber-500' },
  accepted_by_agent: { label: 'قيد المراجعة', color: 'bg-blue-500' },
  tech_assigned: { label: 'تم تعيين فني', color: 'bg-indigo-500' },
  tech_on_the_way: { label: 'الفني في الطريق', color: 'bg-orange-500' },
  tech_arrived: { label: 'وصل الفني', color: 'bg-cyan-500' },
  in_progress: { label: 'قيد العمل', color: 'bg-purple-500' },
  resolved: { label: 'تم الحل', color: 'bg-emerald-500' },
  closed: { label: 'مغلق', color: 'bg-muted' },
  pending: { label: 'معلق', color: 'bg-yellow-500' },
  assigned: { label: 'مسند', color: 'bg-blue-500' },
  completed: { label: 'مكتمل', color: 'bg-emerald-500' },
  cancelled: { label: 'ملغي', color: 'bg-red-500' },
};

const issueTypeLabels: Record<string, string> = {
  no_internet: 'انقطاع الإنترنت',
  slow_internet: 'إنترنت بطيء',
  no_connection: 'لا يوجد اتصال',
  slow_speed: 'بطء في السرعة',
  intermittent: 'تقطعات متكررة',
  router_issue: 'مشكلة بالراوتر',
  billing: 'مشكلة بالفواتير',
  upgrade: 'طلب ترقية',
  emergency: 'طوارئ',
  other: 'أخرى',
};

const CustomerPortal = () => {
  const { user } = useAuth();
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  // Realtime subscription for tickets
  useEffect(() => {
    if (!subscriber) return;
    const channel = supabase
      .channel('customer_tickets_' + subscriber.id)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'maintenance_tickets',
        filter: `subscriber_id=eq.${subscriber.id}`,
      }, () => {
        loadTickets(subscriber.id);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [subscriber?.id]);

  // Realtime for notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('customer_notifs_' + user.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        loadUnreadCount();
        toast.info('لديك إشعار جديد');
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Find subscriber link
      let { data: link } = await supabase
        .from('subscriber_users')
        .select('subscriber_id')
        .eq('user_id', user.id)
        .maybeSingle();

      // Auto-link if not found
      if (!link) {
        const phone = user.user_metadata?.phone || user.phone;
        const subNum = user.user_metadata?.subscription_number;
        let subId: string | null = null;

        if (subNum) {
          const { data } = await supabase.from('subscribers').select('id').eq('username', subNum).maybeSingle();
          subId = data?.id || null;
        }
        if (!subId && phone) {
          const { data } = await supabase.from('subscribers').select('id').eq('phone', phone).maybeSingle();
          subId = data?.id || null;
        }
        if (subId) {
          await supabase.from('subscriber_users').insert({ user_id: user.id, subscriber_id: subId });
          link = { subscriber_id: subId };
        }
      }

      if (!link) { setLoading(false); return; }

      // Load all data in parallel
      const [subRes, ticketsRes, invoicesRes] = await Promise.all([
        supabase.from('subscribers').select('*').eq('id', link.subscriber_id).single(),
        supabase.from('maintenance_tickets').select('*').eq('subscriber_id', link.subscriber_id).order('created_at', { ascending: false }).limit(50),
        supabase.from('invoices').select('*').eq('subscriber_id', link.subscriber_id).order('created_at', { ascending: false }).limit(20),
      ]);

      const sub = subRes.data;
      if (sub) {
        setSubscriber(sub as any);
        setTickets(ticketsRes.data || []);
        setInvoices(invoicesRes.data || []);

        // Load agent
        if (sub.agent_id) {
          const { data: agentData } = await supabase.from('agents')
            .select('id, name, phone, whatsapp, telegram, region')
            .eq('id', sub.agent_id).maybeSingle();
          if (agentData) setAgent(agentData);
        }

        // Load contract
        const { data: contractData } = await supabase.from('contracts')
          .select('id, status, end_date, package_id, monthly_fee')
          .eq('subscriber_id', link.subscriber_id)
          .order('created_at', { ascending: false }).limit(1).maybeSingle();
        
        if (contractData) {
          let pkg = null;
          if (contractData.package_id) {
            const { data: pkgData } = await supabase.from('packages')
              .select('name, speed_mbps').eq('id', contractData.package_id).maybeSingle();
            pkg = pkgData;
          }
          setContract({ ...contractData, package: pkg });
        }
      }

      loadUnreadCount();
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async (subscriberId: string) => {
    const { data } = await supabase.from('maintenance_tickets')
      .select('*').eq('subscriber_id', subscriberId)
      .order('created_at', { ascending: false }).limit(50);
    if (data) setTickets(data);
  };

  const loadUnreadCount = async () => {
    if (!user) return;
    const { count } = await supabase.from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('read', false);
    setUnreadNotifications(count || 0);
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('تم تحديث البيانات');
  };

  const openTickets = tickets.filter(t => !['resolved', 'closed', 'completed', 'cancelled'].includes(t.status));
  const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'overdue');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Wifi className="h-10 w-10 text-primary animate-pulse" />
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground mt-4">جاري تحميل بياناتك...</p>
        </div>
      </div>
    );
  }

  if (!subscriber) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">لا يوجد حساب مرتبط</h2>
            <p className="text-muted-foreground mb-4">
              لم يتم العثور على حساب مشترك مرتبط بهذا المستخدم. يرجى التواصل مع الدعم الفني.
            </p>
            <p className="text-sm text-muted-foreground">
              تأكد من إدخال رقم الخدمة الصحيح عند التسجيل.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>بوابة العميل | ISP Pro</title>
      </Helmet>

      <div className="min-h-screen bg-background" dir="rtl">
        {/* Header */}
        <div className="bg-gradient-to-l from-primary via-primary to-primary/90 text-primary-foreground">
          <div className="max-w-2xl mx-auto px-4 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-background/20 backdrop-blur flex items-center justify-center shadow-lg">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">بوابة العميل</h1>
                  <p className="text-sm opacity-80">{subscriber.name}</p>
                </div>
              </div>
              <Button
                variant="ghost" size="icon"
                onClick={refreshData} disabled={refreshing}
                className="text-primary-foreground hover:bg-background/20"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="bg-background/15 backdrop-blur rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{openTickets.length}</p>
                <p className="text-xs opacity-80">طلبات نشطة</p>
              </div>
              <div className="bg-background/15 backdrop-blur rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{pendingInvoices.length}</p>
                <p className="text-xs opacity-80">فواتير معلقة</p>
              </div>
              <div className="bg-background/15 backdrop-blur rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">
                  {subscriber.status === 'active' ? '✅' : subscriber.status === 'suspended' ? '⚠️' : '❌'}
                </p>
                <p className="text-xs opacity-80">حالة الخدمة</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 pb-24 -mt-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid grid-cols-5 h-16 bg-card border shadow-lg">
              <TabsTrigger value="home" className="flex flex-col gap-0.5 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Home className="h-4 w-4" />
                <span className="text-[10px]">الرئيسية</span>
              </TabsTrigger>
              <TabsTrigger value="tickets" className="flex flex-col gap-0.5 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative">
                <Wrench className="h-4 w-4" />
                <span className="text-[10px]">الطلبات</span>
                {openTickets.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                    {openTickets.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="new-ticket" className="flex flex-col gap-0.5 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Plus className="h-4 w-4" />
                <span className="text-[10px]">طلب جديد</span>
              </TabsTrigger>
              <TabsTrigger value="invoices" className="flex flex-col gap-0.5 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative">
                <FileText className="h-4 w-4" />
                <span className="text-[10px]">الفواتير</span>
                {pendingInvoices.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                    {pendingInvoices.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex flex-col gap-0.5 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative">
                <Bell className="h-4 w-4" />
                <span className="text-[10px]">الإشعارات</span>
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* HOME TAB */}
            <TabsContent value="home" className="mt-4 space-y-4">
              {/* Personal Info */}
              <Card className="shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-5 w-5 text-primary" />
                    معلومات الحساب
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">الاسم</p>
                      <p className="font-semibold">{subscriber.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">الهاتف</p>
                      <p className="font-semibold">{subscriber.phone}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">رقم الخدمة</p>
                      <p className="font-semibold">{subscriber.username || 'غير محدد'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">الباقة</p>
                      <p className="font-semibold text-primary">{subscriber.plan || contract?.package?.name || 'غير محدد'}</p>
                    </div>
                    {subscriber.address && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">العنوان</p>
                        <p className="font-semibold flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{subscriber.address}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Service Status */}
              <Card className={`shadow-lg border-l-4 ${
                contract?.status === 'active' ? 'border-l-emerald-500' :
                contract?.status === 'suspended' ? 'border-l-amber-500' : 'border-l-destructive'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {contract?.status === 'active' ? (
                        <Wifi className="h-8 w-8 text-emerald-500" />
                      ) : (
                        <WifiOff className="h-8 w-8 text-destructive" />
                      )}
                      <div>
                        <p className="font-bold">
                          {contract?.status === 'active' ? 'الخدمة فعّالة' :
                           contract?.status === 'suspended' ? 'الخدمة موقوفة' :
                           contract ? 'الخدمة منتهية' : 'لا يوجد عقد'}
                        </p>
                        {contract && (
                          <p className="text-sm text-muted-foreground">
                            ينتهي: {new Date(contract.end_date).toLocaleDateString('ar-IQ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-muted-foreground">الرصيد</p>
                      <p className={`text-xl font-bold ${subscriber.balance < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                        {subscriber.balance.toLocaleString()} <span className="text-xs">د.ع</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Contact */}
              {agent && (
                <Card className="shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Phone className="h-5 w-5 text-primary" />
                      التواصل مع الوكيل: {agent.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => window.location.href = `tel:${agent.phone}`} className="h-12">
                        <Phone className="h-4 w-4 ml-2" /> اتصال
                      </Button>
                      {agent.whatsapp && (
                        <Button 
                          onClick={() => window.open(`https://wa.me/${agent.whatsapp?.replace(/[^0-9]/g, '')}`, '_blank')}
                          className="h-12 bg-emerald-600 hover:bg-emerald-700"
                        >
                          واتساب
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Tickets */}
              {tickets.length > 0 && (
                <Card className="shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span className="flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-primary" />
                        آخر الطلبات
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('tickets')}>
                        عرض الكل
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {tickets.slice(0, 3).map(ticket => {
                      const st = statusConfig[ticket.status] || statusConfig.open;
                      return (
                        <div 
                          key={ticket.id}
                          className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <div>
                            <p className="font-mono text-sm font-bold">{ticket.ticket_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {issueTypeLabels[ticket.issue_type || ''] || ticket.issue_description.slice(0, 30)}
                            </p>
                          </div>
                          <Badge className={`${st.color} text-white text-xs`}>{st.label}</Badge>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Quick New Ticket */}
              <Button 
                onClick={() => setActiveTab('new-ticket')} 
                className="w-full h-14 text-lg shadow-lg"
              >
                <Plus className="h-5 w-5 ml-2" />
                طلب صيانة جديد
              </Button>
            </TabsContent>

            {/* TICKETS TAB */}
            <TabsContent value="tickets" className="mt-4 space-y-4">
              <Card className="shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-primary" />
                      جميع الطلبات
                    </span>
                    <Badge variant="secondary">{tickets.length} طلب</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {tickets.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <Wrench className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>لا توجد طلبات صيانة</p>
                      <Button variant="outline" className="mt-4" onClick={() => setActiveTab('new-ticket')}>
                        <Plus className="h-4 w-4 ml-2" />
                        إنشاء طلب جديد
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px]">
                      <div className="p-4 space-y-3">
                        {tickets.map(ticket => {
                          const st = statusConfig[ticket.status] || statusConfig.open;
                          return (
                            <Card 
                              key={ticket.id}
                              className="cursor-pointer hover:border-primary/50 transition-colors"
                              onClick={() => setSelectedTicket(ticket)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-mono text-sm text-primary font-bold">{ticket.ticket_number}</span>
                                  <Badge className={`${st.color} text-white`}>{st.label}</Badge>
                                </div>
                                <div className="space-y-1 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Wrench className="h-3 w-3 text-muted-foreground" />
                                    <span>{issueTypeLabels[ticket.issue_type || ''] || ticket.issue_description.slice(0, 50)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    <span>{new Date(ticket.created_at).toLocaleDateString('ar-IQ')}</span>
                                  </div>
                                  {ticket.technician_id && (
                                    <div className="flex items-center gap-2 text-blue-600">
                                      <User className="h-3 w-3" />
                                      <span>تم تعيين فني</span>
                                    </div>
                                  )}
                                  {ticket.notes && (
                                    <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                                      <p className="font-semibold mb-1">ملاحظات:</p>
                                      <p>{ticket.notes}</p>
                                    </div>
                                  )}
                                </div>
                                <Button variant="ghost" size="sm" className="w-full mt-2" onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); }}>
                                  <Eye className="h-4 w-4 ml-1" /> عرض التفاصيل
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* NEW TICKET TAB */}
            <TabsContent value="new-ticket" className="mt-4">
              <AdvancedTicketForm 
                subscriberId={subscriber.id}
                agentId={subscriber.agent_id}
                onSuccess={() => {
                  refreshData();
                  setActiveTab('tickets');
                }}
              />
            </TabsContent>

            {/* INVOICES TAB */}
            <TabsContent value="invoices" className="mt-4 space-y-4">
              {/* Subscription Summary */}
              {contract && (
                <Card className="shadow-md border-blue-500/20 bg-blue-500/5">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">الرسوم الشهرية</p>
                        <p className="font-bold">{contract.monthly_fee.toLocaleString()} د.ع</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">انتهاء العقد</p>
                        <p className="font-bold">{new Date(contract.end_date).toLocaleDateString('ar-IQ')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">الرصيد</p>
                        <p className={`font-bold ${subscriber.balance < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                          {subscriber.balance.toLocaleString()} د.ع
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      الفواتير
                    </span>
                    <Badge variant="secondary">{invoices.length} فاتورة</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {invoices.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>لا توجد فواتير</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px]">
                      <div className="p-4 space-y-3">
                        {invoices.map(invoice => (
                          <Card 
                            key={invoice.id}
                            className={`${
                              invoice.status === 'paid' ? 'border-emerald-500/30 bg-emerald-500/5' :
                              invoice.status === 'overdue' ? 'border-destructive/30 bg-destructive/5' :
                              'border-amber-500/30 bg-amber-500/5'
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-sm font-bold">{invoice.invoice_number}</span>
                                <Badge className={
                                  invoice.status === 'paid' ? 'bg-emerald-500' :
                                  invoice.status === 'overdue' ? 'bg-destructive' : 'bg-amber-500'
                                }>
                                  {invoice.status === 'paid' ? 'مدفوعة' : invoice.status === 'overdue' ? 'متأخرة' : 'معلقة'}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-muted-foreground">المبلغ</p>
                                  <p className="font-bold text-lg">{Number(invoice.net_amount || invoice.amount).toLocaleString()} د.ع</p>
                                </div>
                                <div className="text-left">
                                  <p className="text-muted-foreground">الاستحقاق</p>
                                  <p className="font-medium">{new Date(invoice.due_date).toLocaleDateString('ar-IQ')}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* NOTIFICATIONS TAB */}
            <TabsContent value="notifications" className="mt-4">
              {user && <CustomerNotifications userId={user.id} />}
            </TabsContent>
          </Tabs>
        </div>

        {/* Ticket Details Modal */}
        <TicketDetailsModal
          ticket={selectedTicket}
          open={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      </div>
    </>
  );
};

export default CustomerPortal;
