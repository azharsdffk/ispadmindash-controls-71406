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
import { toast } from "sonner";

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReceiptModal = ({ open, onOpenChange }: ReceiptModalProps) => {
  const [subscriberId, setSubscriberId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [discount, setDiscount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subscriberId || !amount || !paymentMethod) {
      toast.error("الرجاء ملء جميع الحقول المطلوبة");
      return;
    }

    setLoading(true);
    
    // محاكاة عملية الحفظ
    setTimeout(() => {
      toast.success("تم إصدار سند القبض بنجاح");
      onOpenChange(false);
      setLoading(false);
      // إعادة تعيين النموذج
      setSubscriberId("");
      setAmount("");
      setPaymentMethod("");
      setDiscount("");
      setNotes("");
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl">إصدار سند قبض</DialogTitle>
          <DialogDescription>إصدار سند قبض لمشترك</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="subscriber">المشترك *</Label>
            <Select value={subscriberId} onValueChange={setSubscriberId}>
              <SelectTrigger id="subscriber">
                <SelectValue placeholder="اختر المشترك" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">أحمد محمد - 0501234567</SelectItem>
                <SelectItem value="2">فاطمة علي - 0507654321</SelectItem>
                <SelectItem value="3">محمد حسن - 0509876543</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">المبلغ (ريال) *</Label>
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
              <Label htmlFor="discount">الخصم (ريال)</Label>
              <Input
                id="discount"
                type="number"
                placeholder="0.00"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">طريقة الدفع *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="اختر طريقة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">نقداً</SelectItem>
                <SelectItem value="bank">تحويل بنكي</SelectItem>
                <SelectItem value="card">بطاقة ائتمان</SelectItem>
                <SelectItem value="online">دفع إلكتروني</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Input
              id="notes"
              placeholder="ملاحظات إضافية..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {amount && discount && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span>المبلغ الأصلي:</span>
                <span className="font-medium">{amount} ريال</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span>الخصم:</span>
                <span className="font-medium text-destructive">-{discount} ريال</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>الصافي:</span>
                <span className="text-primary">{(parseFloat(amount) - parseFloat(discount)).toFixed(2)} ريال</span>
              </div>
            </div>
          )}

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
