import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Settings, 
  Lock, 
  Phone, 
  MapPin, 
  LogOut,
  Loader2,
  Eye,
  EyeOff,
  Save
} from 'lucide-react';

interface CustomerAccountSettingsProps {
  subscriber: {
    id: string;
    name: string;
    phone: string;
    address: string | null;
  };
  onUpdate: () => void;
}

export function CustomerAccountSettings({ subscriber, onUpdate }: CustomerAccountSettingsProps) {
  const { signOut } = useAuth();
  const [phone, setPhone] = useState(subscriber.phone);
  const [address, setAddress] = useState(subscriber.address || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updatingInfo, setUpdatingInfo] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleUpdateInfo = async () => {
    if (!phone.trim()) {
      toast.error('رقم الهاتف مطلوب');
      return;
    }

    setUpdatingInfo(true);
    try {
      const { error } = await supabase
        .from('subscribers')
        .update({
          phone: phone.trim(),
          address: address.trim() || null
        })
        .eq('id', subscriber.id);

      if (error) throw error;

      toast.success('تم تحديث البيانات بنجاح');
      onUpdate();
    } catch (error) {
      console.error('Error updating info:', error);
      toast.error('حدث خطأ في تحديث البيانات');
    } finally {
      setUpdatingInfo(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('الرجاء إدخال كلمة المرور الجديدة');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('تم تغيير كلمة المرور بنجاح');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'حدث خطأ في تغيير كلمة المرور');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      toast.success('تم تسجيل الخروج بنجاح');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('حدث خطأ في تسجيل الخروج');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Update Contact Info */}
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="pb-3 bg-gradient-to-l from-primary/10 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            تحديث بيانات التواصل
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>رقم الهاتف</Label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07xx xxx xxxx"
              className="h-12"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              العنوان
            </Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="العنوان الكامل..."
              className="h-12"
            />
          </div>

          <Button 
            onClick={handleUpdateInfo}
            disabled={updatingInfo}
            className="w-full h-12"
          >
            {updatingInfo ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Save className="h-5 w-5 ml-2" />
                حفظ التغييرات
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="shadow-lg border-amber-500/20">
        <CardHeader className="pb-3 bg-gradient-to-l from-amber-500/10 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-500" />
            تغيير كلمة المرور
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>كلمة المرور الجديدة</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 pl-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute left-1 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>تأكيد كلمة المرور</Label>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="h-12"
            />
          </div>

          <Button 
            onClick={handleUpdatePassword}
            disabled={updatingPassword || !newPassword || !confirmPassword}
            variant="secondary"
            className="w-full h-12"
          >
            {updatingPassword ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Lock className="h-5 w-5 ml-2" />
                تغيير كلمة المرور
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="shadow-lg border-destructive/20">
        <CardContent className="p-4">
          <Button 
            onClick={handleLogout}
            disabled={loggingOut}
            variant="destructive"
            className="w-full h-14 text-lg"
          >
            {loggingOut ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <LogOut className="h-5 w-5 ml-2" />
                تسجيل الخروج
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
