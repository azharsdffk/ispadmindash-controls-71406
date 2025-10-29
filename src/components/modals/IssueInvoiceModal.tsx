import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Tag, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";

interface IssueInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const invoiceSchema = z.object({
  subscriber_id: z.string().uuid("يجب اختيار مشترك"),
  amount: z.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  discount: z.number().min(0, "الخصم لا يمكن أن يكون سالباً"),
  due_date: z.date(),
  currency: z.enum(["IQD", "USD"]),
});

export const IssueInvoiceModal = ({ open, onOpenChange, onSuccess }: IssueInvoiceModalProps) => {
  const [dueDate, setDueDate] = useState<Date>();
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [formData, setFormData] = useState({
    subscriber_id: "",
    amount: "",
    discount: "0",
    currency: "IQD" as "IQD" | "USD",
  });

  useEffect(() => {
    if (open) {
      loadSubscribers();
    }
  }, [open]);

  const loadSubscribers = async () => {
    const { data } = await supabase
      .from("subscribers")
      .select("id, name, phone")
      .order("name");
    if (data) setSubscribers(data);
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("الرجاء إدخال رمز الكوبون");
      return;
    }

    if (!formData.subscriber_id) {
      toast.error("الرجاء اختيار المشترك أولاً");
      return;
    }

    if (!formData.amount) {
      toast.error("الرجاء إدخال المبلغ أولاً");
      return;
    }

    try {
      const { data, error } = await supabase.rpc('apply_discount_coupon', {
        p_coupon_code: couponCode,
        p_subscriber_id: formData.subscriber_id,
        p_invoice_amount: parseFloat(formData.amount),
      });

      if (error) throw error;

      const result = data[0];
      if (result.success) {
        setCouponDiscount(result.discount_amount);
        
        // Get coupon details
        const { data: couponData } = await supabase
          .from('discount_coupons')
          .select('*')
          .eq('code', couponCode)
          .single();
        
        setAppliedCoupon(couponData);
        toast.success(result.message);
      } else {
        toast.error(result.message);
        setCouponDiscount(0);
        setAppliedCoupon(null);
      }
    } catch (error: any) {
      toast.error("فشل التحقق من الكوبون");
      setCouponDiscount(0);
      setAppliedCoupon(null);
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
    setCouponDiscount(0);
    toast.info("تم إزالة الكوبون");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!dueDate) {
        toast.error("الرجاء اختيار تاريخ الاستحقاق");
        return;
      }

      const validatedData = invoiceSchema.parse({
        subscriber_id: formData.subscriber_id,
        amount: parseFloat(formData.amount),
        discount: parseFloat(formData.discount),
        due_date: dueDate,
        currency: formData.currency,
      });

      const { data: { user } } = await supabase.auth.getUser();
      
      const totalDiscount = validatedData.discount + couponDiscount;
      const netAmount = validatedData.amount - totalDiscount;
      
      // Generate invoice number
      const invoiceNumber = `INV-${format(new Date(), "yyyyMM")}-${Date.now().toString().slice(-6)}`;
      
      const { data: invoiceData, error } = await supabase.from("invoices").insert([{
        invoice_number: invoiceNumber,
        subscriber_id: validatedData.subscriber_id,
        amount: validatedData.amount,
        discount: totalDiscount,
        net_amount: netAmount,
        due_date: format(validatedData.due_date, "yyyy-MM-dd"),
        issue_date: format(new Date(), "yyyy-MM-dd"),
        currency: validatedData.currency,
        status: "pending" as const,
        created_by: user?.id,
      }]).select().single();

      if (error) throw error;

      // Record coupon usage if applied
      if (appliedCoupon && invoiceData) {
        await supabase.from('coupon_usage').insert({
          coupon_id: appliedCoupon.id,
          subscriber_id: validatedData.subscriber_id,
          invoice_id: invoiceData.id,
          discount_amount: couponDiscount,
          used_by: user?.id,
        });

        // Update coupon usage count
        await supabase
          .from('discount_coupons')
          .update({ usage_count: appliedCoupon.usage_count + 1 })
          .eq('id', appliedCoupon.id);
      }

      toast.success("تم إصدار الفاتورة بنجاح");
      onOpenChange(false);
      setFormData({ subscriber_id: "", amount: "", discount: "0", currency: "IQD" });
      setDueDate(undefined);
      setCouponCode("");
      setAppliedCoupon(null);
      setCouponDiscount(0);
      onSuccess?.();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
      } else {
        toast.error("فشل إصدار الفاتورة");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>إصدار فاتورة جديدة</DialogTitle>
          <DialogDescription>أدخل تفاصيل الفاتورة</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subscriber">المشترك *</Label>
            <select
              id="subscriber"
              required
              className="w-full px-3 py-2 border rounded-md bg-background"
              value={formData.subscriber_id}
              onChange={(e) => setFormData({ ...formData, subscriber_id: e.target.value })}
            >
              <option value="">اختر المشترك</option>
              {subscribers.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} - {sub.phone}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">العملة *</Label>
            <select
              id="currency"
              className="w-full px-3 py-2 border rounded-md bg-background"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value as "IQD" | "USD" })}
            >
              <option value="IQD">دينار عراقي (ع.د)</option>
              <option value="USD">دولار أمريكي ($)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">المبلغ *</Label>
            <Input
              id="amount"
              required
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount">الخصم</Label>
            <Input
              id="discount"
              type="number"
              min="0"
              step="0.01"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coupon">كوبون الخصم (اختياري)</Label>
            {appliedCoupon ? (
              <div className="flex items-center gap-2 p-3 border rounded-md bg-green-50 dark:bg-green-950">
                <Check className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    {appliedCoupon.code}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    خصم: {couponDiscount} {formData.currency}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeCoupon}
                >
                  إزالة
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  id="coupon"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="أدخل رمز الكوبون"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={applyCoupon}
                  disabled={!couponCode.trim()}
                >
                  <Tag className="h-4 w-4 ml-2" />
                  تطبيق
                </Button>
              </div>
            )}
          </div>

          {(parseFloat(formData.amount) > 0 || couponDiscount > 0) && (
            <div className="p-4 border rounded-md bg-muted/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span>المبلغ الأساسي:</span>
                <span>{parseFloat(formData.amount || "0").toFixed(2)} {formData.currency}</span>
              </div>
              {parseFloat(formData.discount) > 0 && (
                <div className="flex justify-between text-sm text-orange-600">
                  <span>خصم يدوي:</span>
                  <span>- {parseFloat(formData.discount).toFixed(2)} {formData.currency}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>خصم الكوبون:</span>
                  <span>- {couponDiscount.toFixed(2)} {formData.currency}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>الإجمالي:</span>
                <span>
                  {(parseFloat(formData.amount || "0") - parseFloat(formData.discount || "0") - couponDiscount).toFixed(2)} {formData.currency}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>تاريخ الاستحقاق *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-right font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit">إصدار الفاتورة</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
