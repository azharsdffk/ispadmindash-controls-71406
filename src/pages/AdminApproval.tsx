import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Helmet } from 'react-helmet-async';
import { Shield, LogIn, X, KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const ADMIN_PIN = '1234';

const AdminApproval = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, isSuperAdmin, loading } = useUserRole();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // Non-admin users cannot access this page
  if (user && !isAdmin && !isSuperAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleVerify = () => {
    setVerifying(true);
    setTimeout(() => {
      if (pin === ADMIN_PIN) {
        toast.success('تم التحقق بنجاح، مرحباً بك في لوحة التحكم');
        navigate('/admin', { replace: true });
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setPin('');
        if (newAttempts >= 3) {
          toast.error('تم تجاوز الحد الأقصى للمحاولات، سيتم تسجيل خروجك');
          signOut();
        } else {
          toast.error(`رمز PIN غير صحيح (${3 - newAttempts} محاولات متبقية)`);
        }
      }
      setVerifying(false);
    }, 800);
  };

  const handleCancel = () => {
    signOut();
  };

  return (
    <>
      <Helmet>
        <title>تأكيد الدخول | ISP Admin</title>
      </Helmet>

      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5" dir="rtl">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-md"
          >
            <div className="bg-card/80 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 shadow-2xl shadow-primary/10 space-y-8">
              {/* Icon */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-amber-600 mb-4 shadow-lg shadow-primary/30">
                  <Shield className="w-10 h-10 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">تأكيد دخول لوحة التحكم</h1>
                <p className="text-muted-foreground text-sm mt-2">
                  أدخل رمز PIN للمتابعة إلى لوحة الإدارة
                </p>
              </div>

              {/* User info */}
              {user?.email && (
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">تسجيل الدخول كـ</p>
                  <p className="font-medium text-foreground text-sm">{user.email}</p>
                </div>
              )}

              {/* PIN input */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                  <KeyRound className="h-4 w-4" />
                  <span>أدخل رمز PIN المكون من 4 أرقام</span>
                </div>
                <div className="flex justify-center" dir="ltr">
                  <InputOTP
                    maxLength={4}
                    value={pin}
                    onChange={setPin}
                    onComplete={handleVerify}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleVerify}
                  disabled={pin.length < 4 || verifying}
                  className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-amber-600 hover:from-primary/90 hover:to-amber-600/90 text-primary-foreground shadow-lg shadow-primary/25"
                >
                  {verifying ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>جارٍ التحقق...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <LogIn size={20} />
                      <span>دخول لوحة التحكم</span>
                    </div>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="w-full h-12 rounded-xl gap-2"
                >
                  <X size={18} />
                  <span>إلغاء وتسجيل الخروج</span>
                </Button>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6">
              هذه الصفحة محمية ومتاحة فقط للمدراء المعتمدين
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AdminApproval;
