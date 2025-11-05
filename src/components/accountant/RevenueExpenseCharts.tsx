import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/currency';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';

interface RevenueExpenseChartsProps {
  stats: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
  };
}

export const RevenueExpenseCharts = ({ stats }: RevenueExpenseChartsProps) => {
  // بيانات مثال للأشهر الستة الماضية
  const monthlyData = [
    { month: 'محرم', revenue: 45000000, expenses: 28000000 },
    { month: 'صفر', revenue: 52000000, expenses: 31000000 },
    { month: 'ربيع الأول', revenue: 48000000, expenses: 29000000 },
    { month: 'ربيع الثاني', revenue: 61000000, expenses: 35000000 },
    { month: 'جمادى الأول', revenue: 55000000, expenses: 32000000 },
    { month: 'جمادى الثاني', revenue: 58000000, expenses: 34000000 },
  ];

  // بيانات التوزيع المالي
  const distributionData = [
    { name: 'الإيرادات', value: stats.totalRevenue, color: 'hsl(var(--primary))' },
    { name: 'المصروفات', value: stats.totalExpenses, color: 'hsl(var(--destructive))' },
  ];

  // بيانات الربحية الشهرية
  const profitData = monthlyData.map(item => ({
    month: item.month,
    profit: item.revenue - item.expenses
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="text-sm font-medium mb-1">{payload[0].payload.month}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value, 'IQD')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* مخطط الإيرادات والمصروفات الشهرية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            الإيرادات والمصروفات الشهرية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="revenue" 
                name="الإيرادات" 
                fill="hsl(var(--primary))" 
                radius={[8, 8, 0, 0]}
              />
              <Bar 
                dataKey="expenses" 
                name="المصروفات" 
                fill="hsl(var(--destructive))" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* مخطط دائري للتوزيع المالي */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            التوزيع المالي الإجمالي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => {
                  const total = stats.totalRevenue + stats.totalExpenses;
                  const percentage = ((Number(entry.value) / total) * 100).toFixed(1);
                  return `${entry.name}: ${percentage}%`;
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatCurrency(value, 'IQD')}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }} />
              <span className="text-sm">الإيرادات</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--destructive))' }} />
              <span className="text-sm">المصروفات</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* مخطط خطي للربحية الشهرية */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-secondary" />
              تطور صافي الربح الشهري
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-secondary" />
                <span className="text-sm text-muted-foreground">
                  متوسط الربح: {formatCurrency(profitData.reduce((sum, d) => sum + d.profit, 0) / profitData.length, 'IQD')}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={profitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                        <p className="text-sm font-medium mb-1">{payload[0].payload.month}</p>
                        <p className="text-sm text-secondary">
                          الربح: {formatCurrency(payload[0].value as number, 'IQD')}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="profit" 
                name="صافي الربح"
                stroke="hsl(var(--secondary))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--secondary))', r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
