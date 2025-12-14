import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Loader2, 
  Monitor, 
  Smartphone, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  LogOut, 
  Fingerprint,
  Lock,
  Laptop,
  Globe,
  KeyRound,
  ShieldAlert,
  Activity
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Session {
  id: string;
  device_name: string | null;
  ip_address: unknown;
  user_agent: string | null;
  created_at: string;
  last_active: string;
  metadata: any;
}

interface SecuritySettings {
  allow_multiple_sessions: boolean;
  two_factor_enabled: boolean;
}

export default function SecuritySettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [settings, setSettings] = useState<SecuritySettings>({
    allow_multiple_sessions: true,
    two_factor_enabled: false,
  });
  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null);
  const [showRevokeAll, setShowRevokeAll] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSessions();
      fetchSecuritySettings();
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('revoked', false)
        .order('last_active', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      toast.error('فشل تحميل الجلسات');
    } finally {
      setLoading(false);
    }
  };

  const fetchSecuritySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_security_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings({
          allow_multiple_sessions: data.allow_multiple_sessions,
          two_factor_enabled: data.two_factor_enabled,
        });
      }
    } catch (error: any) {
      console.error('Error fetching security settings:', error);
    }
  };

  const updateSecuritySettings = async (key: keyof SecuritySettings, value: boolean) => {
    try {
      const { error } = await supabase
        .from('user_security_settings')
        .upsert({
          user_id: user?.id,
          [key]: value,
        });

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success('تم تحديث الإعدادات بنجاح');
    } catch (error: any) {
      console.error('Error updating security settings:', error);
      toast.error('فشل تحديث الإعدادات');
    }
  };

  const revokeSession = async (sessionId: string) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-sessions', {
        body: {
          action: 'revoke',
          sessionId,
        },
      });

      if (error) throw error;

      toast.success('تم إنهاء الجلسة بنجاح');
      fetchSessions();
    } catch (error: any) {
      console.error('Error revoking session:', error);
      toast.error('فشل إنهاء الجلسة');
    } finally {
      setActionLoading(false);
      setSessionToRevoke(null);
    }
  };

  const revokeAllSessions = async () => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-sessions', {
        body: {
          action: 'revoke_all',
        },
      });

      if (error) throw error;

      toast.success('تم إنهاء جميع الجلسات بنجاح');
      window.location.href = '/';
    } catch (error: any) {
      console.error('Error revoking all sessions:', error);
      toast.error('فشل إنهاء الجلسات');
    } finally {
      setActionLoading(false);
      setShowRevokeAll(false);
    }
  };

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Laptop className="h-5 w-5 text-primary" />;
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="h-5 w-5 text-primary" />;
    }
    return <Monitor className="h-5 w-5 text-primary" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <ShieldCheck className="h-12 w-12 text-primary relative z-10" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري تحميل إعدادات الأمان...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950" dir="rtl">
      <AppHeader onOpenSettings={() => {}} />
      <AppSidebar />
      
      <main className="lg:mr-64 p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Professional Header with Icon */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-blue-600/20 via-primary/10 to-transparent p-6 border border-primary/20">
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
            
            <div className="relative flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-lg" />
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary/30 to-blue-600/20 border border-primary/30">
                  <ShieldCheck className="h-10 w-10 text-primary" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                  الأمان والجلسات
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                    <Activity className="h-3 w-3 ml-1" />
                    نشط
                  </Badge>
                </h1>
                <p className="text-slate-400 mt-1">إدارة أمان حسابك وجلسات تسجيل الدخول النشطة</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-800/50 border-slate-700/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <Globe className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{sessions.length}</p>
                    <p className="text-sm text-slate-400">جلسات نشطة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <Lock className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {settings.allow_multiple_sessions ? 'مفعّل' : 'معطّل'}
                    </p>
                    <p className="text-sm text-slate-400">تعدد الجلسات</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <Fingerprint className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {settings.two_factor_enabled ? 'مفعّل' : 'قريباً'}
                    </p>
                    <p className="text-sm text-slate-400">المصادقة الثنائية</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Settings Card */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <KeyRound className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-white">إعدادات الأمان</CardTitle>
                  <CardDescription className="text-slate-400">تخصيص خيارات الأمان والوصول لحسابك</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Globe className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="multiple-sessions" className="text-white font-medium">السماح بجلسات متعددة</Label>
                    <p className="text-sm text-slate-400">
                      السماح بتسجيل الدخول من عدة أجهزة في نفس الوقت
                    </p>
                  </div>
                </div>
                <Switch
                  id="multiple-sessions"
                  checked={settings.allow_multiple_sessions}
                  onCheckedChange={(checked) => updateSecuritySettings('allow_multiple_sessions', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Fingerprint className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="2fa" className="text-white font-medium flex items-center gap-2">
                      المصادقة الثنائية
                      <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400">قريباً</Badge>
                    </Label>
                    <p className="text-sm text-slate-400">
                      إضافة طبقة أمان إضافية لحسابك
                    </p>
                  </div>
                </div>
                <Switch
                  id="2fa"
                  disabled
                  checked={settings.two_factor_enabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions Card */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Activity className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">الجلسات النشطة</CardTitle>
                    <CardDescription className="text-slate-400">
                      الأجهزة التي قمت بتسجيل الدخول منها
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowRevokeAll(true)}
                  disabled={sessions.length === 0}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                >
                  <LogOut className="h-4 w-4 ml-2" />
                  إنهاء جميع الجلسات
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {sessions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 rounded-full bg-slate-700/30 blur-xl" />
                    <ShieldAlert className="h-16 w-16 text-slate-500 relative z-10 mx-auto" />
                  </div>
                  <p className="text-slate-400 mt-4">لا توجد جلسات نشطة</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session, index) => (
                    <div
                      key={session.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border transition-all hover:border-primary/30 ${
                        index === 0 
                          ? 'bg-primary/5 border-primary/20' 
                          : 'bg-slate-900/50 border-slate-700/50'
                      }`}
                    >
                      <div className={`p-3 rounded-xl ${
                        index === 0 
                          ? 'bg-primary/20 border border-primary/30' 
                          : 'bg-slate-800 border border-slate-700'
                      }`}>
                        {getDeviceIcon(session.user_agent)}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-white">
                            {session.device_name || 'جهاز غير معروف'}
                          </h4>
                          {index === 0 && (
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                              الجلسة الحالية
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                          {session.ip_address && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-slate-500" />
                              <span>{String(session.ip_address)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-500" />
                            <span>
                              آخر نشاط: {format(new Date(session.last_active), 'dd/MM/yyyy HH:mm')}
                            </span>
                          </div>
                        </div>
                        
                        {session.user_agent && (
                          <p className="text-xs text-slate-500 truncate max-w-md">
                            {session.user_agent}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSessionToRevoke(session.id)}
                        disabled={actionLoading}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Revoke Session Dialog */}
      <AlertDialog open={!!sessionToRevoke} onOpenChange={() => setSessionToRevoke(null)}>
        <AlertDialogContent dir="rtl" className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-red-500/10">
                <LogOut className="h-5 w-5 text-red-400" />
              </div>
              <AlertDialogTitle className="text-white">إنهاء الجلسة</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-slate-400">
              هل أنت متأكد من إنهاء هذه الجلسة؟ سيتم تسجيل خروج هذا الجهاز تلقائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sessionToRevoke && revokeSession(sessionToRevoke)}
              disabled={actionLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              {actionLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke All Sessions Dialog */}
      <AlertDialog open={showRevokeAll} onOpenChange={setShowRevokeAll}>
        <AlertDialogContent dir="rtl" className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-red-500/10">
                <ShieldAlert className="h-5 w-5 text-red-400" />
              </div>
              <AlertDialogTitle className="text-white">إنهاء جميع الجلسات</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-slate-400">
              هل أنت متأكد من إنهاء جميع الجلسات؟ سيتم تسجيل الخروج من جميع الأجهزة بما في ذلك هذا الجهاز.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={revokeAllSessions}
              disabled={actionLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              {actionLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              إنهاء الكل
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
