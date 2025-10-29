import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddContractModal = ({ open, onOpenChange }: AddContractModalProps) => {
  const [loading, setLoading] = useState(false);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    subscriber_id: "",
    package_id: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    auto_renew: false,
    renewal_period_months: 12,
    monthly_fee: "",
    installation_fee: "",
    notes: ""
  });

  useEffect(() => {
    if (open) {
      fetchSubscribers();
      fetchPackages();
    }
  }, [open]);

  const fetchSubscribers = async () => {
    const { data } = await supabase
      .from('subscribers')
      .select('id, name, phone')
      .order('name');
    setSubscribers(data || []);
  };

  const fetchPackages = async () => {
    const { data } = await supabase
      .from('packages')
      .select('id, name, monthly_price')
      .eq('active', true)
      .order('name');
    setPackages(data || []);
  };

  const handlePackageChange = (packageId: string) => {
    setFormData(prev => ({ ...prev, package_id: packageId }));
    
    const selectedPackage = packages.find(p => p.id === packageId);
    if (selectedPackage) {
      setFormData(prev => ({
        ...prev,
        monthly_fee: selectedPackage.monthly_price.toString()
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get the next contract number
      const { data: contractNumberData } = await supabase.rpc('generate_contract_number');
      
      const { error } = await supabase
        .from('contracts')
        .insert([{
          contract_number: contractNumberData,
          subscriber_id: formData.subscriber_id,
          package_id: formData.package_id || null,
          start_date: formData.start_date,
          end_date: formData.end_date,
          auto_renew: formData.auto_renew,
          renewal_period_months: formData.renewal_period_months,
          monthly_fee: Number(formData.monthly_fee),
          installation_fee: Number(formData.installation_fee) || 0,
          notes: formData.notes,
          status: 'active'
        }]);

      if (error) throw error;

      toast.success('تم إنشاء العقد بنجاح');
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating contract:', error);
      toast.error('فشل إنشاء العقد: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      subscriber_id: "",
      package_id: "",
      start_date: new Date().toISOString().split('T')[0],
      end_date: "",
      auto_renew: false,
      renewal_period_months: 12,
      monthly_fee: "",
      installation_fee: "",
      notes: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>عقد جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subscriber">المشترك *</Label>
              <Select value={formData.subscriber_id} onValueChange={(value) => setFormData({...formData, subscriber_id: value})} required>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المشترك" />
                </SelectTrigger>
                <SelectContent>
                  {subscribers.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name} - {sub.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="package">الباقة</Label>
              <Select value={formData.package_id} onValueChange={handlePackageChange}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الباقة" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">تاريخ البدء *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">تاريخ الانتهاء *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                min={formData.start_date}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthly_fee">القيمة الشهرية (IQD) *</Label>
              <Input
                id="monthly_fee"
                type="number"
                value={formData.monthly_fee}
                onChange={(e) => setFormData({...formData, monthly_fee: e.target.value})}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="installation_fee">رسوم التركيب (IQD)</Label>
              <Input
                id="installation_fee"
                type="number"
                value={formData.installation_fee}
                onChange={(e) => setFormData({...formData, installation_fee: e.target.value})}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Switch
              id="auto_renew"
              checked={formData.auto_renew}
              onCheckedChange={(checked) => setFormData({...formData, auto_renew: checked})}
            />
            <Label htmlFor="auto_renew">تجديد تلقائي</Label>
          </div>

          {formData.auto_renew && (
            <div className="space-y-2">
              <Label htmlFor="renewal_period">فترة التجديد (بالأشهر)</Label>
              <Input
                id="renewal_period"
                type="number"
                value={formData.renewal_period_months}
                onChange={(e) => setFormData({...formData, renewal_period_months: Number(e.target.value)})}
                min="1"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="ملاحظات إضافية..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الحفظ..." : "حفظ العقد"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
