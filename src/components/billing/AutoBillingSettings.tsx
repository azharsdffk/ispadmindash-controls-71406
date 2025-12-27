import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar, Clock, Bell, Play, Loader2, CheckCircle2 } from 'lucide-react';

interface BillingSettings {
  id?: string;
  enabled: boolean;
  billing_day: number;
  advance_days: number;
  auto_send_sms: boolean;
  auto_send_email: boolean;
}

export const AutoBillingSettings = () => {
  const [settings, setSettings] = useState<BillingSettings>({
    enabled: true,
    billing_day: 1,
    advance_days: 5,
    auto_send_sms: true,
    auto_send_email: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<{ created: number; skipped: number; errors: number } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('auto_billing_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      if (settings.id) {
        const { error } = await supabase
          .from('auto_billing_settings')
          .update({
            enabled: settings.enabled,
            billing_day: settings.billing_day,
            advance_days: settings.advance_days,
            auto_send_sms: settings.auto_send_sms,
            auto_send_email: settings.auto_send_email,
            updated_at: new Date().toISOString()
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('auto_billing_settings')
          .insert({
            enabled: settings.enabled,
            billing_day: settings.billing_day,
            advance_days: settings.advance_days,
            auto_send_sms: settings.auto_send_sms,
            auto_send_email: settings.auto_send_email
          })
          .select()
          .single();

        if (error) throw error;
        if (data) setSettings(data);
      }

      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('فشل في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const generateInvoicesNow = async () => {
    setGenerating(true);
    setLastResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('auto-generate-invoices');

      if (error) throw error;

      if (data?.results) {
        setLastResult(data.results);
        toast.success(data.message);
      }
    } catch (error) {
      console.error('Error generating invoices:', error);
      toast.error('فشل في إنشاء الفواتير');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            إعدادات الفوترة التلقائية
          </CardTitle>
          <CardDescription>
            تكوين الإصدار التلقائي للفواتير الشهرية
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* تفعيل/تعطيل */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>تفعيل الفوترة التلقائية</Label>
              <p className="text-sm text-muted-foreground">
                إصدار فواتير شهرية تلقائياً لجميع العقود النشطة
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
            />
          </div>

          {/* يوم الفوترة */}
          <div className="space-y-2">
            <Label>يوم إصدار الفواتير</Label>
            <Select
              value={settings.billing_day.toString()}
              onValueChange={(value) => setSettings({ ...settings, billing_day: parseInt(value) })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="اختر اليوم" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    اليوم {day} من كل شهر
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* أيام التقديم */}
          <div className="space-y-2">
            <Label>إصدار الفاتورة قبل (أيام)</Label>
            <Input
              type="number"
              min={0}
              max={15}
              value={settings.advance_days}
              onChange={(e) => setSettings({ ...settings, advance_days: parseInt(e.target.value) || 0 })}
              className="w-[200px]"
            />
            <p className="text-sm text-muted-foreground">
              عدد الأيام لإصدار الفاتورة قبل تاريخ الاستحقاق
            </p>
          </div>

          {/* إشعارات */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" />
              الإشعارات التلقائية
            </h4>
            
            <div className="flex items-center justify-between">
              <Label>إرسال SMS للمشترك</Label>
              <Switch
                checked={settings.auto_send_sms}
                onCheckedChange={(checked) => setSettings({ ...settings, auto_send_sms: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>إرسال بريد إلكتروني</Label>
              <Switch
                checked={settings.auto_send_email}
                onCheckedChange={(checked) => setSettings({ ...settings, auto_send_email: checked })}
              />
            </div>
          </div>

          {/* أزرار */}
          <div className="flex gap-3 pt-4">
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              حفظ الإعدادات
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* تشغيل يدوي */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            تشغيل يدوي
          </CardTitle>
          <CardDescription>
            إنشاء الفواتير الشهرية الآن لجميع العقود النشطة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={generateInvoicesNow} 
            disabled={generating}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                جاري إنشاء الفواتير...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 ml-2" />
                إنشاء الفواتير الآن
              </>
            )}
          </Button>

          {lastResult && (
            <div className="p-4 rounded-lg bg-muted space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                نتائج آخر عملية
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{lastResult.created}</div>
                  <div className="text-muted-foreground">فواتير جديدة</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{lastResult.skipped}</div>
                  <div className="text-muted-foreground">تم تخطيها</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{lastResult.errors}</div>
                  <div className="text-muted-foreground">أخطاء</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
