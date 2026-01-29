import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from '@/hooks/use-toast';
import { Phone, Shield, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

const PhoneAuth = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(5);

  // تنسيق رقم الهاتف للعرض
  const formatPhoneDisplay = (value: string) => {
    const digits = value.replace(/[^0-9]/g, '');
    return digits;
  };

  // تنسيق رقم الهاتف للإرسال
  const formatPhoneForApi = (value: string) => {
    let digits = value.replace(/[^0-9]/g, '');
    if (digits.startsWith('0')) {
      digits = '964' + digits.substring(1);
    }
    if (!digits.startsWith('964')) {
      digits = '964' + digits;
    }
    return digits;
  };

  // العد التنازلي
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // إرسال OTP
  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast({
        title: 'خطأ',
        description: 'الرجاء إدخال رقم هاتف صحيح',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhoneForApi(phone);
      
      const { data, error } = await supabase.functions.invoke('send-otp-verify', {
        body: { to: formattedPhone, channel: 'sms' },
      });

      if (error) throw error;

      if (data.success) {
        setStep('otp');
        setCountdown(60);
        toast({
          title: 'تم الإرسال',
          description: 'تم إرسال رمز التحقق إلى هاتفك',
        });
      } else {
        if (data.waitSeconds) {
          setCountdown(data.waitSeconds);
        }
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Send OTP error:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إرسال رمز التحقق',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // التحقق من OTP
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'خطأ',
        description: 'الرجاء إدخال رمز التحقق المكون من 6 أرقام',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhoneForApi(phone);
      
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { phone: formattedPhone, otp },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'نجاح',
          description: data.isNewUser ? 'تم إنشاء حسابك بنجاح' : 'تم تسجيل الدخول بنجاح',
        });

        // توجيه المستخدم
        navigate('/pending-approval');
      } else {
        setAttemptsLeft(data.attemptsLeft || attemptsLeft - 1);
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في التحقق من الرمز',
        variant: 'destructive',
      });
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  // إعادة إرسال OTP
  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setOtp('');
    await handleSendOTP();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative w-full max-w-md">
        {/* البطاقة الرئيسية */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
          {/* الشعار */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mb-4">
              <Phone className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">ISP Pro</h1>
            <p className="text-white/60">
              {step === 'phone' ? 'أدخل رقم هاتفك للمتابعة' : 'أدخل رمز التحقق'}
            </p>
          </div>

          {step === 'phone' ? (
            /* شاشة إدخال رقم الهاتف */
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white/80">رقم الهاتف</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                    +964
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="7xxxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneDisplay(e.target.value))}
                    className="pl-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 text-lg"
                    dir="ltr"
                    maxLength={11}
                  />
                </div>
                <p className="text-xs text-white/40">
                  سيتم إرسال رمز تحقق مكون من 6 أرقام
                </p>
              </div>

              <Button
                onClick={handleSendOTP}
                disabled={loading || phone.length < 10}
                className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin ml-2" />
                ) : (
                  <ArrowRight className="w-5 h-5 ml-2" />
                )}
                إرسال رمز التحقق
              </Button>
            </div>
          ) : (
            /* شاشة إدخال OTP */
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-white/60 text-sm mb-4">
                    تم إرسال الرمز إلى
                  </p>
                  <p className="text-white font-mono text-lg" dir="ltr">
                    +{formatPhoneForApi(phone)}
                  </p>
                </div>

                <div className="flex justify-center" dir="ltr">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                  >
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTPSlot
                          key={index}
                          index={index}
                          className="w-12 h-14 text-xl bg-white/10 border-white/20 text-white"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <p className="text-center text-xs text-white/40">
                  المحاولات المتبقية: {attemptsLeft}
                </p>
              </div>

              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin ml-2" />
                ) : (
                  <Shield className="w-5 h-5 ml-2" />
                )}
                تأكيد
              </Button>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                  }}
                  className="text-white/60 hover:text-white text-sm"
                >
                  تغيير الرقم
                </button>

                <button
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || loading}
                  className={`text-sm flex items-center gap-1 ${
                    countdown > 0 ? 'text-white/40' : 'text-primary hover:text-primary/80'
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  {countdown > 0 ? `إعادة الإرسال (${countdown}s)` : 'إعادة الإرسال'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* رابط تسجيل الدخول بالإيميل */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/auth')}
            className="text-white/60 hover:text-white text-sm"
          >
            تسجيل الدخول بالبريد الإلكتروني بدلاً من ذلك
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhoneAuth;
