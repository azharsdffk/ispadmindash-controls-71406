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
      <div className="min-h-screen flex items-center justify-center bg-background">
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
    <div className="min-h-screen bg-background" dir="rtl">
      <AppHeader onOpenSettings={() => {}} />
      <AppSidebar />
      
      <main className="lg:mr-64 pt-16 p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Compact Header */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-border">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                الأمان والجلسات
                <Badge variant="secondary" className="bg-success/10 text-success border-success/20 text-xs">
                  <Activity className="h-3 w-3 ml-1" />
                  نشط
                </Badge>
              </h1>
              <p className="text-muted-foreground text-sm">إدارة أمان حسابك وجلسات تسجيل الدخول</p>
            </div>
          </div>

          {/* Stats Cards - Compact */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-card border-border">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-info/10 border border-info/20">
                    <Globe className="h-4 w-4 text-info" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{sessions.length}</p>
                    <p className="text-xs text-muted-foreground">جلسات نشطة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-success/10 border border-success/20">
                    <Lock className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">
                      {settings.allow_multiple_sessions ? 'مفعّل' : 'معطّل'}
                    </p>
                    <p className="text-xs text-muted-foreground">تعدد الجلسات</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-warning/10 border border-warning/20">
                    <Fingerprint className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">
                      {settings.two_factor_enabled ? 'مفعّل' : 'معطّل'}
                    </p>
                    <p className="text-xs text-muted-foreground">المصادقة الثنائية</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Settings Card - Compact */}
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border py-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <KeyRound className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-foreground text-base">إعدادات الأمان</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-info" />
                  <div>
                    <Label htmlFor="multiple-sessions" className="text-foreground text-sm">السماح بجلسات متعددة</Label>
                    <p className="text-xs text-muted-foreground">تسجيل الدخول من عدة أجهزة</p>
                  </div>
                </div>
                <Switch
                  id="multiple-sessions"
                  checked={settings.allow_multiple_sessions}
                  onCheckedChange={(checked) => updateSecuritySettings('allow_multiple_sessions', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-warning" />
                  <div>
                    <Label htmlFor="2fa" className="text-foreground text-sm flex items-center gap-1">
                      المصادقة الثنائية
                      {settings.two_factor_enabled && (
                        <Badge variant="outline" className="text-[10px] border-success/30 text-success px-1 py-0">مفعّل</Badge>
                      )}
                    </Label>
                    <p className="text-xs text-muted-foreground">طبقة أمان إضافية عند تسجيل الدخول</p>
                  </div>
                </div>
                <Switch
                  id="2fa"
                  checked={settings.two_factor_enabled}
                  onCheckedChange={(checked) => updateSecuritySettings('two_factor_enabled', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions Card - Compact */}
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-success/10">
                    <Activity className="h-4 w-4 text-success" />
                  </div>
                  <CardTitle className="text-foreground text-base">الجلسات النشطة</CardTitle>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowRevokeAll(true)}
                  disabled={sessions.length === 0}
                  className="h-8 text-xs"
                >
                  <LogOut className="h-3 w-3 ml-1" />
                  إنهاء الكل
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {sessions.length === 0 ? (
                <div className="text-center py-6">
                  <ShieldAlert className="h-10 w-10 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground mt-2 text-sm">لا توجد جلسات نشطة</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session, index) => (
                    <div
                      key={session.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        index === 0 
                          ? 'bg-primary/5 border-primary/20' 
                          : 'bg-muted/50 border-border'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        index === 0 
                          ? 'bg-primary/20' 
                          : 'bg-muted'
                      }`}>
                        {getDeviceIcon(session.user_agent)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground text-sm truncate">
                            {session.device_name || 'جهاز غير معروف'}
                          </h4>
                          {index === 0 && (
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0">
                              الحالية
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          {session.ip_address && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {String(session.ip_address)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(session.last_active), 'dd/MM HH:mm')}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSessionToRevoke(session.id)}
                        disabled={actionLoading}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
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
        <AlertDialogContent dir="rtl" className="bg-card border-border">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-destructive/10">
                <LogOut className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle className="text-foreground">إنهاء الجلسة</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground">
              هل أنت متأكد من إنهاء هذه الجلسة؟ سيتم تسجيل خروج هذا الجهاز تلقائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sessionToRevoke && revokeSession(sessionToRevoke)}
              disabled={actionLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {actionLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke All Sessions Dialog */}
      <AlertDialog open={showRevokeAll} onOpenChange={setShowRevokeAll}>
        <AlertDialogContent dir="rtl" className="bg-card border-border">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-destructive/10">
                <ShieldAlert className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle className="text-foreground">إنهاء جميع الجلسات</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground">
              هل أنت متأكد من إنهاء جميع الجلسات؟ سيتم تسجيل الخروج من جميع الأجهزة بما في ذلك هذا الجهاز.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={revokeAllSessions}
              disabled={actionLoading}
              className="bg-destructive hover:bg-destructive/90"
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
