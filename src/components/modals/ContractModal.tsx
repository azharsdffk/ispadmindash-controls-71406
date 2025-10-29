import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Subscriber {
  id: string;
  name: string;
  phone: string;
}

interface Package {
  id: string;
  name: string;
  monthly_price: number;
}

export const ContractModal = ({ open, onOpenChange }: ContractModalProps) => {
  const [loading, setLoading] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  
  const [formData, setFormData] = useState({
    subscriber_id: "",
    package_id: "",
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    monthly_fee: "",
    installation_fee: "",
    auto_renew: false,
    renewal_period_months: "12",
    notes: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      const [subsRes, pkgsRes] = await Promise.all([
        supabase.from("subscribers").select("id, name, phone").order("name"),
        supabase.from("packages").select("id, name, monthly_price").eq("active", true),
      ]);

      if (subsRes.data) setSubscribers(subsRes.data);
      if (pkgsRes.data) setPackages(pkgsRes.data);
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  const handlePackageChange = (packageId: string) => {
    setFormData({ ...formData, package_id: packageId });
    const selectedPackage = packages.find(p => p.id === packageId);
    if (selectedPackage) {
      setFormData(prev => ({
        ...prev,
        package_id: packageId,
        monthly_fee: selectedPackage.monthly_price.toString(),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: contractNumber } = await supabase
        .rpc("generate_contract_number");

      const { error } = await supabase.from("contracts").insert({
        subscriber_id: formData.subscriber_id,
        package_id: formData.package_id || null,
        contract_number: contractNumber,
        start_date: formData.start_date,
        end_date: formData.end_date,
        monthly_fee: parseFloat(formData.monthly_fee),
        installation_fee: formData.installation_fee ? parseFloat(formData.installation_fee) : 0,
        auto_renew: formData.auto_renew,
        renewal_period_months: parseInt(formData.renewal_period_months),
        notes: formData.notes,
        status: "active",
      });

      if (error) throw error;

      toast.success("تم إنشاء العقد بنجاح");
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error creating contract:", error);
      toast.error("حدث خطأ أثناء إنشاء العقد");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      subscriber_id: "",
      package_id: "",
      start_date: format(new Date(), "yyyy-MM-dd"),
      end_date: format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      monthly_fee: "",
      installation_fee: "",
      auto_renew: false,
      renewal_period_months: "12",
      notes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء عقد جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>المشترك *</Label>
              <Select
                value={formData.subscriber_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, subscriber_id: value })
                }
                required
              >
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
              <Label>الباقة</Label>
              <Select
                value={formData.package_id}
                onValueChange={handlePackageChange}
              >
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

            <div className="space-y-2">
              <Label>تاريخ البدء *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>تاريخ الانتهاء *</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>الرسوم الشهرية (IQD) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.monthly_fee}
                onChange={(e) =>
                  setFormData({ ...formData, monthly_fee: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>رسوم التركيب (IQD)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.installation_fee}
                onChange={(e) =>
                  setFormData({ ...formData, installation_fee: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>فترة التجديد (بالأشهر)</Label>
              <Input
                type="number"
                value={formData.renewal_period_months}
                onChange={(e) =>
                  setFormData({ ...formData, renewal_period_months: e.target.value })
                }
              />
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                checked={formData.auto_renew}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, auto_renew: checked })
                }
              />
              <Label>تجديد تلقائي</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
