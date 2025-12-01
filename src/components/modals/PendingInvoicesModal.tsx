import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, FileText, Calendar, User } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  net_amount: number | null;
  due_date: string;
  status: string;
  currency: string;
  subscriber: {
    name: string;
    phone: string;
  } | null;
}

interface PendingInvoicesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PendingInvoicesModal = ({ open, onOpenChange }: PendingInvoicesModalProps) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (open) {
      fetchPendingInvoices();
    }
  }, [open]);

  const fetchPendingInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          amount,
          net_amount,
          due_date,
          status,
          currency,
          subscriber:subscribers(name, phone)
        `)
        .in('status', ['pending', 'overdue'])
        .order('due_date', { ascending: true });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.subscriber?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.subscriber?.phone.includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">معلقة</Badge>;
      case 'overdue':
        return <Badge variant="destructive">متأخرة</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.net_amount || inv.amount), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-6 w-6 text-warning" />
            الفواتير المعلقة
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث برقم الفاتورة أو اسم المشترك..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg border border-warning/20">
            <span className="text-sm font-medium">إجمالي المبالغ المعلقة:</span>
            <span className="text-lg font-bold text-warning">{formatCurrency(totalAmount, 'IQD')}</span>
          </div>

          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد فواتير معلقة
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{invoice.invoice_number}</span>
                          {getStatusBadge(invoice.status)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          {invoice.subscriber?.name || 'غير محدد'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          تاريخ الاستحقاق: {new Date(invoice.due_date).toLocaleDateString('ar-IQ')}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-lg font-bold text-foreground">
                          {formatCurrency(invoice.net_amount || invoice.amount, invoice.currency as 'IQD' | 'USD')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="text-sm text-muted-foreground text-center">
            عدد الفواتير: {filteredInvoices.length}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
