import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LogIn, Eye, EyeOff, UserPlus, Mail, Lock, User, Phone, Sparkles, Hexagon, Triangle, Circle } from 'lucide-react';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { PasswordRecovery } from '@/components/auth/PasswordRecovery';
import { signupSchema, loginSchema, sanitizeInput } from '@/utils/inputValidation';

const Auth = () => {
  const { signIn, signUp } = useAuth();
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
  });

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

  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#030014]" dir="rtl">
        <PasswordRecovery onBack={() => setIsForgotPassword(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#030014]" dir="rtl">
      {/* الخلفية المتحركة الديناميكية */}
      <div className="absolute inset-0">
        {/* الشبكة السداسية */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 17.32v34.64L30 60 0 51.96V17.32L30 0z' fill='none' stroke='%233b82f6' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />
        
        {/* الأشعة المركزية */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at ${mousePosition.x}% ${mousePosition.y}%, 
                rgba(59, 130, 246, 0.15) 0%,
                transparent 50%),
              radial-gradient(ellipse at 80% 20%, 
                rgba(139, 92, 246, 0.1) 0%,
                transparent 40%),
              radial-gradient(ellipse at 20% 80%, 
                rgba(6, 182, 212, 0.08) 0%,
                transparent 40%)
            `,
          }}
        />
        
        {/* الجسيمات العائمة */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `hsl(${210 + Math.random() * 60}, 90%, 60%)`,
              boxShadow: `0 0 ${Math.random() * 10 + 5}px currentColor`,
              animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}

        {/* الأشكال الهندسية الدوارة */}
        <div className="absolute top-[15%] right-[10%] text-blue-500/10 animate-spin-slow">
          <Hexagon size={120} strokeWidth={0.5} />
        </div>
        <div className="absolute bottom-[20%] left-[15%] text-violet-500/10 animate-spin-reverse">
          <Triangle size={80} strokeWidth={0.5} />
        </div>
        <div className="absolute top-[60%] right-[80%] text-cyan-500/10 animate-pulse">
          <Circle size={60} strokeWidth={0.5} />
        </div>
        <div className="absolute top-[30%] left-[5%] text-blue-400/10 animate-bounce-slow">
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
              className="absolute -inset-1 rounded-3xl opacity-75 blur-xl transition-all duration-500 group-hover:opacity-100"
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(139, 92, 246, 0.4), rgba(6, 182, 212, 0.4))',
              }}
            />
            
            {/* البطاقة الزجاجية */}
            <div className="relative bg-[#0a0a1a]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-8 sm:p-10 shadow-2xl">
              {/* الخط المتوهج العلوي */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
              
              {/* الشعار */}
              <div className="text-center mb-10">
                <div className="relative inline-flex">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 rounded-2xl blur-lg opacity-50 animate-pulse" />
                  <div className="relative p-4 bg-gradient-to-br from-blue-600 via-violet-600 to-cyan-600 rounded-2xl shadow-xl">
                    <div className="w-12 h-12 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-full h-full text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <h1 className="mt-6 text-3xl sm:text-4xl font-bold">
                  <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                    نظام ISP Pro
                  </span>
                </h1>
                <p className="mt-2 text-white/40 text-sm">
                  منصة إدارة شبكات الإنترنت المتقدمة
                </p>
              </div>

              {/* علامات التبويب */}
              <div className="relative mb-8">
                <div className="flex bg-white/[0.03] rounded-xl p-1 border border-white/[0.05]">
                  <button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isLogin 
                        ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/25' 
                        : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    <LogIn size={18} />
                    <span>تسجيل الدخول</span>
                  </button>
                  <button
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                      !isLogin 
                        ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/25' 
                        : 'text-white/50 hover:text-white/80'
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
                      <Label className="text-white/70 text-sm">الاسم الكامل</Label>
                      <div className="relative group/input">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-violet-500/20 rounded-xl blur opacity-0 group-focus-within/input:opacity-100 transition-opacity" />
                        <div className="relative">
                          <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                          <Input
                            type="text"
                            required={!isLogin}
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="أدخل الاسم الكامل"
                            className="pr-12 h-13 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/30 rounded-xl focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm">رقم الهاتف</Label>
                      <div className="relative group/input">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-violet-500/20 rounded-xl blur opacity-0 group-focus-within/input:opacity-100 transition-opacity" />
                        <div className="relative">
                          <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                          <Input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="07xxxxxxxx"
                            className="pr-12 h-13 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/30 rounded-xl focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                <div className="space-y-2">
                  <Label className="text-white/70 text-sm">البريد الإلكتروني</Label>
                  <div className="relative group/input">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-violet-500/20 rounded-xl blur opacity-0 group-focus-within/input:opacity-100 transition-opacity" />
                    <div className="relative">
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                      <Input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="example@email.com"
                        className="pr-12 h-13 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/30 rounded-xl focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white/70 text-sm">كلمة المرور</Label>
                  <div className="relative group/input">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-violet-500/20 rounded-xl blur opacity-0 group-focus-within/input:opacity-100 transition-opacity" />
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                        minLength={6}
                        className="pr-12 pl-12 h-13 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/30 rounded-xl focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
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
                      className="text-sm text-blue-400/80 hover:text-blue-400 transition-colors"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="relative w-full h-13 text-base font-semibold bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-600 hover:from-blue-500 hover:via-violet-500 hover:to-cyan-500 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 overflow-hidden group/btn" 
                  disabled={loading}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                  <div className="w-full border-t border-white/[0.06]" />
                </div>
                <div className="relative flex justify-center">
                  <div className="px-4 bg-[#0a0a1a] text-xs text-white/30">
                    أو
                  </div>
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
                    className="flex flex-col items-center gap-2 py-3 px-2 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-blue-500/30 hover:bg-white/[0.04] transition-all"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-xs text-white/40">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <p className="mt-8 text-center text-xs text-white/25">
                بتسجيل الدخول، أنت توافق على{' '}
                <span className="text-blue-400/60 hover:text-blue-400 cursor-pointer transition-colors">شروط الاستخدام</span>
                {' '}و{' '}
                <span className="text-blue-400/60 hover:text-blue-400 cursor-pointer transition-colors">سياسة الخصوصية</span>
              </p>
            </div>
          </div>

          {/* حقوق الملكية */}
          <p className="mt-8 text-center text-xs text-white/20">
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
