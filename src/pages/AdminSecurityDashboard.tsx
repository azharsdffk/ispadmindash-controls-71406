import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shield, Activity, Eye, Monitor, MapPin, Globe,
  Loader2, Search, RefreshCw, AlertTriangle, CheckCircle,
  XCircle, Clock, Download, User, FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Navigate } from 'react-router-dom';

interface SecurityLog {
  id: string;
  user_id: string;
  ip_address: string | null;
  location: string | null;
  country: string | null;
  city: string | null;
  device_info: string | null;
  user_agent: string | null;
  browser: string | null;
  os: string | null;
  login_method: string | null;
  login_status: string | null;
  event_type: string | null;
  metadata: any;
  created_at: string;
}

interface LoginAttempt {
  id: string;
  email: string;
  user_id: string | null;
  success: boolean;
  ip_address: unknown;
  user_agent: string | null;
  error_message: string | null;
  created_at: string | null;
}

const AdminSecurityDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isSuperAdmin, loading: roleLoading } = useUserRole();
  const [activeTab, setActiveTab] = useState('security-logs');
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('all');

  useEffect(() => {
    if (!roleLoading && (isAdmin || isSuperAdmin)) {
      fetchData();
    }
  }, [roleLoading, isAdmin, isSuperAdmin, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'security-logs') {
        const { data, error } = await supabase
          .from('user_security_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);
        if (error) throw error;
        setSecurityLogs((data as any[]) || []);
      } else if (activeTab === 'login-attempts') {
        const { data, error } = await supabase
          .from('login_attempts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);
        if (error) throw error;
        setLoginAttempts(data || []);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  const filteredSecurityLogs = securityLogs.filter(log => {
    const matchesSearch = !searchTerm ||
      log.ip_address?.includes(searchTerm) ||
      log.user_id?.includes(searchTerm) ||
      log.event_type?.includes(searchTerm) ||
      log.country?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = eventFilter === 'all' || log.event_type === eventFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredLoginAttempts = loginAttempts.filter(attempt => {
    return !searchTerm ||
      attempt.email?.includes(searchTerm) ||
      String(attempt.ip_address)?.includes(searchTerm);
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'success': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">نجاح</Badge>;
      case 'failed': return <Badge variant="destructive">فشل</Badge>;
      case 'blocked': return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">محظور</Badge>;
      default: return <Badge variant="secondary">{status || 'غير معروف'}</Badge>;
    }
  };

  const exportToCSV = () => {
    const data = activeTab === 'security-logs' ? filteredSecurityLogs : filteredLoginAttempts;
    const headers = activeTab === 'security-logs'
      ? ['ID', 'User ID', 'IP', 'Country', 'City', 'Device', 'Browser', 'OS', 'Event', 'Status', 'Date']
      : ['ID', 'Email', 'Success', 'IP', 'Error', 'Date'];
    
    const rows = data.map((item: any) => {
      if (activeTab === 'security-logs') {
        return [item.id, item.user_id, item.ip_address, item.country, item.city, item.device_info, item.browser, item.os, item.event_type, item.login_status, item.created_at];
      }
      return [item.id, item.email, item.success, item.ip_address, item.error_message, item.created_at];
    });

    const csv = [headers.join(','), ...rows.map((r: any[]) => r.map(v => `"${v || ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success('تم تصدير البيانات');
  };

  const statsCards = [
    {
      title: 'إجمالي الأحداث الأمنية',
      value: securityLogs.length,
      icon: Shield,
      color: 'text-blue-400'
    },
    {
      title: 'محاولات دخول فاشلة',
      value: loginAttempts.filter(a => !a.success).length,
      icon: AlertTriangle,
      color: 'text-red-400'
    },
    {
      title: 'محاولات دخول ناجحة',
      value: loginAttempts.filter(a => a.success).length,
      icon: CheckCircle,
      color: 'text-emerald-400'
    },
    {
      title: 'عناوين IP فريدة',
      value: new Set(securityLogs.map(l => l.ip_address).filter(Boolean)).size,
      icon: Globe,
      color: 'text-purple-400'
    }
  ];

  return (
    <>
      <Helmet>
        <title>لوحة الأمان - Admin</title>
      </Helmet>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background" dir="rtl">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <AppHeader />
            <main className="flex-1 p-4 md:p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Shield className="h-7 w-7 text-primary" />
                    لوحة الأمان والمراقبة
                  </h1>
                  <p className="text-muted-foreground mt-1">مراقبة الأحداث الأمنية وسجلات الدخول - متاح للأدمن فقط</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportToCSV}>
                    <Download className="h-4 w-4 ml-1" />
                    تصدير
                  </Button>
                  <Button variant="outline" size="sm" onClick={fetchData}>
                    <RefreshCw className="h-4 w-4 ml-1" />
                    تحديث
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map((stat, i) => (
                  <Card key={i} className="border-border/50">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                        <stat.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); }}>
                <TabsList className="mb-4">
                  <TabsTrigger value="security-logs" className="gap-1">
                    <Monitor className="h-4 w-4" /> سجلات الأمان
                  </TabsTrigger>
                  <TabsTrigger value="login-attempts" className="gap-1">
                    <Activity className="h-4 w-4" /> محاولات الدخول
                  </TabsTrigger>
                </TabsList>

                {/* Filters */}
                <div className="flex gap-3 mb-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث بـ IP، بريد، حدث..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  {activeTab === 'security-logs' && (
                    <Select value={eventFilter} onValueChange={setEventFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="نوع الحدث" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        <SelectItem value="login">تسجيل دخول</SelectItem>
                        <SelectItem value="logout">تسجيل خروج</SelectItem>
                        <SelectItem value="password_change">تغيير كلمة مرور</SelectItem>
                        <SelectItem value="otp_sent">إرسال OTP</SelectItem>
                        <SelectItem value="otp_verified">تحقق OTP</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Security Logs Tab */}
                <TabsContent value="security-logs">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">سجلات الأمان التفصيلية</CardTitle>
                      <CardDescription>IP، الموقع، الجهاز، المتصفح، ونوع الحدث</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="flex justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : filteredSecurityLogs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>لا توجد سجلات أمان بعد</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[500px]">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-right">التاريخ</TableHead>
                                <TableHead className="text-right">المستخدم</TableHead>
                                <TableHead className="text-right">IP</TableHead>
                                <TableHead className="text-right">الموقع</TableHead>
                                <TableHead className="text-right">الجهاز</TableHead>
                                <TableHead className="text-right">المتصفح / OS</TableHead>
                                <TableHead className="text-right">الحدث</TableHead>
                                <TableHead className="text-right">الحالة</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredSecurityLogs.map(log => (
                                <TableRow key={log.id}>
                                  <TableCell className="text-xs">
                                    {format(new Date(log.created_at), 'yyyy/MM/dd HH:mm', { locale: ar })}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs max-w-[120px] truncate">
                                    {log.user_id?.slice(0, 8)}...
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">{log.ip_address || '-'}</TableCell>
                                  <TableCell className="text-xs">
                                    {log.country || log.city ? `${log.country || ''} ${log.city || ''}` : '-'}
                                  </TableCell>
                                  <TableCell className="text-xs">{log.device_info || '-'}</TableCell>
                                  <TableCell className="text-xs">
                                    {log.browser || '-'} / {log.os || '-'}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">{log.event_type || '-'}</Badge>
                                  </TableCell>
                                  <TableCell>{getStatusBadge(log.login_status)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Login Attempts Tab */}
                <TabsContent value="login-attempts">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">محاولات تسجيل الدخول</CardTitle>
                      <CardDescription>جميع محاولات الدخول الناجحة والفاشلة مع تفاصيل IP و User Agent</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="flex justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : filteredLoginAttempts.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>لا توجد محاولات دخول مسجلة</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[500px]">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-right">التاريخ</TableHead>
                                <TableHead className="text-right">البريد</TableHead>
                                <TableHead className="text-right">النتيجة</TableHead>
                                <TableHead className="text-right">IP</TableHead>
                                <TableHead className="text-right">User Agent</TableHead>
                                <TableHead className="text-right">الخطأ</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredLoginAttempts.map(attempt => (
                                <TableRow key={attempt.id}>
                                  <TableCell className="text-xs">
                                    {attempt.created_at ? format(new Date(attempt.created_at), 'yyyy/MM/dd HH:mm', { locale: ar }) : '-'}
                                  </TableCell>
                                  <TableCell className="text-xs">{attempt.email}</TableCell>
                                  <TableCell>
                                    {attempt.success ? (
                                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">نجاح</Badge>
                                    ) : (
                                      <Badge variant="destructive">فشل</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">{String(attempt.ip_address) || '-'}</TableCell>
                                  <TableCell className="text-xs max-w-[200px] truncate">{attempt.user_agent || '-'}</TableCell>
                                  <TableCell className="text-xs text-destructive">{attempt.error_message || '-'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
};

export default AdminSecurityDashboard;
