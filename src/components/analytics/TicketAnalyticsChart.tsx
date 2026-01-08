import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  RadialBarChart, RadialBar, Legend, Tooltip
} from 'recharts';
import { Wrench, Clock, CheckCircle, AlertTriangle, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TicketAnalyticsChartProps {
  stats: {
    open: number;
    inProgress: number;
    resolved: number;
    averageResolutionTime: number; // in hours
    slaCompliance: number; // percentage
  };
}

const COLORS = {
  open: 'hsl(38, 92%, 50%)',
  inProgress: 'hsl(221, 83%, 53%)',
  resolved: 'hsl(142, 71%, 45%)',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-card border border-primary/20 rounded-lg shadow-xl p-3 backdrop-blur-xl">
        <p className="font-semibold" style={{ color: data.payload.fill }}>
          {data.name}: {data.value}
        </p>
      </div>
    );
  }
  return null;
};

export const TicketAnalyticsChart = ({ stats }: TicketAnalyticsChartProps) => {
  const totalTickets = stats.open + stats.inProgress + stats.resolved;
  const resolutionRate = totalTickets > 0 
    ? ((stats.resolved / totalTickets) * 100).toFixed(1) 
    : 0;

  const pieData = [
    { name: 'مفتوحة', value: stats.open, fill: COLORS.open },
    { name: 'قيد المعالجة', value: stats.inProgress, fill: COLORS.inProgress },
    { name: 'محلولة', value: stats.resolved, fill: COLORS.resolved },
  ];

  const performanceData = [
    {
      name: 'معدل الحل',
      value: Number(resolutionRate),
      fill: 'hsl(142, 71%, 45%)',
    },
    {
      name: 'الالتزام بـ SLA',
      value: stats.slaCompliance,
      fill: 'hsl(45, 85%, 55%)',
    },
  ];

  // Format average resolution time
  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} دقيقة`;
    if (hours < 24) return `${hours.toFixed(1)} ساعة`;
    return `${(hours / 24).toFixed(1)} يوم`;
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            تحليلات تذاكر الصيانة
          </CardTitle>
          <Badge variant="outline" className="gap-1">
            <Timer className="h-3 w-3" />
            متوسط الحل: {formatTime(stats.averageResolutionTime)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Distribution Pie Chart */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground text-center">توزيع الحالات</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.fill}
                      className="stroke-card stroke-2 transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Legend */}
            <div className="flex justify-center gap-4">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                  <span className="text-xs font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Radial Chart */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground text-center">مؤشرات الأداء</h4>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="40%" 
                outerRadius="90%" 
                data={performanceData}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  background={{ fill: 'hsl(var(--muted) / 0.3)' }}
                  dataKey="value"
                  cornerRadius={10}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadialBarChart>
            </ResponsiveContainer>
            
            {/* Performance Labels */}
            <div className="flex justify-center gap-6">
              {performanceData.map((item) => (
                <div key={item.name} className="text-center">
                  <p className="text-xl font-bold" style={{ color: item.fill }}>{item.value}%</p>
                  <p className="text-xs text-muted-foreground">{item.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div>
              <p className="text-lg font-bold text-warning">{stats.open}</p>
              <p className="text-xs text-muted-foreground">مفتوحة</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-info/10 border border-info/20">
            <Clock className="h-5 w-5 text-info" />
            <div>
              <p className="text-lg font-bold text-info">{stats.inProgress}</p>
              <p className="text-xs text-muted-foreground">قيد المعالجة</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
            <CheckCircle className="h-5 w-5 text-success" />
            <div>
              <p className="text-lg font-bold text-success">{stats.resolved}</p>
              <p className="text-xs text-muted-foreground">محلولة</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
