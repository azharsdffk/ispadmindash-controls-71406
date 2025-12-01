import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, Currency } from "@/lib/currency";
import { FileText, Calendar, DollarSign, User, Building, StickyNote } from "lucide-react";

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
  if (!voucher) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            تفاصيل السند
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
