import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, Zap, Globe, CheckCircle, Lock, Server, Wifi, Clock, 
  Database, ShieldCheck, Activity, ArrowRight, ArrowLeft,
  Key, Eye, FileCheck, CloudLightning, Cpu, Network,
  RefreshCw, Layers, Box, Smartphone
} from 'lucide-react';

const Features = () => {
  const navigate = useNavigate();

  const securityFeatures = [
    { icon: Lock, title: 'تشفير TLS 1.3', description: 'أحدث بروتوكولات التشفير لحماية البيانات أثناء النقل', status: 'active' },
    { icon: ShieldCheck, title: 'HTTPS إلزامي', description: 'جميع الاتصالات مشفرة ومحمية', status: 'active' },
    { icon: Key, title: 'تشفير AES-256', description: 'تشفير البيانات المخزنة بأعلى معايير الأمان', status: 'active' },
    { icon: Eye, title: 'مراقبة الأمان', description: 'نظام مراقبة مستمر للكشف عن التهديدات', status: 'active' },
    { icon: FileCheck, title: 'RLS Policies', description: 'سياسات أمان على مستوى الصفوف للتحكم الدقيق', status: 'active' },
    { icon: Database, title: 'نسخ احتياطي مشفر', description: 'نسخ احتياطية يومية مشفرة للبيانات', status: 'active' },
  ];

  const performanceFeatures = [
    { icon: CloudLightning, title: 'Edge Functions', description: 'تنفيذ الأكواد على أقرب خادم للمستخدم', metric: '<50ms' },
    { icon: Cpu, title: 'معالجة سريعة', description: 'خوادم عالية الأداء لمعالجة الطلبات', metric: '99.9%' },
    { icon: RefreshCw, title: 'تحديث فوري', description: 'تحديث البيانات في الوقت الفعلي عبر WebSocket', metric: 'Real-time' },
    { icon: Server, title: 'تخزين مؤقت ذكي', description: 'نظام كاش متقدم لتسريع الاستجابة', metric: '10x' },
  ];

  const integrationFeatures = [
    { icon: Smartphone, title: 'الرسائل النصية', description: 'إشعارات SMS للعملاء عبر Twilio', connected: true },
    { icon: Wifi, title: 'إدارة الشبكة', description: 'تكامل مع أنظمة MikroTik و RADIUS', connected: true },
    { icon: Database, title: 'قاعدة البيانات', description: 'PostgreSQL مع Supabase Realtime', connected: true },
    { icon: Box, title: 'التخزين السحابي', description: 'تخزين الملفات والمستندات بأمان', connected: true },
    { icon: Layers, title: 'المصادقة', description: 'نظام تسجيل دخول متعدد الطرق', connected: true },
    { icon: Network, title: 'واجهات API', description: 'RESTful APIs للتكامل الخارجي', connected: true },
  ];

  return (
    <>
      <Helmet>
        <title>الميزات | نظام إدارة الاشتراكات</title>
        <meta name="description" content="تعرف على ميزات النظام: الأمان، السرعة، والتكامل" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white" dir="rtl">
        {/* الخلفية */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl" />
        </div>

        {/* المحتوى */}
        <div className="relative z-10 container mx-auto px-4 py-12">
          {/* زر العودة */}
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-8 text-white/60 hover:text-white hover:bg-white/10"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة
          </Button>

          {/* العنوان الرئيسي */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
              ميزات النظام
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              نظام متكامل يجمع بين الأمان القوي، الأداء العالي، والتكامل السلس مع الخدمات المختلفة
            </p>
          </div>

          {/* قسم الأمان */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">🔒 نظام آمن</h2>
                <p className="text-white/60">حماية شاملة لبياناتك وخصوصيتك</p>
              </div>
              <Badge className="mr-auto bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle className="w-3 h-3 ml-1" />
                درجة الأمان: 95%
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {securityFeatures.map((feature, index) => (
                <Card 
                  key={index} 
                  className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300 group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                        <feature.icon className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-white">{feature.title}</h3>
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        </div>
                        <p className="text-sm text-white/60">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* قسم السرعة */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-lg shadow-cyan-500/30">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">⚡ أداء سريع</h2>
                <p className="text-white/60">استجابة فورية وأداء استثنائي</p>
              </div>
              <Badge className="mr-auto bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                <Activity className="w-3 h-3 ml-1" />
                وقت الاستجابة: ~120ms
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {performanceFeatures.map((feature, index) => (
                <Card 
                  key={index} 
                  className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300 group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-cyan-500/20 group-hover:bg-cyan-500/30 transition-colors">
                        <feature.icon className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-white">{feature.title}</h3>
                          <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-xs">
                            {feature.metric}
                          </Badge>
                        </div>
                        <p className="text-sm text-white/60">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* مؤشرات الأداء */}
            <Card className="mt-6 bg-white/5 border-white/10">
              <CardContent className="p-6">
                <h4 className="font-semibold mb-4 text-white/80">مؤشرات الأداء الحالية</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/60">نسبة التشغيل</span>
                      <span className="text-green-400 font-bold">99.9%</span>
                    </div>
                    <Progress value={99.9} className="h-2 bg-white/10" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/60">سرعة الاستجابة</span>
                      <span className="text-cyan-400 font-bold">ممتاز</span>
                    </div>
                    <Progress value={85} className="h-2 bg-white/10" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/60">كفاءة التحميل</span>
                      <span className="text-blue-400 font-bold">92%</span>
                    </div>
                    <Progress value={92} className="h-2 bg-white/10" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* قسم التكامل */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">🌐 نظام متكامل</h2>
                <p className="text-white/60">تكامل سلس مع جميع الخدمات</p>
              </div>
              <Badge className="mr-auto bg-violet-500/20 text-violet-400 border-violet-500/30">
                <Wifi className="w-3 h-3 ml-1" />
                {integrationFeatures.length} خدمات متصلة
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {integrationFeatures.map((feature, index) => (
                <Card 
                  key={index} 
                  className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-violet-500/30 transition-all duration-300 group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-violet-500/20 group-hover:bg-violet-500/30 transition-colors">
                        <feature.icon className="w-5 h-5 text-violet-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-white">{feature.title}</h3>
                          <Badge 
                            className={`text-xs ${
                              feature.connected 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}
                          >
                            {feature.connected ? 'متصل' : 'قيد الإعداد'}
                          </Badge>
                        </div>
                        <p className="text-sm text-white/60">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="text-center">
            <Card className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-violet-500/10 border-white/10 max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-2">جاهز للبدء؟</h3>
                <p className="text-white/60 mb-6">استمتع بنظام آمن وسريع ومتكامل لإدارة اشتراكاتك</p>
                <Button 
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-lg px-8 py-3 h-auto"
                >
                  ابدأ الآن
                  <ArrowLeft className="w-5 h-5 mr-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Features;
