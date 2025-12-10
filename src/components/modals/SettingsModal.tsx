import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  User, Monitor, CreditCard, Wrench, Bell, Settings, 
  Users, FileText, Package, MapPin, Calendar, Archive,
  Shield, UserCog, Import, Percent, BarChart3, Home,
  Receipt, Wallet, Building, Lock, ChevronLeft
} from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const navigate = useNavigate();
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

  const navigateTo = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const quickActions = [
    { icon: Home, label: "الرئيسية", path: "/", color: "bg-blue-500" },
    { icon: Users, label: "المشتركين", path: "/subscribers", color: "bg-emerald-500" },
    { icon: Receipt, label: "الفواتير", path: "/invoices", color: "bg-violet-500" },
    { icon: Wallet, label: "السندات", path: "/vouchers", color: "bg-amber-500" },
    { icon: Wrench, label: "الصيانة", path: "/maintenance", color: "bg-orange-500" },
    { icon: Building, label: "العقود", path: "/contracts", color: "bg-cyan-500" },
    { icon: Package, label: "الباقات", path: "/plans", color: "bg-pink-500" },
    { icon: Archive, label: "المخزن", path: "/inventory", color: "bg-indigo-500" },
    { icon: BarChart3, label: "التقارير", path: "/reports", color: "bg-teal-500" },
    { icon: Calendar, label: "الجدولة", path: "/schedule", color: "bg-purple-500" },
    { icon: Bell, label: "الإشعارات", path: "/notifications", color: "bg-rose-500" },
    { icon: Percent, label: "الخصومات", path: "/discounts", color: "bg-lime-500" },
  ];

  const adminActions = [
    { icon: UserCog, label: "إدارة الأدوار", path: "/roles", color: "bg-blue-600" },
    { icon: Shield, label: "الصلاحيات", path: "/permissions", color: "bg-red-500" },
    { icon: Users, label: "حسابات المستخدمين", path: "/accounts", color: "bg-green-600" },
    { icon: MapPin, label: "تتبع الموظفين", path: "/tracking", color: "bg-amber-600" },
    { icon: User, label: "الموظفين", path: "/employees", color: "bg-purple-600" },
    { icon: Import, label: "استيراد البيانات", path: "/import", color: "bg-cyan-600" },
    { icon: Lock, label: "إعدادات الأمان", path: "/security", color: "bg-slate-600" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            الإعدادات
          </DialogTitle>
          <DialogDescription>إدارة إعدادات النظام والحساب والإجراءات السريعة</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="actions" className="w-full">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="actions" className="gap-1 text-xs">
              <Settings className="h-4 w-4" />
              الإجراءات
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-1 text-xs">
              <User className="h-4 w-4" />
              الحساب
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-1 text-xs">
              <Monitor className="h-4 w-4" />
              النظام
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-1 text-xs">
              <CreditCard className="h-4 w-4" />
              الفواتير
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="gap-1 text-xs">
              <Wrench className="h-4 w-4" />
              الصيانة
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1 text-xs">
              <Bell className="h-4 w-4" />
              الإشعارات
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[55vh] mt-4">
            <TabsContent value="actions" className="space-y-6 px-1">
              {/* الإجراءات السريعة */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-primary">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  الإجراءات السريعة
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {quickActions.map((action) => (
                    <Button
                      key={action.path}
                      type="button"
                      variant="outline"
                      className="h-20 flex-col gap-2 hover:bg-primary/10 hover:border-primary transition-all"
                      onClick={() => navigateTo(action.path)}
                    >
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <action.icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-xs font-medium">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* إدارة النظام */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-orange-500">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  إدارة النظام (المدير فقط)
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {adminActions.map((action) => (
                    <Button
                      key={action.path}
                      type="button"
                      variant="outline"
                      className="h-20 flex-col gap-2 hover:bg-orange-500/10 hover:border-orange-500 transition-all"
                      onClick={() => navigateTo(action.path)}
                    >
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <action.icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-xs font-medium">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* لوحات التحكم */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-emerald-500">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  لوحات التحكم
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-16 justify-start gap-3 hover:bg-emerald-500/10 hover:border-emerald-500"
                    onClick={() => navigateTo("/dashboard")}
                  >
                    <div className="p-2 rounded-lg bg-emerald-500">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="font-medium">لوحة التحكم الرئيسية</div>
                      <div className="text-xs text-muted-foreground">نظرة عامة</div>
                    </div>
                    <ChevronLeft className="h-4 w-4 mr-auto" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-16 justify-start gap-3 hover:bg-blue-500/10 hover:border-blue-500"
                    onClick={() => navigateTo("/accountant")}
                  >
                    <div className="p-2 rounded-lg bg-blue-500">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="font-medium">لوحة المحاسب</div>
                      <div className="text-xs text-muted-foreground">المالية والتقارير</div>
                    </div>
                    <ChevronLeft className="h-4 w-4 mr-auto" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-16 justify-start gap-3 hover:bg-orange-500/10 hover:border-orange-500"
                    onClick={() => navigateTo("/technician")}
                  >
                    <div className="p-2 rounded-lg bg-orange-500">
                      <Wrench className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="font-medium">لوحة الفني</div>
                      <div className="text-xs text-muted-foreground">الصيانة والتذاكر</div>
                    </div>
                    <ChevronLeft className="h-4 w-4 mr-auto" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="account" className="space-y-4 px-1">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" type="email" placeholder="admin@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input id="phone" type="tel" placeholder="+964 750 000 0000" />
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
              <Button
                type="button"
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigateTo("/security")}
              >
                <Lock className="h-4 w-4 ml-2" />
                إعدادات الأمان المتقدمة
              </Button>
            </TabsContent>

            <TabsContent value="system" className="space-y-6 px-1">
              {/* معلومات الشركة */}
              <div className="space-y-4 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border border-primary/10">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Building className="h-4 w-4 text-primary" />
                  معلومات الشركة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">اسم الشركة</Label>
                    <Input id="company-name" placeholder="اسم شركتك" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-phone">هاتف الشركة</Label>
                    <Input id="company-phone" placeholder="07xxxxxxxxx" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="company-address">عنوان الشركة</Label>
                    <Input id="company-address" placeholder="عنوان الشركة الكامل" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-email">البريد الإلكتروني</Label>
                    <Input id="company-email" type="email" placeholder="info@company.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-website">الموقع الإلكتروني</Label>
                    <Input id="company-website" placeholder="www.company.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo">شعار النظام</Label>
                  <Input id="logo" type="file" accept="image/*" className="cursor-pointer" />
                </div>
              </div>

              {/* المظهر والعرض */}
              <div className="space-y-4 p-4 rounded-lg bg-gradient-to-r from-violet-500/5 to-transparent border border-violet-500/10">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-violet-500" />
                  المظهر والعرض
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <Label htmlFor="dark-mode">الوضع الداكن</Label>
                    </div>
                    <Switch
                      id="dark-mode"
                      checked={darkMode}
                      onCheckedChange={setDarkMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="theme-color">لون النظام الأساسي</Label>
                    <div className="flex gap-2">
                      <Input id="theme-color" type="color" defaultValue="#1e40af" className="w-16 h-10 p-1 cursor-pointer" />
                      <Input defaultValue="#1e40af" className="flex-1" readOnly />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="font-size">حجم الخط</Label>
                    <select
                      id="font-size"
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="small">صغير</option>
                      <option value="medium">متوسط</option>
                      <option value="large">كبير</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">اللغة الافتراضية</Label>
                    <select
                      id="language"
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* إعدادات الطباعة */}
              <div className="space-y-4 p-4 rounded-lg bg-gradient-to-r from-emerald-500/5 to-transparent border border-emerald-500/10">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-500" />
                  إعدادات الطباعة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="print-format">تنسيق الطباعة</Label>
                    <select
                      id="print-format"
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="a4">A4</option>
                      <option value="a5">A5</option>
                      <option value="thermal">حراري (80mm)</option>
                      <option value="thermal-58">حراري (58mm)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="print-copies">عدد النسخ الافتراضي</Label>
                    <Input id="print-copies" type="number" defaultValue="1" min="1" max="5" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label htmlFor="print-logo">طباعة الشعار</Label>
                    <Switch id="print-logo" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label htmlFor="print-footer">طباعة التذييل</Label>
                    <Switch id="print-footer" defaultChecked />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-footer">نص تذييل الفاتورة</Label>
                  <textarea
                    id="invoice-footer"
                    className="w-full min-h-[60px] px-3 py-2 border rounded-md bg-background text-sm"
                    placeholder="شكراً لتعاملكم معنا..."
                    defaultValue="شكراً لتعاملكم معنا - للاستفسار يرجى الاتصال على الرقم أعلاه"
                  />
                </div>
              </div>

              {/* إعدادات متقدمة */}
              <div className="space-y-4 p-4 rounded-lg bg-gradient-to-r from-orange-500/5 to-transparent border border-orange-500/10">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Settings className="h-4 w-4 text-orange-500" />
                  إعدادات متقدمة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label htmlFor="auto-backup">النسخ الاحتياطي التلقائي</Label>
                    <Switch id="auto-backup" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label htmlFor="audit-log">تسجيل العمليات</Label>
                    <Switch id="audit-log" defaultChecked />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">مهلة الجلسة (دقيقة)</Label>
                    <Input id="session-timeout" type="number" defaultValue="30" min="5" max="120" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-login-attempts">محاولات تسجيل الدخول القصوى</Label>
                    <Input id="max-login-attempts" type="number" defaultValue="5" min="3" max="10" />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="billing" className="space-y-4 px-1">
              <div className="space-y-2">
                <Label htmlFor="tax">نسبة الضريبة (%)</Label>
                <Input id="tax" type="number" defaultValue="0" min="0" max="100" />
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
                <Label htmlFor="currency">العملة الافتراضية</Label>
                <select
                  id="currency"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="IQD">دينار عراقي (IQD)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="late-fee">غرامة التأخير (%)</Label>
                <Input id="late-fee" type="number" defaultValue="5" min="0" max="100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grace-period">فترة السماح (أيام)</Label>
                <Input id="grace-period" type="number" defaultValue="7" min="0" />
              </div>
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-4 px-1">
              <div className="space-y-2">
                <Label htmlFor="sla">مدة SLA الافتراضية (ساعات)</Label>
                <Input id="sla" type="number" defaultValue="24" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auto-assign">تعيين الفني تلقائياً</Label>
                <Switch id="auto-assign" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue-types">أنواع الأعطال المسبقة</Label>
                <textarea
                  id="issue-types"
                  className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-background"
                  placeholder="انقطاع الإنترنت&#10;بطء الخدمة&#10;مشكلة في الراوتر"
                  defaultValue="انقطاع الإنترنت&#10;بطء الخدمة&#10;مشكلة في الراوتر&#10;مشكلة في الكابل&#10;جهاز ONT محروق&#10;UPS مفصول"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority-levels">مستويات الأولوية</Label>
                <textarea
                  id="priority-levels"
                  className="w-full min-h-[80px] px-3 py-2 border rounded-md bg-background"
                  defaultValue="منخفض&#10;متوسط&#10;عالي&#10;عاجل"
                />
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4 px-1">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notif">إشعارات التطبيق</Label>
                <Switch id="push-notif" defaultChecked />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sms-template">قالب رسائل SMS</Label>
                <textarea
                  id="sms-template"
                  className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-background"
                  placeholder="عزيزي العميل، تم إصدار فاتورة جديدة..."
                  defaultValue="عزيزي العميل {NAME}، تم إصدار فاتورة جديدة بمبلغ {AMOUNT}. الرجاء السداد قبل {DUE_DATE}"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reminder-days">أيام التذكير قبل الاستحقاق</Label>
                <Input id="reminder-days" type="number" defaultValue="3" min="1" />
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
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
