import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Smartphone, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ZainCashPaymentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriberId: string;
  invoiceId?: string;
  amount: number;
  onSuccess?: () => void;
}

export const ZainCashPayment = ({
  open,
  onOpenChange,
  subscriberId,
  invoiceId,
  amount,
  onSuccess,
}: ZainCashPaymentProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const handlePayment = async () => {
    if (!phoneNumber || phoneNumber.length < 11) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال رقم هاتف صحيح',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setPaymentStatus('processing');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // محاكاة عملية الدفع عبر ZainCash
      // في الواقع، ستحتاج إلى دمج API الخاص بـ ZainCash
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockTransactionId = `ZC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      setTransactionId(mockTransactionId);

      // تسجيل الدفعة في قاعدة البيانات
      const paymentData = {
        subscriber_id: subscriberId,
        invoice_id: invoiceId || null,
        amount: amount,
        payment_method: 'other' as const,
        payment_gateway: 'ZainCash',
        transaction_id: mockTransactionId,
        payment_status: 'completed',
        paid_at: new Date().toISOString(),
        gateway_response: {
          phone: phoneNumber,
          transaction_id: mockTransactionId,
          timestamp: new Date().toISOString(),
        },
        created_by: user?.id,
        payment_date: new Date().toISOString().split('T')[0],
      };

      const { error } = await supabase
        .from('payments')
        .insert([paymentData]);

      if (error) throw error;

      setPaymentStatus('success');
      
      toast({
        title: 'نجح الدفع',
        description: `تم الدفع بنجاح عبر ZainCash\nرقم المعاملة: ${mockTransactionId}`,
      });

      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
      }, 2000);
      
    } catch (error: any) {
      setPaymentStatus('failed');
      toast({
        title: 'فشل الدفع',
        description: error.message || 'حدث خطأ أثناء عملية الدفع',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (paymentStatus) {
      case 'processing':
        return (
          <Badge variant="outline" className="gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            جاري المعالجة
          </Badge>
        );
      case 'success':
        return (
          <Badge variant="outline" className="gap-2 border-green-500 text-green-500">
            <CheckCircle2 className="h-3 w-3" />
            نجحت العملية
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="gap-2 border-red-500 text-red-500">
            <XCircle className="h-3 w-3" />
            فشلت العملية
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <DialogTitle>الدفع عبر ZainCash</DialogTitle>
            {getStatusBadge()}
          </div>
          <DialogDescription>
            ادفع بأمان باستخدام محفظة ZainCash الإلكترونية
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">المبلغ المطلوب:</span>
              <span className="text-2xl font-bold">{amount.toLocaleString()} IQD</span>
            </div>
          </div>

          {paymentStatus === 'idle' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">رقم هاتف ZainCash</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="07XXXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  maxLength={11}
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground">
                  أدخل رقم هاتف ZainCash المسجل
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handlePayment}
                  disabled={loading || !phoneNumber}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      جاري المعالجة...
                    </>
                  ) : (
                    <>
                      <Smartphone className="mr-2 h-4 w-4" />
                      ادفع الآن
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="outline"
                  disabled={loading}
                >
                  إلغاء
                </Button>
              </div>
            </>
          )}

          {paymentStatus === 'success' && transactionId && (
            <div className="space-y-3">
              <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="font-semibold text-green-700 dark:text-green-400">
                  تمت عملية الدفع بنجاح
                </p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">رقم المعاملة:</span>
                  <span className="font-mono font-semibold">{transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المبلغ:</span>
                  <span className="font-semibold">{amount.toLocaleString()} IQD</span>
                </div>
              </div>
            </div>
          )}

          {paymentStatus === 'failed' && (
            <div className="space-y-3">
              <div className="rounded-lg bg-red-50 dark:bg-red-950 p-4 text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                <p className="font-semibold text-red-700 dark:text-red-400">
                  فشلت عملية الدفع
                </p>
                <p className="text-sm text-red-600 dark:text-red-500 mt-1">
                  يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني
                </p>
              </div>
              
              <Button
                onClick={() => {
                  setPaymentStatus('idle');
                  setPhoneNumber('');
                }}
                variant="outline"
                className="w-full"
              >
                إعادة المحاولة
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            <p>سيتم إرسال رمز التأكيد إلى رقم هاتفك المسجل في ZainCash</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
