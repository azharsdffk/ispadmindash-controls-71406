import { RevenueGrowthChart } from './RevenueGrowthChart';
import { SubscriberGrowthChart } from './SubscriberGrowthChart';
import { TicketAnalyticsChart } from './TicketAnalyticsChart';
import { FinancialHealthCard } from './FinancialHealthCard';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AnalyticsDashboardProps {
  dateRange?: { from: string; to: string };
}

export const AnalyticsDashboard = ({ dateRange }: AnalyticsDashboardProps) => {
  const analytics = useAnalytics(dateRange);

  if (analytics.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">جاري تحميل التحليلات...</p>
        </div>
      </div>
    );
  }

  if (analytics.error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-destructive">{analytics.error}</p>
        <Button onClick={analytics.refresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">لوحة التحليلات المتقدمة</h2>
          <Badge variant="secondary" className="gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            تحديث مباشر
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={analytics.refresh} 
            variant="outline" 
            size="sm" 
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue Growth */}
        <RevenueGrowthChart 
          data={analytics.revenue.monthly}
          showComparison
        />

        {/* Subscriber Growth */}
        <SubscriberGrowthChart 
          data={analytics.subscribers.growth}
        />

        {/* Ticket Analytics */}
        <TicketAnalyticsChart 
          stats={analytics.tickets}
        />

        {/* Financial Health */}
        <FinancialHealthCard 
          metrics={analytics.financial}
        />
      </div>
    </div>
  );
};
