import { useState } from "react";
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

interface IssueInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const IssueInvoiceModal = ({ open, onOpenChange }: IssueInvoiceModalProps) => {
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    subscriber: "",
    amount: "",
    discount: "0",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subscriber || !formData.amount || !date) {
      toast.error("الرجاء ملء جميع الحقول المطلوبة");
      return;
    }
    toast.success("تم إصدار الفاتورة بنجاح");
    onOpenChange(false);
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
              value={formData.subscriber}
              onChange={(e) => setFormData({ ...formData, subscriber: e.target.value })}
            >
              <option value="">اختر المشترك</option>
              <option value="1">أحمد محمد - 0501234567</option>
              <option value="2">فاطمة علي - 0507654321</option>
              <option value="3">محمد خالد - 0509876543</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">المبلغ (ريال) *</Label>
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
            <Label htmlFor="discount">الخصم (ريال)</Label>
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
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: ar }) : "اختر التاريخ"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
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
