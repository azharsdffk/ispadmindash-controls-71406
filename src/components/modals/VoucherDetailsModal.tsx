import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, Currency } from "@/lib/currency";
import { FileText, Calendar, DollarSign, User, Building, StickyNote, UserCircle, Phone, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VoucherDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voucher: {
    id: string;
    voucher_number: string;
    voucher_type: "income" | "expense";
    amount: number;
    currency?: Currency;
    account?: string;
    expense_type?: string;
    description?: string;
    created_at: string;
    created_by?: string;
  } | null;
}

export const VoucherDetailsModal = ({ open, onOpenChange, voucher }: VoucherDetailsModalProps) => {
  const [creatorInfo, setCreatorInfo] = useState<{ full_name: string; phone: string | null } | null>(null);

  useEffect(() => {
    const fetchCreator = async () => {
      if (voucher?.created_by) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", voucher.created_by)
          .single();
        setCreatorInfo(data);
      } else {
        setCreatorInfo(null);
      }
    };
    if (open && voucher) {
      fetchCreator();
    }
  }, [open, voucher]);

  const handlePrint = () => {
    if (!voucher) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>سند ${voucher.voucher_type === 'income' ? 'قبض' : 'صرف'} - ${voucher.voucher_number}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; background: #fff; }
              .voucher-container { max-width: 600px; margin: 0 auto; border: 2px solid #1e3a5f; border-radius: 12px; overflow: hidden; }
              .voucher-header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: white; padding: 24px; text-align: center; }
              .voucher-header h1 { font-size: 24px; margin-bottom: 8px; }
              .voucher-header .number { font-size: 18px; opacity: 0.9; }
              .voucher-body { padding: 24px; }
              .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px dashed #e5e7eb; }
              .info-row:last-child { border-bottom: none; }
              .info-label { color: #6b7280; font-size: 14px; }
              .info-value { font-weight: 600; color: #1f2937; }
              .amount-section { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 16px 0; text-align: center; }
              .amount-section .label { color: #6b7280; font-size: 14px; margin-bottom: 8px; }
              .amount-section .value { font-size: 28px; font-weight: bold; color: #1e3a5f; }
              .voucher-footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #6b7280; }
              .signature-section { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; }
              .signature-box { text-align: center; width: 45%; }
              .signature-line { border-top: 1px solid #1e3a5f; margin-top: 50px; padding-top: 8px; }
            </style>
          </head>
          <body>
            <div class="voucher-container">
              <div class="voucher-header">
                <h1>${voucher.voucher_type === 'income' ? 'سند قبض' : 'سند صرف'}</h1>
                <div class="number">رقم السند: ${voucher.voucher_number}</div>
              </div>
              <div class="voucher-body">
                <div class="amount-section">
                  <div class="label">المبلغ</div>
                  <div class="value">${formatCurrency(Number(voucher.amount), voucher.currency || "IQD")}</div>
                </div>
                ${voucher.account ? `<div class="info-row"><span class="info-label">الحساب</span><span class="info-value">${voucher.account}</span></div>` : ''}
                ${voucher.expense_type ? `<div class="info-row"><span class="info-label">نوع المصروف</span><span class="info-value">${voucher.expense_type}</span></div>` : ''}
                ${voucher.description ? `<div class="info-row"><span class="info-label">الوصف</span><span class="info-value">${voucher.description}</span></div>` : ''}
                ${creatorInfo ? `<div class="info-row"><span class="info-label">منشئ السند</span><span class="info-value">${creatorInfo.full_name}${creatorInfo.phone ? ' - ' + creatorInfo.phone : ''}</span></div>` : ''}
                <div class="info-row">
                  <span class="info-label">التاريخ</span>
                  <span class="info-value">${new Date(voucher.created_at).toLocaleDateString("ar-IQ", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div class="signature-section">
                  <div class="signature-box">
                    <div class="signature-line">المستلم</div>
                  </div>
                  <div class="signature-box">
                    <div class="signature-line">المسلم</div>
                  </div>
                </div>
              </div>
              <div class="voucher-footer">
                تم الطباعة بتاريخ: ${new Date().toLocaleDateString("ar-IQ")} - ${new Date().toLocaleTimeString("ar-IQ")}
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!voucher) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              تفاصيل السند
            </div>
            <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              طباعة
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Voucher Number & Type */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">رقم السند</p>
              <p className="font-semibold">{voucher.voucher_number}</p>
            </div>
            <Badge variant={voucher.voucher_type === "income" ? "default" : "destructive"} className="text-sm">
              {voucher.voucher_type === "income" ? "سند قبض" : "سند صرف"}
            </Badge>
          </div>

          {/* Amount */}
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <DollarSign className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">المبلغ</p>
              <p className="font-bold text-lg">
                {formatCurrency(Number(voucher.amount), voucher.currency || "IQD")}
              </p>
            </div>
          </div>

          {/* Account */}
          {voucher.account && (
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Building className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">الحساب</p>
                <p className="font-medium">{voucher.account}</p>
              </div>
            </div>
          )}

          {/* Expense Type */}
          {voucher.expense_type && (
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <User className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">نوع المصروف</p>
                <p className="font-medium">{voucher.expense_type}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {voucher.description && (
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <StickyNote className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">الوصف</p>
                <p className="font-medium">{voucher.description}</p>
              </div>
            </div>
          )}

          {/* Creator Info */}
          {creatorInfo && (
            <div className="p-3 border rounded-lg bg-muted/30 space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">منشئ السند</p>
              <div className="flex items-center gap-3">
                <UserCircle className="h-5 w-5 text-primary" />
                <span className="font-medium">{creatorInfo.full_name}</span>
              </div>
              {creatorInfo.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <span className="font-medium" dir="ltr">{creatorInfo.phone}</span>
                </div>
              )}
            </div>
          )}

          {/* Date */}
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
              <p className="font-medium">
                {new Date(voucher.created_at).toLocaleDateString("ar-IQ", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};