import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  CreditCard,
  Building2,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Moon,
  Sun,
  Languages,
  Printer,
  Database,
  Cloud,
  HardDrive,
  Wifi,
  BellRing,
  MessageSquare,
  Send,
  Smartphone,
  Monitor,
  Zap,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Info,
  ChevronRight,
  Crown,
  Percent,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Calculator,
  Wrench,
  Users,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Server,
  Cpu,
  MemoryStick
} from "lucide-react";
import { useState, useEffect } from "react";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SystemStats {
  totalUsers: number;
  activeSubscribers: number;
  totalInvoices: number;
  totalTickets: number;
  storageUsed: number;
  lastBackup: string;
}

interface ProfileData {
  full_name: string;
  phone: string;
  username: string;
}

interface CompanySettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  taxNumber: string;
  currency: string;
  timezone: string;
  language: string;
}

interface AppearanceSettings {
  darkMode: boolean;
  primaryColor: string;
  fontSize: string;
  compactMode: boolean;
  animations: boolean;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  paymentAlerts: boolean;
  ticketAlerts: boolean;
  expiryReminders: boolean;
  reminderDays: number;
}

interface BillingSettings {
  taxRate: number;
  gracePeriod: number;
  lateFeePercent: number;
  autoInvoice: boolean;
  billingCycle: string;
}

const Settings = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [confirmReset, setConfirmReset] = useState(false);
  const [settingsProgress, setSettingsProgress] = useState(0);

  // System Stats
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeSubscribers: 0,
    totalInvoices: 0,
    totalTickets: 0,
    storageUsed: 0,
    lastBackup: ''
  });

  // Profile Settings
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    phone: '',
    username: ''
  });

  // Password Change
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  // Company Settings
  const [company, setCompany] = useState<CompanySettings>({
    companyName: 'شركة الإنترنت المتقدمة',
    companyAddress: 'بغداد، العراق',
    companyPhone: '+964 770 123 4567',
    companyEmail: 'info@company.iq',
    taxNumber: 'TAX-2024-001',
    currency: 'IQD',
    timezone: 'Asia/Baghdad',
    language: 'ar'
  });

  // Appearance Settings
  const [appearance, setAppearance] = useState<AppearanceSettings>({
    darkMode: true,
    primaryColor: 'blue',
    fontSize: 'medium',
    compactMode: false,
    animations: true
  });

  // Notification Preferences
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    paymentAlerts: true,
    ticketAlerts: true,
    expiryReminders: true,
    reminderDays: 7
  });

  // Billing Settings
  const [billing, setBilling] = useState<BillingSettings>({
    taxRate: 15,
    gracePeriod: 5,
    lateFeePercent: 2,
    autoInvoice: true,
    billingCycle: 'monthly'
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    calculateProgress();
  }, [profile, company, appearance, notifications, billing]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          username: profileData.username || ''
        });
      }

      // Fetch stats
      const [usersResult, subscribersResult, invoicesResult, ticketsResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('subscribers').select('id', { count: 'exact', head: true }),
        supabase.from('invoices').select('id', { count: 'exact', head: true }),
        supabase.from('maintenance_tickets').select('id', { count: 'exact', head: true })
      ]);

      setStats({
        totalUsers: usersResult.count || 0,
        activeSubscribers: subscribersResult.count || 0,
        totalInvoices: invoicesResult.count || 0,
        totalTickets: ticketsResult.count || 0,
        storageUsed: 45,
        lastBackup: new Date().toLocaleDateString('ar-IQ')
      });
    } catch (error) {
      console.error('Error fetching settings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    let completed = 0;
    const total = 10;

    if (profile.full_name) completed++;
    if (profile.phone) completed++;
    if (profile.username) completed++;
    if (company.companyName) completed++;
    if (company.companyEmail) completed++;
    if (company.companyPhone) completed++;
    if (notifications.emailNotifications || notifications.smsNotifications) completed++;
    if (billing.taxRate > 0) completed++;
    if (appearance.primaryColor) completed++;
    if (company.currency) completed++;

    setSettingsProgress((completed / total) * 100);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          username: profile.username,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('تم حفظ الملف الشخصي بنجاح');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('فشل في حفظ الملف الشخصي');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    if (passwords.new.length < 8) {
      toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) throw error;
      toast.success('تم تغيير كلمة المرور بنجاح');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('فشل في تغيير كلمة المرور');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Simulate saving settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      toast.error('فشل في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    setCompany({
      companyName: 'شركة الإنترنت المتقدمة',
      companyAddress: 'بغداد، العراق',
      companyPhone: '+964 770 123 4567',
      companyEmail: 'info@company.iq',
      taxNumber: 'TAX-2024-001',
      currency: 'IQD',
      timezone: 'Asia/Baghdad',
      language: 'ar'
    });
    setAppearance({
      darkMode: true,
      primaryColor: 'blue',
      fontSize: 'medium',
      compactMode: false,
      animations: true
    });
    setNotifications({
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      paymentAlerts: true,
      ticketAlerts: true,
      expiryReminders: true,
      reminderDays: 7
    });
    setBilling({
      taxRate: 15,
      gracePeriod: 5,
      lateFeePercent: 2,
      autoInvoice: true,
      billingCycle: 'monthly'
    });
    setConfirmReset(false);
    toast.success('تم إعادة تعيين الإعدادات');
  };

  const statsCards = [
    { 
      label: 'المستخدمون', 
      value: stats.totalUsers, 
      icon: Users, 
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20'
    },
    { 
      label: 'المشتركون', 
      value: stats.activeSubscribers, 
      icon: TrendingUp, 
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20'
    },
    { 
      label: 'الفواتير', 
      value: stats.totalInvoices, 
      icon: FileText, 
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20'
    },
    { 
      label: 'التذاكر', 
      value: stats.totalTickets, 
      icon: Wrench, 
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20'
    },
    { 
      label: 'التخزين', 
      value: `${stats.storageUsed}%`, 
      icon: HardDrive, 
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20'
    },
    { 
      label: 'آخر نسخة', 
      value: stats.lastBackup || 'لا يوجد', 
      icon: Cloud, 
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10 border-pink-500/20'
    }
  ];

  const tabItems = [
    { id: 'profile', label: 'الملف الشخصي', icon: User },
    { id: 'company', label: 'الشركة', icon: Building2 },
    { id: 'appearance', label: 'المظهر', icon: Palette },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'billing', label: 'الفوترة', icon: CreditCard },
    { id: 'security', label: 'الأمان', icon: Shield },
    { id: 'system', label: 'النظام', icon: Server }
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
        
        <div className="flex flex-1 w-full">
          <AppSidebar />
          
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                    <SettingsIcon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                      الإعدادات
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      إدارة إعدادات النظام والتفضيلات
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setConfirmReset(true)}
                  >
                    <RotateCcw className="h-4 w-4" />
                    إعادة تعيين
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={handleSaveSettings}
                    disabled={saving}
                  >
                    {saving ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    حفظ التغييرات
                  </Button>
                </div>
              </div>

              {/* Progress Card */}
              <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <span className="font-medium">اكتمال الإعدادات</span>
                        <Badge variant="secondary" className="mr-2">
                          {Math.round(settingsProgress)}%
                        </Badge>
                      </div>
                      <Progress value={settingsProgress} className="h-2" />
                      <p className="text-sm text-muted-foreground mt-2">
                        أكمل إعداداتك للحصول على أفضل تجربة
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {settingsProgress === 100 ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          مكتمل
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1">
                          <AlertCircle className="h-3 w-3" />
                          غير مكتمل
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {statsCards.map((stat, index) => (
                  <Card 
                    key={index}
                    className={`${stat.bgColor} border transition-all duration-300 hover:scale-105 hover:shadow-lg`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-background/50`}>
                          <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Main Settings Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-muted/50 p-1 h-auto flex-wrap justify-start gap-1">
                  {tabItems.map((tab) => (
                    <TabsTrigger 
                      key={tab.id}
                      value={tab.id}
                      className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5 text-primary" />
                          المعلومات الشخصية
                        </CardTitle>
                        <CardDescription>
                          تحديث معلوماتك الشخصية
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">الاسم الكامل</Label>
                          <Input
                            id="fullName"
                            value={profile.full_name}
                            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                            placeholder="أدخل اسمك الكامل"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="username">اسم المستخدم</Label>
                          <Input
                            id="username"
                            value={profile.username}
                            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                            placeholder="اسم المستخدم"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">رقم الهاتف</Label>
                          <Input
                            id="phone"
                            value={profile.phone}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            placeholder="+964 xxx xxx xxxx"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">البريد الإلكتروني</Label>
                          <Input
                            id="email"
                            value={user?.email || ''}
                            disabled
                            className="bg-muted"
                          />
                          <p className="text-xs text-muted-foreground">
                            لا يمكن تغيير البريد الإلكتروني
                          </p>
                        </div>
                        <Button 
                          className="w-full gap-2"
                          onClick={handleSaveProfile}
                          disabled={saving}
                        >
                          {saving ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          حفظ المعلومات
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lock className="h-5 w-5 text-primary" />
                          تغيير كلمة المرور
                        </CardTitle>
                        <CardDescription>
                          تحديث كلمة المرور الخاصة بك
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showPassword ? 'text' : 'password'}
                              value={passwords.current}
                              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                              placeholder="أدخل كلمة المرور الحالية"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                          <Input
                            id="newPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={passwords.new}
                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                            placeholder="أدخل كلمة المرور الجديدة"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                          <Input
                            id="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                            placeholder="أعد إدخال كلمة المرور الجديدة"
                          />
                        </div>
                        <Button 
                          className="w-full gap-2"
                          onClick={handleChangePassword}
                          disabled={saving || !passwords.new || !passwords.confirm}
                        >
                          <Lock className="h-4 w-4" />
                          تغيير كلمة المرور
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Company Tab */}
                <TabsContent value="company" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          معلومات الشركة
                        </CardTitle>
                        <CardDescription>
                          بيانات الشركة الأساسية
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="companyName">اسم الشركة</Label>
                          <Input
                            id="companyName"
                            value={company.companyName}
                            onChange={(e) => setCompany({ ...company, companyName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="companyAddress">العنوان</Label>
                          <Textarea
                            id="companyAddress"
                            value={company.companyAddress}
                            onChange={(e) => setCompany({ ...company, companyAddress: e.target.value })}
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="companyPhone">رقم الهاتف</Label>
                          <Input
                            id="companyPhone"
                            value={company.companyPhone}
                            onChange={(e) => setCompany({ ...company, companyPhone: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="companyEmail">البريد الإلكتروني</Label>
                          <Input
                            id="companyEmail"
                            type="email"
                            value={company.companyEmail}
                            onChange={(e) => setCompany({ ...company, companyEmail: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="taxNumber">الرقم الضريبي</Label>
                          <Input
                            id="taxNumber"
                            value={company.taxNumber}
                            onChange={(e) => setCompany({ ...company, taxNumber: e.target.value })}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Globe className="h-5 w-5 text-primary" />
                          الإعدادات الإقليمية
                        </CardTitle>
                        <CardDescription>
                          العملة والمنطقة الزمنية واللغة
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currency">العملة</Label>
                          <Select
                            value={company.currency}
                            onValueChange={(value) => setCompany({ ...company, currency: value })}
                          >
                            <SelectTrigger id="currency">
                              <SelectValue placeholder="اختر العملة" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="IQD">الدينار العراقي (IQD)</SelectItem>
                              <SelectItem value="USD">الدولار الأمريكي (USD)</SelectItem>
                              <SelectItem value="EUR">اليورو (EUR)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="timezone">المنطقة الزمنية</Label>
                          <Select
                            value={company.timezone}
                            onValueChange={(value) => setCompany({ ...company, timezone: value })}
                          >
                            <SelectTrigger id="timezone">
                              <SelectValue placeholder="اختر المنطقة الزمنية" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Asia/Baghdad">بغداد (GMT+3)</SelectItem>
                              <SelectItem value="Asia/Dubai">دبي (GMT+4)</SelectItem>
                              <SelectItem value="Asia/Riyadh">الرياض (GMT+3)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="language">اللغة</Label>
                          <Select
                            value={company.language}
                            onValueChange={(value) => setCompany({ ...company, language: value })}
                          >
                            <SelectTrigger id="language">
                              <SelectValue placeholder="اختر اللغة" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ar">العربية</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="ku">کوردی</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Appearance Tab */}
                <TabsContent value="appearance" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Palette className="h-5 w-5 text-primary" />
                          المظهر العام
                        </CardTitle>
                        <CardDescription>
                          تخصيص مظهر التطبيق
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {appearance.darkMode ? (
                              <Moon className="h-5 w-5 text-primary" />
                            ) : (
                              <Sun className="h-5 w-5 text-amber-500" />
                            )}
                            <div>
                              <Label>الوضع الليلي</Label>
                              <p className="text-sm text-muted-foreground">
                                تفعيل الوضع الداكن
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={appearance.darkMode}
                            onCheckedChange={(checked) => setAppearance({ ...appearance, darkMode: checked })}
                          />
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <Label>اللون الأساسي</Label>
                          <div className="flex gap-2 flex-wrap">
                            {['blue', 'green', 'purple', 'red', 'orange', 'pink'].map((color) => (
                              <button
                                key={color}
                                className={`w-10 h-10 rounded-lg border-2 transition-all ${
                                  appearance.primaryColor === color 
                                    ? 'border-foreground scale-110' 
                                    : 'border-transparent'
                                }`}
                                style={{ 
                                  backgroundColor: color === 'blue' ? '#3b82f6' :
                                    color === 'green' ? '#22c55e' :
                                    color === 'purple' ? '#a855f7' :
                                    color === 'red' ? '#ef4444' :
                                    color === 'orange' ? '#f97316' : '#ec4899'
                                }}
                                onClick={() => setAppearance({ ...appearance, primaryColor: color })}
                              />
                            ))}
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Label>حجم الخط</Label>
                          <Select
                            value={appearance.fontSize}
                            onValueChange={(value) => setAppearance({ ...appearance, fontSize: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر حجم الخط" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">صغير</SelectItem>
                              <SelectItem value="medium">متوسط</SelectItem>
                              <SelectItem value="large">كبير</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-primary" />
                          خيارات إضافية
                        </CardTitle>
                        <CardDescription>
                          إعدادات متقدمة للعرض
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>الوضع المضغوط</Label>
                            <p className="text-sm text-muted-foreground">
                              تقليل المسافات بين العناصر
                            </p>
                          </div>
                          <Switch
                            checked={appearance.compactMode}
                            onCheckedChange={(checked) => setAppearance({ ...appearance, compactMode: checked })}
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div>
                            <Label>الرسوم المتحركة</Label>
                            <p className="text-sm text-muted-foreground">
                              تفعيل التأثيرات الحركية
                            </p>
                          </div>
                          <Switch
                            checked={appearance.animations}
                            onCheckedChange={(checked) => setAppearance({ ...appearance, animations: checked })}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <NotificationSettings />

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BellRing className="h-5 w-5 text-primary" />
                          تفضيلات الإشعارات
                        </CardTitle>
                        <CardDescription>
                          اختر أنواع الإشعارات التي تريد تلقيها
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <Label>إشعارات البريد</Label>
                              <p className="text-xs text-muted-foreground">
                                استلام التحديثات عبر البريد
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={notifications.emailNotifications}
                            onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <Label>رسائل SMS</Label>
                              <p className="text-xs text-muted-foreground">
                                استلام رسائل نصية قصيرة
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={notifications.smsNotifications}
                            onCheckedChange={(checked) => setNotifications({ ...notifications, smsNotifications: checked })}
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <Label>إشعارات الهاتف</Label>
                              <p className="text-xs text-muted-foreground">
                                إشعارات على الجهاز المحمول
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={notifications.pushNotifications}
                            onCheckedChange={(checked) => setNotifications({ ...notifications, pushNotifications: checked })}
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <Label>تنبيهات الدفع</Label>
                              <p className="text-xs text-muted-foreground">
                                إشعار عند استلام دفعات
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={notifications.paymentAlerts}
                            onCheckedChange={(checked) => setNotifications({ ...notifications, paymentAlerts: checked })}
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Wrench className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <Label>تنبيهات التذاكر</Label>
                              <p className="text-xs text-muted-foreground">
                                إشعار عند فتح تذاكر صيانة
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={notifications.ticketAlerts}
                            onCheckedChange={(checked) => setNotifications({ ...notifications, ticketAlerts: checked })}
                          />
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Label>أيام التذكير المسبق</Label>
                          <Select
                            value={notifications.reminderDays.toString()}
                            onValueChange={(value) => setNotifications({ ...notifications, reminderDays: parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر عدد الأيام" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3">3 أيام</SelectItem>
                              <SelectItem value="5">5 أيام</SelectItem>
                              <SelectItem value="7">7 أيام</SelectItem>
                              <SelectItem value="14">14 يوم</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Billing Tab */}
                <TabsContent value="billing" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calculator className="h-5 w-5 text-primary" />
                          إعدادات الضريبة
                        </CardTitle>
                        <CardDescription>
                          تكوين معدلات الضريبة والرسوم
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="taxRate">نسبة الضريبة (%)</Label>
                          <Input
                            id="taxRate"
                            type="number"
                            value={billing.taxRate}
                            onChange={(e) => setBilling({ ...billing, taxRate: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lateFee">رسوم التأخير (%)</Label>
                          <Input
                            id="lateFee"
                            type="number"
                            value={billing.lateFeePercent}
                            onChange={(e) => setBilling({ ...billing, lateFeePercent: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="gracePeriod">فترة السماح (أيام)</Label>
                          <Input
                            id="gracePeriod"
                            type="number"
                            value={billing.gracePeriod}
                            onChange={(e) => setBilling({ ...billing, gracePeriod: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          دورة الفوترة
                        </CardTitle>
                        <CardDescription>
                          إعدادات إصدار الفواتير
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="billingCycle">دورة الفوترة</Label>
                          <Select
                            value={billing.billingCycle}
                            onValueChange={(value) => setBilling({ ...billing, billingCycle: value })}
                          >
                            <SelectTrigger id="billingCycle">
                              <SelectValue placeholder="اختر دورة الفوترة" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">أسبوعي</SelectItem>
                              <SelectItem value="monthly">شهري</SelectItem>
                              <SelectItem value="quarterly">ربع سنوي</SelectItem>
                              <SelectItem value="yearly">سنوي</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div>
                            <Label>الفوترة التلقائية</Label>
                            <p className="text-sm text-muted-foreground">
                              إصدار الفواتير تلقائياً
                            </p>
                          </div>
                          <Switch
                            checked={billing.autoInvoice}
                            onCheckedChange={(checked) => setBilling({ ...billing, autoInvoice: checked })}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        إعدادات الأمان
                      </CardTitle>
                      <CardDescription>
                        إدارة إعدادات الأمان والخصوصية
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/20">
                              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-medium">المصادقة الثنائية</p>
                              <p className="text-sm text-muted-foreground">غير مفعلة</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="w-full">
                            تفعيل
                          </Button>
                        </div>

                        <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/20">
                              <Monitor className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium">الجلسات النشطة</p>
                              <p className="text-sm text-muted-foreground">1 جلسة</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="w-full" asChild>
                            <a href="/security">إدارة الجلسات</a>
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium">سجل النشاط الأخير</h4>
                        <div className="space-y-2">
                          {[
                            { action: 'تسجيل دخول ناجح', time: 'منذ ساعة', icon: CheckCircle2, color: 'text-emerald-400' },
                            { action: 'تحديث الملف الشخصي', time: 'منذ يومين', icon: User, color: 'text-blue-400' },
                            { action: 'تغيير كلمة المرور', time: 'منذ أسبوع', icon: Lock, color: 'text-amber-400' }
                          ].map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                              <div className="flex items-center gap-3">
                                <item.icon className={`h-4 w-4 ${item.color}`} />
                                <span className="text-sm">{item.action}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">{item.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* System Tab */}
                <TabsContent value="system" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Database className="h-5 w-5 text-primary" />
                          النسخ الاحتياطي
                        </CardTitle>
                        <CardDescription>
                          إدارة النسخ الاحتياطية للبيانات
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 rounded-lg border border-border bg-muted/30">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm">آخر نسخة احتياطية</span>
                            <Badge variant="secondary">{stats.lastBackup || 'لا يوجد'}</Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 gap-2">
                              <Download className="h-4 w-4" />
                              تحميل
                            </Button>
                            <Button size="sm" className="flex-1 gap-2">
                              <Upload className="h-4 w-4" />
                              نسخ احتياطي
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">النسخ الاحتياطي التلقائي</span>
                            <Switch defaultChecked />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            يتم إنشاء نسخة احتياطية يومياً الساعة 3 صباحاً
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-primary" />
                          حالة النظام
                        </CardTitle>
                        <CardDescription>
                          معلومات أداء النظام
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Server className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">الخادم</span>
                            </div>
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              متصل
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Database className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">قاعدة البيانات</span>
                            </div>
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              نشطة
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <HardDrive className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">التخزين</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{stats.storageUsed}% مستخدم</span>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Label>استخدام التخزين</Label>
                          <Progress value={stats.storageUsed} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            45 GB من 100 GB
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                          <AlertCircle className="h-5 w-5" />
                          منطقة الخطر
                        </CardTitle>
                        <CardDescription>
                          إجراءات لا يمكن التراجع عنها
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <p className="font-medium">حذف جميع البيانات</p>
                              <p className="text-sm text-muted-foreground">
                                سيتم حذف جميع البيانات بشكل نهائي ولا يمكن استعادتها
                              </p>
                            </div>
                            <Button variant="destructive" size="sm" className="gap-2">
                              <Trash2 className="h-4 w-4" />
                              حذف البيانات
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>

        {/* Reset Confirmation Dialog */}
        <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-amber-500" />
                إعادة تعيين الإعدادات
              </AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من إعادة تعيين جميع الإعدادات إلى الوضع الافتراضي؟
                لن يتم حذف بياناتك الشخصية.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetSettings} className="bg-amber-500 hover:bg-amber-600">
                إعادة تعيين
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    </TooltipProvider>
  );
};

export default Settings;
