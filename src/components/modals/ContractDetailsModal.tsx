import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { formatCurrency } from "@/lib/currency";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";

interface ContractDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: any;
  onUpdate: () => void;
}

export const ContractDetailsModal = ({ open, onOpenChange, contract, onUpdate }: ContractDetailsModalProps) => {
  const [status, setStatus] = useState(contract.status);
  const [updating, setUpdating] = useState(false);
  const { hasPermission } = usePermissions();

  const canUpdateContracts = hasPermission('contracts.update');

  const updateStatus = async () => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ status })
        .eq('id', contract.id);

      if (error) throw error;

      toast.success('تم تحديث حالة العقد بنجاح');
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating contract:', error);
      toast.error('فشل تحديث حالة العقد');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'نشط', variant: 'default' },
      expired: { label: 'منتهي', variant: 'destructive' },
      suspended: { label: 'معلق', variant: 'secondary' },
      cancelled: { label: 'ملغي', variant: 'outline' },
      pending: { label: 'قيد الانتظار', variant: 'secondary' }
    };

    const { label, variant } = statusMap[status] || statusMap.pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>تفاصيل العقد - {contract.contract_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">رقم العقد</p>
              <p className="font-medium">{contract.contract_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الحالة</p>
              <div className="mt-1">{getStatusBadge(contract.status)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">المشترك</p>
              <p className="font-medium">{contract.subscribers.name}</p>
              <p className="text-sm text-muted-foreground">{contract.subscribers.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الباقة</p>
              <p className="font-medium">{contract.packages?.name || '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">تاريخ البدء</p>
              <p className="font-medium">{format(new Date(contract.start_date), 'dd MMMM yyyy', { locale: ar })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">تاريخ الانتهاء</p>
              <p className="font-medium">{format(new Date(contract.end_date), 'dd MMMM yyyy', { locale: ar })}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">القيمة الشهرية</p>
              <p className="font-medium">{formatCurrency(Number(contract.monthly_fee), contract.currency)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">رسوم التركيب</p>
              <p className="font-medium">{formatCurrency(Number(contract.installation_fee), contract.currency)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">التجديد التلقائي</p>
              <p className="font-medium">{contract.auto_renew ? `مفعّل (${contract.renewal_period_months} شهر)` : 'غير مفعّل'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
              <p className="font-medium">{format(new Date(contract.created_at), 'dd MMMM yyyy', { locale: ar })}</p>
            </div>
          </div>

          {contract.notes && (
            <div>
              <p className="text-sm text-muted-foreground">ملاحظات</p>
              <p className="font-medium whitespace-pre-wrap">{contract.notes}</p>
            </div>
          )}

          {canUpdateContracts && (
            <>
              <div className="border-t pt-4">
                <Label htmlFor="status">تحديث حالة العقد</Label>
                <div className="flex gap-2 mt-2">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="suspended">معلق</SelectItem>
                      <SelectItem value="cancelled">ملغي</SelectItem>
                      <SelectItem value="expired">منتهي</SelectItem>
                      <SelectItem value="pending">قيد الانتظار</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={updateStatus} disabled={updating || status === contract.status}>
                    {updating ? "جاري التحديث..." : "تحديث"}
                  </Button>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إغلاق
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
