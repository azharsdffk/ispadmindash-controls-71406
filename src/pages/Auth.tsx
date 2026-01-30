import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LogIn, Eye, EyeOff, UserPlus, Mail, Lock, User, Phone, Shield } from 'lucide-react';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { PasswordRecovery } from '@/components/auth/PasswordRecovery';
import { MFAVerifyScreen } from '@/components/auth/MFAVerifyScreen';
import { signupSchema, loginSchema, sanitizeInput } from '@/utils/inputValidation';
import { checkPasswordLeaked } from '@/utils/passwordStrength';

const Auth = () => {
  const { signIn, signUp, mfaRequired, completeMFASignIn, clearMFARequired } = useAuth();
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
      const sanitizedEmail = sanitizeInput(formData.email.trim().toLowerCase());
      
      if (isLogin) {
        const validatedData = loginSchema.parse({
          email: sanitizedEmail,
          password: formData.password,
        });
        
        const { error, mfaRequired: needsMFA } = await signIn(validatedData.email, validatedData.password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
          } else {
            toast.error('فشل تسجيل الدخول: ' + error.message);
          }
        } else if (needsMFA) {
          toast.info('يرجى إدخال رمز التحقق من تطبيق المصادقة');
        } else {
          toast.success('تم تسجيل الدخول بنجاح');
        }
      } else {
        const validatedData = signupSchema.parse({
          email: sanitizedEmail,
          password: formData.password,
          fullName: sanitizeInput(formData.fullName),
          phone: formData.phone ? sanitizeInput(formData.phone) : undefined,
        });
        
        toast.loading('جارٍ التحقق من أمان كلمة المرور...');
        const { isLeaked, count } = await checkPasswordLeaked(validatedData.password);
        toast.dismiss();
        
        if (isLeaked) {
          toast.error(
            `⚠️ تحذير: كلمة المرور هذه تم تسريبها في ${count.toLocaleString()} اختراق سابق. الرجاء اختيار كلمة مرور مختلفة.`,
            { duration: 8000 }
          );
          setLoading(false);
          return;
        }
        
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

  // Show MFA verification screen if required
  if (mfaRequired) {
    const handleMFAVerify = async (code: string) => {
      const { error } = await completeMFASignIn(mfaRequired.factorId, code);
      if (error) {
        throw error;
      }
      toast.success('تم التحقق بنجاح');
    };

    const handleMFACancel = () => {
      clearMFARequired();
    };

    return (
      <MFAVerifyScreen 
        factorId={mfaRequired.factorId}
        onVerify={handleMFAVerify}
        onCancel={handleMFACancel}
      />
    );
  }

  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background" dir="rtl">
        <PasswordRecovery onBack={() => setIsForgotPassword(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5" dir="rtl">
      {/* خلفية زخرفية */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* دوائر زخرفية */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        {/* خطوط ذهبية */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
      </div>

      {/* المحتوى الرئيسي */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          
          {/* البطاقة الرئيسية */}
          <div className="bg-card/80 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 shadow-2xl shadow-primary/10">
            
            {/* الشعار والعنوان */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-amber-600 mb-4 shadow-lg shadow-primary/30">
                <Shield className="w-10 h-10 text-background" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                ISP Pro System
              </h1>
              <p className="text-muted-foreground text-sm">
                نظام إدارة شبكات الإنترنت المتقدم
              </p>
            </div>

            {/* علامات التبويب */}
            <div className="flex bg-muted/50 rounded-2xl p-1.5 mb-6">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isLogin 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LogIn size={18} />
                <span>تسجيل الدخول</span>
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  !isLogin 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <UserPlus size={18} />
                <span>حساب جديد</span>
              </button>
            </div>

            {/* النموذج */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  {/* الاسم الكامل */}
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm font-medium">الاسم الكامل</Label>
                    <div className="relative">
                      <Input
                        type="text"
                        required={!isLogin}
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="أدخل اسمك الكامل"
                        className="pr-4 pl-11 h-12 bg-background/50 border-border/50 rounded-xl focus:border-primary focus:ring-primary/20"
                      />
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  {/* رقم الهاتف */}
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm font-medium">رقم الهاتف</Label>
                    <div className="relative">
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="07xxxxxxxx"
                        className="pr-4 pl-11 h-12 bg-background/50 border-border/50 rounded-xl focus:border-primary focus:ring-primary/20"
                      />
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </>
              )}
              
              {/* البريد الإلكتروني */}
              <div className="space-y-2">
                <Label className="text-foreground text-sm font-medium">البريد الإلكتروني</Label>
                <div className="relative">
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@email.com"
                    className="pr-4 pl-11 h-12 bg-background/50 border-border/50 rounded-xl focus:border-primary focus:ring-primary/20"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              {/* كلمة المرور */}
              <div className="space-y-2">
                <Label className="text-foreground text-sm font-medium">كلمة المرور</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    minLength={6}
                    className="pr-4 pl-20 h-12 bg-background/50 border-border/50 rounded-xl focus:border-primary focus:ring-primary/20"
                  />
                  <Lock className="absolute left-12 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {!isLogin && formData.password && (
                  <div className="pt-1">
                    <PasswordStrengthIndicator password={formData.password} />
                  </div>
                )}
              </div>

              {isLogin && (
                <div className="flex justify-start pt-1">
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
              )}

              {/* زر الإرسال */}
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-amber-600 hover:from-primary/90 hover:to-amber-600/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 mt-6" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>جارٍ التحميل...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isLogin ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                    <span>{isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}</span>
                  </div>
                )}
              </Button>
            </form>
          </div>

          {/* حقوق الملكية */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            © 2024 ISP Pro System • جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
