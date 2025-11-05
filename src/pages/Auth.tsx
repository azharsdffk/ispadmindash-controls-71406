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
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <LogIn className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {isForgotPassword ? 'إعادة تعيين كلمة المرور' : isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </CardTitle>
          <CardDescription>
            {isForgotPassword
              ? 'أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين'
              : isLogin
                ? 'أدخل بيانات الدخول الخاصة بك'
                : 'أدخل بياناتك لإنشاء حساب'}
          </CardDescription>
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? 'جارٍ التحميل...'
                : isForgotPassword
                  ? 'إرسال رابط إعادة التعيين'
                  : isLogin
                    ? 'تسجيل الدخول'
                    : 'إنشاء حساب'}
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            {isLogin && !isForgotPassword && (
              <Button
                type="button"
                variant="link"
                onClick={() => setIsForgotPassword(true)}
                className="text-sm w-full"
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
                className="text-sm"
              >
                العودة إلى تسجيل الدخول
              </Button>
            ) : (
              <Button
                type="button"
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm"
              >
                {isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب؟ سجل الدخول'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
