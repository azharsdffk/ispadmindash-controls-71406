import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LogIn, Eye, EyeOff, Phone, Lock, Wifi, Shield, Headphones, Zap } from 'lucide-react';

const CustomerAuth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });

  // التحقق من تسجيل الدخول
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/contact');
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/contact');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // البحث عن المشترك بالهاتف
      const { data: subscriber, error: subError } = await supabase
        .from('subscribers')
        .select('id, phone, name')
        .eq('phone', formData.phone)
        .single();

      if (subError || !subscriber) {
        toast.error('رقم الهاتف غير مسجل في النظام');
        setLoading(false);
        return;
      }

      // التحقق من الربط مع حساب المستخدم
      const { data: subscriberUser, error: userError } = await supabase
        .from('subscriber_users')
        .select('user_id')
        .eq('subscriber_id', subscriber.id)
        .single();

      if (userError || !subscriberUser) {
        toast.error('الحساب غير مفعل. يرجى التواصل مع الوكيل');
        setLoading(false);
        return;
      }

      // البحث عن البريد الإلكتروني للمستخدم
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', subscriberUser.user_id)
        .single();

      if (profileError || !profile) {
        toast.error('حدث خطأ في البحث عن الحساب');
        setLoading(false);
        return;
      }

      // محاولة تسجيل الدخول باستخدام رقم الهاتف كبريد إلكتروني
      const email = `${formData.phone}@isp.local`;
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: formData.password,
      });

      if (signInError) {
        toast.error('كلمة المرور غير صحيحة');
        setLoading(false);
        return;
      }

      toast.success(`مرحباً ${subscriber.name}`);
      navigate('/contact');
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" dir="rtl">
      {/* خلفية متحركة */}
      <div className="absolute inset-0">
        {/* دوائر متوهجة */}
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl" />
        
        {/* نمط الشبكة */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* المحتوى */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* الشعار والعنوان */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30 mb-4">
            <Wifi className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">بوابة العملاء</h1>
          <p className="text-white/60">سجل دخولك لإدارة خدمتك</p>
        </div>

        {/* بطاقة تسجيل الدخول */}
        <div className="w-full max-w-md">
          <div className="relative">
            {/* الهالة */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur-lg opacity-30" />
            
            {/* البطاقة */}
            <div className="relative bg-white/[0.08] backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
              {/* الخط المتوهج */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
              
              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                {/* رقم الهاتف */}
                <div className="space-y-2">
                  <Label className="text-white/80 text-sm font-medium">رقم الهاتف</Label>
                  <div className="relative">
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                    <Input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="07xxxxxxxx"
                      className="pr-12 h-14 bg-white/[0.05] border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 text-lg"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* كلمة المرور */}
                <div className="space-y-2">
                  <Label className="text-white/80 text-sm font-medium">كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="pr-12 pl-12 h-14 bg-white/[0.05] border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* نسيت كلمة المرور */}
                <div className="text-right">
                  <button
                    type="button"
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>

                {/* زر الدخول */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all duration-300"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>جارٍ الدخول...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <LogIn className="h-5 w-5" />
                      <span>تسجيل الدخول</span>
                    </div>
                  )}
                </Button>
              </form>

              {/* رسالة المساعدة */}
              <div className="mt-6 pt-6 border-t border-white/10 text-center">
                <p className="text-white/50 text-sm">
                  ليس لديك حساب؟ تواصل مع وكيلك لتفعيل الخدمة
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* المميزات */}
        <div className="mt-10 flex flex-wrap justify-center gap-6 max-w-lg">
          <div className="flex items-center gap-2 text-white/60">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-sm">آمن</span>
          </div>
          <div className="flex items-center gap-2 text-white/60">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-sm">سريع</span>
          </div>
          <div className="flex items-center gap-2 text-white/60">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Headphones className="w-4 h-4 text-violet-400" />
            </div>
            <span className="text-sm">دعم متواصل</span>
          </div>
        </div>

        {/* الفوتر */}
        <div className="mt-8 text-center text-white/30 text-xs">
          <p>© 2024 ISP Pro System - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerAuth;
