import { useState, useEffect } from 'react';
import { Shield, Zap, Globe, CheckCircle, Lock, Server, Wifi, Clock, Database, Users, ShieldCheck, Activity } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface FeatureMetrics {
  secure: {
    tlsEnabled: boolean;
    httpsEnabled: boolean;
    encryptionLevel: string;
    lastSecurityCheck: Date;
    securityScore: number;
  };
  fast: {
    responseTime: number;
    uptime: number;
    loadTime: number;
    serverLatency: number;
  };
  integrated: {
    totalServices: number;
    activeServices: string[];
    apiConnections: number;
  };
}

const FeaturesBadges = () => {
  const [metrics, setMetrics] = useState<FeatureMetrics>({
    secure: {
      tlsEnabled: true,
      httpsEnabled: true,
      encryptionLevel: 'AES-256',
      lastSecurityCheck: new Date(),
      securityScore: 95,
    },
    fast: {
      responseTime: 120,
      uptime: 99.9,
      loadTime: 1.2,
      serverLatency: 45,
    },
    integrated: {
      totalServices: 12,
      activeServices: ['المدفوعات', 'الإشعارات', 'التخزين', 'المصادقة', 'الرسائل النصية'],
      apiConnections: 8,
    },
  });

  const [selectedFeature, setSelectedFeature] = useState<'secure' | 'fast' | 'integrated' | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  // محاكاة تحديث المقاييس في الوقت الفعلي
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        fast: {
          ...prev.fast,
          responseTime: Math.floor(Math.random() * 50) + 100,
          serverLatency: Math.floor(Math.random() * 20) + 35,
        },
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      id: 'secure' as const,
      icon: Shield,
      label: 'آمن',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      hoverColor: 'hover:bg-blue-500/30',
      ringColor: 'ring-blue-500/50',
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-indigo-600',
      tooltip: 'اتصال مشفر بتقنية TLS/SSL مع حماية AES-256',
      value: `${metrics.secure.securityScore}%`,
      status: metrics.secure.tlsEnabled && metrics.secure.httpsEnabled,
    },
    {
      id: 'fast' as const,
      icon: Zap,
      label: 'سريع',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20',
      hoverColor: 'hover:bg-cyan-500/30',
      ringColor: 'ring-cyan-500/50',
      gradientFrom: 'from-cyan-500',
      gradientTo: 'to-teal-600',
      tooltip: `وقت الاستجابة: ${metrics.fast.responseTime}ms | التشغيل: ${metrics.fast.uptime}%`,
      value: `${metrics.fast.responseTime}ms`,
      status: metrics.fast.responseTime < 200,
    },
    {
      id: 'integrated' as const,
      icon: Globe,
      label: 'متكامل',
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/20',
      hoverColor: 'hover:bg-violet-500/30',
      ringColor: 'ring-violet-500/50',
      gradientFrom: 'from-violet-500',
      gradientTo: 'to-purple-600',
      tooltip: `${metrics.integrated.totalServices} خدمة متصلة | ${metrics.integrated.apiConnections} واجهات برمجة`,
      value: `${metrics.integrated.totalServices}`,
      status: metrics.integrated.totalServices > 5,
    },
  ];

  return (
    <>
      <div className="flex flex-wrap justify-center gap-6 max-w-lg">
        {features.map((feature) => (
          <Tooltip key={feature.id}>
            <TooltipTrigger asChild>
              <button
                className={`
                  group flex items-center gap-2 text-white/60 
                  transition-all duration-300 ease-out
                  ${hoveredFeature === feature.id ? 'scale-110 text-white' : ''}
                `}
                onMouseEnter={() => setHoveredFeature(feature.id)}
                onMouseLeave={() => setHoveredFeature(null)}
                onClick={() => setSelectedFeature(feature.id)}
              >
                <div 
                  className={`
                    relative w-10 h-10 rounded-xl ${feature.bgColor} ${feature.hoverColor}
                    flex items-center justify-center
                    transition-all duration-300 ease-out
                    group-hover:shadow-lg group-hover:shadow-current/20
                    ${hoveredFeature === feature.id ? `ring-2 ${feature.ringColor}` : ''}
                  `}
                >
                  <feature.icon className={`w-5 h-5 ${feature.color} transition-transform duration-300 group-hover:scale-110`} />
                  
                  {/* مؤشر الحالة */}
                  <span 
                    className={`
                      absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900
                      ${feature.status ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}
                    `}
                  />
                </div>
                
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{feature.label}</span>
                  <span className={`text-xs ${feature.color} opacity-80`}>{feature.value}</span>
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent 
              side="bottom" 
              className="bg-slate-800/95 backdrop-blur-xl border-white/10 text-white max-w-xs"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className={`w-4 h-4 ${feature.status ? 'text-green-400' : 'text-yellow-400'}`} />
                <span>{feature.tooltip}</span>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* نافذة تفاصيل الميزة */}
      <Dialog open={selectedFeature !== null} onOpenChange={() => setSelectedFeature(null)}>
        <DialogContent className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              {selectedFeature === 'secure' && (
                <>
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Shield className="w-6 h-6 text-blue-400" />
                  </div>
                  نظام الأمان
                </>
              )}
              {selectedFeature === 'fast' && (
                <>
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Zap className="w-6 h-6 text-cyan-400" />
                  </div>
                  الأداء والسرعة
                </>
              )}
              {selectedFeature === 'integrated' && (
                <>
                  <div className="p-2 rounded-lg bg-violet-500/20">
                    <Globe className="w-6 h-6 text-violet-400" />
                  </div>
                  التكامل والخدمات
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              تفاصيل ومؤشرات الأداء في الوقت الفعلي
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {selectedFeature === 'secure' && (
              <>
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-green-400" />
                        <span>تشفير TLS/SSL</span>
                      </div>
                      <Badge variant={metrics.secure.tlsEnabled ? "default" : "destructive"} className="bg-green-500/20 text-green-400">
                        {metrics.secure.tlsEnabled ? 'مفعّل' : 'معطّل'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-400" />
                        <span>بروتوكول HTTPS</span>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-400">
                        {metrics.secure.httpsEnabled ? 'مفعّل' : 'معطّل'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-violet-400" />
                        <span>مستوى التشفير</span>
                      </div>
                      <Badge className="bg-violet-500/20 text-violet-400">
                        {metrics.secure.encryptionLevel}
                      </Badge>
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-white/60">درجة الأمان</span>
                        <span className="text-green-400 font-bold">{metrics.secure.securityScore}%</span>
                      </div>
                      <Progress value={metrics.secure.securityScore} className="h-2 bg-white/10" />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {selectedFeature === 'fast' && (
              <>
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        <span>وقت الاستجابة</span>
                      </div>
                      <Badge className="bg-cyan-500/20 text-cyan-400">
                        {metrics.fast.responseTime}ms
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-400" />
                        <span>وقت التحميل</span>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400">
                        {metrics.fast.loadTime}s
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-violet-400" />
                        <span>تأخير الخادم</span>
                      </div>
                      <Badge className="bg-violet-500/20 text-violet-400">
                        {metrics.fast.serverLatency}ms
                      </Badge>
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-white/60">نسبة التشغيل</span>
                        <span className="text-green-400 font-bold">{metrics.fast.uptime}%</span>
                      </div>
                      <Progress value={metrics.fast.uptime} className="h-2 bg-white/10" />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {selectedFeature === 'integrated' && (
              <>
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-violet-400" />
                        <span>الخدمات المتصلة</span>
                      </div>
                      <Badge className="bg-violet-500/20 text-violet-400">
                        {metrics.integrated.totalServices} خدمة
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-cyan-400" />
                        <span>واجهات API</span>
                      </div>
                      <Badge className="bg-cyan-500/20 text-cyan-400">
                        {metrics.integrated.apiConnections} اتصال
                      </Badge>
                    </div>

                    <div className="pt-2">
                      <span className="text-sm text-white/60 block mb-3">الخدمات النشطة:</span>
                      <div className="flex flex-wrap gap-2">
                        {metrics.integrated.activeServices.map((service, index) => (
                          <Badge 
                            key={index} 
                            className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border border-violet-500/30"
                          >
                            <CheckCircle className="w-3 h-3 ml-1" />
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            <Button 
              onClick={() => setSelectedFeature(null)}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FeaturesBadges;
