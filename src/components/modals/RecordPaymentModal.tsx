import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Building2, Wallet, Smartphone } from 'lucide-react';

interface RecordPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriberId: string;
  invoiceId?: string;
  invoiceAmount?: number;
  onSuccess?: () => void;
}

export const RecordPaymentModal = ({
  open,
  onOpenChange,
  subscriberId,
  invoiceId,
  invoiceAmount,
  onSuccess,
}: RecordPaymentModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: invoiceAmount?.toString() || '',
    payment_method: 'cash' as 'cash' | 'bank_transfer' | 'card' | 'other',
    payment_gateway: '',
    transaction_id: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال مبلغ صحيح',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const paymentData = {
        subscriber_id: subscriberId,
        invoice_id: invoiceId || null,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        payment_gateway: formData.payment_gateway || null,
        transaction_id: formData.transaction_id || null,
        payment_status: 'completed',
        paid_at: new Date().toISOString(),
        notes: formData.notes || null,
        created_by: user?.id,
        payment_date: new Date().toISOString().split('T')[0],
      };

      const { error } = await supabase
        .from('payments')
        .insert([paymentData]);

      if (error) throw error;

      // Update subscriber balance
      const { error: balanceError } = await supabase.rpc(
        'process_payment_transaction',
        {
          p_subscriber_id: subscriberId,
          p_invoice_id: invoiceId || null,
          p_amount: parseFloat(formData.amount),
          p_payment_method: formData.payment_method,
          p_payment_date: new Date().toISOString().split('T')[0],
          p_notes: formData.notes || null,
          p_user_id: user?.id,
        }
      );

      if (balanceError) console.error('Balance update error:', balanceError);

      toast({
        title: 'تم التسجيل بنجاح',
        description: 'تم تسجيل الدفعة بنجاح',
      });

      onSuccess?.();
      onOpenChange(false);
      
      setFormData({
        amount: '',
        payment_method: 'cash',
        payment_gateway: '',
        transaction_id: '',
        notes: '',
      });
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء تسجيل الدفعة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Wallet className="h-4 w-4" />;
      case 'bank_transfer':
        return <Building2 className="h-4 w-4" />;
      case 'credit_card':
        return <CreditCard className="h-4 w-4" />;
      case 'zaincash':
        return <Smartphone className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>تسجيل دفعة</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">المبلغ (IQD) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">طريقة الدفع *</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value: any) => setFormData({ ...formData, payment_method: value })}
            >
              <SelectTrigger id="payment_method">
                <div className="flex items-center gap-2">
                  {getPaymentIcon(formData.payment_method)}
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    <span>نقداً</span>
                  </div>
                </SelectItem>
                <SelectItem value="bank_transfer">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>تحويل بنكي</span>
                  </div>
                </SelectItem>
                <SelectItem value="card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span>بطاقة ائتمان</span>
                  </div>
                </SelectItem>
                <SelectItem value="other">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span>ZainCash / أخرى</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.payment_method !== 'cash' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="transaction_id">رقم المعاملة</Label>
                <Input
                  id="transaction_id"
                  value={formData.transaction_id}
                  onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                  placeholder="أدخل رقم المعاملة"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_gateway">بوابة الدفع</Label>
                <Input
                  id="payment_gateway"
                  value={formData.payment_gateway}
                  onChange={(e) => setFormData({ ...formData, payment_gateway: e.target.value })}
                  placeholder="مثال: ZainCash, Visa, Mastercard"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="ملاحظات إضافية (اختياري)"
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
