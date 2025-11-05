import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { validatePassword } from '@/utils/passwordStrength';
import { signupSchema, loginSchema, emailSchema, sanitizeInput } from '@/utils/inputValidation';

const Auth = () => {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(formData.email.trim().toLowerCase());
      
      if (isForgotPassword) {
        // Validate email
        const validatedEmail = emailSchema.parse(sanitizedEmail);
        
        const { error } = await supabase.auth.resetPasswordForEmail(validatedEmail, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) {
          toast.error('فشل إرسال رابط إعادة التعيين: ' + error.message);
        } else {
          toast.success('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
          setIsForgotPassword(false);
        }
      } else if (isLogin) {
        // Validate login data
        const validatedData = loginSchema.parse({
          email: sanitizedEmail,
          password: formData.password,
        });
        
        const { error } = await signIn(validatedData.email, validatedData.password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
          } else {
            toast.error('فشل تسجيل الدخول: ' + error.message);
          }
        } else {
          toast.success('تم تسجيل الدخول بنجاح');
        }
      } else {
        // Validate signup data
        const validatedData = signupSchema.parse({
          email: sanitizedEmail,
          password: formData.password,
          fullName: sanitizeInput(formData.fullName),
          phone: formData.phone ? sanitizeInput(formData.phone) : undefined,
        });
        
        const { error } = await signUp(
          validatedData.email, 
          validatedData.password, 
          validatedData.fullName, 
          validatedData.phone
        );
        
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('هذا البريد الإلكتروني مسجل بالفعل');
          } else {
            toast.error('فشل التسجيل: ' + error.message);
          }
        } else {
          toast.success('تم إنشاء الحساب بنجاح');
        }
      }
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        toast.error(error.issues[0].message);
      } else {
        console.error('Auth error:', error);
        toast.error('حدث خطأ غير متوقع');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5" dir="rtl">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-card/95 backdrop-blur">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative p-4 rounded-2xl gradient-bg">
                <LogIn className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold gradient-text">
              {isForgotPassword ? 'إعادة تعيين كلمة المرور' : isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {isForgotPassword
                ? 'أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين'
                : isLogin
                  ? 'أدخل بيانات الدخول الخاصة بك'
                  : 'أدخل بياناتك لإنشاء حساب'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !isForgotPassword && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">الاسم الكامل *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    required={!isLogin}
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="أدخل الاسم الكامل"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="07xxxxxxxx"
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="example@email.com"
              />
            </div>
            {!isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {!isLogin && formData.password && (
                  <PasswordStrengthIndicator password={formData.password} />
                )}
              </div>
            )}
            <Button type="submit" className="w-full h-12 text-base gradient-bg hover:opacity-90 transition-opacity" disabled={loading}>
              {loading
                ? 'جارٍ التحميل...'
                : isForgotPassword
                  ? 'إرسال رابط إعادة التعيين'
                  : isLogin
                    ? 'تسجيل الدخول'
                    : 'إنشاء حساب'}
            </Button>
          </form>
          <div className="mt-6 text-center space-y-2 pt-4 border-t">
            {isLogin && !isForgotPassword && (
              <Button
                type="button"
                variant="link"
                onClick={() => setIsForgotPassword(true)}
                className="text-sm w-full text-primary hover:text-primary/80"
              >
                نسيت كلمة المرور؟
              </Button>
            )}
            {isForgotPassword ? (
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  setIsForgotPassword(false);
                  setIsLogin(true);
                }}
                className="text-sm text-primary hover:text-primary/80"
              >
                العودة إلى تسجيل الدخول
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsLogin(!isLogin)}
                  className="w-full"
                >
                  {isLogin ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
