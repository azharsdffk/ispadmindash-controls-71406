import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Phone, 
  MessageCircle, 
  Send, 
  User, 
  AlertTriangle, 
  Loader2, 
  Search,
  Wifi,
  WifiOff,
  Clock,
  Zap,
  Calendar,
  Bell,
  Package,
  Wrench,
  CheckCircle,
  AlertCircle,
  FileText,
  MapPin,
  CreditCard,
  Download,
  ChevronDown,
  RefreshCw,
  Sparkles,
  Shield,
  Activity
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { TicketTimeline } from '@/components/customer/TicketTimeline';
import { CustomerNotifications } from '@/components/customer/CustomerNotifications';
import { InvoicePDF } from '@/components/customer/InvoicePDF';
import { ZainCashPayment } from '@/components/payments/ZainCashPayment';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

const issueTypes = [
  { value: 'no_internet', label: 'انقطاع الخدمة', icon: '🔴', desc: 'لا يوجد اتصال' },
  { value: 'slow_internet', label: 'انترنت بطيء', icon: '🟡', desc: 'سرعة منخفضة' },
  { value: 'intermittent', label: 'تقطعات متكررة', icon: '🟠', desc: 'اتصال متقطع' },
  { value: 'router_issue', label: 'مشكلة بالراوتر', icon: '📡', desc: 'خلل بالجهاز' },
];

export default function CustomerContact() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [emergencySubmitting, setEmergencySubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedIssue, setSelectedIssue] = useState('');

  useEffect(() => {
    if (user) {
      loadSubscriberByUser();
    }
  }, [user]);

  const loadSubscriberByUser = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: subUser } = await supabase
        .from('subscriber_users')
        .select('subscriber_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subUser) {
        await loadSubscriberData(subUser.subscriber_id);
      }
    } catch (error) {
      console.error('Error loading subscriber:', error);
    } finally {
      setLoading(false);
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
        .select('id, ticket_number, status, created_at, issue_type, issue_description, scheduled_date, resolved_at, notes')
        .eq('subscriber_id', subscriberId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (ticketsData) {
        setTickets(ticketsData);
      }

      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('id, invoice_number, amount, net_amount, discount, status, issue_date, due_date, currency')
        .eq('subscriber_id', subscriberId)
        .order('created_at', { ascending: false })
        .limit(10);

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
    setRefreshing(false);
    toast.success('تم تحديث البيانات');
  };

  const submitMaintenanceRequest = async () => {
    if (!subscriber) {
      toast.error('الرجاء البحث عن حسابك أولاً');
      return;
    }

    if (!selectedIssue) {
      toast.error('الرجاء اختيار نوع المشكلة');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('maintenance_tickets')
        .insert({
          subscriber_id: subscriber.id,
          ticket_number: `TKT-${Date.now().toString().slice(-8)}`,
          issue_type: selectedIssue,
          issue_description: issueTypes.find(t => t.value === selectedIssue)?.label || selectedIssue,
          status: 'open',
          priority: 'medium',
        })
        .select()
        .single();

      if (error) throw error;

      setShowSuccess(true);
      setSelectedIssue('');
      await loadSubscriberData(subscriber.id);
      setTimeout(() => setShowSuccess(false), 5000);

    } catch (error) {
      console.error('Error submitting maintenance request:', error);
      toast.error('حدث خطأ في إرسال الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  const submitEmergencyRequest = async () => {
    if (!subscriber) {
      toast.error('الرجاء البحث عن حسابك أولاً');
      return;
    }

    setEmergencySubmitting(true);
    try {
      const { error } = await supabase
        .from('maintenance_tickets')
        .insert({
          subscriber_id: subscriber.id,
          ticket_number: `EMR-${Date.now().toString().slice(-8)}`,
          issue_type: 'emergency',
          issue_description: '🚨 طوارئ: انترنت مقطوع بالكامل',
          status: 'open',
          priority: 'urgent',
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('تم إرسال طلب الطوارئ! سيتم التواصل معك فوراً');
      await loadSubscriberData(subscriber.id);

    } catch (error) {
      console.error('Error submitting emergency request:', error);
      toast.error('حدث خطأ في إرسال طلب الطوارئ');
    } finally {
      setEmergencySubmitting(false);
    }
  };

  const getServiceStatus = () => {
    if (!contract) return { status: 'unknown', label: 'غير محدد', color: 'bg-muted' };
    
    switch (contract.status) {
      case 'active':
        return { status: 'active', label: 'فعال', color: 'bg-green-500' };
      case 'suspended':
        return { status: 'suspended', label: 'معلق', color: 'bg-yellow-500' };
      case 'expired':
      case 'cancelled':
        return { status: 'stopped', label: 'متوقف', color: 'bg-red-500' };
      default:
        return { status: 'unknown', label: 'غير محدد', color: 'bg-muted' };
    }
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

  const openMap = () => {
    if (!agent?.latitude || !agent?.longitude) return;
    window.open(`https://www.google.com/maps?q=${agent.latitude},${agent.longitude}`, '_blank');
  };

  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentModalOpen(true);
  };

  const serviceStatus = getServiceStatus();
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue');
  const activeTickets = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background" dir="rtl">
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
        <title>ISP | خدمة الإنترنت</title>
        <meta name="description" content="عرض حالة الخدمة والتواصل مع الوكيل وطلب الصيانة" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-muted/20" dir="rtl">
        {/* Hero Header */}
        <div className="bg-gradient-to-l from-primary via-primary to-primary/80 text-primary-foreground">
          <div className="max-w-lg mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Wifi className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">ISP</h1>
                  <p className="text-sm opacity-80">خدمة الإنترنت</p>
                </div>
              </div>
              {subscriber && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={refreshData}
                  disabled={refreshing}
                  className="text-primary-foreground hover:bg-white/20"
                >
                  <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>

            {subscriber && (
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold">{serviceStatus.label}</p>
                  <p className="text-xs opacity-80">حالة الخدمة</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold">{activeTickets.length}</p>
                  <p className="text-xs opacity-80">طلبات نشطة</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold">{pendingInvoices.length}</p>
                  <p className="text-xs opacity-80">فواتير معلقة</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pb-24 -mt-2">
          {/* رسالة النجاح */}
          {showSuccess && (
            <Card className="border-green-500 bg-green-500/10 animate-in slide-in-from-top mb-4 mt-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="font-bold text-green-700 dark:text-green-400">تم استلام طلبك!</p>
                    <p className="text-sm text-muted-foreground">سيتم التواصل معك قريباً</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search - Only if no subscriber */}
          {!subscriber && (
            <Card className="border-2 border-dashed mt-6 bg-background/80 backdrop-blur">
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
                <TabsList className="grid grid-cols-4 h-14 bg-background/80 backdrop-blur border shadow-sm">
                  <TabsTrigger value="home" className="flex flex-col gap-0.5 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Wifi className="h-4 w-4" />
                    <span className="text-xs">الرئيسية</span>
                  </TabsTrigger>
                  <TabsTrigger value="tickets" className="flex flex-col gap-0.5 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative">
                    <Wrench className="h-4 w-4" />
                    <span className="text-xs">الطلبات</span>
                    {activeTickets.length > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                        {activeTickets.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="invoices" className="flex flex-col gap-0.5 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative">
                    <FileText className="h-4 w-4" />
                    <span className="text-xs">الفواتير</span>
                    {pendingInvoices.length > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                        {pendingInvoices.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="flex flex-col gap-0.5 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Bell className="h-4 w-4" />
                    <span className="text-xs">الإشعارات</span>
                  </TabsTrigger>
                </TabsList>

                {/* Home Tab */}
                <TabsContent value="home" className="mt-4 space-y-4">
                  {/* حالة الخدمة */}
                  <Card className="border-2 overflow-hidden shadow-lg" style={{ borderColor: serviceStatus.status === 'active' ? 'hsl(142.1 76.2% 36.3%)' : serviceStatus.status === 'stopped' ? 'hsl(0 84.2% 60.2%)' : 'hsl(47.9 95.8% 53.1%)' }}>
                    <div className={`h-1.5 ${serviceStatus.color}`} />
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        {serviceStatus.status === 'active' ? (
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center shadow-inner">
                            <Wifi className="h-8 w-8 text-green-500" />
                          </div>
                        ) : serviceStatus.status === 'stopped' ? (
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center animate-pulse shadow-inner">
                            <WifiOff className="h-8 w-8 text-red-500" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 flex items-center justify-center shadow-inner">
                            <AlertTriangle className="h-8 w-8 text-yellow-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">حالة الخدمة</p>
                          <p className="text-2xl font-bold">{serviceStatus.label}</p>
                          {subscriber.updated_at && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              آخر تحديث: {new Date(subscriber.updated_at).toLocaleDateString('ar-IQ')}
                            </p>
                          )}
                        </div>
                        {serviceStatus.status === 'active' && (
                          <div className="text-left">
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                              <Activity className="h-3 w-3 ml-1" />
                              متصل
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      {subscriber.status_comment && (
                        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                            <div>
                              <span className="font-medium text-destructive">سبب التوقف: </span>
                              <span>{subscriber.status_comment}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* معلومات الباقة */}
                  {contract?.package && (
                    <Card className="overflow-hidden shadow-md">
                      <CardHeader className="pb-2 bg-gradient-to-l from-primary/5 to-transparent">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          الباقة الحالية
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="p-4 bg-gradient-to-br from-muted/50 to-muted/20 rounded-xl">
                            <Sparkles className="h-5 w-5 mx-auto text-primary mb-2" />
                            <p className="text-xs text-muted-foreground">الباقة</p>
                            <p className="font-bold text-sm mt-1">{contract.package.name}</p>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 rounded-xl">
                            <Zap className="h-5 w-5 mx-auto text-yellow-500 mb-2" />
                            <p className="text-xs text-muted-foreground">السرعة</p>
                            <p className="font-bold text-sm mt-1">{contract.package.speed_mbps} Mbps</p>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-muted/50 to-muted/20 rounded-xl">
                            <Calendar className="h-5 w-5 mx-auto text-primary mb-2" />
                            <p className="text-xs text-muted-foreground">التجديد</p>
                            <p className="font-bold text-sm mt-1">
                              {new Date(contract.end_date).toLocaleDateString('ar-IQ', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* التواصل مع الوكيل */}
                  <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        وكيلك المسؤول
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {agent ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shadow-inner">
                              <User className="h-7 w-7 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-lg">{agent.name}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {agent.region}
                              </p>
                              {agent.working_hours && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <Clock className="h-3 w-3" />
                                  {agent.working_hours}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <Button onClick={makeCall} size="lg" className="h-14 shadow-md">
                              <Phone className="h-5 w-5 ml-2" />
                              اتصال
                            </Button>
                            {agent.whatsapp && (
                              <Button 
                                onClick={openWhatsApp} 
                                size="lg"
                                className="h-14 bg-green-600 hover:bg-green-700 shadow-md"
                              >
                                <MessageCircle className="h-5 w-5 ml-2" />
                                واتساب
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            {agent.telegram && (
                              <Button 
                                onClick={openTelegram} 
                                variant="outline"
                                className="h-12"
                              >
                                <Send className="h-4 w-4 ml-2" />
                                تلغرام
                              </Button>
                            )}
                            {agent.latitude && agent.longitude && (
                              <Button 
                                onClick={openMap} 
                                variant="outline"
                                className="h-12"
                              >
                                <MapPin className="h-4 w-4 ml-2" />
                                موقع المكتب
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <User className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          <p>لم يتم تعيين وكيل لحسابك</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* طلب صيانة */}
                  <Card className="shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Wrench className="h-5 w-5" />
                        طلب صيانة / دعم
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {issueTypes.map((issue) => (
                          <Button
                            key={issue.value}
                            variant={selectedIssue === issue.value ? "default" : "outline"}
                            className={`h-auto py-4 flex flex-col items-center gap-2 transition-all ${
                              selectedIssue === issue.value ? 'shadow-md scale-[1.02]' : ''
                            }`}
                            onClick={() => setSelectedIssue(issue.value)}
                          >
                            <span className="text-2xl">{issue.icon}</span>
                            <span className="text-sm font-medium">{issue.label}</span>
                            <span className="text-xs text-muted-foreground">{issue.desc}</span>
                          </Button>
                        ))}
                      </div>

                      <Button 
                        onClick={submitMaintenanceRequest}
                        disabled={!selectedIssue || submitting}
                        className="w-full h-14 text-lg shadow-md"
                      >
                        {submitting ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-5 w-5 ml-2" />
                            إرسال الطلب
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* زر الطوارئ */}
                  <Card className="border-red-500/50 bg-gradient-to-br from-red-500/5 to-transparent shadow-md">
                    <CardContent className="p-4">
                      <Button 
                        onClick={submitEmergencyRequest}
                        disabled={emergencySubmitting}
                        variant="destructive"
                        className="w-full h-16 text-lg gap-3 shadow-lg"
                      >
                        {emergencySubmitting ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <>
                            <AlertCircle className="h-6 w-6" />
                            <span>🚨 انترنت مقطوع بالكامل</span>
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        استخدم هذا الزر فقط في حالات الطوارئ
                      </p>
                    </CardContent>
                  </Card>

                  {/* معلومات الحساب */}
                  <Card className="bg-muted/30 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-muted-foreground">رقم الخدمة</p>
                          <p className="font-mono font-bold text-lg">{subscriber.username || '-'}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-muted-foreground">الاسم</p>
                          <p className="font-bold text-lg">{subscriber.name}</p>
                        </div>
                      </div>
                      {typeof subscriber.balance === 'number' && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">الرصيد</span>
                            <span className={`text-xl font-bold ${subscriber.balance < 0 ? 'text-destructive' : 'text-green-600'}`}>
                              {subscriber.balance.toLocaleString()} د.ع
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tickets Tab */}
                <TabsContent value="tickets" className="mt-4 space-y-4">
                  <Card className="shadow-md">
                    <CardHeader className="pb-3 bg-gradient-to-l from-primary/5 to-transparent">
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Wrench className="h-5 w-5 text-primary" />
                          طلبات الصيانة
                        </span>
                        <Badge variant="secondary">{tickets.length} طلب</Badge>
                      </CardTitle>
                    </CardHeader>
                  </Card>

                  {tickets.length === 0 ? (
                    <Card className="shadow-sm">
                      <CardContent className="py-12 text-center text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p className="font-medium">لا توجد طلبات صيانة</p>
                        <p className="text-sm mt-1">جميع الأمور على ما يرام!</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {tickets.map((ticket) => (
                        <TicketTimeline key={ticket.id} ticket={ticket} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Invoices Tab */}
                <TabsContent value="invoices" className="mt-4 space-y-4">
                  <Card className="shadow-md">
                    <CardHeader className="pb-3 bg-gradient-to-l from-primary/5 to-transparent">
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          الفواتير
                        </span>
                        <Badge variant="secondary">{invoices.length} فاتورة</Badge>
                      </CardTitle>
                    </CardHeader>
                  </Card>

                  {invoices.length === 0 ? (
                    <Card className="shadow-sm">
                      <CardContent className="py-12 text-center text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p className="font-medium">لا توجد فواتير</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {invoices.map((invoice) => (
                        <Card key={invoice.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-mono text-sm text-muted-foreground">
                                    {invoice.invoice_number}
                                  </span>
                                  <Badge 
                                    variant={invoice.status === 'paid' ? 'default' : invoice.status === 'overdue' ? 'destructive' : 'secondary'}
                                    className={invoice.status === 'paid' ? 'bg-green-500' : ''}
                                  >
                                    {invoice.status === 'paid' ? 'مدفوعة' : invoice.status === 'overdue' ? 'متأخرة' : 'معلقة'}
                                  </Badge>
                                </div>
                                <p className="text-2xl font-bold">
                                  {(invoice.net_amount || invoice.amount).toLocaleString()}
                                  <span className="text-sm text-muted-foreground mr-1">
                                    {invoice.currency === 'IQD' ? 'د.ع' : '$'}
                                  </span>
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(invoice.issue_date).toLocaleDateString('ar-IQ')}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    استحقاق: {new Date(invoice.due_date).toLocaleDateString('ar-IQ')}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <InvoicePDF 
                                  invoice={invoice} 
                                  subscriber={{
                                    name: subscriber.name,
                                    phone: subscriber.phone,
                                    username: subscriber.username,
                                    address: subscriber.address
                                  }} 
                                />
                                {invoice.status !== 'paid' && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => openPaymentModal(invoice)}
                                    className="gap-1"
                                  >
                                    <CreditCard className="h-4 w-4" />
                                    <span className="sr-only md:not-sr-only">دفع</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="mt-4">
                  {user && <CustomerNotifications userId={user.id} />}
                </TabsContent>
              </Tabs>

              {/* زر تغيير الحساب */}
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground mt-6"
                onClick={() => {
                  setSubscriber(null);
                  setAgent(null);
                  setContract(null);
                  setTickets([]);
                  setInvoices([]);
                  setSearchQuery('');
                  setActiveTab('home');
                }}
              >
                البحث عن حساب آخر
              </Button>
            </>
          )}
        </div>

        {/* Payment Modal */}
        {selectedInvoice && subscriber && (
          <ZainCashPayment
            open={paymentModalOpen}
            onOpenChange={setPaymentModalOpen}
            subscriberId={subscriber.id}
            invoiceId={selectedInvoice.id}
            amount={selectedInvoice.net_amount || selectedInvoice.amount}
            onSuccess={() => {
              loadSubscriberData(subscriber.id);
              toast.success('تم الدفع بنجاح!');
            }}
          />
        )}
      </div>
    </>
  );
}
