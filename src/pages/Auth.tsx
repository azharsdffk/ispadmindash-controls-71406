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
      {/* الخلفية المتحركة الديناميكية */}
      <div className="absolute inset-0">
        {/* الشبكة السداسية */}
        <div 
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 17.32v34.64L30 60 0 51.96V17.32L30 0z' fill='none' stroke='%23d4a853' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />
        
        {/* الأشعة المركزية */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at ${mousePosition.x}% ${mousePosition.y}%, 
                hsl(45 85% 55% / 0.12) 0%,
                transparent 50%),
              radial-gradient(ellipse at 80% 20%, 
                hsl(35 80% 50% / 0.08) 0%,
                transparent 40%),
              radial-gradient(ellipse at 20% 80%, 
                hsl(45 85% 60% / 0.06) 0%,
                transparent 40%)
            `,
          }}
        />
        
        {/* الجسيمات العائمة */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `hsl(${40 + Math.random() * 20}, 85%, 55%)`,
              boxShadow: `0 0 ${Math.random() * 10 + 5}px hsl(45 85% 55% / 0.5)`,
              animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}

        {/* الأشكال الهندسية الدوارة */}
        <div className="absolute top-[15%] right-[10%] text-primary/15 animate-spin-slow">
          <Hexagon size={120} strokeWidth={0.5} />
        </div>
        <div className="absolute bottom-[20%] left-[15%] text-amber-500/10 animate-spin-reverse">
          <Triangle size={80} strokeWidth={0.5} />
        </div>
        <div className="absolute top-[60%] right-[80%] text-primary/10 animate-pulse">
          <Circle size={60} strokeWidth={0.5} />
        </div>
        <div className="absolute top-[30%] left-[5%] text-amber-400/15 animate-bounce-slow">
          <Sparkles size={40} />
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-[480px]">
          {/* البطاقة الرئيسية */}
          <div className="relative group">
            {/* الهالة المتوهجة */}
            <div 
              className="absolute -inset-1 rounded-3xl opacity-60 blur-xl transition-all duration-500 group-hover:opacity-80"
              style={{
                background: 'linear-gradient(135deg, hsl(45 85% 55% / 0.4), hsl(35 80% 50% / 0.3), hsl(45 85% 60% / 0.4))',
              }}
            />
            
            {/* البطاقة */}
            <div className="relative bg-card/95 backdrop-blur-xl rounded-3xl border border-primary/20 p-8 sm:p-10 shadow-2xl">
              {/* الخط المتوهج العلوي */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
              
              {/* الشعار */}
              <div className="text-center mb-10">
                <div className="relative inline-flex">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 rounded-2xl blur-lg opacity-50 animate-pulse" />
                  <div className="relative p-4 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 rounded-2xl shadow-xl">
                    <div className="w-12 h-12 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-full h-full text-background" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <h1 className="mt-6 text-3xl sm:text-4xl font-bold">
                  <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
                    نظام ISP Pro
                  </span>
                </h1>
                <p className="mt-2 text-muted-foreground text-sm">
                  منصة إدارة شبكات الإنترنت المتقدمة
                </p>
              </div>

              {/* علامات التبويب */}
              <div className="relative mb-8">
                <div className="flex bg-card/80 rounded-xl p-1 border border-primary/15">
                  <button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition-all duration-300 ${
                      isLogin 
                        ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-background shadow-lg' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <LogIn size={18} />
                    <span>تسجيل الدخول</span>
                  </button>
                  <button
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition-all duration-300 ${
                      !isLogin 
                        ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-background shadow-lg' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <UserPlus size={18} />
                    <span>حساب جديد</span>
                  </button>
                </div>
              </div>

              {/* النموذج */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-foreground/80 text-sm font-semibold">الاسم الكامل</Label>
                      <div className="relative group/input">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-amber-500/20 rounded-xl blur opacity-0 group-focus-within/input:opacity-100 transition-opacity" />
                        <div className="relative">
                          <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            type="text"
                            required={!isLogin}
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="أدخل الاسم الكامل"
                            className="pr-12 h-13"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground/80 text-sm font-semibold">رقم الهاتف</Label>
                      <div className="relative group/input">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-amber-500/20 rounded-xl blur opacity-0 group-focus-within/input:opacity-100 transition-opacity" />
                        <div className="relative">
                          <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="07xxxxxxxx"
                            className="pr-12 h-13"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* حقل اختيار الدور */}
                    <div className="space-y-2">
                      <Label className="text-foreground/80 text-sm font-semibold">نوع الحساب</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {roleOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, role: option.value as any })}
                            className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-right ${
                              formData.role === option.value
                                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                                : 'border-primary/20 bg-card/50 hover:border-primary/40 hover:bg-primary/5'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                formData.role === option.value
                                  ? 'bg-gradient-to-br from-amber-500 to-yellow-600 text-background'
                                  : 'bg-primary/10 text-primary'
                              }`}>
                                <Users size={20} />
                              </div>
                              <div>
                                <p className={`font-bold text-sm ${
                                  formData.role === option.value ? 'text-primary' : 'text-foreground'
                                }`}>
                                  {option.label}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {option.description}
                                </p>
                              </div>
                            </div>
                            {formData.role === option.value && (
                              <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <svg className="w-3 h-3 text-background" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                
                <div className="space-y-2">
                  <Label className="text-foreground/80 text-sm font-semibold">البريد الإلكتروني</Label>
                  <div className="relative group/input">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-amber-500/20 rounded-xl blur opacity-0 group-focus-within/input:opacity-100 transition-opacity" />
                    <div className="relative">
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="example@email.com"
                        className="pr-12 h-13"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-foreground/80 text-sm font-semibold">كلمة المرور</Label>
                  <div className="relative group/input">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-amber-500/20 rounded-xl blur opacity-0 group-focus-within/input:opacity-100 transition-opacity" />
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                        minLength={6}
                        className="pr-12 pl-12 h-13"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
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

                <Button 
                  type="submit" 
                  className="relative w-full h-13 text-base overflow-hidden group/btn" 
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

              {/* الفاصل */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-primary/15" />
                </div>
                <div className="relative flex justify-center">
                  <div className="px-4 bg-card text-xs text-muted-foreground">
                    أو
                  </div>
                </div>
              </div>

              {/* تسجيل الدخول بالهاتف */}
              <a
                href="/phone-auth"
                className="flex items-center justify-center gap-3 w-full h-13 bg-card/50 hover:bg-primary/10 border border-primary/20 hover:border-primary/40 text-foreground rounded-xl transition-all duration-300"
              >
                <Phone className="h-5 w-5" />
                <span>تسجيل الدخول برقم الهاتف (OTP)</span>
              </a>

              {/* الفاصل الثاني */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-primary/10" />
                </div>
              </div>

              {/* الميزات */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: '🔒', label: 'آمن' },
                  { icon: '⚡', label: 'سريع' },
                  { icon: '🌐', label: 'متكامل' },
                ].map((item, i) => (
                  <div 
                    key={i}
                    className="flex flex-col items-center gap-2 py-3 px-2 rounded-xl bg-card/50 border border-primary/15 hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <p className="mt-8 text-center text-xs text-muted-foreground/60">
                بتسجيل الدخول، أنت توافق على{' '}
                <span className="text-primary/80 hover:text-primary cursor-pointer transition-colors">شروط الاستخدام</span>
                {' '}و{' '}
                <span className="text-primary/80 hover:text-primary cursor-pointer transition-colors">سياسة الخصوصية</span>
              </p>
            </div>
          </div>

          {/* حقوق الملكية */}
          <p className="mt-8 text-center text-xs text-muted-foreground/50">
            © 2024 ISP Pro System • جميع الحقوق محفوظة
          </p>
        </div>
      </div>

      {/* الأنماط المخصصة */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-spin-slow {
          animation: spin-slow 30s linear infinite;
        }
        
        .animate-spin-reverse {
          animation: spin-reverse 25s linear infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
        
        .h-13 {
          height: 3.25rem;
        }
      `}</style>
    </div>
  );
};

export default Auth;
