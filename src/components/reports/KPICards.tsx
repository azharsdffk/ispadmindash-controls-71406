import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Users, FileText, Wrench, Target, Percent } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface KPICardsProps {
  stats: {
    totalSubscribers: number;
    activeSubscribers: number;
    totalInvoices: number;
    pendingInvoices: number;
    totalRevenue: number;
    totalExpenses: number;
    openTickets: number;
    resolvedTickets: number;
  };
  netProfit: number;
  profitMargin: number | string;
}

export const KPICards = ({ stats, netProfit, profitMargin }: KPICardsProps) => {
  const kpis = [
    {
      title: 'إجمالي الإيرادات',
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      trend: '+12.5%',
      trendUp: true,
      color: 'from-emerald-500 to-green-600',
      bgColor: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
    },
    {
      title: 'إجمالي المصروفات',
      value: formatCurrency(stats.totalExpenses),
      icon: TrendingDown,
      trend: '-3.2%',
      trendUp: false,
      color: 'from-rose-500 to-red-600',
      bgColor: 'bg-rose-500/10',
      iconColor: 'text-rose-500',
    },
    {
      title: 'صافي الربح',
      value: formatCurrency(netProfit),
      icon: DollarSign,
      trend: netProfit >= 0 ? '+8.7%' : '-5.1%',
      trendUp: netProfit >= 0,
      color: netProfit >= 0 ? 'from-blue-500 to-indigo-600' : 'from-orange-500 to-red-600',
      bgColor: netProfit >= 0 ? 'bg-blue-500/10' : 'bg-orange-500/10',
      iconColor: netProfit >= 0 ? 'text-blue-500' : 'text-orange-500',
    },
    {
      title: 'هامش الربح',
      value: `${profitMargin}%`,
      icon: Percent,
      trend: '+2.3%',
      trendUp: true,
      color: 'from-violet-500 to-purple-600',
      bgColor: 'bg-violet-500/10',
      iconColor: 'text-violet-500',
    },
  ];

  const secondaryKpis = [
    {
      title: 'المشتركين',
      value: stats.totalSubscribers,
      icon: Users,
      subText: `${stats.activeSubscribers} نشط`,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'الفواتير',
      value: stats.totalInvoices,
      icon: FileText,
      subText: `${stats.pendingInvoices} معلق`,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'التذاكر المفتوحة',
      value: stats.openTickets,
      icon: Wrench,
      subText: `${stats.resolvedTickets} محلولة`,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
    },
    {
      title: 'معدل الحل',
      value: stats.openTickets + stats.resolvedTickets > 0 
        ? `${Math.round((stats.resolvedTickets / (stats.openTickets + stats.resolvedTickets)) * 100)}%`
        : '0%',
      icon: Target,
      subText: 'من إجمالي التذاكر',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className={`h-1 bg-gradient-to-r ${kpi.color}`} />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                  <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
                  <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                    kpi.trendUp ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                  }`}>
                    {kpi.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {kpi.trend}
                  </div>
                </div>
                <div className={`${kpi.bgColor} p-3 rounded-xl`}>
                  <kpi.icon className={`h-6 w-6 ${kpi.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {secondaryKpis.map((kpi, index) => (
          <Card key={index} className="border shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`${kpi.bgColor} p-2.5 rounded-lg`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-lg font-bold">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.title}</p>
                  <p className="text-xs text-muted-foreground/70">{kpi.subText}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
