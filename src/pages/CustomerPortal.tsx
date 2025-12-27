import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { User, FileText, DollarSign, Wrench, Package, Download, CreditCard, CheckCircle, Clock, XCircle, Plus, Gift, Award } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateTicketForm } from "@/components/customer/CreateTicketForm";
import { ActiveOffersDisplay } from "@/components/customer/ActiveOffersDisplay";
import { LoyaltyPointsDisplay } from "@/components/customer/LoyaltyPointsDisplay";

const CustomerPortal = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [subscriberData, setSubscriberData] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCustomerData();
    }
  }, [user]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);

      // Get subscriber ID linked to this user
      const { data: subscriberLink } = await supabase
        .from('subscriber_users')
        .select('subscriber_id')
        .eq('user_id', user?.id)
        .single();

      if (!subscriberLink) {
        setLoading(false);
        return;
      }

      // Get subscriber details
      const { data: subscriber } = await supabase
        .from('subscribers')
        .select('*')
        .eq('id', subscriberLink.subscriber_id)
        .single();

      setSubscriberData(subscriber);

      // Get invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('subscriber_id', subscriberLink.subscriber_id)
        .order('created_at', { ascending: false })
        .limit(10);

      setInvoices(invoicesData || []);

      // Get payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('subscriber_id', subscriberLink.subscriber_id)
        .order('created_at', { ascending: false })
        .limit(10);

      setPayments(paymentsData || []);

      // Get maintenance tickets
      const { data: ticketsData } = await supabase
        .from('maintenance_tickets')
        .select('*')
        .eq('subscriber_id', subscriberLink.subscriber_id)
        .order('created_at', { ascending: false })
        .limit(10);

      setTickets(ticketsData || []);

    } catch (error) {
      console.error('Error fetching customer data:', error);
      toast.error('فشل تحميل بيانات العميل');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      'pending': { label: 'معلق', variant: 'secondary' },
      'paid': { label: 'مدفوع', variant: 'default' },
      'overdue': { label: 'متأخر', variant: 'destructive' },
      'open': { label: 'مفتوح', variant: 'secondary' },
      'in_progress': { label: 'قيد المعالجة', variant: 'default' },
      'resolved': { label: 'محلول', variant: 'default' },
    };

    const config = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: any = {
      'low': { label: 'منخفضة', variant: 'secondary' },
      'medium': { label: 'متوسطة', variant: 'default' },
      'high': { label: 'عالية', variant: 'destructive' },
    };

    const config = priorityMap[priority] || { label: priority, variant: 'secondary' };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!subscriberData) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
        <div className="flex flex-1 w-full">
          <AppSidebar />
          <main className="flex-1 p-6 overflow-y-auto">
            <Alert>
              <AlertDescription>
                لا يوجد حساب مشترك مرتبط بهذا المستخدم
              </AlertDescription>
            </Alert>
          </main>
        </div>
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
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">بوابة العميل</h1>
            </div>

            {/* Account Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    معلومات الحساب
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">الاسم</p>
                      <p className="font-semibold">{subscriberData.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">الهاتف</p>
                      <p className="font-semibold">{subscriberData.phone}</p>
                    </div>
                    {subscriberData.email && (
                      <div>
                        <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                        <p className="font-semibold">{subscriberData.email}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    الباقة الحالية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-2xl font-bold text-primary">{subscriberData.plan || 'غير محدد'}</p>
                    </div>
                    {subscriberData.address && (
                      <div>
                        <p className="text-sm text-muted-foreground">العنوان</p>
                        <p className="text-sm">{subscriberData.address}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    الرصيد
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className={`text-3xl font-bold ${Number(subscriberData.balance) < 0 ? 'text-destructive' : 'text-success'}`}>
                      {Number(subscriberData.balance).toLocaleString()}
                      <span className="text-sm text-muted-foreground mr-2">دينار</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Number(subscriberData.balance) < 0 ? 'مديون' : 'دائن'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Loyalty Points and Offers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <LoyaltyPointsDisplay subscriberId={subscriberData.id} />
              <ActiveOffersDisplay />
            </div>

            {/* Tabs for different sections */}
            <Tabs defaultValue="invoices" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 h-12">
                <TabsTrigger value="invoices" className="gap-2">
                  <FileText className="h-4 w-4" />
                  الفواتير
                </TabsTrigger>
                <TabsTrigger value="payments" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  المدفوعات
                </TabsTrigger>
                <TabsTrigger value="tickets" className="gap-2">
                  <Wrench className="h-4 w-4" />
                  الصيانة
                </TabsTrigger>
                <TabsTrigger value="new-ticket" className="gap-2">
                  <Plus className="h-4 w-4" />
                  طلب جديد
                </TabsTrigger>
              </TabsList>

              <TabsContent value="invoices">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        الفواتير
                      </CardTitle>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 ml-2" />
                        تنزيل الكل
                      </Button>
                    </div>
                    <CardDescription>آخر 10 فواتير</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {invoices.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">لا توجد فواتير</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>رقم الفاتورة</TableHead>
                            <TableHead>التاريخ</TableHead>
                            <TableHead>المبلغ</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                              <TableCell>{new Date(invoice.issue_date).toLocaleDateString('ar-IQ')}</TableCell>
                              <TableCell>{Number(invoice.net_amount).toLocaleString()} دينار</TableCell>
                              <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      المدفوعات
                    </CardTitle>
                    <CardDescription>آخر 10 مدفوعات</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {payments.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">لا توجد مدفوعات</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>التاريخ</TableHead>
                            <TableHead>المبلغ</TableHead>
                            <TableHead>طريقة الدفع</TableHead>
                            <TableHead>الملاحظات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell>{new Date(payment.payment_date).toLocaleDateString('ar-IQ')}</TableCell>
                              <TableCell className="font-semibold text-success">
                                +{Number(payment.amount).toLocaleString()} دينار
                              </TableCell>
                              <TableCell>
                                {payment.payment_method === 'cash' ? 'نقدي' :
                                 payment.payment_method === 'card' ? 'بطاقة' :
                                 payment.payment_method === 'bank_transfer' ? 'حوالة بنكية' : payment.payment_method}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {payment.notes || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tickets">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5" />
                      تذاكر الصيانة
                    </CardTitle>
                    <CardDescription>آخر 10 تذاكر</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tickets.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">لا توجد تذاكر صيانة</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>رقم التذكرة</TableHead>
                            <TableHead>الوصف</TableHead>
                            <TableHead>الأولوية</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>التاريخ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tickets.map((ticket) => (
                            <TableRow key={ticket.id}>
                              <TableCell className="font-medium">{ticket.ticket_number}</TableCell>
                              <TableCell>{ticket.issue_description}</TableCell>
                              <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                              <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                              <TableCell>{new Date(ticket.created_at).toLocaleDateString('ar-IQ')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="new-ticket">
                <div className="max-w-md mx-auto">
                  <CreateTicketForm 
                    subscriberId={subscriberData.id} 
                    onSuccess={fetchCustomerData}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default CustomerPortal;
