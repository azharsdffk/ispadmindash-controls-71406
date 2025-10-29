import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Gift, TrendingUp, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddPromotionalOfferModal } from "./AddPromotionalOfferModal";

interface PromotionalOffer {
  id: string;
  name: string;
  description: string | null;
  offer_type: string;
  discount_percentage: number | null;
  free_months: number | null;
  bonus_speed_mbps: number | null;
  valid_from: string;
  valid_until: string;
  auto_apply: boolean;
  active: boolean;
  created_at: string;
}

export const PromotionalOffersManager = () => {
  const [offers, setOffers] = useState<PromotionalOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('promotional_offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers((data || []) as any);
    } catch (error: any) {
      console.error('Error fetching offers:', error);
      toast.error('فشل تحميل العروض');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('promotional_offers')
        .update({ active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(currentStatus ? 'تم تعطيل العرض' : 'تم تفعيل العرض');
      fetchOffers();
    } catch (error) {
      toast.error('فشل تحديث العرض');
    }
  };

  const deleteOffer = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العرض؟')) return;

    try {
      const { error } = await supabase
        .from('promotional_offers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('تم حذف العرض');
      fetchOffers();
    } catch (error) {
      toast.error('فشل حذف العرض');
    }
  };

  const getOfferValue = (offer: PromotionalOffer) => {
    if (offer.offer_type === 'discount' && offer.discount_percentage) {
      return `خصم ${offer.discount_percentage}%`;
    }
    if (offer.offer_type === 'free_months' && offer.free_months) {
      return `${offer.free_months} شهر مجاني`;
    }
    if (offer.offer_type === 'speed_upgrade' && offer.bonus_speed_mbps) {
      return `+${offer.bonus_speed_mbps} ميجابت`;
    }
    return '-';
  };

  const getOfferIcon = (type: string) => {
    if (type === 'discount') return <Gift className="h-4 w-4" />;
    if (type === 'free_months') return <Calendar className="h-4 w-4" />;
    if (type === 'speed_upgrade') return <TrendingUp className="h-4 w-4" />;
    return null;
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
          <CardTitle>العروض الترويجية</CardTitle>
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة عرض
          </Button>
        </CardHeader>
        <CardContent>
          {offers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد عروض ترويجية حالياً
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العرض</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>القيمة</TableHead>
                  <TableHead>الصلاحية</TableHead>
                  <TableHead>تطبيق تلقائي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <div>
                        <div className="font-semibold">{offer.name}</div>
                        {offer.description && (
                          <div className="text-sm text-muted-foreground">{offer.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getOfferIcon(offer.offer_type)}
                        <span className="text-sm">
                          {offer.offer_type === 'discount' && 'خصم'}
                          {offer.offer_type === 'free_months' && 'أشهر مجانية'}
                          {offer.offer_type === 'speed_upgrade' && 'زيادة سرعة'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold">
                        {getOfferValue(offer)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>من: {new Date(offer.valid_from).toLocaleDateString('ar-IQ')}</div>
                        <div>حتى: {new Date(offer.valid_until).toLocaleDateString('ar-IQ')}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {offer.auto_apply ? (
                        <Badge variant="default">نعم</Badge>
                      ) : (
                        <Badge variant="secondary">لا</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={offer.active ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => toggleActive(offer.id, offer.active)}
                      >
                        {offer.active ? 'نشط' : 'معطل'}
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
                          onClick={() => deleteOffer(offer.id)}
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

      <AddPromotionalOfferModal 
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSuccess={fetchOffers}
      />
    </>
  );
};
