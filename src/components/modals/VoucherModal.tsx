import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Currency, getCurrencyLabel } from "@/lib/currency";

interface VoucherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VoucherModal = ({ open, onOpenChange }: VoucherModalProps) => {
  const [expenseType, setExpenseType] = useState("");
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState<Currency>("IQD");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!expenseType || !amount || !account) {
      toast.error("الرجاء ملء جميع الحقول المطلوبة");
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      toast.success("تم إصدار سند الصرف بنجاح");
      onOpenChange(false);
      setLoading(false);
      setExpenseType("");
      setAmount("");
      setAccount("");
      setDescription("");
      setCurrency("IQD");
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl">إصدار سند صرف</DialogTitle>
          <DialogDescription>تسجيل عملية صرف جديدة</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="expense-type">نوع المصروف *</Label>
            <Select value={expenseType} onValueChange={setExpenseType}>
              <SelectTrigger id="expense-type">
                <SelectValue placeholder="اختر نوع المصروف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maintenance">صيانة</SelectItem>
                <SelectItem value="equipment">معدات</SelectItem>
                <SelectItem value="salaries">رواتب</SelectItem>
                <SelectItem value="utilities">مرافق</SelectItem>
                <SelectItem value="rent">إيجار</SelectItem>
                <SelectItem value="marketing">تسويق</SelectItem>
                <SelectItem value="other">أخرى</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">العملة *</Label>
            <Select value={currency} onValueChange={(val) => setCurrency(val as Currency)}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IQD">{getCurrencyLabel("IQD")}</SelectItem>
                <SelectItem value="USD">{getCurrencyLabel("USD")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">المبلغ *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account">الحساب *</Label>
            <Select value={account} onValueChange={setAccount}>
              <SelectTrigger id="account">
                <SelectValue placeholder="اختر الحساب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">الصندوق النقدي</SelectItem>
                <SelectItem value="bank1">بنك الراجحي</SelectItem>
                <SelectItem value="bank2">بنك الأهلي</SelectItem>
                <SelectItem value="bank3">بنك سامبا</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">الوصف *</Label>
            <Textarea
              id="description"
              placeholder="تفاصيل المصروف..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الحفظ..." : "إصدار السند"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
