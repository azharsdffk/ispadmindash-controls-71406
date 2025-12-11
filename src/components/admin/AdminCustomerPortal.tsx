import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, FileText, DollarSign, Wrench, Package, Search, Eye, CreditCard } from 'lucide-react';
import { SubscriberDetailsModal } from '@/components/modals/SubscriberDetailsModal';
import { formatCurrency } from '@/lib/currency';

interface Subscriber {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  plan: string | null;
  balance: number | null;
  username: string | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  net_amount: number | null;
  status: string;
  issue_date: string;
  subscriber_id: string;
  subscribers: { name: string } | null;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  subscriber_id: string;
  subscribers: { name: string } | null;
}

interface Ticket {
  id: string;
  ticket_number: string;
  issue_description: string;
  status: string;
  priority: string;
  created_at: string;
  subscriber_id: string;
  subscribers: { name: string } | null;
}

export const AdminCustomerPortal = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubscriber, setSelectedSubscriber] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'subscribers' | 'invoices' | 'payments' | 'tickets'>('subscribers');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [subscribersRes, invoicesRes, paymentsRes, ticketsRes] = await Promise.all([
        supabase.from('subscribers').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('invoices').select('*, subscribers(name)').order('created_at', { ascending: false }).limit(100),
        supabase.from('payments').select('*, subscribers(name)').order('created_at', { ascending: false }).limit(100),
        supabase.from('maintenance_tickets').select('*, subscribers(name)').order('created_at', { ascending: false }).limit(100)
      ]);

      setSubscribers(subscribersRes.data || []);
      setInvoices(invoicesRes.data || []);
      setPayments(paymentsRes.data || []);
      setTickets(ticketsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'pending': { label: 'معلق', variant: 'secondary' },
      'paid': { label: 'مدفوع', variant: 'default' },
      'overdue': { label: 'متأخر', variant: 'destructive' },
      'open': { label: 'مفتوح', variant: 'secondary' },
      'in_progress': { label: 'قيد المعالجة', variant: 'default' },
      'resolved': { label: 'محلول', variant: 'default' },
      'closed': { label: 'مغلق', variant: 'outline' },
    };
    const config = statusMap[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      'low': { label: 'منخفضة', variant: 'secondary' },
      'medium': { label: 'متوسطة', variant: 'default' },
      'high': { label: 'عالية', variant: 'destructive' },
      'urgent': { label: 'عاجلة', variant: 'destructive' },
    };
    const config = priorityMap[priority] || { label: priority, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredSubscribers = subscribers.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone?.includes(searchQuery) ||
    s.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInvoices = invoices.filter(i =>
    i.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.subscribers?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPayments = payments.filter(p =>
    p.subscribers?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTickets = tickets.filter(t =>
    t.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subscribers?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openSubscriberDetails = async (subscriberId: string) => {
    const subscriber = subscribers.find(s => s.id === subscriberId);
    if (subscriber) {
      setSelectedSubscriber(subscriber);
      setDetailsModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveView('subscribers')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{subscribers.length}</p>
                <p className="text-sm text-muted-foreground">المشتركين</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveView('invoices')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-info/10">
                <FileText className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{invoices.length}</p>
                <p className="text-sm text-muted-foreground">الفواتير</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveView('payments')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-success/10">
                <CreditCard className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{payments.length}</p>
                <p className="text-sm text-muted-foreground">المدفوعات</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveView('tickets')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-warning/10">
                <Wrench className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tickets.length}</p>
                <p className="text-sm text-muted-foreground">تذاكر الصيانة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and View Selector */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={activeView} onValueChange={(v: any) => setActiveView(v)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="subscribers">المشتركين</SelectItem>
            <SelectItem value="invoices">الفواتير</SelectItem>
            <SelectItem value="payments">المدفوعات</SelectItem>
            <SelectItem value="tickets">تذاكر الصيانة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subscribers View */}
      {activeView === 'subscribers' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              قائمة المشتركين
            </CardTitle>
            <CardDescription>إدارة ومتابعة جميع المشتركين</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>الباقة</TableHead>
                  <TableHead>الرصيد</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscribers.map((subscriber) => (
                  <TableRow key={subscriber.id}>
                    <TableCell className="font-medium">{subscriber.name}</TableCell>
                    <TableCell>{subscriber.phone}</TableCell>
                    <TableCell>{subscriber.plan || '-'}</TableCell>
                    <TableCell className={Number(subscriber.balance) < 0 ? 'text-destructive' : 'text-success'}>
                      {formatCurrency(subscriber.balance || 0, 'IQD')}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => openSubscriberDetails(subscriber.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Invoices View */}
      {activeView === 'invoices' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              الفواتير
            </CardTitle>
            <CardDescription>جميع فواتير المشتركين</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الفاتورة</TableHead>
                  <TableHead>المشترك</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell 
                      className="cursor-pointer text-primary hover:underline"
                      onClick={() => openSubscriberDetails(invoice.subscriber_id)}
                    >
                      {invoice.subscribers?.name || '-'}
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.net_amount || invoice.amount, 'IQD')}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>{new Date(invoice.issue_date).toLocaleDateString('ar-IQ')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Payments View */}
      {activeView === 'payments' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              المدفوعات
            </CardTitle>
            <CardDescription>سجل جميع المدفوعات</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المشترك</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell 
                      className="cursor-pointer text-primary hover:underline font-medium"
                      onClick={() => openSubscriberDetails(payment.subscriber_id)}
                    >
                      {payment.subscribers?.name || '-'}
                    </TableCell>
                    <TableCell className="text-success font-semibold">
                      +{formatCurrency(payment.amount, 'IQD')}
                    </TableCell>
                    <TableCell>
                      {payment.payment_method === 'cash' ? 'نقدي' :
                       payment.payment_method === 'card' ? 'بطاقة' :
                       payment.payment_method === 'bank_transfer' ? 'حوالة بنكية' : payment.payment_method}
                    </TableCell>
                    <TableCell>{new Date(payment.payment_date).toLocaleDateString('ar-IQ')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Tickets View */}
      {activeView === 'tickets' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              تذاكر الصيانة
            </CardTitle>
            <CardDescription>جميع تذاكر الصيانة للمشتركين</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم التذكرة</TableHead>
                  <TableHead>المشترك</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>الأولوية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.ticket_number}</TableCell>
                    <TableCell 
                      className="cursor-pointer text-primary hover:underline"
                      onClick={() => openSubscriberDetails(ticket.subscriber_id)}
                    >
                      {ticket.subscribers?.name || '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{ticket.issue_description}</TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>{new Date(ticket.created_at).toLocaleDateString('ar-IQ')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <SubscriberDetailsModal
        subscriber={selectedSubscriber}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
      />
    </div>
  );
};