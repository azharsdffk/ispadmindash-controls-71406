import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LogIn, Eye, EyeOff, UserPlus, Mail, Lock, User, Phone, Sparkles, Hexagon, Triangle, Circle, Users } from 'lucide-react';
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: '' as 'client' | 'technician' | 'agent' | 'admin' | '',
  });

  const roleOptions = [
    { value: 'client', label: 'العميل', description: 'مستخدم عادي للخدمة' },
    { value: 'technician', label: 'الفني', description: 'فني صيانة ودعم' },
    { value: 'agent', label: 'الوكيل', description: 'وكيل مبيعات' },
    { value: 'admin', label: 'المدير', description: 'مدير النظام' },
  ];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
          // MFA is required, the component will switch to MFA verification
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
        
        // Check if password has been leaked
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
    <div className="min-h-screen relative overflow-hidden bg-background" dir="rtl">
      {/* الخلفية - خطوط ذهبية علوية وسفلية */}
      <div className="absolute inset-0 pointer-events-none">
        {/* خط ذهبي علوي */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
        {/* خط ذهبي سفلي */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
        
        {/* توهج خفيف في الخلفية */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              radial-gradient(ellipse at 50% 0%, hsl(45 85% 55% / 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 100%, hsl(45 85% 55% / 0.1) 0%, transparent 40%)
            `,
          }}
        />
      </div>

      {/* المحتوى الرئيسي */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-start pt-8 pb-8 px-4 overflow-y-auto">
        <div className="w-full max-w-[420px]">
          
          {/* الشعار والعنوان */}
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              <span className="text-primary">ISP Pro</span>
              <span className="text-foreground"> قاعدة</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              برنامج إدارة شبكات الانترنت المتقدمة
            </p>
          </div>

          {/* علامات التبويب */}
          <div className="relative mb-6">
            <div className="flex bg-card rounded-full p-1 border border-primary/30">
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full text-sm font-bold transition-all duration-300 ${
                  !isLogin 
                    ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-background shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <UserPlus size={18} />
                <span>حساب جديد</span>
              </button>
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full text-sm font-bold transition-all duration-300 ${
                  isLogin 
                    ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-background shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LogIn size={18} />
                <span>امتياز</span>
              </button>
            </div>
          </div>

          {/* النموذج */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                {/* الاسم الكامل */}
                <div className="space-y-2">
                  <Label className="text-foreground text-sm font-semibold block text-right">كامل</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      required={!isLogin}
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="أدخل الاسم بالكامل"
                      className="pr-4 pl-12 h-14 bg-card border-primary/30 rounded-xl text-right"
                    />
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                {/* رقم الهاتف */}
                <div className="space-y-2">
                  <Label className="text-foreground text-sm font-semibold block text-right">فوريل</Label>
                  <div className="relative">
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="07xxxxxxxx"
                      className="pr-4 pl-12 h-14 bg-card border-primary/30 rounded-xl text-right"
                    />
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                
                {/* حقل اختيار الدور */}
                <div className="space-y-3">
                  <Label className="text-foreground text-sm font-semibold block text-right">حساب غير رسمي</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {roleOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, role: option.value as any })}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                          formData.role === option.value
                            ? 'border-primary bg-primary/15 shadow-lg shadow-primary/20'
                            : 'border-primary/30 bg-card hover:border-primary/50'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2 text-center">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            formData.role === option.value
                              ? 'bg-gradient-to-br from-amber-500 to-yellow-600 text-background'
                              : 'bg-primary/20 text-primary'
                          }`}>
                            <Users size={24} />
                          </div>
                          <div>
                            <p className={`font-bold text-base ${
                              formData.role === option.value ? 'text-primary' : 'text-foreground'
                            }`}>
                              {option.label}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {option.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {/* البريد الإلكتروني */}
            <div className="space-y-2">
              <Label className="text-foreground text-sm font-semibold block text-right">البريد الإلكتروني</Label>
              <div className="relative">
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@email.com"
                  className="pr-4 pl-12 h-14 bg-card border-primary/30 rounded-xl text-right"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            
            {/* كلمة المرور */}
            <div className="space-y-2">
              <Label className="text-foreground text-sm font-semibold block text-right">كلمة المرور</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  minLength={6}
                  className="pr-4 pl-20 h-14 bg-card border-primary/30 rounded-xl text-right"
                />
                <Lock className="absolute left-12 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {!isLogin && formData.password && (
                <div className="pt-2">
                  <PasswordStrengthIndicator password={formData.password} />
                </div>
              )}
            </div>

            {isLogin && (
              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm text-primary hover:text-primary/80 transition-colors font-semibold"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
            )}

            {/* زر الإرسال */}
            <Button 
              type="submit" 
              className="relative w-full h-14 text-base font-bold rounded-xl overflow-hidden group/btn bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 text-background shadow-lg" 
              disabled={loading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  <span>جارٍ التحميل...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {isLogin ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                  <span>{isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}</span>
                </div>
              )}
            </Button>
          </form>


          {/* حقوق الملكية */}
          <p className="mt-8 text-center text-xs text-muted-foreground/60">
            © 2024 ISP Pro System • جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
