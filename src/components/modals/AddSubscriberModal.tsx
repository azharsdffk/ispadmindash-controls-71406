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
    issueType: "",
    issueDescription: "",
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
        issueType: "",
        issueDescription: "",
      });
      onSuccess?.();
    } catch (error: any) {
      console.error('Add subscriber error:', error);
      toast.error("فشل إضافة المشترك: " + (error.message || ''));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text">إضافة مشترك جديد</DialogTitle>
          <DialogDescription className="text-base">أدخل بيانات المشترك الجديد بشكل كامل</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* المعلومات الأساسية */}
          <div className="space-y-4 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border border-primary/10">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              المعلومات الأساسية
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-medium">الاسم الكامل *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="أدخل اسم المشترك الكامل"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="font-medium">اسم المستخدم</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="اسم المستخدم للنظام"
                  className="h-11"
                />
              </div>
            </div>
          </div>

          {/* معلومات الاتصال */}
          <div className="space-y-4 p-4 rounded-lg bg-gradient-to-r from-blue-500/5 to-transparent border border-blue-500/10">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              معلومات الاتصال
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-medium">رقم الهاتف الأساسي *</Label>
                <Input
                  id="phone"
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="07xxxxxxxxx"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_secondary" className="font-medium">رقم هاتف ثانوي</Label>
                <Input
                  id="phone_secondary"
                  type="tel"
                  value={formData.phone_secondary}
                  onChange={(e) => setFormData({ ...formData, phone_secondary: e.target.value })}
                  placeholder="07xxxxxxxxx"
                  className="h-11"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email" className="font-medium">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@email.com"
                  className="h-11"
                />
              </div>
            </div>
          </div>

          {/* معلومات العنوان */}
          <div className="space-y-4 p-4 rounded-lg bg-gradient-to-r from-green-500/5 to-transparent border border-green-500/10">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              العنوان والموقع
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address" className="font-medium">العنوان</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="أدخل العنوان الكامل"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressNotes" className="font-medium">ملاحظات الموقع</Label>
                <Input
                  id="addressNotes"
                  value={formData.addressNotes}
                  onChange={(e) => setFormData({ ...formData, addressNotes: e.target.value })}
                  placeholder="معلومات إضافية عن الموقع (قرب معلم معين، رقم الدار، إلخ)"
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude" className="font-medium">خط العرض (Latitude)</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="33.3152"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude" className="font-medium">خط الطول (Longitude)</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="44.3661"
                    className="h-11"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* معلومات الخدمة */}
          <div className="space-y-4 p-4 rounded-lg bg-gradient-to-r from-purple-500/5 to-transparent border border-purple-500/10">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              معلومات الخدمة
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plan" className="font-medium">الباقة</Label>
                <select
                  id="plan"
                  className="w-full h-11 px-3 py-2 border rounded-md bg-background text-foreground"
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                >
                  <option value="">اختر الباقة المناسبة</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.name}>
                      {pkg.name} - {pkg.speed_mbps} ميجابايت/ثانية
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="statusComment" className="font-medium">ملاحظات حالة المشترك</Label>
                <Input
                  id="statusComment"
                  value={formData.statusComment}
                  onChange={(e) => setFormData({ ...formData, statusComment: e.target.value })}
                  placeholder="أي ملاحظات عن حالة المشترك أو الخدمة"
                  className="h-11"
                />
              </div>
            </div>
          </div>

          {/* المشاكل والأعطال */}
          <div className="space-y-4 p-4 rounded-lg bg-gradient-to-r from-orange-500/5 to-transparent border border-orange-500/10">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              المشاكل والأعطال (إن وجدت)
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="issueType" className="font-medium">نوع المشكلة</Label>
                <select
                  id="issueType"
                  className="w-full h-11 px-3 py-2 border rounded-md bg-background text-foreground"
                  value={formData.issueType}
                  onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                >
                  <option value="">اختر نوع المشكلة</option>
                  <option value="cable_cut_external">انقطاع في الكابل الخارجي</option>
                  <option value="internal_connector_broken">فيشه الداخلية مكسورة</option>
                  <option value="ont_burned">جهاز الـ ONT محروق</option>
                  <option value="ups_disconnected">الـ UPS مفصول عن الكهرباء</option>
                  <option value="device_reprogramming">إعادة برمجة الأجهزة</option>
                  <option value="external_connector_replacement">تبديل فيشه خارجية</option>
                  <option value="internal_connector_replacement">تبديل فيشه داخلية</option>
                  <option value="router_replacement">تبديل راوتر</option>
                  <option value="ont_replacement">تبديل جهاز الـ ONT</option>
                  <option value="ont_reprogramming">إعادة برمجة الـ ONT</option>
                  <option value="other">مشكلة أخرى</option>
                </select>
              </div>

              {formData.issueType && (
                <div className="space-y-2">
                  <Label htmlFor="issueDescription" className="font-medium">وصف المشكلة بالتفصيل</Label>
                  <textarea
                    id="issueDescription"
                    className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-background text-foreground resize-y"
                    value={formData.issueDescription}
                    onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                    placeholder="اكتب وصفاً تفصيلياً للمشكلة التي يعاني منها المشترك..."
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 px-6">
              إلغاء
            </Button>
            <Button type="submit" className="h-11 px-8">
              إضافة المشترك
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
