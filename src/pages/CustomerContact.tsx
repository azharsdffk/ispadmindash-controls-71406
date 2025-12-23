import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
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
  MapPin
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';

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
}

interface Contract {
  id: string;
  status: string;
  end_date: string;
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
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  due_date: string;
  currency: string;
}

// أنواع المشاكل المتاحة للعميل
const issueTypes = [
  { value: 'no_internet', label: 'انقطاع الخدمة', icon: '🔴' },
  { value: 'slow_internet', label: 'انترنت بطيء', icon: '🟡' },
  { value: 'intermittent', label: 'تقطعات متكررة', icon: '🟠' },
  { value: 'router_issue', label: 'مشكلة بالراوتر', icon: '📡' },
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
        .single();

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
        .single();

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
      // Get subscriber
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

      // Load agent with full details
      if (subData.agent_id) {
        const { data: agentData } = await supabase
          .from('agents')
          .select('id, name, phone, whatsapp, telegram, region, working_hours, latitude, longitude')
          .eq('id', subData.agent_id)
          .single();

        if (agentData) {
          setAgent(agentData);
        }
      }

      // Load active contract with package
      const { data: contractData } = await supabase
        .from('contracts')
        .select('id, status, end_date, package_id')
        .eq('subscriber_id', subscriberId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (contractData) {
        let packageInfo = null;
        if (contractData.package_id) {
          const { data: pkgData } = await supabase
            .from('packages')
            .select('name, speed_mbps')
            .eq('id', contractData.package_id)
            .single();
          packageInfo = pkgData;
        }
        setContract({
          ...contractData,
          package: packageInfo
        });
      }

      // Load last 5 tickets
      const { data: ticketsData } = await supabase
        .from('maintenance_tickets')
        .select('id, ticket_number, status, created_at, issue_type')
        .eq('subscriber_id', subscriberId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (ticketsData) {
        setTickets(ticketsData);
      }

      // Load last invoice
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('id, invoice_number, amount, status, due_date, currency')
        .eq('subscriber_id', subscriberId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (invoicesData) {
        setInvoices(invoicesData);
      }
    } catch (error) {
      console.error('Error loading subscriber data:', error);
    }
  };

  // إرسال طلب الصيانة
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

  // 🚨 زر الطوارئ - انترنت مقطوع بالكامل
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

  const getTicketStatus = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive" className="text-xs">جديد</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-500 text-xs">قيد المعالجة</Badge>;
      case 'resolved':
      case 'closed':
        return <Badge className="bg-green-500 text-xs">تم الحل</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  const getIssueLabel = (issueType: string | null) => {
    if (!issueType) return '-';
    if (issueType === 'emergency') return '🚨 طوارئ';
    return issueTypes.find(t => t.value === issueType)?.label || issueType;
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

  const serviceStatus = getServiceStatus();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري تحميل بياناتك...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>بوابة العميل | خدمة الإنترنت</title>
        <meta name="description" content="عرض حالة الخدمة والتواصل مع الوكيل وطلب الصيانة" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4 pb-20" dir="rtl">
        <div className="max-w-lg mx-auto space-y-4">
          
          {/* Header */}
          <div className="text-center py-4">
            <h1 className="text-2xl font-bold">بوابة العميل</h1>
            <p className="text-muted-foreground text-sm">خدمة الإنترنت</p>
          </div>

          {/* رسالة النجاح */}
          {showSuccess && (
            <Card className="border-green-500 bg-green-500/10 animate-in slide-in-from-top">
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
            <Card className="border-2 border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5" />
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
                    className="text-lg"
                  />
                  <Button onClick={searchSubscriber} disabled={searching} size="lg">
                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'بحث'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {subscriber && (
            <>
              {/* 1️⃣ حالة الخدمة - الأهم */}
              <Card className="border-2 overflow-hidden" style={{ borderColor: serviceStatus.status === 'active' ? 'hsl(142.1 76.2% 36.3%)' : serviceStatus.status === 'stopped' ? 'hsl(0 84.2% 60.2%)' : 'hsl(47.9 95.8% 53.1%)' }}>
                <div className={`h-2 ${serviceStatus.color}`}></div>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {serviceStatus.status === 'active' ? (
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Wifi className="h-8 w-8 text-green-500" />
                        </div>
                      ) : serviceStatus.status === 'stopped' ? (
                        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                          <WifiOff className="h-8 w-8 text-red-500" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
                          <AlertTriangle className="h-8 w-8 text-yellow-500" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">حالة الخدمة</p>
                        <p className="text-2xl font-bold">{serviceStatus.label}</p>
                        {subscriber.updated_at && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            آخر تحديث: {new Date(subscriber.updated_at).toLocaleDateString('ar-IQ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {subscriber.status_comment && (
                    <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
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

              {/* 2️⃣ معلومات الباقة */}
              {contract?.package && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      الباقة الحالية
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">الباقة</p>
                        <p className="font-bold text-sm mt-1">{contract.package.name}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">السرعة</p>
                        <p className="font-bold text-sm mt-1 flex items-center justify-center gap-1">
                          <Zap className="h-3 w-3 text-yellow-500" />
                          {contract.package.speed_mbps} Mbps
                        </p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">التجديد</p>
                        <p className="font-bold text-sm mt-1 flex items-center justify-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(contract.end_date).toLocaleDateString('ar-IQ', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 3️⃣ التواصل مع الوكيل - ⭐ الأهم */}
              <Card className="border-primary/50 bg-primary/5">
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
                        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="h-7 w-7 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-lg">{agent.name}</p>
                          <p className="text-sm text-muted-foreground">{agent.region}</p>
                          {agent.working_hours && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {agent.working_hours}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* أزرار التواصل */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button onClick={makeCall} size="lg" className="h-14">
                          <Phone className="h-5 w-5 ml-2" />
                          اتصال
                        </Button>
                        {agent.whatsapp && (
                          <Button 
                            onClick={openWhatsApp} 
                            size="lg"
                            className="h-14 bg-green-600 hover:bg-green-700"
                          >
                            <MessageCircle className="h-5 w-5 ml-2" />
                            واتساب
                          </Button>
                        )}
                      </div>
                      
                      {/* أزرار إضافية */}
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

              {/* 4️⃣ طلب صيانة */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    طلب صيانة / دعم
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {issueTypes.map((issue) => (
                      <Button
                        key={issue.value}
                        variant={selectedIssue === issue.value ? "default" : "outline"}
                        className="h-auto py-4 flex flex-col items-center gap-2"
                        onClick={() => setSelectedIssue(issue.value)}
                      >
                        <span className="text-2xl">{issue.icon}</span>
                        <span className="text-sm">{issue.label}</span>
                      </Button>
                    ))}
                  </div>

                  <Button 
                    onClick={submitMaintenanceRequest}
                    disabled={!selectedIssue || submitting}
                    className="w-full h-14 text-lg"
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

              {/* 🚨 زر الطوارئ */}
              <Card className="border-red-500 bg-red-500/5">
                <CardContent className="p-4">
                  <Button 
                    onClick={submitEmergencyRequest}
                    disabled={emergencySubmitting}
                    variant="destructive"
                    className="w-full h-16 text-lg gap-3"
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

              {/* 5️⃣ متابعة الطلبات */}
              {tickets.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      طلباتك الأخيرة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="flex items-center justify-between py-3 px-3 bg-muted/30 rounded-lg">
                        <div className="flex flex-col">
                          <span className="font-medium">{getIssueLabel(ticket.issue_type)}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="font-mono">{ticket.ticket_number}</span>
                            <span>•</span>
                            {new Date(ticket.created_at).toLocaleDateString('ar-IQ')}
                          </span>
                        </div>
                        {getTicketStatus(ticket.status)}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* 7️⃣ الفواتير - آخر فاتورة */}
              {invoices.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      آخر فاتورة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between py-3 px-3 bg-muted/30 rounded-lg">
                        <div className="flex flex-col">
                          <span className="font-mono text-sm">{invoice.invoice_number}</span>
                          <span className="text-lg font-bold">
                            {invoice.amount.toLocaleString()} {invoice.currency === 'IQD' ? 'د.ع' : '$'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            تاريخ الاستحقاق: {new Date(invoice.due_date).toLocaleDateString('ar-IQ')}
                          </span>
                        </div>
                        <Badge 
                          variant={invoice.status === 'paid' ? 'default' : 'destructive'}
                          className={invoice.status === 'paid' ? 'bg-green-500' : ''}
                        >
                          {invoice.status === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* معلومات الحساب المختصرة */}
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-muted-foreground">رقم الخدمة</p>
                      <p className="font-mono font-bold">{subscriber.username || '-'}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-muted-foreground">الاسم</p>
                      <p className="font-bold">{subscriber.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* زر تغيير الحساب */}
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground"
                onClick={() => {
                  setSubscriber(null);
                  setAgent(null);
                  setContract(null);
                  setTickets([]);
                  setInvoices([]);
                  setSearchQuery('');
                }}
              >
                البحث عن حساب آخر
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
