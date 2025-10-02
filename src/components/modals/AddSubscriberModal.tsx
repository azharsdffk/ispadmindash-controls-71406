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

interface AddSubscriberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddSubscriberModal = ({ open, onOpenChange }: AddSubscriberModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    plan: "basic",
    latitude: "",
    longitude: "",
    addressNotes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error("الرجاء ملء الحقول المطلوبة");
      return;
    }
    toast.success("تم إضافة المشترك بنجاح");
    onOpenChange(false);
    setFormData({ name: "", phone: "", email: "", address: "", plan: "basic", latitude: "", longitude: "", addressNotes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة مشترك جديد</DialogTitle>
          <DialogDescription>أدخل بيانات المشترك الجديد</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">الاسم *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="أدخل اسم المشترك"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف *</Label>
            <Input
              id="phone"
              required
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+966 50 000 0000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="example@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">العنوان</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="أدخل العنوان"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">الباقة</Label>
            <select
              id="plan"
              className="w-full px-3 py-2 border rounded-md bg-background"
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
            >
              <option value="basic">أساسية - 100 ميجا</option>
              <option value="standard">متوسطة - 250 ميجا</option>
              <option value="premium">متقدمة - 500 ميجا</option>
              <option value="ultimate">فائقة - 1 جيجا</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">خط العرض</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="33.3152"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">خط الطول</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="44.3661"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressNotes">ملاحظات الموقع</Label>
            <Input
              id="addressNotes"
              value={formData.addressNotes}
              onChange={(e) => setFormData({ ...formData, addressNotes: e.target.value })}
              placeholder="معلومات إضافية عن الموقع"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit">إضافة المشترك</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
