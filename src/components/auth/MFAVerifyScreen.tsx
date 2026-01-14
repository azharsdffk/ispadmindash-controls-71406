import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Shield, KeyRound } from 'lucide-react';

interface MFAVerifyScreenProps {
  factorId: string;
  onVerify: (code: string) => Promise<void>;
  onCancel?: () => void;
}

export const MFAVerifyScreen = ({ factorId, onVerify, onCancel }: MFAVerifyScreenProps) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error('الرجاء إدخال رمز مكون من 6 أرقام');
      return;
    }

    setLoading(true);
    try {
      await onVerify(code);
    } catch (error: any) {
      console.error('Error verifying MFA:', error);
      if (error.message?.includes('Invalid')) {
        toast.error('الرمز غير صحيح. يرجى المحاولة مرة أخرى');
      } else {
        toast.error('فشل التحقق: ' + error.message);
      }
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6) {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-xl">التحقق بخطوتين</CardTitle>
          <CardDescription>
            أدخل رمز التحقق من تطبيق المصادقة الخاص بك
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              رمز التحقق
            </Label>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={handleKeyDown}
              className="text-center text-3xl tracking-[0.5em] font-mono h-14"
              dir="ltr"
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-center">
              افتح تطبيق Google Authenticator أو Authy وأدخل الرمز المعروض
            </p>
          </div>

          <div className="flex gap-3">
            {onCancel && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={onCancel}
                disabled={loading}
              >
                رجوع
              </Button>
            )}
            <Button
              className="flex-1"
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري التحقق...
                </>
              ) : (
                'تأكيد'
              )}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              هل تواجه مشكلة في الوصول لتطبيق المصادقة؟
            </p>
            <Button variant="link" size="sm" className="text-primary">
              تواصل مع الدعم الفني
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
