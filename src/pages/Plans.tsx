import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Package, Zap, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useUserRole } from "@/hooks/useUserRole";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Package {
  id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  monthly_price: number;
  speed_mbps: number;
  features: any;
  active: boolean;
  currency: string;
}

const Plans = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addPlanOpen, setAddPlanOpen] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, loading: roleLoading } = useUserRole();

  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    description: '',
    monthly_price: '',
    speed_mbps: '',
    features: '',
    active: true,
  });

  useEffect(() => {
    if (!roleLoading) {
      fetchPackages();
    }
  }, [roleLoading]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('monthly_price', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('فشل تحميل الباقات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const features = formData.features ? JSON.parse(formData.features) : null;

      const { error } = await supabase
        .from('packages')
        .insert({
          name: formData.name,
          name_en: formData.name_en || null,
          description: formData.description || null,
          monthly_price: Number(formData.monthly_price),
          speed_mbps: Number(formData.speed_mbps),
          features,
          active: formData.active,
          currency: 'IQD',
        });

      if (error) throw error;

      toast.success('تم إضافة الباقة بنجاح');
      setAddPlanOpen(false);
      setFormData({
        name: '',
        name_en: '',
        description: '',
        monthly_price: '',
        speed_mbps: '',
        features: '',
        active: true,
      });
      fetchPackages();
    } catch (error: any) {
      console.error('Error adding package:', error);
      toast.error(error.message || 'فشل إضافة الباقة');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('packages')
        .update({ active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(currentStatus ? 'تم إيقاف الباقة' : 'تم تفعيل الباقة');
      fetchPackages();
    } catch (error) {
      console.error('Error toggling package status:', error);
      toast.error('فشل تحديث حالة الباقة');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;

    try {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('تم حذف الباقة بنجاح');
      fetchPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error('فشل حذف الباقة');
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
        <div className="flex flex-1 w-full">
          <AppSidebar />
          <main className="flex-1 p-6 overflow-y-auto">
            <Alert variant="destructive">
              <AlertDescription>
                ليس لديك صلاحية الوصول إلى هذه الصفحة
              </AlertDescription>
            </Alert>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1 w-full">
        <AppSidebar />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">إدارة الباقات</h1>
              </div>
              
              <Dialog open={addPlanOpen} onOpenChange={setAddPlanOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    إضافة باقة جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>إضافة باقة جديدة</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">اسم الباقة بالعربية</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="name_en">اسم الباقة بالإنجليزية</Label>
                      <Input
                        id="name_en"
                        value={formData.name_en}
                        onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">الوصف</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="monthly_price">السعر الشهري (دينار عراقي)</Label>
                      <Input
                        id="monthly_price"
                        type="number"
                        value={formData.monthly_price}
                        onChange={(e) => setFormData({ ...formData, monthly_price: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="speed_mbps">السرعة (ميجابت/ثانية)</Label>
                      <Input
                        id="speed_mbps"
                        type="number"
                        value={formData.speed_mbps}
                        onChange={(e) => setFormData({ ...formData, speed_mbps: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="features">الميزات (JSON)</Label>
                      <Textarea
                        id="features"
                        value={formData.features}
                        onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                        placeholder='["ميزة 1", "ميزة 2"]'
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="active"
                        checked={formData.active}
                        onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                      />
                      <Label htmlFor="active">باقة نشطة</Label>
                    </div>

                    <Button type="submit" className="w-full">إضافة الباقة</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <Card key={pkg.id} className={`relative ${!pkg.active && 'opacity-60'}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-6 w-6 text-primary" />
                        <CardTitle className="text-xl">{pkg.name}</CardTitle>
                      </div>
                      {!pkg.active && (
                        <span className="text-xs bg-muted px-2 py-1 rounded">غير نشط</span>
                      )}
                    </div>
                    <CardDescription>{pkg.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-3xl font-bold text-primary">
                        {pkg.monthly_price.toLocaleString()}
                        <span className="text-sm text-muted-foreground mr-2">دينار/شهر</span>
                      </div>
                      <div className="text-lg font-semibold mt-2 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        {pkg.speed_mbps} ميجابت/ثانية
                      </div>
                    </div>

                    {pkg.features && Array.isArray(pkg.features) && (
                      <ul className="space-y-2">
                        {pkg.features.map((feature: string, index: number) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-success" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleToggleActive(pkg.id, pkg.active)}
                      >
                        {pkg.active ? 'إيقاف' : 'تفعيل'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(pkg.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {packages.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">لا توجد باقات حالياً</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    قم بإضافة باقة جديدة للبدء
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default Plans;
