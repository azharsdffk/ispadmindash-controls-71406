import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail, Phone, Shield, ArrowRight, CheckCircle, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeInput } from '@/utils/inputValidation';

interface PasswordRecoveryProps {
  onBack: () => void;
}

type RecoveryMethod = 'select' | 'email' | 'phone' | 'verify' | 'newPassword';

export const PasswordRecovery = ({ onBack }: PasswordRecoveryProps) => {
  const [step, setStep] = useState<RecoveryMethod>('select');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sentTo, setSentTo] = useState('');

  const handleEmailRecovery = async () => {
    if (!email) {
      toast.error('الرجاء إدخال البريد الإلكتروني');
      return;
    }

    setLoading(true);
    try {
      const sanitizedEmail = sanitizeInput(email.trim().toLowerCase());
      
      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      
      if (error) {
        toast.error('فشل إرسال رابط إعادة التعيين: ' + error.message);
      } else {
        setSentTo(email);
        setStep('verify');
        toast.success('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
      }
    } catch (error: any) {
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneRecovery = async () => {
    if (!phone) {
      toast.error('الرجاء إدخال رقم الهاتف');
      return;
    }

    setLoading(true);
    try {
      // Call edge function to send SMS
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          phone: phone,
          type: 'password_reset',
          generateCode: true
        }
      });

      if (error) {
        toast.error('فشل إرسال رمز التحقق: ' + error.message);
      } else {
        setSentTo(phone);
        setStep('verify');
        toast.success('تم إرسال رمز التحقق إلى رقم هاتفك');
      }
    } catch (error: any) {
      toast.error('حدث خطأ في إرسال الرسالة');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length < 4) {
      toast.error('الرجاء إدخال رمز التحقق الصحيح');
      return;
    }

    setLoading(true);
    try {
      // Verify the code
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          phone: sentTo,
          type: 'verify_code',
          code: verificationCode
        }
      });

      if (error || !data?.valid) {
        toast.error('رمز التحقق غير صحيح');
      } else {
        setStep('newPassword');
        toast.success('تم التحقق بنجاح');
      }
    } catch (error: any) {
      // For email recovery, move to new password step
      if (sentTo.includes('@')) {
        setStep('newPassword');
      } else {
        toast.error('رمز التحقق غير صحيح');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast.error('فشل تحديث كلمة المرور: ' + error.message);
      } else {
        toast.success('تم تحديث كلمة المرور بنجاح');
        onBack();
      }
    } catch (error: any) {
      toast.error('حدث خطأ في تحديث كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  const renderSelectMethod = () => (
    <div className="space-y-4">
      <p className="text-center text-muted-foreground mb-6">
        اختر طريقة استرداد كلمة المرور
      </p>
      
      <Button
        type="button"
        variant="outline"
        className="w-full h-16 justify-start gap-4 hover:bg-primary/5 hover:border-primary transition-all"
        onClick={() => setStep('email')}
      >
        <div className="p-2 rounded-full bg-blue-500/10">
          <Mail className="h-6 w-6 text-blue-500" />
        </div>
        <div className="text-right flex-1">
          <p className="font-medium">الاسترداد عبر البريد الإلكتروني</p>
          <p className="text-xs text-muted-foreground">إرسال رابط إعادة التعيين إلى Gmail</p>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full h-16 justify-start gap-4 hover:bg-primary/5 hover:border-primary transition-all"
        onClick={() => setStep('phone')}
      >
        <div className="p-2 rounded-full bg-green-500/10">
          <Phone className="h-6 w-6 text-green-500" />
        </div>
        <div className="text-right flex-1">
          <p className="font-medium">الاسترداد عبر الهاتف</p>
          <p className="text-xs text-muted-foreground">إرسال رمز التحقق برسالة SMS</p>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full h-16 justify-start gap-4 hover:bg-primary/5 hover:border-primary transition-all opacity-60"
        disabled
      >
        <div className="p-2 rounded-full bg-purple-500/10">
          <Shield className="h-6 w-6 text-purple-500" />
        </div>
        <div className="text-right flex-1">
          <p className="font-medium">المصادقة الثنائية</p>
          <p className="text-xs text-muted-foreground">قريباً - استخدام تطبيق المصادقة</p>
        </div>
        <span className="text-xs bg-muted px-2 py-1 rounded">قريباً</span>
      </Button>
    </div>
  );

  const renderEmailStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
          <Mail className="h-8 w-8 text-blue-500" />
        </div>
        <p className="text-muted-foreground">
          أدخل بريدك الإلكتروني المسجل لإرسال رابط إعادة التعيين
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="recovery-email">البريد الإلكتروني</Label>
        <Input
          id="recovery-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@gmail.com"
          className="h-12"
        />
      </div>

      <Button
        onClick={handleEmailRecovery}
        disabled={loading || !email}
        className="w-full h-12 gradient-bg"
      >
        {loading ? 'جارٍ الإرسال...' : 'إرسال رابط الاسترداد'}
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={() => setStep('select')}
        className="w-full"
      >
        العودة لاختيار الطريقة
      </Button>
    </div>
  );

  const renderPhoneStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <Phone className="h-8 w-8 text-green-500" />
        </div>
        <p className="text-muted-foreground">
          أدخل رقم الهاتف المرتبط بحسابك لإرسال رمز التحقق
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="recovery-phone">رقم الهاتف</Label>
        <Input
          id="recovery-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="07xxxxxxxx"
          className="h-12"
          dir="ltr"
        />
      </div>

      <Button
        onClick={handlePhoneRecovery}
        disabled={loading || !phone}
        className="w-full h-12 gradient-bg"
      >
        {loading ? 'جارٍ الإرسال...' : 'إرسال رمز التحقق'}
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={() => setStep('select')}
        className="w-full"
      >
        العودة لاختيار الطريقة
      </Button>
    </div>
  );

  const renderVerifyStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <p className="font-medium">تم إرسال رمز التحقق</p>
        <p className="text-sm text-muted-foreground mt-1">
          {sentTo.includes('@') 
            ? `تحقق من بريدك الإلكتروني ${sentTo}` 
            : `تم إرسال رمز إلى ${sentTo}`}
        </p>
      </div>

      {sentTo.includes('@') ? (
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            افتح الرابط المرسل إلى بريدك الإلكتروني لإعادة تعيين كلمة المرور
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="w-full"
          >
            العودة لتسجيل الدخول
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="verification-code">رمز التحقق</Label>
            <Input
              id="verification-code"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="أدخل الرمز المكون من 6 أرقام"
              className="h-12 text-center text-2xl tracking-widest"
              maxLength={6}
              dir="ltr"
            />
          </div>

          <Button
            onClick={handleVerifyCode}
            disabled={loading || verificationCode.length < 4}
            className="w-full h-12 gradient-bg"
          >
            {loading ? 'جارٍ التحقق...' : 'تأكيد الرمز'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep('select')}
            className="w-full text-sm"
          >
            استخدام طريقة أخرى
          </Button>
        </>
      )}
    </div>
  );

  const renderNewPasswordStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <KeyRound className="h-8 w-8 text-primary" />
        </div>
        <p className="font-medium">إنشاء كلمة مرور جديدة</p>
        <p className="text-sm text-muted-foreground mt-1">
          اختر كلمة مرور قوية لحماية حسابك
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="••••••••"
          className="h-12"
          minLength={8}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          className="h-12"
          minLength={8}
        />
      </div>

      <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg">
        <p className="font-medium">متطلبات كلمة المرور:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li className={newPassword.length >= 8 ? 'text-green-600' : ''}>8 أحرف على الأقل</li>
          <li className={/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}>حرف كبير واحد على الأقل</li>
          <li className={/[0-9]/.test(newPassword) ? 'text-green-600' : ''}>رقم واحد على الأقل</li>
        </ul>
      </div>

      <Button
        onClick={handleSetNewPassword}
        disabled={loading || !newPassword || !confirmPassword}
        className="w-full h-12 gradient-bg"
      >
        {loading ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور الجديدة'}
      </Button>
    </div>
  );

  return (
    <Card className="w-full max-w-md shadow-2xl border-0 bg-card/95 backdrop-blur">
      <CardHeader className="text-center space-y-4 pb-6">
        <CardTitle className="text-2xl font-bold">استرداد كلمة المرور</CardTitle>
        <CardDescription>
          {step === 'select' && 'اختر طريقة الاسترداد المناسبة'}
          {step === 'email' && 'الاسترداد عبر البريد الإلكتروني'}
          {step === 'phone' && 'الاسترداد عبر رسالة SMS'}
          {step === 'verify' && 'التحقق من الهوية'}
          {step === 'newPassword' && 'إنشاء كلمة مرور جديدة'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'select' && renderSelectMethod()}
        {step === 'email' && renderEmailStep()}
        {step === 'phone' && renderPhoneStep()}
        {step === 'verify' && renderVerifyStep()}
        {step === 'newPassword' && renderNewPasswordStep()}

        {step === 'select' && (
          <div className="mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="link"
              onClick={onBack}
              className="w-full text-primary"
            >
              العودة لتسجيل الدخول
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
