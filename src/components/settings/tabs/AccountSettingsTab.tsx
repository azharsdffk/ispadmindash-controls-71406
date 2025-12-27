import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, Mail, Phone, Key, LogOut, Trash2, 
  Loader2, Save, Eye, EyeOff, AlertTriangle 
} from "lucide-react";
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

interface AccountSettingsTabProps {
  onClose: () => void;
}

export const AccountSettingsTab = ({ onClose }: AccountSettingsTabProps) => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: user?.email || "",
    phone: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setFormData(prev => ({
          ...prev,
          fullName: data.full_name || "",
          phone: data.phone || "",
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update password if provided
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          toast.error('كلمات المرور غير متطابقة');
          setLoading(false);
          return;
        }
        
        if (formData.newPassword.length < 6) {
          toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
          setLoading(false);
          return;
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword,
        });

        if (passwordError) throw passwordError;
        
        setFormData(prev => ({ ...prev, newPassword: "", confirmPassword: "" }));
      }

      toast.success('تم حفظ التغييرات بنجاح');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error('فشل حفظ التغييرات');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
      const { error } = await supabase.functions.invoke('manage-sessions', {
        body: { action: 'revoke_all' },
      });

      if (error) throw error;
      
      toast.success('تم تسجيل الخروج من جميع الأجهزة');
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out all:', error);
      toast.error('فشل تسجيل الخروج');
    }
  };

  const handleDeleteAccount = async () => {
    toast.error('حذف الحساب غير متاح حالياً - تواصل مع الدعم');
    setShowDeleteConfirm(false);
  };

  return (
    <div className="space-y-6">
      {/* معلومات الحساب */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            معلومات الحساب
          </CardTitle>
          <CardDescription>تعديل معلوماتك الشخصية</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                الاسم الكامل
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="أدخل اسمك"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                رقم الهاتف
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="07xxxxxxxxx"
                dir="ltr"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                value={formData.email}
                disabled
                className="bg-muted"
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">لا يمكن تغيير البريد الإلكتروني</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* تغيير كلمة المرور */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Key className="h-5 w-5 text-primary" />
            تغيير كلمة المرور
          </CardTitle>
          <CardDescription>اترك الحقول فارغة إذا لم ترد التغيير</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="••••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إجراءات الحساب */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-destructive">
            <AlertTriangle className="h-5 w-5" />
            إجراءات الحساب
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 hover:bg-warning/10 hover:border-warning"
            onClick={() => setShowLogoutAllConfirm(true)}
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج من جميع الأجهزة
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start gap-2 hover:bg-destructive/10 hover:border-destructive text-destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4" />
            حذف الحساب نهائياً
          </Button>
        </CardContent>
      </Card>

      {/* زر الحفظ */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          إلغاء
        </Button>
        <Button onClick={handleSaveProfile} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin ml-2" />
          ) : (
            <Save className="h-4 w-4 ml-2" />
          )}
          حفظ التغييرات
        </Button>
      </div>

      {/* تأكيد تسجيل الخروج من الكل */}
      <AlertDialog open={showLogoutAllConfirm} onOpenChange={setShowLogoutAllConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تسجيل الخروج من جميع الأجهزة</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إنهاء جميع جلساتك الحالية وستحتاج لتسجيل الدخول مرة أخرى. هل تريد المتابعة؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutAll} className="bg-warning hover:bg-warning/90">
              تسجيل الخروج
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* تأكيد حذف الحساب */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">حذف الحساب نهائياً</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بياناتك نهائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
              حذف الحساب
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
