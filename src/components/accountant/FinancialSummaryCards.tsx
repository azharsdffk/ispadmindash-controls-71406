import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Target, PieChart } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface FinancialSummaryCardsProps {
  stats: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    cashFlow: number;
    targetRevenue?: number;
  };
}

export const FinancialSummaryCards = ({ stats }: FinancialSummaryCardsProps) => {
  const revenueProgress = stats.targetRevenue 
    ? (stats.totalRevenue / stats.targetRevenue) * 100 
    : 0;

  const profitMarginColor = stats.profitMargin >= 20 
    ? 'text-green-600' 
    : stats.profitMargin >= 10 
    ? 'text-yellow-600' 
    : 'text-red-600';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* الأداء المالي */}
      <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            الأداء المالي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(stats.totalRevenue, 'IQD')}
                </span>
                <span className="text-xs text-muted-foreground">إجمالي الإيرادات</span>
              </div>
              {stats.targetRevenue && (
                <>
                  <Progress value={revenueProgress} className="h-2 mb-1" />
                  <p className="text-xs text-muted-foreground">
                    {revenueProgress.toFixed(0)}% من الهدف ({formatCurrency(stats.targetRevenue, 'IQD')})
                  </p>
                </>
              )}
            </div>
            
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">صافي الربح</span>
                <span className={`text-lg font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.netProfit, 'IQD')}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* هامش الربح */}
      <Card className="border-2 border-success/20 hover:border-success/40 transition-all duration-300 hover:shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PieChart className="h-4 w-4 text-success" />
            هامش الربح
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-5xl font-bold ${profitMarginColor}`}>
                {stats.profitMargin.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-2">نسبة الربح من الإيرادات</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-3 border-t">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">الإيرادات</div>
                <div className="text-sm font-semibold text-green-600">
                  {formatCurrency(stats.totalRevenue, 'IQD')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">المصروفات</div>
                <div className="text-sm font-semibold text-red-600">
                  {formatCurrency(stats.totalExpenses, 'IQD')}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* التدفق النقدي */}
      <Card className="border-2 border-info/20 hover:border-info/40 transition-all duration-300 hover:shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {stats.cashFlow >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            التدفق النقدي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-4xl font-bold ${stats.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats.cashFlow, 'IQD')}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.cashFlow >= 0 ? 'تدفق نقدي إيجابي' : 'تدفق نقدي سلبي'}
              </p>
            </div>
            
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">الحالة المالية:</span>
                <span className={`font-semibold ${stats.cashFlow >= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                  {stats.cashFlow >= 0 ? 'ممتازة ✓' : 'تحتاج متابعة ⚠'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
