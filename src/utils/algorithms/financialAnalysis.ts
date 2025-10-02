// خوارزميات التحليل المالي والتنبؤ

export interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  cashFlow: number;
  collectionRate: number;
  averagePaymentTime: number;
}

export interface RevenueForecas {
  month: string;
  predicted: number;
  confidence: number;
}

/**
 * حساب المؤشرات المالية الأساسية
 */
export const calculateFinancialMetrics = (
  invoices: any[],
  payments: any[],
  expenses: any[]
): FinancialMetrics => {
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalPaid = payments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  
  const netProfit = totalPaid - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const cashFlow = totalPaid - totalExpenses;
  const collectionRate = totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0;
  
  // حساب متوسط وقت الدفع
  const paidInvoices = invoices.filter(inv => 
    payments.some(pay => pay.invoice_id === inv.id)
  );
  
  let totalDays = 0;
  paidInvoices.forEach(invoice => {
    const payment = payments.find(pay => pay.invoice_id === invoice.id);
    if (payment) {
      const invoiceDate = new Date(invoice.issue_date);
      const paymentDate = new Date(payment.payment_date);
      const days = Math.floor((paymentDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
      totalDays += days;
    }
  });
  
  const averagePaymentTime = paidInvoices.length > 0 ? totalDays / paidInvoices.length : 0;

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    profitMargin,
    cashFlow,
    collectionRate,
    averagePaymentTime
  };
};

/**
 * التنبؤ بالإيرادات باستخدام المتوسط المتحرك
 */
export const forecastRevenue = (historicalData: { month: string; revenue: number }[]): RevenueForecas[] => {
  if (historicalData.length < 3) {
    return [];
  }

  const forecasts: RevenueForecas[] = [];
  const windowSize = 3;

  // حساب الاتجاه العام
  const recentRevenues = historicalData.slice(-windowSize).map(d => d.revenue);
  const averageRevenue = recentRevenues.reduce((sum, rev) => sum + rev, 0) / windowSize;
  
  // حساب التباين
  const variance = recentRevenues.reduce((sum, rev) => sum + Math.pow(rev - averageRevenue, 2), 0) / windowSize;
  const standardDeviation = Math.sqrt(variance);
  
  // التنبؤ للأشهر الثلاثة القادمة
  const lastMonth = new Date(historicalData[historicalData.length - 1].month);
  
  for (let i = 1; i <= 3; i++) {
    const nextMonth = new Date(lastMonth);
    nextMonth.setMonth(nextMonth.getMonth() + i);
    
    const monthStr = nextMonth.toISOString().slice(0, 7);
    const predicted = averageRevenue;
    const confidence = Math.max(0, Math.min(100, 100 - (standardDeviation / averageRevenue * 100)));
    
    forecasts.push({
      month: monthStr,
      predicted,
      confidence
    });
  }

  return forecasts;
};

/**
 * تحليل أنماط الدفع والتحصيل
 */
export const analyzePaymentPatterns = (payments: any[]) => {
  const paymentsByMonth: { [key: string]: number } = {};
  const paymentsByMethod: { [key: string]: number } = {};
  
  payments.forEach(payment => {
    const month = new Date(payment.payment_date).toISOString().slice(0, 7);
    paymentsByMonth[month] = (paymentsByMonth[month] || 0) + payment.amount;
    
    const method = payment.payment_method || 'unknown';
    paymentsByMethod[method] = (paymentsByMethod[method] || 0) + payment.amount;
  });

  return {
    monthlyTrend: Object.entries(paymentsByMonth).map(([month, amount]) => ({
      month,
      amount
    })),
    methodDistribution: Object.entries(paymentsByMethod).map(([method, amount]) => ({
      method,
      amount,
      percentage: (amount / payments.reduce((sum, p) => sum + p.amount, 0)) * 100
    }))
  };
};

/**
 * كشف الحالات الشاذة في المدفوعات
 */
export const detectPaymentAnomalies = (payments: any[]): any[] => {
  if (payments.length < 10) return [];

  const amounts = payments.map(p => p.amount);
  const mean = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
  const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);
  
  const threshold = 2; // عدد الانحرافات المعيارية
  
  return payments.filter(payment => {
    const zScore = Math.abs((payment.amount - mean) / stdDev);
    return zScore > threshold;
  }).map(payment => ({
    ...payment,
    anomalyType: payment.amount > mean ? 'unusually_high' : 'unusually_low',
    deviation: ((payment.amount - mean) / mean * 100).toFixed(2) + '%'
  }));
};
