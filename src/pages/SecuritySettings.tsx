import { useState, useEffect, useMemo } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
  Activity,
  Eye,
  EyeOff,
  Search,
  Filter,
  History,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Settings,
  Key,
  UserCheck,
  Trash2,
  Bell,
  AlertCircle,
  Wifi,
  WifiOff,
  Calendar,
  LayoutGrid,
  List,
  ChevronDown,
  Timer
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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Session {
  id: string;
  device_name: string | null;
  ip_address: unknown;
  user_agent: string | null;
  created_at: string;
  last_active: string;
  metadata: any;
  expires_at: string;
}

interface SecuritySettings {
  allow_multiple_sessions: boolean;
  two_factor_enabled: boolean;
}

interface SecurityLog {
  id: string;
  action: string;
  ip_address: unknown;
  user_agent: string | null;
  created_at: string;
  metadata: any;
}

interface LoginAttempt {
  id: string;
  email: string;
  success: boolean;
  ip_address: unknown;
  created_at: string;
  error_message: string | null;
}

type ViewMode = 'grid' | 'list';
type TabType = 'sessions' | 'security-logs' | 'login-history';

export default function SecuritySettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [settings, setSettings] = useState<SecuritySettings>({
    allow_multiple_sessions: true,
    two_factor_enabled: false,
  });
  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null);
  const [showRevokeAll, setShowRevokeAll] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('sessions');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchSessions(),
      fetchSecuritySettings(),
      fetchSecurityLogs(),
      fetchLoginAttempts(),
    ]);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast.success('تم تحديث البيانات بنجاح');
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
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
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

  const fetchSecurityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('security_audit_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSecurityLogs(data || []);
    } catch (error: any) {
      console.error('Error fetching security logs:', error);
    }
  };

  const fetchLoginAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLoginAttempts(data || []);
    } catch (error: any) {
      console.error('Error fetching login attempts:', error);
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
      const { error } = await supabase.functions.invoke('manage-sessions', {
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
      const { error } = await supabase.functions.invoke('manage-sessions', {
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

  const getDeviceType = (userAgent: string | null): string => {
    if (!userAgent) return 'جهاز غير معروف';
    const ua = userAgent.toLowerCase();
    if (ua.includes('iphone')) return 'iPhone';
    if (ua.includes('ipad')) return 'iPad';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('macintosh') || ua.includes('mac os')) return 'Mac';
    if (ua.includes('linux')) return 'Linux';
    return 'جهاز غير معروف';
  };

  const getBrowserInfo = (userAgent: string | null): string => {
    if (!userAgent) return 'متصفح غير معروف';
    const ua = userAgent.toLowerCase();
    if (ua.includes('chrome') && !ua.includes('edge')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    if (ua.includes('opera')) return 'Opera';
    return 'متصفح غير معروف';
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
      case 'session_created':
        return <UserCheck className="h-4 w-4 text-success" />;
      case 'logout':
      case 'session_revoked':
        return <LogOut className="h-4 w-4 text-warning" />;
      case 'password_change':
        return <Key className="h-4 w-4 text-info" />;
      case 'settings_update':
        return <Settings className="h-4 w-4 text-primary" />;
      case 'failed_login':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      'login': 'تسجيل دخول',
      'logout': 'تسجيل خروج',
      'session_created': 'إنشاء جلسة',
      'session_revoked': 'إنهاء جلسة',
      'password_change': 'تغيير كلمة المرور',
      'settings_update': 'تحديث الإعدادات',
      'failed_login': 'محاولة دخول فاشلة',
      '2fa_enabled': 'تفعيل المصادقة الثنائية',
      '2fa_disabled': 'إلغاء المصادقة الثنائية',
    };
    return labels[action] || action;
  };

  // Statistics
  const stats = useMemo(() => {
    const activeSessions = sessions.length;
    const mobileDevices = sessions.filter(s => {
      const ua = s.user_agent?.toLowerCase() || '';
      return ua.includes('mobile') || ua.includes('android') || ua.includes('iphone');
    }).length;
    const desktopDevices = activeSessions - mobileDevices;
    const successfulLogins = loginAttempts.filter(l => l.success).length;
    const failedLogins = loginAttempts.filter(l => !l.success).length;
    const securityScore = Math.min(100, Math.max(0, 
      50 + 
      (settings.two_factor_enabled ? 30 : 0) + 
      (!settings.allow_multiple_sessions ? 10 : 0) +
      (failedLogins === 0 ? 10 : -failedLogins * 2)
    ));
    
    return {
      activeSessions,
      mobileDevices,
      desktopDevices,
      successfulLogins,
      failedLogins,
      totalLogs: securityLogs.length,
      securityScore,
    };
  }, [sessions, loginAttempts, securityLogs, settings]);

  // Filtered data
  const filteredLoginAttempts = useMemo(() => {
    let filtered = loginAttempts;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(l => 
        filterStatus === 'success' ? l.success : !l.success
      );
    }
    
    if (searchTerm) {
      filtered = filtered.filter(l =>
        String(l.ip_address).includes(searchTerm) ||
        l.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [loginAttempts, filterStatus, searchTerm]);

  const filteredSessions = useMemo(() => {
    if (!searchTerm) return sessions;
    return sessions.filter(s =>
      String(s.ip_address).includes(searchTerm) ||
      s.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.user_agent?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sessions, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <ShieldCheck className="h-16 w-16 text-primary relative z-10" />
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-lg">جاري تحميل إعدادات الأمان...</p>
        </div>
      </div>
    );
  }

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getSecurityScoreLabel = (score: number) => {
    if (score >= 80) return 'ممتاز';
    if (score >= 60) return 'جيد';
    if (score >= 40) return 'متوسط';
    return 'ضعيف';
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AppHeader onOpenSettings={() => {}} />
      <AppSidebar />
      
      <main className="lg:mr-64 pt-16 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header with Security Score */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-success/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            
            <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-2xl animate-pulse" />
                  <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                    <Shield className="h-10 w-10 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    الأمان والجلسات
                    <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                      <Activity className="h-3 w-3 ml-1" />
                      محمي
                    </Badge>
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    إدارة أمان حسابك ومراقبة جلسات تسجيل الدخول
                  </p>
                </div>
              </div>

              {/* Security Score Circle */}
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      className="stroke-muted fill-none"
                      strokeWidth="8"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      className={`fill-none ${getSecurityScoreColor(stats.securityScore).replace('text', 'stroke')}`}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(stats.securityScore / 100) * 251.2} 251.2`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-bold ${getSecurityScoreColor(stats.securityScore)}`}>
                      {stats.securityScore}%
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">مستوى الأمان</p>
                  <p className={`text-xl font-bold ${getSecurityScoreColor(stats.securityScore)}`}>
                    {getSecurityScoreLabel(stats.securityScore)}
                  </p>
                  {stats.securityScore < 80 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      فعّل المصادقة الثنائية لزيادة الأمان
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="bg-gradient-to-br from-info/10 to-info/5 border-info/20 hover:shadow-lg transition-all hover:-translate-y-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-info/20 border border-info/30">
                    <Globe className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.activeSessions}</p>
                    <p className="text-xs text-muted-foreground">جلسات نشطة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:shadow-lg transition-all hover:-translate-y-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/20 border border-primary/30">
                    <Monitor className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.desktopDevices}</p>
                    <p className="text-xs text-muted-foreground">أجهزة سطح المكتب</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 hover:shadow-lg transition-all hover:-translate-y-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-secondary/20 border border-secondary/30">
                    <Smartphone className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.mobileDevices}</p>
                    <p className="text-xs text-muted-foreground">أجهزة محمولة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20 hover:shadow-lg transition-all hover:-translate-y-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-success/20 border border-success/30">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.successfulLogins}</p>
                    <p className="text-xs text-muted-foreground">دخول ناجح</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20 hover:shadow-lg transition-all hover:-translate-y-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-destructive/20 border border-destructive/30">
                    <XCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.failedLogins}</p>
                    <p className="text-xs text-muted-foreground">محاولات فاشلة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20 hover:shadow-lg transition-all hover:-translate-y-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-warning/20 border border-warning/30">
                    <History className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalLogs}</p>
                    <p className="text-xs text-muted-foreground">سجل الأمان</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Settings Card */}
          <Card className="bg-card border-border overflow-hidden">
            <CardHeader className="border-b border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                    <KeyRound className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground">إعدادات الأمان</CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">تخصيص إعدادات أمان حسابك</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Multiple Sessions Setting */}
                <div className="group p-5 rounded-xl bg-gradient-to-br from-info/5 to-transparent border border-info/20 hover:border-info/40 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-info/10 group-hover:bg-info/20 transition-colors">
                        <Globe className="h-6 w-6 text-info" />
                      </div>
                      <div>
                        <Label htmlFor="multiple-sessions" className="text-foreground text-base font-medium">
                          السماح بجلسات متعددة
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          تسجيل الدخول من عدة أجهزة في نفس الوقت
                        </p>
                        <Badge 
                          variant="outline" 
                          className={`mt-2 ${settings.allow_multiple_sessions 
                            ? 'border-success/30 text-success bg-success/10' 
                            : 'border-muted text-muted-foreground'}`}
                        >
                          {settings.allow_multiple_sessions ? 'مفعّل' : 'معطّل'}
                        </Badge>
                      </div>
                    </div>
                    <Switch
                      id="multiple-sessions"
                      checked={settings.allow_multiple_sessions}
                      onCheckedChange={(checked) => updateSecuritySettings('allow_multiple_sessions', checked)}
                    />
                  </div>
                </div>

                {/* 2FA Setting */}
                <div className="group p-5 rounded-xl bg-gradient-to-br from-warning/5 to-transparent border border-warning/20 hover:border-warning/40 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-warning/10 group-hover:bg-warning/20 transition-colors">
                        <Fingerprint className="h-6 w-6 text-warning" />
                      </div>
                      <div>
                        <Label htmlFor="2fa" className="text-foreground text-base font-medium flex items-center gap-2">
                          المصادقة الثنائية
                          {settings.two_factor_enabled && (
                            <Badge className="bg-success/10 text-success border-success/30 text-xs">
                              <ShieldCheck className="h-3 w-3 ml-1" />
                              محمي
                            </Badge>
                          )}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          طبقة أمان إضافية عند تسجيل الدخول
                        </p>
                        {!settings.two_factor_enabled && (
                          <div className="flex items-center gap-1 mt-2 text-warning text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            <span>ينصح بتفعيلها لزيادة الأمان</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Switch
                      id="2fa"
                      checked={settings.two_factor_enabled}
                      onCheckedChange={(checked) => updateSecuritySettings('two_factor_enabled', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs Section */}
          <Card className="bg-card border-border overflow-hidden">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
              <CardHeader className="border-b border-border bg-muted/30 pb-0">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <TabsList className="bg-background/50 border h-auto p-1 flex-wrap">
                    <TabsTrigger 
                      value="sessions" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
                    >
                      <Globe className="h-4 w-4" />
                      <span>الجلسات النشطة</span>
                      <Badge variant="secondary" className="mr-1 text-xs">
                        {sessions.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="security-logs" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
                    >
                      <History className="h-4 w-4" />
                      <span>سجل الأمان</span>
                      <Badge variant="secondary" className="mr-1 text-xs">
                        {securityLogs.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="login-history" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
                    >
                      <UserCheck className="h-4 w-4" />
                      <span>سجل الدخول</span>
                      <Badge variant="secondary" className="mr-1 text-xs">
                        {loginAttempts.length}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex items-center gap-2 pb-4 lg:pb-0">
                    <div className="relative flex-1 lg:w-64">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-9 bg-background"
                      />
                    </div>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="shrink-0"
                          >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>تحديث البيانات</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {activeTab === 'sessions' && sessions.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowRevokeAll(true)}
                        className="shrink-0 gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        إنهاء الكل
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {/* Sessions Tab */}
                <TabsContent value="sessions" className="m-0">
                  {filteredSessions.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-muted/50 rounded-full animate-ping" />
                        <div className="relative p-4 rounded-full bg-muted">
                          <WifiOff className="h-12 w-12 text-muted-foreground" />
                        </div>
                      </div>
                      <p className="text-muted-foreground mt-4 text-lg">لا توجد جلسات نشطة</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px]">
                      <div className="divide-y divide-border">
                        {filteredSessions.map((session, index) => (
                          <div
                            key={session.id}
                            className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${
                              index === 0 ? 'bg-primary/5' : ''
                            }`}
                          >
                            <div className={`p-3 rounded-xl ${
                              index === 0 
                                ? 'bg-primary/20 ring-2 ring-primary/30' 
                                : 'bg-muted'
                            }`}>
                              {getDeviceIcon(session.user_agent)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium text-foreground">
                                  {session.device_name || getDeviceType(session.user_agent)}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {getBrowserInfo(session.user_agent)}
                                </Badge>
                                {index === 0 && (
                                  <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                                    <Wifi className="h-3 w-3 ml-1" />
                                    الجلسة الحالية
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                                {session.ip_address && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {String(session.ip_address)}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(session.last_active), { addSuffix: true, locale: ar })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(session.created_at), 'dd/MM/yyyy HH:mm')}
                                </span>
                              </div>
                            </div>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSessionToRevoke(session.id)}
                                    disabled={actionLoading}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <LogOut className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>إنهاء الجلسة</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>

                {/* Security Logs Tab */}
                <TabsContent value="security-logs" className="m-0">
                  {securityLogs.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="relative inline-block">
                        <div className="relative p-4 rounded-full bg-muted">
                          <History className="h-12 w-12 text-muted-foreground" />
                        </div>
                      </div>
                      <p className="text-muted-foreground mt-4 text-lg">لا توجد سجلات أمان</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px]">
                      <div className="divide-y divide-border">
                        {securityLogs.map((log) => (
                          <div
                            key={log.id}
                            className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                          >
                            <div className="p-2.5 rounded-xl bg-muted">
                              {getActionIcon(log.action)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground">
                                {getActionLabel(log.action)}
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                {log.ip_address && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {String(log.ip_address)}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>

                {/* Login History Tab */}
                <TabsContent value="login-history" className="m-0">
                  <div className="p-4 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Button
                        variant={filterStatus === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('all')}
                      >
                        الكل
                      </Button>
                      <Button
                        variant={filterStatus === 'success' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('success')}
                        className={filterStatus === 'success' ? 'bg-success hover:bg-success/90' : ''}
                      >
                        <CheckCircle className="h-4 w-4 ml-1" />
                        ناجح
                      </Button>
                      <Button
                        variant={filterStatus === 'failed' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('failed')}
                        className={filterStatus === 'failed' ? 'bg-destructive hover:bg-destructive/90' : ''}
                      >
                        <XCircle className="h-4 w-4 ml-1" />
                        فاشل
                      </Button>
                    </div>
                  </div>
                  
                  {filteredLoginAttempts.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="relative inline-block">
                        <div className="relative p-4 rounded-full bg-muted">
                          <UserCheck className="h-12 w-12 text-muted-foreground" />
                        </div>
                      </div>
                      <p className="text-muted-foreground mt-4 text-lg">لا توجد سجلات دخول</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[450px]">
                      <div className="divide-y divide-border">
                        {filteredLoginAttempts.map((attempt) => (
                          <div
                            key={attempt.id}
                            className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${
                              !attempt.success ? 'bg-destructive/5' : ''
                            }`}
                          >
                            <div className={`p-2.5 rounded-xl ${
                              attempt.success 
                                ? 'bg-success/10' 
                                : 'bg-destructive/10'
                            }`}>
                              {attempt.success 
                                ? <CheckCircle className="h-5 w-5 text-success" />
                                : <XCircle className="h-5 w-5 text-destructive" />
                              }
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-foreground">
                                  {attempt.success ? 'تسجيل دخول ناجح' : 'محاولة دخول فاشلة'}
                                </h4>
                                <Badge 
                                  variant="outline" 
                                  className={attempt.success 
                                    ? 'border-success/30 text-success' 
                                    : 'border-destructive/30 text-destructive'}
                                >
                                  {attempt.success ? 'ناجح' : 'فاشل'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                                {attempt.ip_address && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {String(attempt.ip_address)}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(attempt.created_at), 'dd/MM/yyyy HH:mm')}
                                </span>
                              </div>
                              {attempt.error_message && (
                                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  {attempt.error_message}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          {/* Security Tips */}
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <ShieldAlert className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">نصائح أمنية</h3>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success shrink-0" />
                      <span>استخدم كلمة مرور قوية تحتوي على أحرف وأرقام ورموز</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success shrink-0" />
                      <span>فعّل المصادقة الثنائية لحماية إضافية</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success shrink-0" />
                      <span>راجع الجلسات النشطة بانتظام وأنهِ الجلسات المشبوهة</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success shrink-0" />
                      <span>لا تشارك بيانات تسجيل الدخول مع أي شخص</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Revoke Session Dialog */}
      <AlertDialog open={!!sessionToRevoke} onOpenChange={() => setSessionToRevoke(null)}>
        <AlertDialogContent dir="rtl" className="bg-card border-border">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-destructive/10">
                <LogOut className="h-6 w-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-foreground text-xl">إنهاء الجلسة</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground">
              هل أنت متأكد من إنهاء هذه الجلسة؟ سيتم تسجيل خروج هذا الجهاز تلقائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="gap-2">
              <XCircle className="h-4 w-4" />
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sessionToRevoke && revokeSession(sessionToRevoke)}
              disabled={actionLoading}
              className="bg-destructive hover:bg-destructive/90 gap-2"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              تأكيد الإنهاء
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke All Sessions Dialog */}
      <AlertDialog open={showRevokeAll} onOpenChange={setShowRevokeAll}>
        <AlertDialogContent dir="rtl" className="bg-card border-border">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-destructive/10">
                <ShieldAlert className="h-6 w-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-foreground text-xl">إنهاء جميع الجلسات</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground">
              هل أنت متأكد من إنهاء جميع الجلسات؟ سيتم تسجيل خروجك من جميع الأجهزة بما فيها هذا الجهاز.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="gap-2">
              <XCircle className="h-4 w-4" />
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={revokeAllSessions}
              disabled={actionLoading}
              className="bg-destructive hover:bg-destructive/90 gap-2"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              إنهاء الكل
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
