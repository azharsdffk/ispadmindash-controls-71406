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
import { supabase } from "@/integrations/supabase/client";
import { subscriberFormSchema, sanitizeInput } from "@/utils/inputValidation";
import { trackSubscriberEdit } from "@/utils/piiTracking";

interface AddSubscriberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddSubscriberModal = ({ open, onOpenChange, onSuccess }: AddSubscriberModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    phone_secondary: "",
    email: "",
    address: "",
    username: "",
    plan: "",
    latitude: "",
    longitude: "",
    addressNotes: "",
    statusComment: "",
  });
  
  const [packages, setPackages] = useState<Array<{ id: string; name: string; speed_mbps: number }>>([]);

  const loadPackages = async () => {
    const { data } = await supabase
      .from('packages')
      .select('id, name, speed_mbps')
      .eq('active', true)
      .order('speed_mbps');
    if (data) setPackages(data);
  };

  // Load packages on mount
  useEffect(() => {
    loadPackages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: newSubscriber, error } = await supabase.from('subscribers').insert({
        name: sanitizeInput(formData.name),
        phone: sanitizeInput(formData.phone),
        phone_secondary: formData.phone_secondary ? sanitizeInput(formData.phone_secondary) : null,
        username: formData.username ? sanitizeInput(formData.username) : null,
        email: formData.email ? sanitizeInput(formData.email) : null,
        address: formData.address ? sanitizeInput(formData.address) : null,
        address_notes: formData.addressNotes ? sanitizeInput(formData.addressNotes) : null,
        plan: formData.plan || null,
        status_comment: formData.statusComment ? sanitizeInput(formData.statusComment) : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        created_by: user?.id,
      }).select().single();

      if (error) throw error;
      
      if (newSubscriber) {
        await trackSubscriberEdit(newSubscriber.id, ['name', 'phone', 'email', 'address']);
      }
      
      toast.success("تم إضافة المشترك بنجاح");
      onOpenChange(false);
      setFormData({ 
        name: "", 
        phone: "", 
        phone_secondary: "",
        email: "", 
        address: "",
        username: "",
        plan: "", 
        latitude: "", 
        longitude: "", 
        addressNotes: "",
        statusComment: "",
      });
      onSuccess?.();
    } catch (error: any) {
      console.error('Add subscriber error:', error);
      toast.error("فشل إضافة المشترك: " + (error.message || ''));
    }
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
              placeholder="07xxxxxxxxx"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_secondary">رقم هاتف ثاني</Label>
            <Input
              id="phone_secondary"
              type="tel"
              value={formData.phone_secondary}
              onChange={(e) => setFormData({ ...formData, phone_secondary: e.target.value })}
              placeholder="07xxxxxxxxx"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="اسم المستخدم للمشترك"
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
              <option value="">اختر الباقة</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.name}>
                  {pkg.name} - {pkg.speed_mbps} ميجابايت
                </option>
              ))}
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

          <div className="space-y-2">
            <Label htmlFor="statusComment">التعليق على حالة المشترك</Label>
            <Input
              id="statusComment"
              value={formData.statusComment}
              onChange={(e) => setFormData({ ...formData, statusComment: e.target.value })}
              placeholder="حالة المشترك أو أي ملاحظات"
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
