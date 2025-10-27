import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Receipt } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

export const FinancialManagement = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      // Total revenue
      const { data: payments } = await supabase
        .from('payments')
        .select('amount');
      const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Total expenses
      const { data: vouchers } = await supabase
        .from('vouchers')
        .select('amount')
        .eq('voucher_type', 'expense');
      const totalExpenses = vouchers?.reduce((sum, v) => sum + Number(v.amount), 0) || 0;

      // Monthly revenue
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data: monthlyPayments } = await supabase
        .from('payments')
        .select('amount')
        .gte('payment_date', startOfMonth);
      const monthlyRevenue = monthlyPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      setStats({
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        monthlyRevenue,
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const financialCards = [
    {
      title: 'إجمالي الإيرادات',
      value: formatCurrency(stats.totalRevenue, 'IQD'),
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'إجمالي المصروفات',
      value: formatCurrency(stats.totalExpenses, 'IQD'),
      icon: TrendingDown,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'صافي الربح',
      value: formatCurrency(stats.netProfit, 'IQD'),
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'الإيرادات الشهرية',
      value: formatCurrency(stats.monthlyRevenue, 'IQD'),
      icon: Receipt,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {financialCards.map((card, index) => (
          <Card key={index} className="border-2 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>
                {card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs for different financial sections */}
      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="invoices">الفواتير</TabsTrigger>
          <TabsTrigger value="receipts">سندات القبض</TabsTrigger>
          <TabsTrigger value="expenses">المصروفات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>الأداء المالي</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                الرسوم البيانية المالية التفصيلية
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>إدارة الفواتير</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                قائمة الفواتير المدفوعة والمتأخرة
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts">
          <Card>
            <CardHeader>
              <CardTitle>سندات القبض والصرف</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                سجل سندات القبض والصرف
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>المصروفات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                تفاصيل المصروفات حسب الفئات
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
