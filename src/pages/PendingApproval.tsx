import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Clock, UserCheck, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const PendingApproval = () => {
  const { user, roles, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // إذا تم تعيين دور للمستخدم، توجيهه للصفحة المناسبة
    if (!loading && roles.length > 0) {
      if (roles.includes('admin')) {
        navigate('/');
      } else if (roles.includes('accountant')) {
        navigate('/accountant');
      } else if (roles.includes('technician')) {
        navigate('/technician');
      } else if (roles.includes('client')) {
        navigate('/portal');
      } else {
        navigate('/');
      }
    }
  }, [roles, loading, navigate]);

  // التحقق من الأدوار كل 10 ثواني
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>في انتظار الموافقة | ISP</title>
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
        <div className="max-w-md w-full text-center space-y-8">
          {/* أيقونة الانتظار */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Clock className="h-12 w-12 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </div>

          {/* العنوان */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-foreground">
              في انتظار الموافقة
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              تم إنشاء حسابك بنجاح. يرجى الانتظار حتى يقوم المدير بتخصيص صلاحياتك للوصول إلى النظام.
            </p>
          </div>

          {/* معلومات الحساب */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
            <p className="font-medium text-foreground">{user?.email}</p>
          </div>

          {/* رسالة إضافية */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              سيتم تحديث الصفحة تلقائياً عند تعيين صلاحياتك
            </p>
          </div>

          {/* زر تسجيل الخروج */}
          <Button
            variant="outline"
            onClick={signOut}
            className="w-full gap-2"
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </Button>
        </div>
      </div>
    </>
  );
};

export default PendingApproval;
