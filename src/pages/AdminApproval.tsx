import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';
import { Shield, LogIn, X, KeyRound, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const AdminApproval = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, isSuperAdmin, loading } = useUserRole();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  useEffect(() => {
    if (user && (isAdmin || isSuperAdmin) && !loading) {
      checkPinExists();
    }
  }, [user, isAdmin, isSuperAdmin, loading]);

  const checkPinExists = async () => {
    const { data } = await supabase
      .from('admin_pins')
      .select('id')
      .eq('user_id', user!.id)
      .maybeSingle();
    setHasPin(!!data);
    if (!data) setIsSettingPin(true);
  };

  if (loading || hasPin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (user && !isAdmin && !isSuperAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSetPin = async () => {
    if (newPin.length < 4) {
      toast.error('أدخل رمز PIN مكون من 4 أرقام');
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('رمز PIN غير متطابق');
      setConfirmPin('');
      return;
    }
    setSavingPin(true);
    const { error } = await supabase.rpc('set_admin_pin', { p_pin: newPin });
    setSavingPin(false);
    if (error) {
      toast.error('فشل حفظ رمز PIN: ' + error.message);
    } else {
      toast.success('تم تعيين رمز PIN بنجاح');
      setHasPin(true);
      setIsSettingPin(false);
      setNewPin('');
      setConfirmPin('');
    }
  };

  const handleVerify = async () => {
    if (pin.length < 4) return;
    setVerifying(true);
    const { data, error } = await supabase.rpc('verify_admin_pin', { p_pin: pin });
    setVerifying(false);

    if (error) {
      toast.error('خطأ في التحقق');
      return;
    }

    const result = data?.[0];
    if (result?.success) {
      toast.success('تم التحقق بنجاح، مرحباً بك في لوحة التحكم');
      navigate('/admin', { replace: true });
    } else {
      setPin('');
      if (result?.message?.includes('محظور')) {
        toast.error(result.message);
        signOut();
      } else {
        toast.error(result?.message || 'رمز PIN غير صحيح');
      }
    }
  };

  // Set PIN screen (first time)
  if (isSettingPin) {
    return (
      <>
        <Helmet><title>تعيين رمز PIN | ISP Admin</title></Helmet>
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5" dir="rtl">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
              <div className="bg-card/80 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 shadow-2xl shadow-primary/10 space-y-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-amber-600 mb-4 shadow-lg shadow-primary/30">
                    <KeyRound className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">تعيين رمز PIN</h1>
                  <p className="text-muted-foreground text-sm mt-2">قم بإنشاء رمز PIN للدخول إلى لوحة التحكم</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground text-center">أدخل رمز PIN جديد (4 أرقام)</p>
                    <div className="flex justify-center" dir="ltr">
                      <InputOTP maxLength={4} value={newPin} onChange={setNewPin}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground text-center">تأكيد رمز PIN</p>
                    <div className="flex justify-center" dir="ltr">
                      <InputOTP maxLength={4} value={confirmPin} onChange={setConfirmPin}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSetPin}
                  disabled={newPin.length < 4 || confirmPin.length < 4 || savingPin}
                  className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-amber-600 hover:from-primary/90 hover:to-amber-600/90 text-primary-foreground shadow-lg shadow-primary/25"
                >
                  {savingPin ? (
                    <div className="flex items-center gap-3"><Loader2 className="w-5 h-5 animate-spin" /><span>جارٍ الحفظ...</span></div>
                  ) : (
                    <div className="flex items-center gap-2"><Save size={20} /><span>حفظ رمز PIN</span></div>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </>
    );
  }

  // Verify PIN screen
  return (
    <>
      <Helmet><title>تأكيد الدخول | ISP Admin</title></Helmet>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5" dir="rtl">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
        </div>
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
            <div className="bg-card/80 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 shadow-2xl shadow-primary/10 space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-amber-600 mb-4 shadow-lg shadow-primary/30">
                  <Shield className="w-10 h-10 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">تأكيد دخول لوحة التحكم</h1>
                <p className="text-muted-foreground text-sm mt-2">أدخل رمز PIN للمتابعة</p>
              </div>

              {user?.email && (
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">تسجيل الدخول كـ</p>
                  <p className="font-medium text-foreground text-sm">{user.email}</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                  <KeyRound className="h-4 w-4" />
                  <span>أدخل رمز PIN المكون من 4 أرقام</span>
                </div>
                <div className="flex justify-center" dir="ltr">
                  <InputOTP maxLength={4} value={pin} onChange={setPin} onComplete={handleVerify}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleVerify}
                  disabled={pin.length < 4 || verifying}
                  className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-amber-600 hover:from-primary/90 hover:to-amber-600/90 text-primary-foreground shadow-lg shadow-primary/25"
                >
                  {verifying ? (
                    <div className="flex items-center gap-3"><Loader2 className="w-5 h-5 animate-spin" /><span>جارٍ التحقق...</span></div>
                  ) : (
                    <div className="flex items-center gap-2"><LogIn size={20} /><span>دخول لوحة التحكم</span></div>
                  )}
                </Button>
                <Button variant="outline" onClick={() => signOut()} className="w-full h-12 rounded-xl gap-2">
                  <X size={18} /><span>إلغاء وتسجيل الخروج</span>
                </Button>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-6">هذه الصفحة محمية ومتاحة فقط للمدراء المعتمدين</p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AdminApproval;
