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
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

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
      
      const netAmount = validatedData.amount - validatedData.discount;
      
      // Generate invoice number
      const invoiceNumber = `INV-${format(new Date(), "yyyyMM")}-${Date.now().toString().slice(-6)}`;
      
      const { error } = await supabase.from("invoices").insert([{
        invoice_number: invoiceNumber,
        subscriber_id: validatedData.subscriber_id,
        amount: validatedData.amount,
        discount: validatedData.discount,
        net_amount: netAmount,
        due_date: format(validatedData.due_date, "yyyy-MM-dd"),
        issue_date: format(new Date(), "yyyy-MM-dd"),
        currency: validatedData.currency,
        status: "pending" as const,
        created_by: user?.id,
      }]);

      if (error) throw error;

      toast.success("تم إصدار الفاتورة بنجاح");
      onOpenChange(false);
      setFormData({ subscriber_id: "", amount: "", discount: "0", currency: "IQD" });
      setDueDate(undefined);
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
