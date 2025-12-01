import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, TrendingDown, Calendar, CreditCard, Banknote } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface PaymentSummary {
  total: number;
  cash: number;
  bank_transfer: number;
  card: number;
  other: number;
  count: number;
}

interface MonthlyRevenueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MonthlyRevenueModal = ({ open, onOpenChange }: MonthlyRevenueModalProps) => {
  const [currentMonth, setCurrentMonth] = useState<PaymentSummary>({ total: 0, cash: 0, bank_transfer: 0, card: 0, other: 0, count: 0 });
  const [lastMonth, setLastMonth] = useState<PaymentSummary>({ total: 0, cash: 0, bank_transfer: 0, card: 0, other: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchRevenueData();
    }
  }, [open]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

      // Current month payments
      const { data: currentData, error: currentError } = await supabase
        .from('payments')
        .select('amount, payment_method')
        .gte('payment_date', firstDayCurrentMonth);

      if (currentError) throw currentError;

      // Last month payments
      const { data: lastData, error: lastError } = await supabase
        .from('payments')
        .select('amount, payment_method')
        .gte('payment_date', firstDayLastMonth)
        .lte('payment_date', lastDayLastMonth);

      if (lastError) throw lastError;

      const calculateSummary = (data: any[]): PaymentSummary => {
        return data.reduce((acc, payment) => {
          acc.total += payment.amount;
          acc.count += 1;
          switch (payment.payment_method) {
            case 'cash':
              acc.cash += payment.amount;
              break;
            case 'bank_transfer':
              acc.bank_transfer += payment.amount;
              break;
            case 'card':
              acc.card += payment.amount;
              break;
            default:
              acc.other += payment.amount;
          }
          return acc;
        }, { total: 0, cash: 0, bank_transfer: 0, card: 0, other: 0, count: 0 });
      };

      setCurrentMonth(calculateSummary(currentData || []));
      setLastMonth(calculateSummary(lastData || []));
    } catch (error) {
      console.error('Error fetching revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  const growthPercentage = lastMonth.total > 0 
    ? ((currentMonth.total - lastMonth.total) / lastMonth.total * 100).toFixed(1)
    : '0';

  const isGrowthPositive = parseFloat(growthPercentage) >= 0;

  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const currentMonthName = monthNames[new Date().getMonth()];
  const lastMonthName = monthNames[new Date().getMonth() - 1 < 0 ? 11 : new Date().getMonth() - 1];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <DollarSign className="h-6 w-6 text-success" />
            الإيرادات الشهرية
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Month Summary */}
              <div className="p-6 bg-gradient-to-br from-success/10 to-success/5 rounded-xl border border-success/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-success" />
                    <span className="font-semibold text-lg">شهر {currentMonthName}</span>
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                    isGrowthPositive ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                  }`}>
                    {isGrowthPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="text-sm font-medium">{growthPercentage}%</span>
                  </div>
                </div>
                
                <div className="text-4xl font-bold text-success mb-2">
                  {formatCurrency(currentMonth.total, 'IQD')}
                </div>
                <p className="text-sm text-muted-foreground">{currentMonth.count} عملية دفع</p>
              </div>

              {/* Payment Methods Breakdown */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  تفصيل طرق الدفع
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Banknote className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">نقدي</span>
                    </div>
                    <div className="text-xl font-bold text-foreground">{formatCurrency(currentMonth.cash, 'IQD')}</div>
                  </div>

                  <div className="p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-muted-foreground">تحويل بنكي</span>
                    </div>
                    <div className="text-xl font-bold text-foreground">{formatCurrency(currentMonth.bank_transfer, 'IQD')}</div>
                  </div>

                  <div className="p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-muted-foreground">بطاقة</span>
                    </div>
                    <div className="text-xl font-bold text-foreground">{formatCurrency(currentMonth.card, 'IQD')}</div>
                  </div>

                  <div className="p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-muted-foreground">أخرى</span>
                    </div>
                    <div className="text-xl font-bold text-foreground">{formatCurrency(currentMonth.other, 'IQD')}</div>
                  </div>
                </div>
              </div>

              {/* Last Month Comparison */}
              <div className="p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">شهر {lastMonthName}</p>
                    <p className="text-xl font-bold text-foreground">{formatCurrency(lastMonth.total, 'IQD')}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">الفرق</p>
                    <p className={`text-xl font-bold ${isGrowthPositive ? 'text-success' : 'text-destructive'}`}>
                      {isGrowthPositive ? '+' : ''}{formatCurrency(currentMonth.total - lastMonth.total, 'IQD')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
