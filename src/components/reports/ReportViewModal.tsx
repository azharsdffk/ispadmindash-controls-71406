import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  FileText, 
  CreditCard, 
  Wrench, 
  TrendingUp, 
  Calendar,
  Download,
  Printer,
  X
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ReportViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string;
  reportTitle: string;
  dateRange: { from: string; to: string };
}

export const ReportViewModal = ({ 
  open, 
  onOpenChange, 
  reportId, 
  reportTitle,
  dateRange 
}: ReportViewModalProps) => {
  
  const { data: subscribersData } = useQuery({
    queryKey: ['report-subscribers', dateRange],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscribers')
        .select('*')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: open && reportId === 'subscribers'
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['report-invoices', dateRange],
    queryFn: async () => {
      const { data } = await supabase
        .from('invoices')
        .select('*, subscribers(name)')
        .gte('issue_date', dateRange.from)
        .lte('issue_date', dateRange.to)
        .order('issue_date', { ascending: false });
      return data || [];
    },
    enabled: open && reportId === 'invoices'
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['report-payments', dateRange],
    queryFn: async () => {
      const { data } = await supabase
        .from('payments')
        .select('*, subscribers(name)')
        .gte('payment_date', dateRange.from)
        .lte('payment_date', dateRange.to)
        .order('payment_date', { ascending: false });
      return data || [];
    },
    enabled: open && reportId === 'payments'
  });

  const { data: ticketsData } = useQuery({
    queryKey: ['report-tickets', dateRange],
    queryFn: async () => {
      const { data } = await supabase
        .from('maintenance_tickets')
        .select('*, subscribers(name), technicians(name)')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: open && reportId === 'maintenance'
  });

  const { data: revenueData } = useQuery({
    queryKey: ['report-revenue', dateRange],
    queryFn: async () => {
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, currency, payment_method, payment_date')
        .gte('payment_date', dateRange.from)
        .lte('payment_date', dateRange.to);
      
      const { data: vouchers } = await supabase
        .from('vouchers')
        .select('amount, currency, voucher_type, created_at')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to);

      return { payments: payments || [], vouchers: vouchers || [] };
    },
    enabled: open && (reportId === 'revenue' || reportId === 'monthly')
  });

  const getIcon = () => {
    const icons: Record<string, React.ReactNode> = {
      subscribers: <Users className="h-6 w-6 text-blue-500" />,
      invoices: <FileText className="h-6 w-6 text-amber-500" />,
      payments: <CreditCard className="h-6 w-6 text-emerald-500" />,
      maintenance: <Wrench className="h-6 w-6 text-rose-500" />,
      revenue: <TrendingUp className="h-6 w-6 text-violet-500" />,
      monthly: <Calendar className="h-6 w-6 text-indigo-500" />,
    };
    return icons[reportId] || <FileText className="h-6 w-6" />;
  };

  const handlePrint = () => {
    window.print();
  };

  const renderContent = () => {
    switch (reportId) {
      case 'subscribers':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-500/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-500">{subscribersData?.length || 0}</p>
                <p className="text-sm text-muted-foreground">إجمالي المشتركين</p>
              </div>
              <div className="bg-emerald-500/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-emerald-500">
                  {subscribersData?.filter(s => s.balance && s.balance >= 0).length || 0}
                </p>
                <p className="text-sm text-muted-foreground">رصيد إيجابي</p>
              </div>
              <div className="bg-rose-500/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-rose-500">
                  {subscribersData?.filter(s => s.balance && s.balance < 0).length || 0}
                </p>
                <p className="text-sm text-muted-foreground">رصيد سلبي</p>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-right">الاسم</th>
                    <th className="p-3 text-right">الهاتف</th>
                    <th className="p-3 text-right">الباقة</th>
                    <th className="p-3 text-right">الرصيد</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribersData?.slice(0, 50).map((sub) => (
                    <tr key={sub.id} className="border-t">
                      <td className="p-3">{sub.name}</td>
                      <td className="p-3">{sub.phone}</td>
                      <td className="p-3">{sub.plan || '-'}</td>
                      <td className="p-3">{formatCurrency(sub.balance || 0, 'IQD')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'invoices':
        const totalInvoices = invoicesData?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
        const paidInvoices = invoicesData?.filter(inv => inv.status === 'paid') || [];
        const pendingInvoices = invoicesData?.filter(inv => inv.status === 'pending') || [];
        
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-amber-500/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-amber-500">{invoicesData?.length || 0}</p>
                <p className="text-sm text-muted-foreground">إجمالي الفواتير</p>
              </div>
              <div className="bg-emerald-500/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-emerald-500">{paidInvoices.length}</p>
                <p className="text-sm text-muted-foreground">مدفوعة</p>
              </div>
              <div className="bg-rose-500/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-rose-500">{pendingInvoices.length}</p>
                <p className="text-sm text-muted-foreground">معلقة</p>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-right">رقم الفاتورة</th>
                    <th className="p-3 text-right">المشترك</th>
                    <th className="p-3 text-right">المبلغ</th>
                    <th className="p-3 text-right">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {invoicesData?.slice(0, 50).map((inv) => (
                    <tr key={inv.id} className="border-t">
                      <td className="p-3">{inv.invoice_number}</td>
                      <td className="p-3">{inv.subscribers?.name || '-'}</td>
                      <td className="p-3">{formatCurrency(inv.amount, inv.currency || 'IQD')}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' :
                          inv.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-rose-500/10 text-rose-500'
                        }`}>
                          {inv.status === 'paid' ? 'مدفوعة' : inv.status === 'pending' ? 'معلقة' : 'ملغية'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'payments':
        const totalPayments = paymentsData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-emerald-500/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-emerald-500">{paymentsData?.length || 0}</p>
                <p className="text-sm text-muted-foreground">عدد المدفوعات</p>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-500">{formatCurrency(totalPayments, 'IQD')}</p>
                <p className="text-sm text-muted-foreground">إجمالي المدفوعات</p>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-right">المشترك</th>
                    <th className="p-3 text-right">المبلغ</th>
                    <th className="p-3 text-right">طريقة الدفع</th>
                    <th className="p-3 text-right">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsData?.slice(0, 50).map((payment) => (
                    <tr key={payment.id} className="border-t">
                      <td className="p-3">{payment.subscribers?.name || '-'}</td>
                      <td className="p-3">{formatCurrency(payment.amount, payment.currency || 'IQD')}</td>
                      <td className="p-3">
                        {payment.payment_method === 'cash' ? 'نقدي' :
                         payment.payment_method === 'bank_transfer' ? 'تحويل بنكي' :
                         payment.payment_method === 'card' ? 'بطاقة' : 'أخرى'}
                      </td>
                      <td className="p-3">{format(new Date(payment.payment_date), 'yyyy/MM/dd', { locale: ar })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'maintenance':
        const openTickets = ticketsData?.filter(t => t.status === 'open') || [];
        const resolvedTickets = ticketsData?.filter(t => t.status === 'resolved' || t.status === 'closed') || [];
        
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-rose-500/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-rose-500">{ticketsData?.length || 0}</p>
                <p className="text-sm text-muted-foreground">إجمالي التذاكر</p>
              </div>
              <div className="bg-amber-500/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-amber-500">{openTickets.length}</p>
                <p className="text-sm text-muted-foreground">مفتوحة</p>
              </div>
              <div className="bg-emerald-500/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-emerald-500">{resolvedTickets.length}</p>
                <p className="text-sm text-muted-foreground">محلولة</p>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-right">رقم التذكرة</th>
                    <th className="p-3 text-right">المشترك</th>
                    <th className="p-3 text-right">الفني</th>
                    <th className="p-3 text-right">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketsData?.slice(0, 50).map((ticket) => (
                    <tr key={ticket.id} className="border-t">
                      <td className="p-3">{ticket.ticket_number}</td>
                      <td className="p-3">{ticket.subscribers?.name || '-'}</td>
                      <td className="p-3">{ticket.technicians?.name || 'غير معين'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          ticket.status === 'open' ? 'bg-amber-500/10 text-amber-500' :
                          ticket.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {ticket.status === 'open' ? 'مفتوحة' : 
                           ticket.status === 'in_progress' ? 'قيد التنفيذ' : 'محلولة'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'revenue':
      case 'monthly':
        const totalRevenue = revenueData?.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const totalExpenses = revenueData?.vouchers
          ?.filter(v => v.voucher_type === 'expense')
          ?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;
        const totalIncome = revenueData?.vouchers
          ?.filter(v => v.voucher_type === 'receipt')
          ?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;
        
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-emerald-500/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-emerald-500">{formatCurrency(totalRevenue + totalIncome, 'IQD')}</p>
                <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
              </div>
              <div className="bg-rose-500/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-rose-500">{formatCurrency(totalExpenses, 'IQD')}</p>
                <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-500">
                  {formatCurrency((totalRevenue + totalIncome) - totalExpenses, 'IQD')}
                </p>
                <p className="text-sm text-muted-foreground">صافي الربح</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-emerald-500">المدفوعات ({revenueData?.payments?.length || 0})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {revenueData?.payments?.slice(0, 10).map((p, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{format(new Date(p.payment_date), 'yyyy/MM/dd')}</span>
                      <span className="text-emerald-500">{formatCurrency(p.amount, p.currency || 'IQD')}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-rose-500">المصروفات ({revenueData?.vouchers?.filter(v => v.voucher_type === 'expense').length || 0})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {revenueData?.vouchers?.filter(v => v.voucher_type === 'expense').slice(0, 10).map((v, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{format(new Date(v.created_at), 'yyyy/MM/dd')}</span>
                      <span className="text-rose-500">{formatCurrency(v.amount, v.currency || 'IQD')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <p className="text-center text-muted-foreground py-8">لا توجد بيانات متاحة</p>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getIcon()}
            <span>{reportTitle}</span>
            <span className="text-sm font-normal text-muted-foreground mr-auto">
              {dateRange.from} - {dateRange.to}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          {renderContent()}
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 ml-2" />
            طباعة
          </Button>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 ml-2" />
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
