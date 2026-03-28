import { Helmet } from 'react-helmet-async';
import { ShieldAlert, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Unauthorized = () => {
  const { user, signOut } = useAuth();

  return (
    <>
      <Helmet>
        <title>غير مصرح | ISP</title>
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-destructive/5 p-4" dir="rtl">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="h-12 w-12 text-destructive" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-foreground">
              غير مصرح بالوصول
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              لم يتم تعيين أي دور لحسابك في النظام. يرجى التواصل مع المدير لتعيين صلاحياتك.
            </p>
          </div>

          {user?.email && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-2">
              <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
              <p className="font-medium text-foreground">{user.email}</p>
            </div>
          )}

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

export default Unauthorized;
