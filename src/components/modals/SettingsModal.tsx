import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { User, Monitor, CreditCard, Wrench, Bell } from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const [darkMode, setDarkMode] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  const handleSave = () => {
    toast.success("تم حفظ الإعدادات بنجاح");
    onOpenChange(false);
  };

  const handleReset = () => {
    toast.info("تم إعادة الإعدادات الافتراضية");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl">الإعدادات</DialogTitle>
          <DialogDescription>إدارة إعدادات النظام والحساب</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="account" className="gap-2">
              <User className="h-4 w-4" />
              الحساب
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Monitor className="h-4 w-4" />
              النظام
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="h-4 w-4" />
              الفواتير
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="gap-2">
              <Wrench className="h-4 w-4" />
              الصيانة
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              الإشعارات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" placeholder="admin@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input id="phone" type="tel" placeholder="+966 50 000 0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور الجديدة</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">اللغة</Label>
              <select
                id="language"
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="logo">شعار النظام</Label>
              <Input id="logo" type="file" accept="image/*" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">الوضع الداكن</Label>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme-color">لون النظام الأساسي</Label>
              <Input id="theme-color" type="color" defaultValue="#1e40af" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="print-format">تنسيق الطباعة</Label>
              <select
                id="print-format"
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="a4">A4</option>
                <option value="thermal">حراري</option>
              </select>
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="tax">نسبة الضريبة (%)</Label>
              <Input id="tax" type="number" defaultValue="15" min="0" max="100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing-cycle">دورة الفوترة الافتراضية</Label>
              <select
                id="billing-cycle"
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="monthly">شهري</option>
                <option value="quarterly">ربع سنوي</option>
                <option value="yearly">سنوي</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank-account">الحساب البنكي الافتراضي</Label>
              <Input id="bank-account" placeholder="SA00 0000 0000 0000 0000 0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">العملة</Label>
              <Input id="currency" defaultValue="ريال سعودي" />
            </div>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="sla">مدة SLA الافتراضية (ساعات)</Label>
              <Input id="sla" type="number" defaultValue="24" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue-types">أنواع الأعطال المسبقة</Label>
              <textarea
                id="issue-types"
                className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-background"
                placeholder="انقطاع الإنترنت&#10;بطء الخدمة&#10;مشكلة في الراوتر"
                defaultValue="انقطاع الإنترنت&#10;بطء الخدمة&#10;مشكلة في الراوتر&#10;مشكلة في الكابل"
              />
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="sms">تفعيل الرسائل القصيرة (SMS)</Label>
              <Switch
                id="sms"
                checked={smsEnabled}
                onCheckedChange={setSmsEnabled}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notif">تفعيل البريد الإلكتروني</Label>
              <Switch
                id="email-notif"
                checked={emailEnabled}
                onCheckedChange={setEmailEnabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sms-template">قالب رسائل SMS</Label>
              <textarea
                id="sms-template"
                className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-background"
                placeholder="عزيزي العميل، تم إصدار فاتورة جديدة..."
                defaultValue="عزيزي العميل {NAME}، تم إصدار فاتورة جديدة بمبلغ {AMOUNT} ريال. الرجاء السداد قبل {DUE_DATE}"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-template">قالب البريد الإلكتروني</Label>
              <textarea
                id="email-template"
                className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-background"
                placeholder="مرحباً {NAME}..."
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button type="button" variant="destructive" onClick={handleReset}>
            إعادة تعيين
          </Button>
          <Button type="button" onClick={handleSave}>
            حفظ التغييرات
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
