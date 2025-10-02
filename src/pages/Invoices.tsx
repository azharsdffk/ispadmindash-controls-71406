import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, FilePlus, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { IssueInvoiceModal } from "@/components/modals/IssueInvoiceModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency, Currency } from "@/lib/currency";

type Invoice = {
  id: string;
  invoice_number: string;
  subscriber_id: string;
  amount: number;
  currency: Currency;
  status: string;
  issue_date: string;
  due_date: string;
  subscribers?: {
    name: string;
  };
};

const Invoices = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [issueInvoiceOpen, setIssueInvoiceOpen] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          subscribers (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error: any) {
      toast.error("فشل تحميل الفواتير: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      paid: { label: 'مدفوعة', variant: 'default' },
      pending: { label: 'معلقة', variant: 'secondary' },
      overdue: { label: 'متأخرة', variant: 'destructive' },
      cancelled: { label: 'ملغاة', variant: 'outline' },
    };
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1 w-full">
        <AppSidebar />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">الفواتير</h1>
              </div>
              <Button onClick={() => setIssueInvoiceOpen(true)}>
                <FilePlus className="h-5 w-5 ml-2" />
                فاتورة جديدة
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>قائمة الفواتير ({invoices.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">جاري التحميل...</div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا يوجد فواتير حالياً. أضف فاتورة جديدة للبدء.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الفاتورة</TableHead>
                        <TableHead>المشترك</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>تاريخ الإصدار</TableHead>
                        <TableHead>تاريخ الاستحقاق</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>{invoice.subscribers?.name}</TableCell>
                          <TableCell>{formatCurrency(invoice.amount, invoice.currency || "IQD")}</TableCell>
                          <TableCell>{new Date(invoice.issue_date).toLocaleDateString('ar-IQ')}</TableCell>
                          <TableCell>{new Date(invoice.due_date).toLocaleDateString('ar-IQ')}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <IssueInvoiceModal 
        open={issueInvoiceOpen} 
        onOpenChange={setIssueInvoiceOpen}
        onSuccess={fetchInvoices}
      />
    </div>
  );
};

export default Invoices;
