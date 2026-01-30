import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LogIn, Eye, EyeOff, UserPlus, Mail, Lock, User, Phone, Shield, Users, Wrench, UserCog, Building2, CheckCircle, Loader2 } from 'lucide-react';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { PasswordRecovery } from '@/components/auth/PasswordRecovery';
import { MFAVerifyScreen } from '@/components/auth/MFAVerifyScreen';
import { signupSchema, loginSchema, sanitizeInput } from '@/utils/inputValidation';
import { checkPasswordLeaked } from '@/utils/passwordStrength';

type RoleType = 'client' | 'technician' | 'agent' | 'admin' | 'super_admin' | 'technical_manager' | 'finance_manager';

const roleConfig: Record<string, { icon: any; label: string; description: string; gradient: string; bgHover: string; borderHover: string; route: string }> = {
  client: {
    icon: Users,
    label: 'العميل',
    description: 'بوابة العملاء',
    gradient: 'from-blue-500 to-blue-600',
    bgHover: 'hover:bg-blue-500/10',
    borderHover: 'hover:border-blue-500/50',
    route: '/portal',
  },
  technician: {
    icon: Wrench,
    label: 'الفني',
    description: 'لوحة الفنيين',
    gradient: 'from-green-500 to-green-600',
    bgHover: 'hover:bg-green-500/10',
    borderHover: 'hover:border-green-500/50',
    route: '/technician',
  },
  technical_manager: {
    icon: Wrench,
    label: 'مدير التقنية',
    description: 'إدارة الفنيين',
    gradient: 'from-teal-500 to-teal-600',
    bgHover: 'hover:bg-teal-500/10',
    borderHover: 'hover:border-teal-500/50',
    route: '/admin',
  },
  agent: {
    icon: UserCog,
    label: 'الوكيل',
    description: 'إدارة الوكلاء',
    gradient: 'from-purple-500 to-purple-600',
    bgHover: 'hover:bg-purple-500/10',
    borderHover: 'hover:border-purple-500/50',
    route: '/agent-dashboard',
  },
  accountant: {
    icon: Building2,
    label: 'المحاسب',
    description: 'لوحة المحاسبة',
    gradient: 'from-orange-500 to-orange-600',
    bgHover: 'hover:bg-orange-500/10',
    borderHover: 'hover:border-orange-500/50',
    route: '/accountant',
  },
  finance_manager: {
    icon: Building2,
    label: 'مدير المالية',
    description: 'إدارة المالية',
    gradient: 'from-yellow-500 to-yellow-600',
    bgHover: 'hover:bg-yellow-500/10',
    borderHover: 'hover:border-yellow-500/50',
    route: '/accountant',
  },
  admin: {
    icon: Building2,
    label: 'المدير',
    description: 'لوحة التحكم',
    gradient: 'from-primary to-amber-600',
    bgHover: 'hover:bg-primary/10',
    borderHover: 'hover:border-primary/50',
    route: '/',
  },
  super_admin: {
    icon: Shield,
    label: 'المدير العام',
    description: 'تحكم كامل',
    gradient: 'from-red-500 to-red-600',
    bgHover: 'hover:bg-red-500/10',
    borderHover: 'hover:border-red-500/50',
    route: '/',
  },
};

const Auth = () => {
  const { user, signIn, signUp, mfaRequired, completeMFASignIn, clearMFARequired } = useAuth();
  const navigate = useNavigate();
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
  
  // حالة اختيار الدور بعد تسجيل الدخول
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // التحقق من المستخدم المسجل دخوله وجلب أدواره
  useEffect(() => {
    const checkUserRoles = async () => {
      if (user && !showRoleSelection) {
        setLoadingRoles(true);
        try {
          const { data: roles, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);

          if (error) throw error;

          const rolesList = roles?.map(r => r.role) || [];
          
          if (rolesList.length === 0) {
            // لا توجد أدوار - توجيه لصفحة الانتظار
            navigate('/pending-approval');
          } else if (rolesList.length === 1) {
            // دور واحد فقط - توجيه مباشر
            const role = rolesList[0];
            const config = roleConfig[role];
            if (config) {
              toast.success(`مرحباً بك - ${config.label}`);
              navigate(config.route);
            } else {
              navigate('/');
            }
          } else {
            // عدة أدوار - عرض شاشة الاختيار
            setUserRoles(rolesList);
            setShowRoleSelection(true);
          }
        } catch (error) {
          console.error('Error fetching roles:', error);
          navigate('/');
        } finally {
          setLoadingRoles(false);
        }
      }
    };

    checkUserRoles();
  }, [user, navigate, showRoleSelection]);

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
        }
        // سيتم التعامل مع التوجيه في useEffect بعد تحديث user
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

  const handleRoleSelect = (role: string) => {
    const config = roleConfig[role];
    if (config) {
      toast.success(`تم اختيار: ${config.label}`);
      navigate(config.route);
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

  // شاشة التحميل أثناء جلب الأدوار
  if (loadingRoles) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جارٍ التحقق من صلاحياتك...</p>
        </div>
      </div>
    );
  }

  // شاشة اختيار الدور (فقط للمستخدمين الذين لديهم عدة أدوار)
  if (showRoleSelection && userRoles.length > 1) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5" dir="rtl">
        {/* خلفية زخرفية */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <div className="bg-card/80 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 shadow-2xl shadow-primary/10">
              
              {/* العنوان */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-amber-600 mb-4 shadow-lg shadow-primary/30">
                  <CheckCircle className="w-10 h-10 text-background" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  مرحباً بك!
                </h1>
                <p className="text-muted-foreground text-sm">
                  لديك عدة أدوار في النظام. اختر الدور الذي تريد الدخول به:
                </p>
              </div>

              {/* شبكة الأدوار المخصصة للمستخدم */}
              <div className={`grid gap-4 ${userRoles.length <= 2 ? 'grid-cols-2' : userRoles.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {userRoles.map((role) => {
                  const config = roleConfig[role];
                  if (!config) return null;
                  const Icon = config.icon;
                  return (
                    <button
                      key={role}
                      onClick={() => handleRoleSelect(role)}
                      className={`group relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-border/50 bg-background/50 transition-all duration-300 ${config.bgHover} ${config.borderHover} hover:shadow-lg hover:scale-[1.02]`}
                    >
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center mb-3 shadow-md group-hover:shadow-lg transition-shadow`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <span className="font-bold text-foreground text-lg">{config.label}</span>
                      <span className="text-xs text-muted-foreground mt-1">{config.description}</span>
                    </button>
                  );
                })}
              </div>

              {/* زر تسجيل الخروج */}
              <div className="mt-6 text-center">
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setShowRoleSelection(false);
                    setUserRoles([]);
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  تسجيل الخروج
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5" dir="rtl">
      {/* خلفية زخرفية */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
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
                    {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                    <span>{isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}</span>
                  </div>
                )}
              </Button>
            </form>
          </div>

          {/* نص أسفل البطاقة */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            بتسجيل الدخول، أنت توافق على شروط الاستخدام وسياسة الخصوصية
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
