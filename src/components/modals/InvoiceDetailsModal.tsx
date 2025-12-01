import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, Currency } from "@/lib/currency";
import { FileText, User, Calendar, CreditCard, MapPin, Phone, Mail, Package } from "lucide-react";

interface InvoiceDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    invoice_number: string;
    subscriber_id: string;
    amount: number;
    discount?: number;
    net_amount?: number;
    currency: Currency;
    status: string;
    issue_date: string;
    due_date: string;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    subscribers?: {
      id: string;
      name: string;
      phone: string;
      phone_secondary?: string;
      username?: string;
      email?: string;
      address?: string;
      plan?: string;
      balance: number;
      status_comment?: string;
      address_notes?: string;
      latitude?: number;
      longitude?: number;
      created_at?: string;
      updated_at?: string;
      created_by?: string;
    };
  } | null;
}

export const InvoiceDetailsModal = ({ open, onOpenChange, invoice }: InvoiceDetailsModalProps) => {
  if (!invoice) return null;

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

  const subscriber = invoice.subscribers;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            تفاصيل الفاتورة #{invoice.invoice_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              معلومات الفاتورة
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">رقم الفاتورة:</span>
                <p className="font-medium">{invoice.invoice_number}</p>
              </div>
              <div>
                <span className="text-muted-foreground">الحالة:</span>
                <p className="mt-1">{getStatusBadge(invoice.status)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">المبلغ:</span>
                <p className="font-medium text-lg">{formatCurrency(invoice.amount, invoice.currency || "IQD")}</p>
              </div>
              {invoice.discount && invoice.discount > 0 && (
                <div>
                  <span className="text-muted-foreground">الخصم:</span>
                  <p className="font-medium text-green-600">{formatCurrency(invoice.discount, invoice.currency || "IQD")}</p>
                </div>
              )}
              {invoice.net_amount && (
                <div>
                  <span className="text-muted-foreground">المبلغ الصافي:</span>
                  <p className="font-medium">{formatCurrency(invoice.net_amount, invoice.currency || "IQD")}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">العملة:</span>
                <p className="font-medium">{invoice.currency || "IQD"}</p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              التواريخ
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">تاريخ الإصدار:</span>
                <p className="font-medium">{new Date(invoice.issue_date).toLocaleDateString('ar-IQ')}</p>
              </div>
              <div>
                <span className="text-muted-foreground">تاريخ الاستحقاق:</span>
                <p className="font-medium">{new Date(invoice.due_date).toLocaleDateString('ar-IQ')}</p>
              </div>
              {invoice.created_at && (
                <div>
                  <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                  <p className="font-medium">{new Date(invoice.created_at).toLocaleString('ar-IQ')}</p>
                </div>
              )}
              {invoice.updated_at && (
                <div>
                  <span className="text-muted-foreground">آخر تحديث:</span>
                  <p className="font-medium">{new Date(invoice.updated_at).toLocaleString('ar-IQ')}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Subscriber Info */}
          {subscriber && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                معلومات المشترك
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">الاسم:</span>
                  <p className="font-medium">{subscriber.name}</p>
                </div>
                {subscriber.username && (
                  <div>
                    <span className="text-muted-foreground">اسم المستخدم:</span>
                    <p className="font-medium">{subscriber.username}</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">الهاتف:</span>
                  <p className="font-medium">{subscriber.phone}</p>
                </div>
                {subscriber.phone_secondary && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">هاتف ثانوي:</span>
                    <p className="font-medium">{subscriber.phone_secondary}</p>
                  </div>
                )}
                {subscriber.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">البريد:</span>
                    <p className="font-medium">{subscriber.email}</p>
                  </div>
                )}
                {subscriber.address && (
                  <div className="col-span-2 flex items-start gap-2">
                    <MapPin className="h-3 w-3 text-muted-foreground mt-1" />
                    <div>
                      <span className="text-muted-foreground">العنوان:</span>
                      <p className="font-medium">{subscriber.address}</p>
                    </div>
                  </div>
                )}
                {subscriber.plan && (
                  <div className="flex items-center gap-2">
                    <Package className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">الباقة:</span>
                    <p className="font-medium">{subscriber.plan}</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CreditCard className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">الرصيد:</span>
                  <p className={`font-medium ${subscriber.balance < 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {formatCurrency(subscriber.balance, invoice.currency || "IQD")}
                  </p>
                </div>
                {subscriber.status_comment && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">ملاحظة الحالة:</span>
                    <p className="font-medium">{subscriber.status_comment}</p>
                  </div>
                )}
              </div>

              {subscriber.latitude && subscriber.longitude && (
                <div className="mt-2">
                  <a
                    href={`https://www.google.com/maps?q=${subscriber.latitude},${subscriber.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm flex items-center gap-1"
                  >
                    <MapPin className="h-3 w-3" />
                    عرض الموقع على الخريطة
                  </a>
                </div>
              )}
            </div>
          )}

          {/* IDs */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-xs text-muted-foreground">
            <p>معرف الفاتورة: {invoice.id}</p>
            <p>معرف المشترك: {invoice.subscriber_id}</p>
            {invoice.created_by && <p>أنشئت بواسطة: {invoice.created_by}</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
