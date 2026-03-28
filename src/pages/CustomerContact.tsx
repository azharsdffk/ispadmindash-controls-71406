import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Phone, 
  MessageCircle, 
  Send, 
  User, 
  Loader2, 
  Search,
  Wifi,
  WifiOff,
  Clock,
  Calendar,
  Bell,
  Wrench,
  CheckCircle,
  AlertCircle,
  FileText,
  MapPin,
  RefreshCw,
  Shield,
  Settings,
  Home,
  History,
  Eye,
  Navigation
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { CustomerDashboardStats } from '@/components/customer/CustomerDashboardStats';
import { AdvancedTicketForm } from '@/components/customer/AdvancedTicketForm';
import { TicketDetailsModal } from '@/components/customer/TicketDetailsModal';
import { CustomerNotifications } from '@/components/customer/CustomerNotifications';
import { CustomerDataDisplay } from '@/components/customer/CustomerDataDisplay';
import { CustomerAccountSettings } from '@/components/customer/CustomerAccountSettings';
import { MaintenanceHistory } from '@/components/customer/MaintenanceHistory';
import { ZainCashPayment } from '@/components/payments/ZainCashPayment';

interface Agent {
  id: string;
  name: string;
  phone: string;
  whatsapp: string | null;
  telegram: string | null;
  region: string;
  working_hours: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface Subscriber {
  id: string;
  name: string;
  phone: string;
  username: string | null;
  address: string | null;
  agent_id: string | null;
  status_comment: string | null;
  updated_at: string | null;
  balance: number;
}

interface Contract {
  id: string;
  status: string;
  end_date: string;
  monthly_fee: number;
  package: {
    name: string;
    speed_mbps: number;
  } | null;
}

interface Ticket {
  id: string;
  ticket_number: string;
  status: string;
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
  net_amount: number;
  discount: number;
  status: string;
  issue_date: string;
  due_date: string;
  currency: string;
}

const statusConfig: Record<string, { label: string; color: string; showTracking?: boolean }> = {
  new: { label: 'جديد', color: 'bg-gray-500', showTracking: false },
  open: { label: 'مفتوح', color: 'bg-amber-500', showTracking: false },
  accepted_by_agent: { label: 'قيد المراجعة', color: 'bg-blue-500', showTracking: true },
  tech_assigned: { label: 'تم تعيين فني', color: 'bg-indigo-500', showTracking: true },
  tech_on_the_way: { label: 'الفني في الطريق', color: 'bg-orange-500', showTracking: true },
  tech_arrived: { label: 'وصل الفني', color: 'bg-cyan-500', showTracking: true },
  in_progress: { label: 'قيد العمل', color: 'bg-purple-500', showTracking: true },
  resolved: { label: 'تم الحل', color: 'bg-emerald-500', showTracking: false },
  closed: { label: 'مغلق', color: 'bg-muted', showTracking: false },
};

const issueTypeLabels: Record<string, string> = {
  no_internet: 'انقطاع الإنترنت',
  slow_internet: 'إنترنت بطيء',
  intermittent: 'تقطعات متكررة',
  router_issue: 'مشكلة بالراوتر',
  billing: 'مشكلة بالفواتير',
  upgrade: 'طلب ترقية',
  emergency: 'طوارئ',
  other: 'أخرى',
};

export default function CustomerContact() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (user) {
      loadSubscriberByUser();
    }
  }, [user]);

  useEffect(() => {
    if (subscriber && user) {
      loadUnreadNotifications();
    }
  }, [subscriber, user]);

  const loadSubscriberByUser = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let { data: subUser } = await supabase
        .from('subscriber_users')
        .select('subscriber_id')
        .eq('user_id', user.id)
        .maybeSingle();

      // Auto-link if not found
      if (!subUser) {
        const phone = user.user_metadata?.phone || user.phone;
        const subscriptionNumber = user.user_metadata?.subscription_number;
        let subscriberId: string | null = null;

        if (subscriptionNumber) {
          const { data: sub } = await supabase
            .from('subscribers')
            .select('id')
            .eq('username', subscriptionNumber)
            .maybeSingle();
          subscriberId = sub?.id || null;
        }
        if (!subscriberId && phone) {
          const { data: sub } = await supabase
            .from('subscribers')
            .select('id')
            .eq('phone', phone)
            .maybeSingle();
          subscriberId = sub?.id || null;
        }
        if (subscriberId) {
          await supabase.from('subscriber_users').insert({
            user_id: user.id,
            subscriber_id: subscriberId
          });
          subUser = { subscriber_id: subscriberId };
        }
      }

      if (subUser) {
        await loadSubscriberData(subUser.subscriber_id);
      }
    } catch (error) {
      console.error('Error loading subscriber:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadNotifications = async () => {
    if (!user) return;
    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      setUnreadNotifications(count || 0);
    } catch (error) {
      console.error('Error loading notifications count:', error);
    }
  };

  const searchSubscriber = async () => {
    if (!searchQuery.trim()) {
      toast.error('الرجاء إدخال رقم الخدمة أو رقم الهاتف');
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .or(`username.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
        .maybeSingle();

      if (error || !data) {
        toast.error('لم يتم العثور على المشترك');
        return;
      }

      await loadSubscriberData(data.id);
    } catch (error) {
      console.error('Error searching subscriber:', error);
      toast.error('حدث خطأ في البحث');
    } finally {
      setSearching(false);
    }
  };

  const loadSubscriberData = async (subscriberId: string) => {
    try {
      const { data: subData } = await supabase
        .from('subscribers')
        .select('*')
        .eq('id', subscriberId)
        .single();

      if (!subData) {
        toast.error('لم يتم العثور على بيانات المشترك');
        return;
      }

      setSubscriber(subData);

      if (subData.agent_id) {
        const { data: agentData } = await supabase
          .from('agents')
          .select('id, name, phone, whatsapp, telegram, region, working_hours, latitude, longitude')
          .eq('id', subData.agent_id)
          .maybeSingle();

        if (agentData) {
          setAgent(agentData);
        }
      }

      const { data: contractData } = await supabase
        .from('contracts')
        .select('id, status, end_date, package_id, monthly_fee')
        .eq('subscriber_id', subscriberId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (contractData) {
        let packageInfo = null;
        if (contractData.package_id) {
          const { data: pkgData } = await supabase
            .from('packages')
            .select('name, speed_mbps')
            .eq('id', contractData.package_id)
            .maybeSingle();
          packageInfo = pkgData;
        }
        setContract({
          ...contractData,
          package: packageInfo
        });
      }

      const { data: ticketsData } = await supabase
        .from('maintenance_tickets')
        .select('id, ticket_number, status, created_at, issue_type, issue_description, scheduled_date, resolved_at, notes, technician_id')
        .eq('subscriber_id', subscriberId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (ticketsData) {
        setTickets(ticketsData);
      }

      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('id, invoice_number, amount, net_amount, discount, status, issue_date, due_date, currency')
        .eq('subscriber_id', subscriberId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (invoicesData) {
        setInvoices(invoicesData);
      }
    } catch (error) {
      console.error('Error loading subscriber data:', error);
    }
  };

  const refreshData = async () => {
    if (!subscriber) return;
    setRefreshing(true);
    await loadSubscriberData(subscriber.id);
    await loadUnreadNotifications();
    setRefreshing(false);
    toast.success('تم تحديث البيانات');
  };

  const openWhatsApp = () => {
    if (!agent?.whatsapp) return;
    const phone = agent.whatsapp.replace(/[^0-9]/g, '');
    const message = subscriber 
      ? `مرحباً، أنا ${subscriber.name}\nرقم الخدمة: ${subscriber.username || 'غير محدد'}`
      : 'مرحباً';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const openTelegram = () => {
    if (!agent?.telegram) return;
    window.open(`https://t.me/${agent.telegram.replace('@', '')}`, '_blank');
  };

  const makeCall = () => {
    if (!agent?.phone) return;
    window.location.href = `tel:${agent.phone}`;
  };

  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentModalOpen(true);
  };

  const getServiceStatus = () => {
    if (!contract) return 'unknown';
    return contract.status;
  };

  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress');
  const completedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue');
  const lastMaintenanceDate = tickets[0]?.created_at || null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Wifi className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <Loader2 className="h-8 w-8 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground mt-4">جاري تحميل بياناتك...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>بوابة العميل | ISP</title>
        <meta name="description" content="بوابة العميل - متابعة الخدمة وطلبات الصيانة" />
      </Helmet>

      <div className="min-h-screen bg-background" dir="rtl">
        {/* Header */}
        <div className="bg-gradient-to-l from-primary via-primary to-primary/90 text-primary-foreground">
          <div className="max-w-lg mx-auto px-4 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-background/20 backdrop-blur flex items-center justify-center shadow-lg">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">بوابة العميل</h1>
                  {subscriber && (
                    <p className="text-sm opacity-80">{subscriber.name}</p>
                  )}
                </div>
              </div>
              {subscriber && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={refreshData}
                  disabled={refreshing}
                  className="text-primary-foreground hover:bg-background/20"
                >
                  <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>

            {/* Quick Stats in Header */}
            {subscriber && (
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
                    {contract?.status === 'active' ? '✅' : contract?.status === 'suspended' ? '⚠️' : '❌'}
                  </p>
                  <p className="text-xs opacity-80">حالة الخدمة</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pb-24 -mt-2">
          {/* Search - Only if no subscriber */}
          {!subscriber && (
            <Card className="border-2 border-dashed mt-6 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  ابحث عن حسابك
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="رقم الخدمة أو الهاتف..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchSubscriber()}
                    className="text-lg h-12"
                  />
                  <Button onClick={searchSubscriber} disabled={searching} size="lg" className="h-12 px-6">
                    {searching ? <Loader2 className="h-5 w-5 animate-spin" /> : 'بحث'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {subscriber && (
            <>
              {/* Tabs Navigation */}
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
                  <TabsTrigger value="settings" className="flex flex-col gap-0.5 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Settings className="h-4 w-4" />
                    <span className="text-[10px]">الإعدادات</span>
                  </TabsTrigger>
                </TabsList>

                {/* Home Tab - Dashboard */}
                <TabsContent value="home" className="mt-4 space-y-4">
                  {/* Dashboard Stats */}
                  <CustomerDashboardStats
                    openTickets={openTickets.length}
                    completedTickets={completedTickets.length}
                    pendingInvoices={pendingInvoices.length}
                    unreadNotifications={unreadNotifications}
                    lastServiceStatus={getServiceStatus()}
                    lastMaintenanceDate={lastMaintenanceDate}
                  />

                  {/* Customer Data */}
                  <CustomerDataDisplay
                    subscriber={subscriber}
                    agent={agent}
                    contract={contract}
                  />

                  {/* Quick Contact with Agent */}
                  {agent && (
                    <Card className="shadow-lg border-primary/20">
                      <CardHeader className="pb-2 bg-gradient-to-l from-primary/10 to-transparent">
                        <CardTitle className="flex items-center gap-2">
                          <Phone className="h-5 w-5 text-primary" />
                          التواصل السريع
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2">
                          <Button onClick={makeCall} size="lg" className="h-14 shadow-md">
                            <Phone className="h-5 w-5 ml-2" />
                            اتصال
                          </Button>
                          {agent.whatsapp && (
                            <Button 
                              onClick={openWhatsApp} 
                              size="lg"
                              className="h-14 bg-emerald-600 hover:bg-emerald-700 shadow-md"
                            >
                              <MessageCircle className="h-5 w-5 ml-2" />
                              واتساب
                            </Button>
                          )}
                        </div>
                        {agent.telegram && (
                          <Button 
                            onClick={openTelegram} 
                            variant="outline"
                            className="w-full mt-2 h-12"
                          >
                            <Send className="h-4 w-4 ml-2" />
                            تلغرام
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Create Ticket Quick Access */}
                  <AdvancedTicketForm 
                    subscriberId={subscriber.id}
                    agentId={subscriber.agent_id}
                    onSuccess={refreshData}
                  />
                </TabsContent>

                {/* Tickets Tab */}
                <TabsContent value="tickets" className="mt-4 space-y-4">
                  {/* Create New Ticket */}
                  <AdvancedTicketForm 
                    subscriberId={subscriber.id}
                    agentId={subscriber.agent_id}
                    onSuccess={refreshData}
                  />

                  {/* Tickets List */}
                  <Card className="shadow-lg">
                    <CardHeader className="pb-3 bg-gradient-to-l from-primary/10 to-transparent">
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Wrench className="h-5 w-5 text-primary" />
                          متابعة التكتات
                        </span>
                        <Badge variant="secondary">{tickets.length} طلب</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {tickets.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                          <Wrench className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>لا توجد طلبات صيانة</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[400px]">
                          <div className="p-4 space-y-3">
                            {tickets.map((ticket) => {
                              const status = statusConfig[ticket.status] || statusConfig.open;
                              return (
                                <Card 
                                  key={ticket.id} 
                                  className="cursor-pointer hover:border-primary/50 transition-colors"
                                  onClick={() => setSelectedTicket(ticket)}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-mono text-sm text-primary font-bold">
                                        {ticket.ticket_number}
                                      </span>
                                      <Badge className={`${status.color} text-white`}>
                                        {status.label}
                                      </Badge>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                      <div className="flex items-center gap-2">
                                        <Wrench className="h-3 w-3 text-muted-foreground" />
                                        <span>
                                          {issueTypeLabels[ticket.issue_type || ''] || ticket.issue_type || 'غير محدد'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        <span>
                                          {new Date(ticket.created_at).toLocaleDateString('ar-IQ')}
                                        </span>
                                      </div>
                                      {ticket.technician_id && (
                                        <div className="flex items-center gap-2 text-blue-600">
                                          <User className="h-3 w-3" />
                                          <span>تم تعيين فني</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="flex-1"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedTicket(ticket);
                                        }}
                                      >
                                        <Eye className="h-4 w-4 ml-1" />
                                        تفاصيل
                                      </Button>
                                      {status.showTracking && (
                                        <Button 
                                          size="sm" 
                                          className="flex-1 bg-orange-500 hover:bg-orange-600"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/ticket/${ticket.id}`);
                                          }}
                                        >
                                          <MapPin className="h-4 w-4 ml-1" />
                                          تتبع مباشر
                                        </Button>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>

                  {/* Maintenance History */}
                  <MaintenanceHistory records={tickets.map(t => ({
                    ...t,
                    technician_name: undefined
                  }))} />
                </TabsContent>

                {/* Invoices Tab */}
                <TabsContent value="invoices" className="mt-4 space-y-4">
                  <Card className="shadow-lg">
                    <CardHeader className="pb-3 bg-gradient-to-l from-primary/10 to-transparent">
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          الفواتير والاشتراك
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
                            {invoices.map((invoice) => (
                              <Card 
                                key={invoice.id}
                                className={`${
                                  invoice.status === 'paid' 
                                    ? 'border-emerald-500/30 bg-emerald-500/5' 
                                    : invoice.status === 'overdue'
                                    ? 'border-destructive/30 bg-destructive/5'
                                    : 'border-amber-500/30 bg-amber-500/5'
                                }`}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="font-mono text-sm font-bold">
                                      {invoice.invoice_number}
                                    </span>
                                    <Badge className={
                                      invoice.status === 'paid' 
                                        ? 'bg-emerald-500' 
                                        : invoice.status === 'overdue'
                                        ? 'bg-destructive'
                                        : 'bg-amber-500'
                                    }>
                                      {invoice.status === 'paid' ? 'مدفوعة' : invoice.status === 'overdue' ? 'متأخرة' : 'معلقة'}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                    <div>
                                      <p className="text-muted-foreground">المبلغ</p>
                                      <p className="font-bold text-lg">{invoice.amount.toLocaleString()} د.ع</p>
                                    </div>
                                    <div className="text-left">
                                      <p className="text-muted-foreground">تاريخ الاستحقاق</p>
                                      <p className="font-medium">
                                        {new Date(invoice.due_date).toLocaleDateString('ar-IQ')}
                                      </p>
                                    </div>
                                  </div>
                                  {invoice.status !== 'paid' && (
                                    <Button 
                                      onClick={() => openPaymentModal(invoice)}
                                      className="w-full"
                                      variant={invoice.status === 'overdue' ? 'destructive' : 'default'}
                                    >
                                      دفع الآن
                                    </Button>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>

                  {/* Payment Summary */}
                  {contract && (
                    <Card className="shadow-md border-blue-500/20 bg-blue-500/5">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-xs text-muted-foreground">الرسوم الشهرية</p>
                            <p className="font-bold">{contract.monthly_fee.toLocaleString()} د.ع</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">تاريخ الانتهاء</p>
                            <p className="font-bold">
                              {new Date(contract.end_date).toLocaleDateString('ar-IQ')}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">الرصيد الحالي</p>
                            <p className={`font-bold ${subscriber.balance < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                              {subscriber.balance.toLocaleString()} د.ع
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="mt-4">
                  {user && <CustomerNotifications userId={user.id} />}
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="mt-4">
                  <CustomerAccountSettings 
                    subscriber={subscriber}
                    onUpdate={refreshData}
                  />
                </TabsContent>
              </Tabs>

              {/* Search Another Account */}
              <Card className="mt-6 shadow-sm">
                <CardContent className="p-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setSubscriber(null);
                      setAgent(null);
                      setContract(null);
                      setTickets([]);
                      setInvoices([]);
                      setSearchQuery('');
                    }}
                  >
                    <Search className="h-4 w-4 ml-2" />
                    البحث عن حساب آخر
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Ticket Details Modal */}
        <TicketDetailsModal
          ticket={selectedTicket}
          open={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />

        {/* Payment Modal */}
        {selectedInvoice && paymentModalOpen && subscriber && (
          <ZainCashPayment
            open={paymentModalOpen}
            onOpenChange={(open) => {
              setPaymentModalOpen(open);
              if (!open) setSelectedInvoice(null);
            }}
            subscriberId={subscriber.id}
            invoiceId={selectedInvoice.id}
            amount={selectedInvoice.net_amount || selectedInvoice.amount}
            onSuccess={() => {
              setPaymentModalOpen(false);
              setSelectedInvoice(null);
              refreshData();
              toast.success('تم الدفع بنجاح');
            }}
          />
        )}
      </div>
    </>
  );
}
