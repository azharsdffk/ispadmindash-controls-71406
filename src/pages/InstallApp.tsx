import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download, Smartphone, CheckCircle, Share, ArrowDown, 
  Wifi, Bell, MapPin, Shield, Wrench, Users
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallApp = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));
    setIsAndroid(/Android/.test(ua));

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    { icon: Wrench, title: 'طلبات الصيانة', desc: 'إنشاء ومتابعة طلبات الصيانة' },
    { icon: MapPin, title: 'تتبع الموقع', desc: 'تحديد موقع الزبون والفني' },
    { icon: Bell, title: 'الإشعارات', desc: 'إشعارات فورية للتحديثات' },
    { icon: Shield, title: 'أمان كامل', desc: 'حماية البيانات والصلاحيات' },
    { icon: Wifi, title: 'اتصال مباشر', desc: 'تحديثات حية ومباشرة' },
    { icon: Users, title: 'زبائن وفنيين', desc: 'واجهة مخصصة لكل دور' },
  ];

  return (
    <>
      <Helmet>
        <title>تثبيت التطبيق - ISP Pro</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col items-center px-4 py-8" dir="rtl">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <img src="/pwa-icon-192.png" alt="ISP Pro" className="w-24 h-24 mx-auto mb-4 rounded-2xl shadow-lg" />
          <h1 className="text-3xl font-bold text-foreground mb-2">ISP Pro</h1>
          <p className="text-muted-foreground text-lg">نظام إدارة مزود خدمة الإنترنت</p>
        </div>

        {/* Install Status */}
        {isInstalled ? (
          <Card className="w-full max-w-md mb-6 border-success/30 bg-success/5">
            <CardContent className="flex items-center gap-3 p-6">
              <CheckCircle className="h-8 w-8 text-success flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg">التطبيق مثبت بالفعل!</h3>
                <p className="text-muted-foreground">يمكنك فتح التطبيق من الشاشة الرئيسية</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-md mb-6">
            <CardContent className="p-6 space-y-4">
              {/* Android / Desktop with prompt */}
              {deferredPrompt && (
                <Button onClick={handleInstall} size="lg" className="w-full text-lg h-14 gap-3">
                  <Download className="h-6 w-6" />
                  تثبيت التطبيق
                </Button>
              )}

              {/* iOS Instructions */}
              {isIOS && !deferredPrompt && (
                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-center">كيفية تثبيت التطبيق على iPhone</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Badge className="mt-0.5 shrink-0">1</Badge>
                      <div>
                        <p className="font-medium">اضغط على زر المشاركة</p>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <Share className="h-4 w-4" /> في أسفل الشاشة
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Badge className="mt-0.5 shrink-0">2</Badge>
                      <p className="font-medium">اختر "إضافة إلى الشاشة الرئيسية"</p>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Badge className="mt-0.5 shrink-0">3</Badge>
                      <p className="font-medium">اضغط "إضافة"</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Android fallback */}
              {isAndroid && !deferredPrompt && (
                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-center">كيفية تثبيت التطبيق على Android</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Badge className="mt-0.5 shrink-0">1</Badge>
                      <p className="font-medium">اضغط على قائمة المتصفح (⋮)</p>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Badge className="mt-0.5 shrink-0">2</Badge>
                      <p className="font-medium">اختر "تثبيت التطبيق" أو "إضافة للشاشة الرئيسية"</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Desktop fallback */}
              {!isIOS && !isAndroid && !deferredPrompt && (
                <div className="text-center space-y-3">
                  <Smartphone className="h-12 w-12 mx-auto text-primary" />
                  <p className="text-muted-foreground">
                    افتح هذا الرابط من هاتفك لتثبيت التطبيق
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Features Grid */}
        <div className="w-full max-w-md">
          <h2 className="text-xl font-bold mb-4 text-center">مميزات التطبيق</h2>
          <div className="grid grid-cols-2 gap-3">
            {features.map((f, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-4 text-center">
                  <f.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold text-sm">{f.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => window.location.href = '/auth'} className="gap-2">
            تسجيل الدخول
            <ArrowDown className="h-4 w-4 rotate-[-90deg]" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default InstallApp;
