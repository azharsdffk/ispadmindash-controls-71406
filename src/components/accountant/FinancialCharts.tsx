import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, PieChart as PieIcon } from 'lucide-react';

const monthlyData = [
  { month: 'كانون الثاني', revenue: 5000000, expenses: 2000000, profit: 3000000 },
  { month: 'شباط', revenue: 6500000, expenses: 2500000, profit: 4000000 },
  { month: 'آذار', revenue: 7000000, expenses: 3000000, profit: 4000000 },
  { month: 'نيسان', revenue: 6000000, expenses: 2800000, profit: 3200000 },
  { month: 'أيار', revenue: 8000000, expenses: 3500000, profit: 4500000 },
  { month: 'حزيران', revenue: 7500000, expenses: 3200000, profit: 4300000 },
];

const expensesByCategory = [
  { name: 'الرواتب', value: 4500000, color: '#3b82f6' },
  { name: 'الصيانة', value: 1500000, color: '#10b981' },
  { name: 'التسويق', value: 1000000, color: '#f59e0b' },
  { name: 'المعدات', value: 2000000, color: '#ef4444' },
  { name: 'أخرى', value: 500000, color: '#8b5cf6' },
];

const revenueByService = [
  { name: 'اشتراكات شهرية', value: 6000000, color: '#059669' },
  { name: 'اشتراكات سنوية', value: 3000000, color: '#0891b2' },
  { name: 'تركيب جديد', value: 2000000, color: '#7c3aed' },
  { name: 'صيانة', value: 1000000, color: '#dc2626' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {(entry.value / 1000000).toFixed(1)}M IQD
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const formatYAxis = (value: number) => {
  return `${(value / 1000000).toFixed(0)}M`;
};

export const FinancialCharts = () => {
  return (
    <div className="space-y-6">
      {/* الإيرادات والمصروفات الشهرية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            الإيرادات والمصروفات الشهرية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis tickFormatter={formatYAxis} className="text-xs" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="revenue" name="الإيرادات" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expenses" name="المصروفات" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* صافي الربح الشهري */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              تطور صافي الربح
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis tickFormatter={formatYAxis} className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  name="صافي الربح"
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* توزيع المصروفات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieIcon className="h-5 w-5" />
              توزيع المصروفات حسب الفئة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => {
                    const percentValue = typeof percent === 'number' ? percent : 0;
                    return `${name} ${(percentValue * 100).toFixed(0)}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `${(value / 1000000).toFixed(1)}M IQD`}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* توزيع الإيرادات حسب نوع الخدمة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieIcon className="h-5 w-5" />
            توزيع الإيرادات حسب نوع الخدمة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueByService}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => {
                    const percentValue = typeof percent === 'number' ? percent : 0;
                    return `${name} ${(percentValue * 100).toFixed(0)}%`;
                  }}
                >
                  {revenueByService.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `${(value / 1000000).toFixed(1)}M IQD`}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex flex-col justify-center space-y-3">
              {revenueByService.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold">
                    {(item.value / 1000000).toFixed(1)}M IQD
                  </span>
                </div>
              ))}
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <span className="font-bold">الإجمالي:</span>
                  <span className="font-bold text-primary">
                    {(revenueByService.reduce((sum, item) => sum + item.value, 0) / 1000000).toFixed(1)}M IQD
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};