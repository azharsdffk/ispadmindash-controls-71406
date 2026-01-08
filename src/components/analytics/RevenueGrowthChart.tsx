import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface RevenueGrowthChartProps {
  data: Array<{
    month: string;
    revenue: number;
    target?: number;
    previousYear?: number;
  }>;
  showComparison?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-primary/20 rounded-lg shadow-xl p-4 backdrop-blur-xl">
        <p className="font-bold text-foreground mb-2 border-b border-border pb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm py-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold" style={{ color: entry.color }}>
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const RevenueGrowthChart = ({ data, showComparison = false }: RevenueGrowthChartProps) => {
  // Calculate growth percentage
  const latestRevenue = data[data.length - 1]?.revenue || 0;
  const previousRevenue = data[data.length - 2]?.revenue || 0;
  const growthPercentage = previousRevenue > 0 
    ? ((latestRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
    : 0;
  const isPositiveGrowth = Number(growthPercentage) >= 0;

  // Calculate average target line
  const avgRevenue = data.reduce((sum, d) => sum + d.revenue, 0) / data.length;

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            نمو الإيرادات
          </CardTitle>
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold ${
            isPositiveGrowth 
              ? 'bg-success/10 text-success' 
              : 'bg-destructive/10 text-destructive'
          }`}>
            {isPositiveGrowth ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            {growthPercentage}%
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(45, 85%, 55%)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="hsl(45, 85%, 55%)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="previousYearGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(200, 80%, 55%)" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="hsl(200, 80%, 55%)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine 
              y={avgRevenue} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="5 5"
              label={{ 
                value: 'المتوسط', 
                position: 'right',
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 10
              }}
            />
            {showComparison && (
              <Area 
                type="monotone" 
                dataKey="previousYear" 
                stroke="hsl(200, 80%, 55%)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#previousYearGradient)" 
                name="السنة السابقة"
                strokeDasharray="5 5"
              />
            )}
            <Area 
              type="monotone" 
              dataKey="target" 
              stroke="hsl(160, 60%, 45%)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#targetGradient)" 
              name="الهدف"
              strokeDasharray="3 3"
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="hsl(45, 85%, 55%)" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#revenueGradient)" 
              name="الإيرادات"
              dot={{ fill: 'hsl(45, 85%, 55%)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: 'hsl(45, 85%, 55%)', stroke: 'white', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
