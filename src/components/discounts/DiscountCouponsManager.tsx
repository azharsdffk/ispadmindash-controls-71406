import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddCouponModal } from "./AddCouponModal";
import { DeleteConfirmDialog } from "@/components/modals/DeleteConfirmDialog";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  currency: string;
  min_purchase_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number;
  valid_from: string;
  valid_until: string;
  active: boolean;
  applicable_to: string;
}

export const DiscountCouponsManager = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<{ id: string; code: string } | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons((data || []) as any);
    } catch (error: any) {
      console.error('Error fetching coupons:', error);
      toast.error('فشل تحميل الكوبونات');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('تم نسخ الكود');
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('discount_coupons')
        .update({ active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(currentStatus ? 'تم تعطيل الكوبون' : 'تم تفعيل الكوبون');
      fetchCoupons();
    } catch (error) {
      toast.error('فشل تحديث الكوبون');
    }
  };

  const handleDeleteClick = (id: string, code: string) => {
    setSelectedCoupon({ id, code });
    setDeleteDialogOpen(true);
  };

  const deleteCoupon = async () => {
    if (!selectedCoupon) return;

    try {
      const { error } = await supabase
        .from('discount_coupons')
        .delete()
        .eq('id', selectedCoupon.id);

      if (error) throw error;
      toast.success('تم حذف الكوبون');
      fetchCoupons();
    } catch (error) {
      toast.error('فشل حذف الكوبون');
    }
  };

  const getDiscountText = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%`;
    }
    return `${coupon.discount_value.toLocaleString()} ${coupon.currency}`;
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 text-center">جاري التحميل...</CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>كوبونات الخصم</CardTitle>
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة كوبون
          </Button>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد كوبونات خصم حالياً
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الكود</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>قيمة الخصم</TableHead>
                  <TableHead>الاستخدامات</TableHead>
                  <TableHead>الصلاحية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-bold text-primary">{coupon.code}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCode(coupon.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{coupon.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold">
                        {getDiscountText(coupon)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {coupon.usage_count} / {coupon.usage_limit || '∞'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>حتى: {new Date(coupon.valid_until).toLocaleDateString('ar-IQ')}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={coupon.active ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => toggleActive(coupon.id, coupon.active)}
                      >
                        {coupon.active ? 'نشط' : 'معطل'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteClick(coupon.id, coupon.code)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddCouponModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSuccess={fetchCoupons}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={deleteCoupon}
        title="حذف الكوبون"
        description="هل أنت متأكد من حذف هذا الكوبون؟ لا يمكن التراجع عن هذا الإجراء."
        itemName={selectedCoupon?.code}
      />
    </>
  );
};
