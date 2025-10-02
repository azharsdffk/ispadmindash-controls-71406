// خوارزميات تحليل سلوك المشتركين

export interface SubscriberBehavior {
  subscriber_id: string;
  payment_score: number;
  churn_risk: 'low' | 'medium' | 'high';
  engagement_level: number;
  predicted_lifetime_value: number;
}

/**
 * حساب درجة الالتزام بالدفع
 */
export const calculatePaymentScore = (
  subscriber: any,
  payments: any[],
  invoices: any[]
): number => {
  const subscriberPayments = payments.filter(p => p.subscriber_id === subscriber.id);
  const subscriberInvoices = invoices.filter(i => i.subscriber_id === subscriber.id);
  
  if (subscriberInvoices.length === 0) return 50; // درجة محايدة
  
  // حساب نسبة الدفع في الوقت المحدد
  let onTimePayments = 0;
  let totalPayments = subscriberPayments.length;
  
  subscriberPayments.forEach(payment => {
    const invoice = subscriberInvoices.find(inv => inv.id === payment.invoice_id);
    if (invoice) {
      const paymentDate = new Date(payment.payment_date);
      const dueDate = new Date(invoice.due_date);
      
      if (paymentDate <= dueDate) {
        onTimePayments++;
      }
    }
  });
  
  const onTimeRate = totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : 0;
  
  // حساب نسبة التحصيل
  const totalDue = subscriberInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = subscriberPayments.reduce((sum, pay) => sum + pay.amount, 0);
  const collectionRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;
  
  // الدرجة النهائية (مرجحة)
  return Math.round(onTimeRate * 0.6 + collectionRate * 0.4);
};

/**
 * تقييم خطر إلغاء الاشتراك
 */
export const assessChurnRisk = (
  subscriber: any,
  payments: any[],
  maintenanceTickets: any[]
): 'low' | 'medium' | 'high' => {
  let riskScore = 0;
  
  // عامل 1: عدم الدفع لفترة طويلة
  const recentPayments = payments.filter(p => {
    const paymentDate = new Date(p.payment_date);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return p.subscriber_id === subscriber.id && paymentDate >= threeMonthsAgo;
  });
  
  if (recentPayments.length === 0) riskScore += 40;
  else if (recentPayments.length === 1) riskScore += 20;
  
  // عامل 2: الرصيد السلبي
  if (subscriber.balance < 0) {
    const balanceRatio = Math.abs(subscriber.balance) / 100000; // نسبة للدينار العراقي
    riskScore += Math.min(30, balanceRatio * 10);
  }
  
  // عامل 3: تذاكر صيانة غير محلولة
  const unresolvedTickets = maintenanceTickets.filter(
    t => t.subscriber_id === subscriber.id && t.status !== 'resolved'
  );
  riskScore += unresolvedTickets.length * 5;
  
  // عامل 4: عدم وجود اتصال حديث
  const accountAge = new Date().getTime() - new Date(subscriber.created_at).getTime();
  const monthsSinceCreation = accountAge / (1000 * 60 * 60 * 24 * 30);
  
  if (monthsSinceCreation > 6 && recentPayments.length === 0) {
    riskScore += 20;
  }
  
  if (riskScore >= 60) return 'high';
  if (riskScore >= 30) return 'medium';
  return 'low';
};

/**
 * حساب مستوى التفاعل
 */
export const calculateEngagementLevel = (
  subscriber: any,
  payments: any[],
  maintenanceTickets: any[]
): number => {
  let engagementScore = 0;
  
  // عدد المدفوعات في آخر 6 أشهر
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const recentPayments = payments.filter(p => 
    p.subscriber_id === subscriber.id && 
    new Date(p.payment_date) >= sixMonthsAgo
  ).length;
  
  engagementScore += Math.min(50, recentPayments * 8);
  
  // عدد طلبات الصيانة (يدل على استخدام الخدمة)
  const recentTickets = maintenanceTickets.filter(t =>
    t.subscriber_id === subscriber.id &&
    new Date(t.created_at) >= sixMonthsAgo
  ).length;
  
  engagementScore += Math.min(30, recentTickets * 10);
  
  // الانتظام في الدفع
  if (recentPayments >= 5) engagementScore += 20;
  
  return Math.min(100, engagementScore);
};

/**
 * التنبؤ بالقيمة الدائمة للمشترك (CLV)
 */
export const predictLifetimeValue = (
  subscriber: any,
  payments: any[]
): number => {
  const subscriberPayments = payments.filter(p => p.subscriber_id === subscriber.id);
  
  if (subscriberPayments.length === 0) return 0;
  
  // حساب متوسط الدفع الشهري
  const totalPaid = subscriberPayments.reduce((sum, p) => sum + p.amount, 0);
  const accountAge = new Date().getTime() - new Date(subscriber.created_at).getTime();
  const monthsActive = Math.max(1, accountAge / (1000 * 60 * 60 * 24 * 30));
  
  const avgMonthlyPayment = totalPaid / monthsActive;
  
  // افتراض متوسط عمر العميل 24 شهراً (قابل للتعديل)
  const estimatedLifetimeMonths = 24;
  
  return Math.round(avgMonthlyPayment * estimatedLifetimeMonths);
};

/**
 * تحليل شامل لجميع المشتركين
 */
export const analyzeAllSubscribers = (
  subscribers: any[],
  payments: any[],
  invoices: any[],
  maintenanceTickets: any[]
): SubscriberBehavior[] => {
  
  return subscribers.map(subscriber => ({
    subscriber_id: subscriber.id,
    payment_score: calculatePaymentScore(subscriber, payments, invoices),
    churn_risk: assessChurnRisk(subscriber, payments, maintenanceTickets),
    engagement_level: calculateEngagementLevel(subscriber, payments, maintenanceTickets),
    predicted_lifetime_value: predictLifetimeValue(subscriber, payments)
  }));
};

/**
 * اقتراحات لتحسين الاحتفاظ بالمشتركين
 */
export const generateRetentionStrategies = (
  analysis: SubscriberBehavior[]
): Array<{ subscriber_id: string; strategy: string; priority: 'low' | 'medium' | 'high' }> => {
  
  return analysis
    .filter(a => a.churn_risk === 'high' || a.payment_score < 50)
    .map(a => {
      let strategy = '';
      let priority: 'low' | 'medium' | 'high' = 'medium';
      
      if (a.churn_risk === 'high' && a.payment_score < 30) {
        strategy = 'عرض خصم 20% لمدة 3 أشهر + مكالمة شخصية';
        priority = 'high';
      } else if (a.churn_risk === 'high') {
        strategy = 'اتصال شخصي لفهم المشاكل + عرض خطة دفع مرنة';
        priority = 'high';
      } else if (a.payment_score < 50) {
        strategy = 'إرسال تذكير ودي + عرض خدمة عملاء مميزة';
        priority = 'medium';
      }
      
      return {
        subscriber_id: a.subscriber_id,
        strategy,
        priority
      };
    });
};
