import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Shield, Monitor, Smartphone, Laptop, Clock, 
  MapPin, LogOut, Fingerprint, Loader2, RefreshCw,
  Activity, CheckCircle, XCircle, AlertTriangle, Settings
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";

interface Session {
  id: string;
  device_name: string | null;
  ip_address: unknown;
  user_agent: string | null;
  created_at: string;
  last_active: string;
}

export const SecuritySettingsTab = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [settings, setSettings] = useState({
    allow_multiple_sessions: true,
    two_factor_enabled: false,
  });
  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [mfaStatus, setMfaStatus] = useState<'loading' | 'enabled' | 'disabled'>('loading');

  useEffect(() => {
    if (user) {
      fetchData();
      checkMFAStatus();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchSessions(), fetchSettings()]);
    setLoading(false);
  };

  const checkMFAStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      const verifiedFactor = data.totp.find(f => f.status === 'verified');
      if (verifiedFactor) {
        setMfaStatus('enabled');
        setSettings(prev => ({ ...prev, two_factor_enabled: true }));
      } else {
        setMfaStatus('disabled');
      }
    } catch (error) {
      console.error('Error checking MFA status:', error);
      setMfaStatus('disabled');
    }
  };

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
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchSettings = async () => {
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
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const updateSetting = async (key: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from('user_security_settings')
        .upsert({
          user_id: user?.id,
          [key]: value,
        });

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success('تم تحديث الإعدادات');
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('فشل تحديث الإعدادات');
    }
  };

  const revokeSession = async (sessionId: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase.functions.invoke('manage-sessions', {
        body: { action: 'revoke', sessionId },
      });

      if (error) throw error;
      
      toast.success('تم إنهاء الجلسة');
      fetchSessions();
    } catch (error) {
      console.error('Error revoking session:', error);
      toast.error('فشل إنهاء الجلسة');
    } finally {
      setActionLoading(false);
      setSessionToRevoke(null);
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

  const getDeviceType = (userAgent: string | null): string => {
    if (!userAgent) return 'جهاز غير معروف';
    const ua = userAgent.toLowerCase();
    if (ua.includes('iphone')) return 'iPhone';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac')) return 'Mac';
    return 'جهاز غير معروف';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* إعدادات الأمان */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            إعدادات الأمان
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-muted/30">
            <div className="flex items-center gap-3">
              <Monitor className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label>السماح بجلسات متعددة</Label>
                <p className="text-sm text-muted-foreground">
                  تسجيل الدخول من أجهزة متعددة في نفس الوقت
                </p>
              </div>
            </div>
            <Switch
              checked={settings.allow_multiple_sessions}
              onCheckedChange={(value) => updateSetting('allow_multiple_sessions', value)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-muted/30">
            <div className="flex items-center gap-3">
              <Fingerprint className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label>المصادقة الثنائية (2FA)</Label>
                <p className="text-sm text-muted-foreground">
                  طبقة حماية إضافية لحسابك باستخدام Google Authenticator
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {mfaStatus === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mfaStatus === 'enabled' ? (
                <>
                  <Badge variant="default" className="bg-success text-success-foreground">
                    مُفعّل
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowMFASetup(true)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowMFASetup(true)}
                >
                  تفعيل
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* الأجهزة المسجلة */}
      <Card className="border-border/40">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              الأجهزة المسجلة
            </CardTitle>
            <CardDescription>الجلسات النشطة حالياً</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Monitor className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>لا توجد جلسات نشطة</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {getDeviceIcon(session.user_agent)}
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {getDeviceType(session.user_agent)}
                      {session.device_name && (
                        <Badge variant="secondary" className="text-xs">
                          {session.device_name}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {String(session.ip_address)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(session.last_active), { 
                          addSuffix: true, 
                          locale: ar 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setSessionToRevoke(session.id)}
                >
                  <LogOut className="h-4 w-4 ml-1" />
                  إنهاء
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* تأكيد إنهاء الجلسة */}
      <AlertDialog open={!!sessionToRevoke} onOpenChange={() => setSessionToRevoke(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>إنهاء الجلسة</AlertDialogTitle>
            <AlertDialogDescription>
              هل تريد إنهاء هذه الجلسة؟ سيتم تسجيل الخروج من هذا الجهاز.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sessionToRevoke && revokeSession(sessionToRevoke)}
              disabled={actionLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إنهاء الجلسة'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MFA Setup Dialog */}
      <Dialog open={showMFASetup} onOpenChange={setShowMFASetup}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>إعداد المصادقة الثنائية</DialogTitle>
          </DialogHeader>
          <TwoFactorSetup 
            onComplete={() => {
              setShowMFASetup(false);
              checkMFAStatus();
            }}
            onCancel={() => setShowMFASetup(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
