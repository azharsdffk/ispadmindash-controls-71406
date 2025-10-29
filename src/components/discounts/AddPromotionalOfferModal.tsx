import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddPromotionalOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddPromotionalOfferModal = ({ open, onOpenChange, onSuccess }: AddPromotionalOfferModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    offer_type: "discount",
    discount_percentage: "",
    free_months: "",
    bonus_speed_mbps: "",
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: "",
    auto_apply: false,
    active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('promotional_offers').insert({
        name: formData.name,
        description: formData.description || null,
        offer_type: formData.offer_type,
        discount_percentage: formData.discount_percentage ? parseFloat(formData.discount_percentage) : null,
        free_months: formData.free_months ? parseInt(formData.free_months) : null,
        bonus_speed_mbps: formData.bonus_speed_mbps ? parseInt(formData.bonus_speed_mbps) : null,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until,
        auto_apply: formData.auto_apply,
        active: formData.active,
      });

      if (error) throw error;

      toast.success('تم إضافة العرض بنجاح');
      onSuccess();
      onOpenChange(false);
      setFormData({
        name: "",
        description: "",
        offer_type: "discount",
        discount_percentage: "",
        free_months: "",
        bonus_speed_mbps: "",
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: "",
        auto_apply: false,
        active: true,
      });
    } catch (error: any) {
      console.error('Error adding offer:', error);
      toast.error('فشل إضافة العرض');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إضافة عرض ترويجي جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">اسم العرض *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="مثال: عرض رمضان الكريم"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف تفصيلي للعرض..."
                rows={3}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="offer_type">نوع العرض *</Label>
              <Select
                value={formData.offer_type}
                onValueChange={(value) => setFormData({ ...formData, offer_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount">خصم نسبة مئوية</SelectItem>
                  <SelectItem value="free_months">أشهر مجانية</SelectItem>
                  <SelectItem value="speed_upgrade">زيادة السرعة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.offer_type === 'discount' && (
              <div className="col-span-2">
                <Label htmlFor="discount_percentage">نسبة الخصم %</Label>
                <Input
                  id="discount_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                  placeholder="10"
                />
              </div>
            )}

            {formData.offer_type === 'free_months' && (
              <div className="col-span-2">
                <Label htmlFor="free_months">عدد الأشهر المجانية</Label>
                <Input
                  id="free_months"
                  type="number"
                  min="1"
                  value={formData.free_months}
                  onChange={(e) => setFormData({ ...formData, free_months: e.target.value })}
                  placeholder="1"
                />
              </div>
            )}

            {formData.offer_type === 'speed_upgrade' && (
              <div className="col-span-2">
                <Label htmlFor="bonus_speed_mbps">زيادة السرعة (ميجابت)</Label>
                <Input
                  id="bonus_speed_mbps"
                  type="number"
                  min="1"
                  value={formData.bonus_speed_mbps}
                  onChange={(e) => setFormData({ ...formData, bonus_speed_mbps: e.target.value })}
                  placeholder="10"
                />
              </div>
            )}

            <div>
              <Label htmlFor="valid_from">تاريخ البدء *</Label>
              <Input
                id="valid_from"
                type="date"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="valid_until">تاريخ الانتهاء *</Label>
              <Input
                id="valid_until"
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                required
              />
            </div>

            <div className="col-span-2 flex items-center gap-2">
              <Switch
                checked={formData.auto_apply}
                onCheckedChange={(checked) => setFormData({ ...formData, auto_apply: checked })}
              />
              <Label>تطبيق تلقائي على المشتركين الجدد</Label>
            </div>

            <div className="col-span-2 flex items-center gap-2">
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label>نشط</Label>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري الإضافة...' : 'إضافة العرض'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
