import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LogIn, Eye, EyeOff, UserPlus, Mail, Lock, User, Phone, Shield, Loader2 } from 'lucide-react';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { PasswordRecovery } from '@/components/auth/PasswordRecovery';
import { MFAVerifyScreen } from '@/components/auth/MFAVerifyScreen';
import { RoleSelectionGrid, roleConfig } from '@/components/auth/RoleSelectionGrid';
import { SignupRoleFields, type RoleSpecificData } from '@/components/auth/SignupRoleFields';
import { signupSchema, loginSchema, sanitizeInput } from '@/utils/inputValidation';
import { checkPasswordLeaked } from '@/utils/passwordStrength';

const ADMIN_SECRET_CODE = 'ADMIN2024';

const Auth = () => {
  const { user, signIn, signUp, mfaRequired, completeMFASignIn, clearMFARequired } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '', phone: '' });
  const [selectedSignupRole, setSelectedSignupRole] = useState<string | null>(null);
  const [roleSpecificData, setRoleSpecificData] = useState<RoleSpecificData>({
    agentRegion: '', technicianSpecialty: '', technicianRegion: '', clientAddress: '', subscriptionNumber: '', adminSecretCode: '',
  });
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  useEffect(() => {
    const checkUserRoles = async () => {
      if (user && !showRoleSelection) {
        setLoadingRoles(true);
        try {
          const { data: roles, error } = await supabase
            .from('user_roles')
            .select('role, approved')
            .eq('user_id', user.id);

          if (error) throw error;

          const approvedRoles = roles?.filter(r => r.approved === true) || [];
          const rolesList = approvedRoles.map(r => r.role);

          if (rolesList.length === 0) {
            navigate('/pending-approval');
          } else if (rolesList.length === 1) {
            const config = roleConfig[rolesList[0]];
            if (config) {
              toast.success(`مرحباً بك - ${config.label}`);
              navigate(config.route);
            } else {
              navigate('/');
            }
          } else {
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

  const validateRoleFields = (): boolean => {
    if (selectedSignupRole === 'admin' && roleSpecificData.adminSecretCode !== ADMIN_SECRET_CODE) {
      toast.error('الرمز السري غير صحيح'); return false;
    }
    if (selectedSignupRole === 'agent' && !roleSpecificData.agentRegion) {
      toast.error('يرجى اختيار المنطقة'); return false;
    }
    if (selectedSignupRole === 'technician' && (!roleSpecificData.technicianSpecialty || !roleSpecificData.technicianRegion)) {
      toast.error('يرجى تحديد التخصص والمنطقة'); return false;
    }
    if (selectedSignupRole === 'client' && !roleSpecificData.clientAddress) {
      toast.error('يرجى إدخال العنوان'); return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const sanitizedEmail = sanitizeInput(formData.email.trim().toLowerCase());

      if (!isLogin && !selectedSignupRole) {
        toast.error('يرجى اختيار نوع الحساب');
        setLoading(false);
        return;
      }

      if (!isLogin && !validateRoleFields()) {
        setLoading(false);
        return;
      }

      if (isLogin) {
        const validatedData = loginSchema.parse({ email: sanitizedEmail, password: formData.password });
        const { error, mfaRequired: needsMFA } = await signIn(validatedData.email, validatedData.password);
        if (error) {
          toast.error(error.message.includes('Invalid login credentials')
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            : 'فشل تسجيل الدخول: ' + error.message);
        } else if (needsMFA) {
          toast.info('يرجى إدخال رمز التحقق من تطبيق المصادقة');
        }
      } else {
        const validatedData = signupSchema.parse({
          email: sanitizedEmail, password: formData.password,
          fullName: sanitizeInput(formData.fullName),
          phone: formData.phone ? sanitizeInput(formData.phone) : undefined,
        });

        toast.loading('جارٍ التحقق من أمان كلمة المرور...');
        const { isLeaked, count } = await checkPasswordLeaked(validatedData.password);
        toast.dismiss();

        if (isLeaked) {
          toast.error(`⚠️ كلمة المرور تم تسريبها في ${count.toLocaleString()} اختراق. اختر كلمة مرور مختلفة.`, { duration: 8000 });
          setLoading(false);
          return;
        }

        const { error } = await signUp(validatedData.email, validatedData.password, validatedData.fullName, validatedData.phone, selectedSignupRole || undefined, roleSpecificData);
        if (error) {
          toast.error(error.message.includes('already registered') ? 'هذا البريد مسجل بالفعل' : 'فشل التسجيل: ' + error.message);
        } else {
          toast.success('تم إنشاء الحساب بنجاح');
        }
      }
    } catch (error: any) {
      if (error?.name === 'ZodError') toast.error(error.issues[0].message);
      else toast.error('حدث خطأ غير متوقع');
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

  // MFA screen
  if (mfaRequired) {
    return (
      <MFAVerifyScreen
        factorId={mfaRequired.factorId}
        onVerify={async (code: string) => {
          const { error } = await completeMFASignIn(mfaRequired.factorId, code);
          if (error) throw error;
          toast.success('تم التحقق بنجاح');
        }}
        onCancel={clearMFARequired}
      />
    );
  }

  // Password recovery
  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background" dir="rtl">
        <PasswordRecovery onBack={() => setIsForgotPassword(false)} />
      </div>
    );
  }

  // Loading roles
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

  // Role selection (multi-role users)
  if (showRoleSelection && userRoles.length > 1) {
    return <RoleSelectionGrid userRoles={userRoles} onRoleSelect={handleRoleSelect} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5" dir="rtl">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card/80 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 shadow-2xl shadow-primary/10">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-amber-600 mb-4 shadow-lg shadow-primary/30">
                <Shield className="w-10 h-10 text-background" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">ISP Pro System</h1>
              <p className="text-muted-foreground text-sm">نظام إدارة شبكات الإنترنت المتقدم</p>
            </div>

            {/* Tabs */}
            <div className="flex bg-muted/50 rounded-2xl p-1.5 mb-6">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isLogin ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LogIn size={18} /><span>تسجيل الدخول</span>
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  !isLogin ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <UserPlus size={18} /><span>حساب جديد</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <SignupRoleFields
                    selectedRole={selectedSignupRole}
                    onRoleSelect={setSelectedSignupRole}
                    roleData={roleSpecificData}
                    onRoleDataChange={setRoleSpecificData}
                  />

                  {/* Full name */}
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm font-medium">الاسم الكامل</Label>
                    <div className="relative">
                      <Input type="text" required value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="أدخل اسمك الكامل"
                        className="pr-4 pl-11 h-12 bg-background/50 border-border/50 rounded-xl focus:border-primary focus:ring-primary/20" />
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm font-medium">رقم الهاتف</Label>
                    <div className="relative">
                      <Input type="tel" value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="07xxxxxxxx"
                        className="pr-4 pl-11 h-12 bg-background/50 border-border/50 rounded-xl focus:border-primary focus:ring-primary/20" />
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label className="text-foreground text-sm font-medium">البريد الإلكتروني</Label>
                <div className="relative">
                  <Input type="email" required value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@email.com"
                    className="pr-4 pl-11 h-12 bg-background/50 border-border/50 rounded-xl focus:border-primary focus:ring-primary/20" />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label className="text-foreground text-sm font-medium">كلمة المرور</Label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} required value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••" minLength={6}
                    className="pr-4 pl-20 h-12 bg-background/50 border-border/50 rounded-xl focus:border-primary focus:ring-primary/20" />
                  <Lock className="absolute left-12 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {!isLogin && formData.password && (
                  <div className="pt-1"><PasswordStrengthIndicator password={formData.password} /></div>
                )}
              </div>

              {isLogin && (
                <div className="flex justify-start pt-1">
                  <button type="button" onClick={() => setIsForgotPassword(true)}
                    className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                    نسيت كلمة المرور؟
                  </button>
                </div>
              )}

              <Button type="submit" disabled={loading}
                className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-amber-600 hover:from-primary/90 hover:to-amber-600/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 mt-6">
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

          <p className="text-center text-xs text-muted-foreground mt-6">
            بتسجيل الدخول، أنت توافق على شروط الاستخدام وسياسة الخصوصية
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
