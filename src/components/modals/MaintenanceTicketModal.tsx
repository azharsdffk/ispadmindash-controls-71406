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

interface MaintenanceTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MaintenanceTicketModal = ({ open, onOpenChange }: MaintenanceTicketModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    subscriber: "",
    priority: "medium",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.subscriber) {
      toast.error("الرجاء ملء الحقول المطلوبة");
      return;
    }
    toast.success("تم فتح تذكرة الصيانة بنجاح");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>فتح تذكرة صيانة جديدة</DialogTitle>
          <DialogDescription>أدخل تفاصيل المشكلة</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان المشكلة *</Label>
            <Input
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="مثال: انقطاع الإنترنت"
            />
          </div>

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
            <Label htmlFor="priority">الأولوية</Label>
            <select
              id="priority"
              className="w-full px-3 py-2 border rounded-md bg-background"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="low">منخفضة</option>
              <option value="medium">متوسطة</option>
              <option value="high">عالية</option>
              <option value="urgent">عاجلة</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <textarea
              id="description"
              className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-background"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="اشرح المشكلة بالتفصيل..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit">فتح التذكرة</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
