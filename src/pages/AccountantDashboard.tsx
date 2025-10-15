import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/currency';
import { DollarSign, TrendingUp, TrendingDown, FileText, CreditCard, Package, AlertCircle, Wallet, ArrowUpRight, ArrowDownRight, PieChart, BarChart3, Receipt, Calculator, Users, Clock } from 'lucide-react';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountingEntries } from '@/components/accountant/AccountingEntries';
import { GeneralLedger } from '@/components/accountant/GeneralLedger';
import { FinancialCharts } from '@/components/accountant/FinancialCharts';
import { AdvancedReports } from '@/components/accountant/AdvancedReports';

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
    totalReceivables: 0,
    totalPayables: 0,
    cashFlow: 0,
    inventoryValue: 0,
    profitMargin: 0,
    overdueInvoices: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [recentVouchers, setRecentVouchers] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [topSubscribers, setTopSubscribers] = useState<any[]>([]);

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
      const todayDate = new Date().toISOString().split('T')[0];
      const { data: todayPaymentsData } = await supabase
        .from('payments')
        .select('amount')
        .eq('payment_date', todayDate);

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

      // حساب قيمة المخزون
      const inventoryValue = inventory?.reduce((sum, item) => 
        sum + ((item.quantity || 0) * (item.unit_price || 0)), 0) || 0;

      // حساب الذمم المدينة (الفواتير المعلقة)
      const totalReceivables = invoices?.reduce((sum, inv) => 
        inv.status === 'pending' || inv.status === 'overdue' ? sum + (inv.net_amount || 0) : sum, 0) || 0;

      // حساب الفواتير المتأخرة
      const currentDate = new Date();
      const overdueInvoices = invoices?.filter(inv => 
        (inv.status === 'pending' || inv.status === 'overdue')
      ).length || 0;

      // حساب التدفق النقدي (المدفوعات - المصروفات)
      const { data: allPayments } = await supabase
        .from('payments')
        .select('amount');
      
      const totalPayments = allPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const cashFlow = totalPayments - totalExpenses;

      // هامش الربح
      const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

      // أفضل المشتركين
      const { data: topSubscribersData } = await supabase
        .from('payments')
        .select('subscriber_id, amount, subscribers(name)')
        .order('amount', { ascending: false })
        .limit(5);

      // الإيرادات الشهرية للـ 6 أشهر الأخيرة
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data: monthlyRevenueData } = await supabase
        .from('payments')
        .select('payment_date, amount')
        .gte('payment_date', sixMonthsAgo.toISOString().split('T')[0]);

      setStats({
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        pendingInvoices,
        paidInvoices,
        todayPayments,
        lowStockItems,
        totalReceivables,
        totalPayables: totalExpenses,
        cashFlow,
        inventoryValue,
        profitMargin,
        overdueInvoices,
      });

      setRecentInvoices(recentInvoicesData || []);
      setRecentPayments(recentPaymentsData || []);
      setRecentVouchers(recentVouchersData || []);
      setLowStockItems(lowStockData || []);
      setTopSubscribers(topSubscribersData || []);
      
      // معالجة البيانات الشهرية
      const monthlyData: any = {};
      monthlyRevenueData?.forEach((payment) => {
        const month = new Date(payment.payment_date).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'short' });
        monthlyData[month] = (monthlyData[month] || 0) + payment.amount;
      });
      setMonthlyRevenue(Object.entries(monthlyData).map(([month, amount]) => ({ month, amount })));
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
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">لوحة التحكم المحاسبية المتقدمة</h1>
              <Badge variant="outline" className="px-4 py-2">
                <Clock className="h-4 w-4 ml-2" />
                آخر تحديث: {new Date().toLocaleTimeString('ar-IQ')}
              </Badge>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-6 lg:w-auto">
                <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
                <TabsTrigger value="financial">التحليل المالي</TabsTrigger>
                <TabsTrigger value="entries">القيود المحاسبية</TabsTrigger>
                <TabsTrigger value="ledger">دفتر الأستاذ</TabsTrigger>
                <TabsTrigger value="operations">العمليات</TabsTrigger>
                <TabsTrigger value="reports">التقارير</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* بطاقات الإحصائيات الرئيسية */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">الذمم المدينة</CardTitle>
                      <Wallet className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(stats.totalReceivables, 'IQD')}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats.overdueInvoices} فاتورة متأخرة
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">قيمة المخزون</CardTitle>
                      <Package className="h-4 w-4 text-cyan-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-cyan-600">
                        {formatCurrency(stats.inventoryValue, 'IQD')}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        إجمالي قيمة المخزون
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* مؤشرات الأداء الرئيسية */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">التدفق النقدي</CardTitle>
                      <ArrowUpRight className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${stats.cashFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {formatCurrency(stats.cashFlow, 'IQD')}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        صافي التدفقات النقدية
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">هامش الربح</CardTitle>
                      <PieChart className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {stats.profitMargin.toFixed(1)}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        نسبة الربح من الإيرادات
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">معدل التحصيل</CardTitle>
                      <Calculator className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">
                        {stats.pendingInvoices > 0 
                          ? ((stats.paidInvoices / (stats.paidInvoices + stats.pendingInvoices)) * 100).toFixed(1)
                          : 100}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        نسبة الفواتير المحصلة
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
                  <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
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
              </TabsContent>

              <TabsContent value="financial" className="space-y-4">
                <FinancialCharts />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        الإيرادات الشهرية
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {monthlyRevenue.length > 0 ? (
                        <div className="space-y-2">
                          {monthlyRevenue.slice(0, 6).map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">{item.month}</span>
                              <span className="font-medium text-green-600">{formatCurrency(item.amount, 'IQD')}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        أفضل المشتركين
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {topSubscribers.length > 0 ? (
                        <div className="space-y-2">
                          {topSubscribers.map((sub, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-sm">{sub.subscribers?.name || 'غير محدد'}</span>
                              <Badge variant="secondary">{formatCurrency(sub.amount, 'IQD')}</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="entries" className="space-y-4">
                <AccountingEntries />
              </TabsContent>

              <TabsContent value="ledger" className="space-y-4">
                <GeneralLedger />
              </TabsContent>

              <TabsContent value="operations" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>العمليات اليومية</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div className="flex items-center gap-3">
                          <Receipt className="h-5 w-5 text-primary" />
                          <span>إجمالي المقبوضات اليوم</span>
                        </div>
                        <span className="font-bold text-green-600">{formatCurrency(stats.todayPayments, 'IQD')}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-orange-500" />
                          <span>الفواتير المعلقة</span>
                        </div>
                        <span className="font-bold text-orange-600">{stats.pendingInvoices}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 text-red-500" />
                          <span>الفواتير المتأخرة</span>
                        </div>
                        <span className="font-bold text-red-600">{stats.overdueInvoices}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>حالة المخزون</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-cyan-500" />
                          <span>إجمالي قيمة المخزون</span>
                        </div>
                        <span className="font-bold text-cyan-600">{formatCurrency(stats.inventoryValue, 'IQD')}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 text-red-500" />
                          <span>عناصر منخفضة المخزون</span>
                        </div>
                        <span className="font-bold text-red-600">{stats.lowStockItems}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                <AdvancedReports />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <AppSidebar />
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
