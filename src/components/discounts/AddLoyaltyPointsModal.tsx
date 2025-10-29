import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddLoyaltyPointsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddLoyaltyPointsModal = ({ open, onOpenChange, onSuccess }: AddLoyaltyPointsModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subscriber_id: "",
    transaction_type: "earn",
    points: "",
    reason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // إضافة معاملة نقاط الولاء
      const { error: transactionError } = await supabase.from('loyalty_transactions').insert({
        subscriber_id: formData.subscriber_id,
        transaction_type: formData.transaction_type,
        points: parseInt(formData.points) * (formData.transaction_type === 'redeem' ? -1 : 1),
        reason: formData.reason || null,
      });

      if (transactionError) throw transactionError;

      // تحديث إجمالي النقاط
      const { data: currentPoints } = await supabase
        .from('loyalty_points')
        .select('points')
        .eq('subscriber_id', formData.subscriber_id)
        .single();

      const newTotal = (currentPoints?.points || 0) + 
        (parseInt(formData.points) * (formData.transaction_type === 'redeem' ? -1 : 1));

      if (currentPoints) {
        await supabase
          .from('loyalty_points')
          .update({ points: newTotal })
          .eq('subscriber_id', formData.subscriber_id);
      } else {
        await supabase
          .from('loyalty_points')
          .insert({ 
            subscriber_id: formData.subscriber_id, 
            points: newTotal 
          });
      }

      toast.success('تم إضافة النقاط بنجاح');
      onSuccess();
      onOpenChange(false);
      setFormData({
        subscriber_id: "",
        transaction_type: "earn",
        points: "",
        reason: "",
      });
    } catch (error: any) {
      console.error('Error adding loyalty points:', error);
      toast.error('فشل إضافة النقاط');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إدارة نقاط الولاء</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="subscriber_id">معرّف المشترك *</Label>
            <Input
              id="subscriber_id"
              value={formData.subscriber_id}
              onChange={(e) => setFormData({ ...formData, subscriber_id: e.target.value })}
              required
              placeholder="UUID المشترك"
            />
          </div>

          <div>
            <Label htmlFor="transaction_type">نوع المعاملة *</Label>
            <Select
              value={formData.transaction_type}
              onValueChange={(value) => setFormData({ ...formData, transaction_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="earn">إضافة نقاط</SelectItem>
                <SelectItem value="redeem">استبدال نقاط</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="points">عدد النقاط *</Label>
            <Input
              id="points"
              type="number"
              min="1"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: e.target.value })}
              required
              placeholder="100"
            />
          </div>

          <div>
            <Label htmlFor="reason">السبب</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="سبب إضافة أو خصم النقاط..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري المعالجة...' : 'إضافة'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
