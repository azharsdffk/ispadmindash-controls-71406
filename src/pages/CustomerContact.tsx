import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Phone, MessageCircle, Send, MapPin, Clock, User, AlertTriangle, CheckCircle, Loader2, ExternalLink, Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

interface Agent {
  id: string;
  name: string;
  phone: string;
  whatsapp: string | null;
  telegram: string | null;
  region: string;
  address: string | null;
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
}

interface Ticket {
  id: string;
  ticket_number: string;
  issue_description: string;
  status: string;
  priority: string;
  created_at: string;
}

const issueTypes = [
  { value: 'slow_internet', label: 'انترنت بطيء' },
  { value: 'disconnection', label: 'انقطاع الخدمة' },
  { value: 'invoice', label: 'استفسار عن الفاتورة' },
  { value: 'transfer', label: 'نقل الخدمة' },
  { value: 'upgrade', label: 'ترقية الباقة' },
  { value: 'technical', label: 'مشكلة تقنية أخرى' },
];

export default function CustomerContact() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [issueType, setIssueType] = useState('');
  const [issueDescription, setIssueDescription] = useState('');

  // Auto-load subscriber if user is logged in
  useEffect(() => {
    if (user) {
      loadSubscriberByUser();
    }
  }, [user]);

  const loadSubscriberByUser = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get subscriber linked to user
      const { data: subUser, error: subUserError } = await supabase
        .from('subscriber_users')
        .select('subscriber_id')
        .eq('user_id', user.id)
        .single();

      if (subUserError || !subUser) {
        return;
      }

      await loadSubscriberData(subUser.subscriber_id);
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
      // Get subscriber with agent
      const { data: subData, error: subError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('id', subscriberId)
        .single();

      if (subError || !subData) {
        toast.error('لم يتم العثور على بيانات المشترك');
        return;
      }

      setSubscriber(subData);

      // Load agent if exists
      if (subData.agent_id) {
        const { data: agentData } = await supabase
          .from('agents')
          .select('*')
          .eq('id', subData.agent_id)
          .single();

        if (agentData) {
          setAgent(agentData);
        }
      }

      // Load subscriber tickets
      const { data: ticketsData } = await supabase
        .from('maintenance_tickets')
        .select('id, ticket_number, issue_description, status, priority, created_at')
        .eq('subscriber_id', subscriberId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (ticketsData) {
        setTickets(ticketsData);
      }
    } catch (error) {
      console.error('Error loading subscriber data:', error);
    }
  };

  const submitComplaint = async () => {
    if (!subscriber) {
      toast.error('الرجاء البحث عن المشترك أولاً');
      return;
    }

    if (!issueType) {
      toast.error('الرجاء اختيار نوع المشكلة');
      return;
    }

    if (!issueDescription.trim()) {
      toast.error('الرجاء وصف المشكلة');
      return;
    }

    setSubmitting(true);
    try {
      // Generate ticket number
      const ticketNumber = `TKT-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Date.now().toString().slice(-4)}`;
      
      const { data, error } = await supabase
        .from('maintenance_tickets')
        .insert({
          subscriber_id: subscriber.id,
          ticket_number: ticketNumber,
          issue_type: issueType,
          issue_description: issueDescription,
          status: 'open',
          priority: 'medium',
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('تم إرسال الطلب بنجاح! رقم التذكرة: ' + ticketNumber);
      
      // Reset form
      setIssueType('');
      setIssueDescription('');
      
      // Reload tickets
      if (subscriber) {
        await loadSubscriberData(subscriber.id);
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error('حدث خطأ في إرسال الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive">جديد</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-500">قيد المعالجة</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500">تم الحل</Badge>;
      case 'closed':
        return <Badge variant="secondary">مغلق</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const openWhatsApp = () => {
    if (!agent?.whatsapp) return;
    const phone = agent.whatsapp.replace(/[^0-9]/g, '');
    const message = subscriber 
      ? `مرحباً، أنا ${subscriber.name}\nرقم الخدمة: ${subscriber.username || 'غير محدد'}\nرقم الهاتف: ${subscriber.phone}`
      : 'مرحباً، أريد الاستفسار عن خدماتكم';
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
        <title>تواصل مع وكيلك | خدمة العملاء</title>
        <meta name="description" content="تواصل مع وكيلك المحلي لحل مشاكل الانترنت والخدمات" />
      </Helmet>

      <div className="min-h-screen bg-background p-4 md:p-8" dir="rtl">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">تواصل مع وكيلك</h1>
            <p className="text-muted-foreground">نحن هنا لمساعدتك في حل أي مشكلة</p>
          </div>

          {/* Search Section - Only show if no subscriber */}
          {!subscriber && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  البحث عن حسابك
                </CardTitle>
                <CardDescription>
                  أدخل رقم الخدمة أو رقم الهاتف للوصول إلى بياناتك
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    placeholder="رقم الخدمة أو رقم الهاتف..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchSubscriber()}
                    className="flex-1"
                  />
                  <Button onClick={searchSubscriber} disabled={searching}>
                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    <span className="mr-2">بحث</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subscriber Info */}
          {subscriber && (
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  معلوماتك
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">الاسم</p>
                    <p className="font-medium">{subscriber.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">رقم الخدمة</p>
                    <p className="font-medium">{subscriber.username || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الهاتف</p>
                    <p className="font-medium">{subscriber.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">المنطقة</p>
                    <p className="font-medium">{subscriber.address || '-'}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => {
                    setSubscriber(null);
                    setAgent(null);
                    setTickets([]);
                  }}
                >
                  تغيير الحساب
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Agent Info */}
          {agent && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  وكيلك: {agent.name}
                </CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4" />
                    {agent.region}
                    {agent.address && ` - ${agent.address}`}
                  </div>
                  {agent.working_hours && (
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4" />
                      {agent.working_hours}
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={makeCall} className="flex-1 min-w-[140px]">
                    <Phone className="h-4 w-4 ml-2" />
                    اتصال
                  </Button>
                  
                  {agent.whatsapp && (
                    <Button 
                      onClick={openWhatsApp} 
                      className="flex-1 min-w-[140px] bg-green-600 hover:bg-green-700"
                    >
                      <MessageCircle className="h-4 w-4 ml-2" />
                      واتساب
                    </Button>
                  )}
                  
                  {agent.telegram && (
                    <Button 
                      onClick={openTelegram} 
                      variant="outline"
                      className="flex-1 min-w-[140px]"
                    >
                      <Send className="h-4 w-4 ml-2" />
                      تلغرام
                    </Button>
                  )}
                  
                  {agent.latitude && agent.longitude && (
                    <Button onClick={openMap} variant="outline" className="flex-1 min-w-[140px]">
                      <MapPin className="h-4 w-4 ml-2" />
                      الموقع
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Agent Message */}
          {subscriber && !agent && (
            <Card className="glass-card border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-yellow-500" />
                  <div>
                    <p className="font-medium">لم يتم تحديد وكيل لحسابك</p>
                    <p className="text-sm text-muted-foreground">
                      يمكنك إرسال طلب وسيتم توجيهه للدعم الفني
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Complaint Form */}
          {subscriber && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  إرسال طلب أو شكوى
                </CardTitle>
                <CardDescription>
                  سيتم إنشاء تذكرة دعم فني ومتابعتها
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">نوع الطلب</label>
                  <Select value={issueType} onValueChange={setIssueType}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع المشكلة" />
                    </SelectTrigger>
                    <SelectContent>
                      {issueTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">وصف المشكلة</label>
                  <Textarea
                    placeholder="اكتب تفاصيل المشكلة هنا..."
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={submitComplaint} 
                  disabled={submitting}
                  className="w-full"
                  size="lg"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <Send className="h-4 w-4 ml-2" />
                  )}
                  إرسال الطلب
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tickets Status */}
          {tickets.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  حالة طلباتك
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <div 
                      key={ticket.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{ticket.ticket_number}</span>
                          {getStatusBadge(ticket.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {ticket.issue_description}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(ticket.created_at).toLocaleDateString('ar-IQ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Emergency Button */}
          {subscriber && (
            <Card className="glass-card border-destructive/30 bg-destructive/5">
              <CardContent className="p-4">
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => {
                    setIssueType('disconnection');
                    setIssueDescription('انقطاع تام في الخدمة - طوارئ');
                    toast.info('تم تعبئة نموذج الطوارئ، اضغط إرسال');
                  }}
                >
                  <AlertTriangle className="h-4 w-4 ml-2" />
                  إبلاغ عن انقطاع تام (طوارئ)
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
