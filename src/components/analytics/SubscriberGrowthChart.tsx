import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Users, UserPlus, UserMinus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SubscriberGrowthChartProps {
  data: Array<{
    month: string;
    newSubscribers: number;
    churnedSubscribers: number;
    totalActive: number;
  }>;
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
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
        {payload.length >= 2 && (
          <div className="mt-2 pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">صافي النمو: </span>
            <span className={`font-bold ${
              payload[0].value - payload[1].value >= 0 ? 'text-success' : 'text-destructive'
            }`}>
              {(payload[0].value - payload[1].value).toLocaleString()}
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const SubscriberGrowthChart = ({ data }: SubscriberGrowthChartProps) => {
  // Calculate stats
  const totalNew = data.reduce((sum, d) => sum + d.newSubscribers, 0);
  const totalChurned = data.reduce((sum, d) => sum + d.churnedSubscribers, 0);
  const netGrowth = totalNew - totalChurned;
  const churnRate = totalNew > 0 ? ((totalChurned / totalNew) * 100).toFixed(1) : 0;

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            تحليل نمو المشتركين
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary" className="gap-1 bg-success/10 text-success border-success/20">
              <UserPlus className="h-3 w-3" />
              +{totalNew}
            </Badge>
            <Badge variant="secondary" className="gap-1 bg-destructive/10 text-destructive border-destructive/20">
              <UserMinus className="h-3 w-3" />
              -{totalChurned}
            </Badge>
            <Badge variant="secondary" className={`gap-1 ${
              netGrowth >= 0 
                ? 'bg-primary/10 text-primary border-primary/20' 
                : 'bg-destructive/10 text-destructive border-destructive/20'
            }`}>
              صافي: {netGrowth > 0 ? '+' : ''}{netGrowth}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="newSubsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0.6}/>
              </linearGradient>
              <linearGradient id="churnedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0, 75%, 55%)" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="hsl(0, 75%, 55%)" stopOpacity={0.6}/>
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
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => <span className="text-sm">{value}</span>}
            />
            <Bar 
              yAxisId="left"
              dataKey="newSubscribers" 
              name="مشتركين جدد"
              fill="url(#newSubsGradient)"
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
            <Bar 
              yAxisId="left"
              dataKey="churnedSubscribers" 
              name="مشتركين منسحبين"
              fill="url(#churnedGradient)"
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="totalActive" 
              name="إجمالي النشطين"
              stroke="hsl(45, 85%, 55%)"
              strokeWidth={3}
              dot={{ fill: 'hsl(45, 85%, 55%)', r: 4 }}
              activeDot={{ r: 6, fill: 'hsl(45, 85%, 55%)', stroke: 'white', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        
        {/* Churn Rate Indicator */}
        <div className="mt-4 flex items-center justify-center gap-4 p-3 rounded-lg bg-muted/30">
          <span className="text-sm text-muted-foreground">معدل التسرب:</span>
          <span className={`text-lg font-bold ${
            Number(churnRate) <= 5 ? 'text-success' : 
            Number(churnRate) <= 10 ? 'text-warning' : 'text-destructive'
          }`}>
            {churnRate}%
          </span>
          <span className="text-xs text-muted-foreground">
            ({Number(churnRate) <= 5 ? 'ممتاز' : Number(churnRate) <= 10 ? 'جيد' : 'يحتاج تحسين'})
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
