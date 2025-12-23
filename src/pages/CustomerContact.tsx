import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  CheckCircle
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';

interface Agent {
  id: string;
  name: string;
  phone: string;
  whatsapp: string | null;
  region: string;
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
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
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

      // Load agent
      if (subData.agent_id) {
        const { data: agentData } = await supabase
          .from('agents')
          .select('id, name, phone, whatsapp, region')
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

      // Load last 3 tickets
      const { data: ticketsData } = await supabase
        .from('maintenance_tickets')
        .select('id, ticket_number, status, created_at, issue_type')
        .eq('subscriber_id', subscriberId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (ticketsData) {
        setTickets(ticketsData);
      }
    } catch (error) {
      console.error('Error loading subscriber data:', error);
    }
  };

  // ✅ إرسال طلب الصيانة - بسيط جداً
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
      // إنشاء التذكرة - agent_id يتم تعيينه تلقائياً من trigger
      const { data: ticketData, error } = await supabase
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

      // عرض رسالة النجاح
      setShowSuccess(true);
      setSelectedIssue('');
      
      // إعادة تحميل التذاكر
      await loadSubscriberData(subscriber.id);

      // إخفاء رسالة النجاح بعد 5 ثواني
      setTimeout(() => setShowSuccess(false), 5000);

    } catch (error) {
      console.error('Error submitting maintenance request:', error);
      toast.error('حدث خطأ في إرسال الطلب');
    } finally {
      setSubmitting(false);
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
        return <Badge className="bg-green-500 text-xs">تم</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  const getIssueLabel = (issueType: string | null) => {
    if (!issueType) return '-';
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

  const makeCall = () => {
    if (!agent?.phone) return;
    window.location.href = `tel:${agent.phone}`;
  };

  const serviceStatus = getServiceStatus();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>حسابي | خدمة العملاء</title>
        <meta name="description" content="عرض معلومات حسابك وحالة الخدمة" />
      </Helmet>

      <div className="min-h-screen bg-background p-4" dir="rtl">
        <div className="max-w-lg mx-auto space-y-4">
          
          {/* ✅ رسالة النجاح */}
          {showSuccess && (
            <Card className="border-green-500 bg-green-500/10">
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
            <Card>
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
                  />
                  <Button onClick={searchSubscriber} disabled={searching}>
                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'بحث'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {subscriber && (
            <>
              {/* 1️⃣ Service Status */}
              <Card className="border-2" style={{ borderColor: serviceStatus.status === 'active' ? 'hsl(var(--primary))' : serviceStatus.status === 'stopped' ? 'hsl(0 84% 60%)' : 'hsl(48 96% 53%)' }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {serviceStatus.status === 'active' ? (
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Wifi className="h-6 w-6 text-green-500" />
                        </div>
                      ) : serviceStatus.status === 'stopped' ? (
                        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                          <WifiOff className="h-6 w-6 text-red-500" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                          <AlertTriangle className="h-6 w-6 text-yellow-500" />
                        </div>
                      )}
                      <div>
                        <p className="text-xl font-bold">حالة الخدمة</p>
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${serviceStatus.color}`}></span>
                          <span className="font-medium">{serviceStatus.label}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {subscriber.status_comment && (
                    <div className="mt-3 p-2 bg-muted rounded-lg text-sm">
                      <span className="text-muted-foreground">السبب: </span>
                      {subscriber.status_comment}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 2️⃣ Personal Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    معلوماتك
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">الاسم</span>
                    <span className="font-medium">{subscriber.name}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">رقم الخدمة</span>
                    <span className="font-mono font-medium">{subscriber.username || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">الهاتف</span>
                    <span dir="ltr">{subscriber.phone}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted-foreground">المنطقة</span>
                    <span>{subscriber.address || '-'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* 3️⃣ Current Package */}
              {contract?.package && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      الباقة الحالية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground">اسم الباقة</span>
                      <span className="font-medium">{contract.package.name}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground">السرعة</span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-yellow-500" />
                        {contract.package.speed_mbps} Mbps
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-muted-foreground">تاريخ التجديد</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(contract.end_date).toLocaleDateString('ar-IQ')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 4️⃣ Agent Contact - زر كبير واضح */}
              <Card className="border-primary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">وكيلك المسؤول</CardTitle>
                </CardHeader>
                <CardContent>
                  {agent ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{agent.name}</p>
                          <p className="text-sm text-muted-foreground">{agent.region}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button onClick={makeCall} className="w-full">
                          <Phone className="h-4 w-4 ml-2" />
                          اتصال
                        </Button>
                        {agent.whatsapp && (
                          <Button 
                            onClick={openWhatsApp} 
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            <MessageCircle className="h-4 w-4 ml-2" />
                            واتساب
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>لم يتم تعيين وكيل لحسابك</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 5️⃣ طلب صيانة - بسيط جداً */}
              <Card className="border-2 border-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    طلب صيانة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* اختيار نوع المشكلة */}
                  <div className="grid grid-cols-2 gap-2">
                    {issueTypes.map((issue) => (
                      <Button
                        key={issue.value}
                        variant={selectedIssue === issue.value ? "default" : "outline"}
                        className="h-auto py-3 flex flex-col items-center gap-1"
                        onClick={() => setSelectedIssue(issue.value)}
                      >
                        <span className="text-lg">{issue.icon}</span>
                        <span className="text-xs">{issue.label}</span>
                      </Button>
                    ))}
                  </div>

                  {/* زر الإرسال */}
                  <Button 
                    onClick={submitMaintenanceRequest}
                    disabled={!selectedIssue || submitting}
                    className="w-full h-12 text-lg"
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

              {/* 6️⃣ آخر الطلبات */}
              {tickets.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      آخر الطلبات
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{getIssueLabel(ticket.issue_type)}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(ticket.created_at).toLocaleDateString('ar-IQ')}
                          </span>
                        </div>
                        {getTicketStatus(ticket.status)}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* زر تغيير الحساب */}
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground"
                onClick={() => {
                  setSubscriber(null);
                  setAgent(null);
                  setContract(null);
                  setTickets([]);
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
