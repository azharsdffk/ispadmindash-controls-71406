import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, TrendingUp, TrendingDown, DollarSign, 
  CreditCard, Wallet, Target, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface FinancialHealthCardProps {
  metrics: {
    revenue: number;
    expenses: number;
    receivables: number;
    payables: number;
    cashFlow: number;
    profitMargin: number;
    collectionRate: number;
    revenueTarget: number;
  };
}

export const FinancialHealthCard = ({ metrics }: FinancialHealthCardProps) => {
  const netProfit = metrics.revenue - metrics.expenses;
  const revenueProgress = metrics.revenueTarget > 0 
    ? Math.min((metrics.revenue / metrics.revenueTarget) * 100, 100) 
    : 0;
  
  // Calculate financial health score (0-100)
  const calculateHealthScore = () => {
    let score = 50; // Base score
    
    // Profit margin contribution (up to 25 points)
    if (metrics.profitMargin > 30) score += 25;
    else if (metrics.profitMargin > 20) score += 20;
    else if (metrics.profitMargin > 10) score += 15;
    else if (metrics.profitMargin > 0) score += 10;
    else score -= 10;
    
    // Collection rate contribution (up to 15 points)
    if (metrics.collectionRate > 90) score += 15;
    else if (metrics.collectionRate > 80) score += 10;
    else if (metrics.collectionRate > 70) score += 5;
    else score -= 5;
    
    // Cash flow contribution (up to 10 points)
    if (metrics.cashFlow > 0) score += 10;
    else score -= 5;
    
    return Math.max(0, Math.min(100, score));
  };

  const healthScore = calculateHealthScore();
  
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'ممتاز';
    if (score >= 60) return 'جيد';
    if (score >= 40) return 'متوسط';
    return 'يحتاج تحسين';
  };

  const healthItems = [
    {
      label: 'صافي الربح',
      value: formatCurrency(netProfit),
      icon: netProfit >= 0 ? TrendingUp : TrendingDown,
      color: netProfit >= 0 ? 'text-success' : 'text-destructive',
      bgColor: netProfit >= 0 ? 'bg-success/10' : 'bg-destructive/10',
    },
    {
      label: 'هامش الربح',
      value: `${metrics.profitMargin.toFixed(1)}%`,
      icon: Target,
      color: metrics.profitMargin >= 20 ? 'text-success' : 'text-warning',
      bgColor: metrics.profitMargin >= 20 ? 'bg-success/10' : 'bg-warning/10',
    },
    {
      label: 'معدل التحصيل',
      value: `${metrics.collectionRate.toFixed(1)}%`,
      icon: CreditCard,
      color: metrics.collectionRate >= 80 ? 'text-success' : 'text-warning',
      bgColor: metrics.collectionRate >= 80 ? 'bg-success/10' : 'bg-warning/10',
    },
    {
      label: 'التدفق النقدي',
      value: formatCurrency(metrics.cashFlow),
      icon: Wallet,
      color: metrics.cashFlow >= 0 ? 'text-success' : 'text-destructive',
      bgColor: metrics.cashFlow >= 0 ? 'bg-success/10' : 'bg-destructive/10',
    },
  ];

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            الصحة المالية
          </CardTitle>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
            healthScore >= 60 ? 'bg-success/10' : 'bg-warning/10'
          }`}>
            {healthScore >= 60 ? (
              <CheckCircle2 className={`h-4 w-4 ${getHealthColor(healthScore)}`} />
            ) : (
              <AlertCircle className={`h-4 w-4 ${getHealthColor(healthScore)}`} />
            )}
            <span className={`text-sm font-semibold ${getHealthColor(healthScore)}`}>
              {getHealthLabel(healthScore)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {/* Health Score Circle */}
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="12"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke={
                  healthScore >= 80 ? 'hsl(160, 60%, 45%)' :
                  healthScore >= 60 ? 'hsl(45, 85%, 55%)' :
                  healthScore >= 40 ? 'hsl(35, 100%, 55%)' :
                  'hsl(0, 75%, 55%)'
                }
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${healthScore * 3.52} 352`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${getHealthColor(healthScore)}`}>
                {healthScore}
              </span>
              <span className="text-xs text-muted-foreground">درجة الصحة</span>
            </div>
          </div>
        </div>

        {/* Revenue Target Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              تحقيق هدف الإيرادات
            </span>
            <span className="font-semibold">{revenueProgress.toFixed(1)}%</span>
          </div>
          <Progress value={revenueProgress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(metrics.revenue)}</span>
            <span>الهدف: {formatCurrency(metrics.revenueTarget)}</span>
          </div>
        </div>

        {/* Financial Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {healthItems.map((item, index) => (
            <div 
              key={index}
              className={`flex items-center gap-3 p-3 rounded-lg ${item.bgColor} border border-transparent hover:border-primary/20 transition-colors`}
            >
              <item.icon className={`h-5 w-5 ${item.color}`} />
              <div>
                <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Receivables vs Payables */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">المستحقات</span>
            <span className="text-sm font-semibold text-success">
              {formatCurrency(metrics.receivables)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">الالتزامات</span>
            <span className="text-sm font-semibold text-destructive">
              {formatCurrency(metrics.payables)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border/50">
            <span className="text-sm font-medium">الصافي</span>
            <span className={`text-sm font-bold ${
              metrics.receivables - metrics.payables >= 0 ? 'text-success' : 'text-destructive'
            }`}>
              {formatCurrency(metrics.receivables - metrics.payables)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
