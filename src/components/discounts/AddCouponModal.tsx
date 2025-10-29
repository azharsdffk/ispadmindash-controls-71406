import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface AddCouponModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddCouponModal = ({ open, onOpenChange, onSuccess }: AddCouponModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount',
    discount_value: '',
    currency: 'IQD',
    min_purchase_amount: '0',
    max_discount_amount: '',
    usage_limit: '',
    per_user_limit: '1',
    valid_until: '',
    active: true,
    applicable_to: 'all',
  });

  const generateCode = () => {
    const code = 'DISC' + Math.random().toString(36).substring(2, 10).toUpperCase();
    setFormData(prev => ({ ...prev, code }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('discount_coupons').insert([{
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        currency: formData.currency as any,
        min_purchase_amount: parseFloat(formData.min_purchase_amount) || 0,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        per_user_limit: parseInt(formData.per_user_limit),
        valid_until: new Date(formData.valid_until).toISOString(),
        active: formData.active,
        applicable_to: formData.applicable_to,
      }]);

      if (error) throw error;

      toast.success('تم إضافة الكوبون بنجاح');
      onSuccess();
      onOpenChange(false);
      setFormData({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        currency: 'IQD',
        min_purchase_amount: '0',
        max_discount_amount: '',
        usage_limit: '',
        per_user_limit: '1',
        valid_until: '',
        active: true,
        applicable_to: 'all',
      });
    } catch (error: any) {
      console.error('Error adding coupon:', error);
      toast.error(error.message || 'فشل إضافة الكوبون');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="gradient-text">إضافة كوبون خصم جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>كود الكوبون *</Label>
              <div className="flex gap-2">
                <Input
                  required
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="SUMMER2024"
                  className="glass-input"
                />
                <Button type="button" variant="outline" onClick={generateCode}>
                  توليد
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>نوع الخصم *</Label>
              <Select
                value={formData.discount_type}
                onValueChange={(value: 'percentage' | 'fixed_amount') =>
                  setFormData(prev => ({ ...prev, discount_type: value }))
                }
              >
                <SelectTrigger className="glass-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">نسبة مئوية %</SelectItem>
                  <SelectItem value="fixed_amount">مبلغ ثابت</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>الوصف</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="خصم صيفي خاص..."
              className="glass-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>قيمة الخصم *</Label>
              <Input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.discount_value}
                onChange={(e) => setFormData(prev => ({ ...prev, discount_value: e.target.value }))}
                placeholder={formData.discount_type === 'percentage' ? '10' : '50000'}
                className="glass-input"
              />
            </div>

            <div className="space-y-2">
              <Label>الحد الأدنى للشراء</Label>
              <Input
                type="number"
                min="0"
                value={formData.min_purchase_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, min_purchase_amount: e.target.value }))}
                className="glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الحد الأقصى للخصم</Label>
              <Input
                type="number"
                min="0"
                value={formData.max_discount_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, max_discount_amount: e.target.value }))}
                placeholder="اختياري"
                className="glass-input"
              />
            </div>

            <div className="space-y-2">
              <Label>عدد مرات الاستخدام الكلي</Label>
              <Input
                type="number"
                min="1"
                value={formData.usage_limit}
                onChange={(e) => setFormData(prev => ({ ...prev, usage_limit: e.target.value }))}
                placeholder="غير محدود"
                className="glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>عدد مرات الاستخدام لكل عميل *</Label>
              <Input
                type="number"
                required
                min="1"
                value={formData.per_user_limit}
                onChange={(e) => setFormData(prev => ({ ...prev, per_user_limit: e.target.value }))}
                className="glass-input"
              />
            </div>

            <div className="space-y-2">
              <Label>صالح حتى *</Label>
              <Input
                type="date"
                required
                value={formData.valid_until}
                onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                className="glass-input"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={formData.active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
            />
            <Label>تفعيل الكوبون فوراً</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'جاري الحفظ...' : 'حفظ الكوبون'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
