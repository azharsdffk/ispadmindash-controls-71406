import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, Activity, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface AdvancedChartsProps {
  monthlyData: any[];
  paymentMethods: any[];
  stats: {
    totalRevenue: number;
    totalExpenses: number;
    openTickets: number;
    resolvedTickets: number;
  };
  netProfit: number;
}

const COLORS = [
  'hsl(221, 83%, 53%)', // blue
  'hsl(142, 71%, 45%)', // green  
  'hsl(38, 92%, 50%)',  // amber
  'hsl(0, 84%, 60%)',   // red
  'hsl(262, 83%, 58%)', // purple
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' && entry.value > 1000 
              ? formatCurrency(entry.value) 
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const AdvancedCharts = ({ monthlyData, paymentMethods, stats, netProfit }: AdvancedChartsProps) => {
  // Performance data for radial chart
  const performanceData = [
    {
      name: 'معدل الحل',
      value: stats.openTickets + stats.resolvedTickets > 0 
        ? Math.round((stats.resolvedTickets / (stats.openTickets + stats.resolvedTickets)) * 100)
        : 0,
      fill: 'hsl(142, 71%, 45%)',
    },
    {
      name: 'هامش الربح',
      value: stats.totalRevenue > 0 ? Math.round((netProfit / stats.totalRevenue) * 100) : 0,
      fill: 'hsl(221, 83%, 53%)',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Revenue vs Expenses Area Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            اتجاه الإيرادات والمصروفات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(142, 71%, 45%)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                name="الإيرادات"
              />
              <Area 
                type="monotone" 
                dataKey="expenses" 
                stroke="hsl(0, 84%, 60%)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorExpenses)" 
                name="المصروفات"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment Methods Pie Chart */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieIcon className="h-5 w-5 text-primary" />
              توزيع طرق الدفع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                >
                  {paymentMethods.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      className="stroke-background stroke-2"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {paymentMethods.map((method, index) => (
                <div key={method.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-muted-foreground">{method.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Radial Chart */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              مؤشرات الأداء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="30%" 
                outerRadius="90%" 
                data={performanceData}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  label={{ position: 'insideStart', fill: '#fff', fontSize: 12 }}
                  background={{ fill: 'hsl(var(--muted))' }}
                  dataKey="value"
                  cornerRadius={10}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadialBarChart>
            </ResponsiveContainer>

            {/* Performance Labels */}
            <div className="flex justify-center gap-8 mt-2">
              {performanceData.map((item) => (
                <div key={item.name} className="text-center">
                  <p className="text-2xl font-bold" style={{ color: item.fill }}>{item.value}%</p>
                  <p className="text-xs text-muted-foreground">{item.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Comparison Bar Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            مقارنة الأداء الشهري
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="revenue" 
                fill="hsl(142, 71%, 45%)" 
                name="الإيرادات" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="expenses" 
                fill="hsl(0, 84%, 60%)" 
                name="المصروفات"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
