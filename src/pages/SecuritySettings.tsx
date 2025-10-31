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
import { Loader2, Monitor, Smartphone, MapPin, Clock, Shield, LogOut, AlertTriangle } from 'lucide-react';
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
      // سيتم تسجيل الخروج تلقائياً
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
    if (!userAgent) return <Monitor className="h-5 w-5" />;
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AppHeader onOpenSettings={() => {}} />
      <AppSidebar />
      
      <main className="lg:mr-64 p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">إعدادات الأمان</h1>
              <p className="text-muted-foreground">إدارة الجلسات والأمان للحساب</p>
            </div>
          </div>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الأمان</CardTitle>
              <CardDescription>تخصيص خيارات الأمان والوصول</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="multiple-sessions">السماح بجلسات متعددة</Label>
                  <p className="text-sm text-muted-foreground">
                    السماح بتسجيل الدخول من عدة أجهزة في نفس الوقت
                  </p>
                </div>
                <Switch
                  id="multiple-sessions"
                  checked={settings.allow_multiple_sessions}
                  onCheckedChange={(checked) => updateSecuritySettings('allow_multiple_sessions', checked)}
                />
              </div>

              <div className="flex items-center justify-between opacity-50">
                <div className="space-y-0.5">
                  <Label htmlFor="2fa">المصادقة الثنائية (قريباً)</Label>
                  <p className="text-sm text-muted-foreground">
                    إضافة طبقة أمان إضافية لحسابك
                  </p>
                </div>
                <Switch
                  id="2fa"
                  disabled
                  checked={settings.two_factor_enabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>الجلسات النشطة</CardTitle>
                  <CardDescription>
                    الأجهزة التي قمت بتسجيل الدخول منها
                  </CardDescription>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowRevokeAll(true)}
                  disabled={sessions.length === 0}
                >
                  <LogOut className="h-4 w-4 ml-2" />
                  إنهاء جميع الجلسات
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد جلسات نشطة</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session, index) => (
                    <div
                      key={session.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {getDeviceIcon(session.user_agent)}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">
                            {session.device_name || 'جهاز غير معروف'}
                          </h4>
                          {index === 0 && (
                            <Badge variant="secondary" className="text-xs">
                              الجلسة الحالية
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {session.ip_address && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{String(session.ip_address)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              آخر نشاط: {format(new Date(session.last_active), 'dd/MM/yyyy HH:mm')}
                            </span>
                          </div>
                        </div>
                        
                        {session.user_agent && (
                          <p className="text-xs text-muted-foreground truncate max-w-md">
                            {session.user_agent}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSessionToRevoke(session.id)}
                        disabled={actionLoading}
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
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>إنهاء الجلسة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إنهاء هذه الجلسة؟ سيتم تسجيل خروج هذا الجهاز تلقائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sessionToRevoke && revokeSession(sessionToRevoke)}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke All Sessions Dialog */}
      <AlertDialog open={showRevokeAll} onOpenChange={setShowRevokeAll}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>إنهاء جميع الجلسات</AlertDialogTitle>
            <AlertDialogDescription>
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
