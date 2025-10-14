import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/currency';
import { DollarSign, TrendingUp, TrendingDown, FileText, CreditCard, Package, AlertCircle } from 'lucide-react';
import { SettingsModal } from '@/components/modals/SettingsModal';

export default function AccountantDashboard() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    pendingInvoices: 0,
    paidInvoices: 0,
    todayPayments: 0,
    lowStockItems: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [recentVouchers, setRecentVouchers] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // جلب إحصائيات الفواتير
      const { data: invoices } = await supabase
        .from('invoices')
        .select('amount, net_amount, status, currency');

      const totalRevenue = invoices?.reduce((sum, inv) => 
        inv.status === 'paid' ? sum + (inv.net_amount || 0) : sum, 0) || 0;
      const pendingInvoices = invoices?.filter(inv => inv.status === 'pending').length || 0;
      const paidInvoices = invoices?.filter(inv => inv.status === 'paid').length || 0;

      // جلب إحصائيات السندات (المصروفات)
      const { data: vouchers } = await supabase
        .from('vouchers')
        .select('amount, currency');

      const totalExpenses = vouchers?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;

      // جلب المدفوعات اليوم
      const today = new Date().toISOString().split('T')[0];
      const { data: todayPaymentsData } = await supabase
        .from('payments')
        .select('amount')
        .eq('payment_date', today);

      const todayPayments = todayPaymentsData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      // جلب عناصر المخزون المنخفض
      const { data: inventory } = await supabase
        .from('inventory')
        .select('*');

      const lowStockItems = inventory?.filter(item => 
        item.quantity < (item.min_stock_level || 10)
      ).length || 0;

      // جلب أحدث الفواتير
      const { data: recentInvoicesData } = await supabase
        .from('invoices')
        .select('*, subscribers(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      // جلب أحدث المدفوعات
      const { data: recentPaymentsData } = await supabase
        .from('payments')
        .select('*, subscribers(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      // جلب أحدث السندات
      const { data: recentVouchersData } = await supabase
        .from('vouchers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // جلب عناصر المخزون المنخفض
      const { data: lowStockData } = await supabase
        .from('inventory')
        .select('*')
        .or('quantity.lt.min_stock_level,quantity.lt.10')
        .limit(5);

      setStats({
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        pendingInvoices,
        paidInvoices,
        todayPayments,
        lowStockItems,
      });

      setRecentInvoices(recentInvoicesData || []);
      setRecentPayments(recentPaymentsData || []);
      setRecentVouchers(recentVouchersData || []);
      setLowStockItems(lowStockData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      paid: "default",
      pending: "secondary",
      overdue: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1">
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold">لوحة تحكم المحاسب</h1>

            {/* بطاقات الإحصائيات */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats.totalRevenue, 'IQD')}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.paidInvoices} فاتورة مدفوعة
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(stats.totalExpenses, 'IQD')}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    من السندات
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatCurrency(stats.netProfit, 'IQD')}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    الإيرادات - المصروفات
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">الفواتير المعلقة</CardTitle>
                  <FileText className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.pendingInvoices}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    بانتظار الدفع
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* بطاقات إضافية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">مدفوعات اليوم</CardTitle>
                  <CreditCard className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(stats.todayPayments, 'IQD')}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">تنبيهات المخزون</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.lowStockItems}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    عناصر منخفضة المخزون
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* الفواتير الأخيرة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  أحدث الفواتير
                </CardTitle>
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
                    {recentInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          لا توجد فواتير
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>{invoice.subscribers?.name || 'غير محدد'}</TableCell>
                          <TableCell>{formatCurrency(invoice.net_amount || invoice.amount, invoice.currency)}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell>{new Date(invoice.issue_date).toLocaleDateString('ar-IQ')}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* المدفوعات الأخيرة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  أحدث المدفوعات
                </CardTitle>
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
                    {recentPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          لا توجد مدفوعات
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.subscribers?.name || 'غير محدد'}</TableCell>
                          <TableCell className="font-medium text-green-600">
                            {formatCurrency(payment.amount, payment.currency)}
                          </TableCell>
                          <TableCell>{payment.payment_method}</TableCell>
                          <TableCell>{new Date(payment.payment_date).toLocaleDateString('ar-IQ')}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* السندات الأخيرة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  أحدث السندات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم السند</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentVouchers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          لا توجد سندات
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentVouchers.map((voucher) => (
                        <TableRow key={voucher.id}>
                          <TableCell className="font-medium">{voucher.voucher_number}</TableCell>
                          <TableCell>
                            <Badge variant={voucher.voucher_type === 'receipt' ? 'default' : 'secondary'}>
                              {voucher.voucher_type === 'receipt' ? 'قبض' : 'صرف'}
                            </Badge>
                          </TableCell>
                          <TableCell className={voucher.voucher_type === 'receipt' ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(voucher.amount, voucher.currency)}
                          </TableCell>
                          <TableCell>{voucher.description || '-'}</TableCell>
                          <TableCell>{new Date(voucher.created_at).toLocaleDateString('ar-IQ')}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* تنبيهات المخزون */}
            {lowStockItems.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <Package className="h-5 w-5" />
                    تنبيه: عناصر منخفضة المخزون
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>اسم الصنف</TableHead>
                        <TableHead>الكمية الحالية</TableHead>
                        <TableHead>الحد الأدنى</TableHead>
                        <TableHead>الوحدة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.item_name}</TableCell>
                          <TableCell className="text-red-600 font-bold">{item.quantity}</TableCell>
                          <TableCell>{item.min_stock_level || 10}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <AppSidebar />
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
