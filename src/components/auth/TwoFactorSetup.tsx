import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, Shield, CheckCircle, Copy, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TwoFactorSetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export const TwoFactorSetup = ({ onComplete, onCancel }: TwoFactorSetupProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'loading' | 'qr' | 'verify' | 'success'>('loading');
  const [factorId, setFactorId] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) throw error;
      
      const totpFactor = data.totp.find(f => f.status === 'verified');
      if (totpFactor) {
        setIsEnabled(true);
        setFactorId(totpFactor.id);
        setStep('success');
      } else {
        setStep('qr');
        enrollMFA();
      }
    } catch (error) {
      console.error('Error checking MFA status:', error);
      setStep('qr');
      enrollMFA();
    }
  };

  const enrollMFA = async () => {
    setLoading(true);
    try {
      // First unenroll any unverified factors
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const unverifiedFactors = factors?.totp.filter(f => f.status === 'unverified') || [];
      
      for (const factor of unverifiedFactors) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }

      // Now enroll a new factor
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'ISP Pro Authenticator',
      });

      if (error) throw error;

      if (data.totp) {
        setFactorId(data.id);
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setStep('qr');
      }
    } catch (error: any) {
      console.error('Error enrolling MFA:', error);
      toast.error('فشل في إعداد المصادقة الثنائية: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (verifyCode.length !== 6) {
      toast.error('الرجاء إدخال رمز مكون من 6 أرقام');
      return;
    }

    setLoading(true);
    try {
      // First create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      // Then verify the challenge
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (error) throw error;

      // Update user security settings
      await supabase
        .from('user_security_settings')
        .upsert({
          user_id: user?.id,
          two_factor_enabled: true,
          two_factor_verified_at: new Date().toISOString(),
        });

      setIsEnabled(true);
      setStep('success');
      toast.success('تم تفعيل المصادقة الثنائية بنجاح!');
      onComplete?.();
    } catch (error: any) {
      console.error('Error verifying MFA:', error);
      if (error.message?.includes('Invalid')) {
        toast.error('الرمز غير صحيح. تأكد من الرمز المعروض في التطبيق');
      } else {
        toast.error('فشل التحقق: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const disableMFA = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });

      if (error) throw error;

      // Update user security settings
      await supabase
        .from('user_security_settings')
        .upsert({
          user_id: user?.id,
          two_factor_enabled: false,
          two_factor_verified_at: null,
        });

      setIsEnabled(false);
      setStep('qr');
      setShowDisableDialog(false);
      toast.success('تم تعطيل المصادقة الثنائية');
      
      // Re-enroll for new setup
      enrollMFA();
    } catch (error: any) {
      console.error('Error disabling MFA:', error);
      toast.error('فشل تعطيل المصادقة الثنائية: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success('تم نسخ المفتاح السري');
  };

  if (step === 'loading') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="py-12 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </CardContent>
      </Card>
    );
  }

  if (step === 'success' && isEnabled) {
    return (
      <Card className="max-w-md mx-auto border-success/30">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <CardTitle className="text-xl">المصادقة الثنائية مفعّلة</CardTitle>
          <CardDescription>
            حسابك محمي بطبقة إضافية من الأمان
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-success/10 border border-success/30 rounded-lg p-4 text-center">
            <Shield className="h-6 w-6 text-success mx-auto mb-2" />
            <p className="text-sm text-success font-medium">
              ستُطلب منك رموز التحقق عند تسجيل الدخول
            </p>
          </div>
          
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setShowDisableDialog(true)}
          >
            تعطيل المصادقة الثنائية
          </Button>
        </CardContent>

        <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                تعطيل المصادقة الثنائية
              </AlertDialogTitle>
              <AlertDialogDescription>
                تعطيل المصادقة الثنائية سيجعل حسابك أقل أماناً. هل أنت متأكد؟
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={disableMFA}
                disabled={loading}
                className="bg-destructive hover:bg-destructive/90"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تعطيل'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Shield className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-xl">إعداد المصادقة الثنائية</CardTitle>
        <CardDescription>
          أضف طبقة حماية إضافية لحسابك باستخدام تطبيق المصادقة
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: QR Code */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm font-medium mb-4">
              1. امسح رمز QR بتطبيق المصادقة (Google Authenticator أو Authy)
            </p>
            
            {qrCode ? (
              <div className="bg-white p-4 rounded-lg inline-block">
                <img 
                  src={qrCode} 
                  alt="QR Code for 2FA setup"
                  width={200}
                  height={200}
                />
              </div>
            ) : (
              <div className="w-52 h-52 mx-auto bg-muted rounded-lg flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Manual Entry */}
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-2 text-center">
              أو أدخل المفتاح يدوياً:
            </p>
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
              <code className="flex-1 text-sm font-mono break-all">
                {showSecret ? secret : '••••••••••••••••'}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={copySecret}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Step 2: Verify */}
        <div className="space-y-4 border-t pt-4">
          <p className="text-sm font-medium">
            2. أدخل الرمز المكون من 6 أرقام من التطبيق:
          </p>
          
          <div className="space-y-2">
            <Label>رمز التحقق</Label>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
              className="text-center text-2xl tracking-widest font-mono"
              dir="ltr"
            />
          </div>

          <div className="flex gap-2">
            {onCancel && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={onCancel}
                disabled={loading}
              >
                إلغاء
              </Button>
            )}
            <Button
              className="flex-1"
              onClick={verifyAndEnable}
              disabled={loading || verifyCode.length !== 6}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'تفعيل المصادقة الثنائية'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
