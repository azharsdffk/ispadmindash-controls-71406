import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useUserRole } from '@/hooks/useUserRole';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { 
  Loader2, Search, RefreshCw, FileText, User, Calendar,
  Shield, Activity, Eye, Filter, Download, Clock,
  AlertTriangle, CheckCircle, XCircle, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_data: any;
  new_data: any;
  ip_address: unknown;
  user_agent: string | null;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  permission_check: Shield,
  unauthorized_: AlertTriangle,
  create: CheckCircle,
  update: Activity,
  delete: XCircle,
  default: Info
};

const ACTION_COLORS: Record<string, string> = {
  permission_check: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  unauthorized_: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  create: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  update: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
};

export default function AuditLog() {
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin, loading: roleLoading } = useUserRole();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (!roleLoading && !isAdmin && !isSuperAdmin) {
      toast.error('ليس لديك صلاحية الوصول إلى هذه الصفحة');
      navigate('/');
      return;
    }
  }, [isAdmin, isSuperAdmin, roleLoading, navigate]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      const { data: logsData, error: logsError } = await supabase
        .from('sensitive_operations_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (logsError) throw logsError;

      // جلب معلومات المستخدمين
      const userIds = [...new Set(logsData?.map(log => log.user_id).filter(Boolean))];
      
      let usersMap: Record<string, { email: string; full_name: string }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        
        profiles?.forEach(profile => {
          usersMap[profile.id] = {
            email: '',
            full_name: profile.full_name || 'غير معروف'
          };
        });
      }

      const enrichedLogs = logsData?.map(log => ({
        ...log,
        user_email: usersMap[log.user_id!]?.email || '',
        user_name: usersMap[log.user_id!]?.full_name || 'غير معروف'
      })) || [];

      setLogs(enrichedLogs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('فشل في جلب سجل العمليات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!roleLoading && (isAdmin || isSuperAdmin)) {
      fetchLogs();

      // الاستماع للتحديثات الفورية
      const channel = supabase
        .channel('audit_log_realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'sensitive_operations_log'
          },
          () => {
            fetchLogs();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [roleLoading, isAdmin, isSuperAdmin]);

  const getActionIcon = (action: string) => {
    for (const key of Object.keys(ACTION_ICONS)) {
      if (action.startsWith(key) || action.includes(key)) {
        return ACTION_ICONS[key];
      }
    }
    return ACTION_ICONS.default;
  };

  const getActionColor = (action: string) => {
    for (const key of Object.keys(ACTION_COLORS)) {
      if (action.startsWith(key) || action.includes(key)) {
        return ACTION_COLORS[key];
      }
    }
    return ACTION_COLORS.default;
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchQuery === '' || 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action.includes(actionFilter);
    const matchesResource = resourceFilter === 'all' || log.resource_type === resourceFilter;

    return matchesSearch && matchesAction && matchesResource;
  });

  const uniqueActions = [...new Set(logs.map(log => log.action.split('_')[0]))];
  const uniqueResources = [...new Set(logs.map(log => log.resource_type))];

  const exportLogs = () => {
    const csv = [
      ['التاريخ', 'المستخدم', 'الإجراء', 'نوع المورد', 'معرف المورد'].join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.user_name || 'غير معروف',
        log.action,
        log.resource_type,
        log.resource_id || '-'
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_log_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    
    toast.success('تم تصدير السجل بنجاح');
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Helmet>
        <title>سجل العمليات | نظام إدارة ISP</title>
      </Helmet>

      <div className="min-h-screen flex w-full bg-background" dir="rtl">
        <AppSidebar />

        <div className="flex-1 flex flex-col">
          <AppHeader />

          <main className="flex-1 p-6 space-y-6">
            {/* العنوان والإحصائيات */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <Activity className="h-8 w-8 text-primary" />
                  سجل العمليات الحساسة
                </h1>
                <p className="text-muted-foreground mt-1">
                  تتبع جميع العمليات الحساسة في النظام
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={fetchLogs}>
                  <RefreshCw className="h-4 w-4 ml-1" />
                  تحديث
                </Button>
                <Button variant="outline" size="sm" onClick={exportLogs}>
                  <Download className="h-4 w-4 ml-1" />
                  تصدير
                </Button>
              </div>
            </div>

            {/* بطاقات الإحصائيات */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي العمليات</p>
                      <p className="text-2xl font-bold">{logs.length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">محاولات غير مصرح بها</p>
                      <p className="text-2xl font-bold text-destructive">
                        {logs.filter(l => l.action.includes('unauthorized')).length}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">فحوصات الصلاحيات</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {logs.filter(l => l.action === 'permission_check').length}
                      </p>
                    </div>
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">اليوم</p>
                      <p className="text-2xl font-bold text-green-600">
                        {logs.filter(l => 
                          new Date(l.created_at).toDateString() === new Date().toDateString()
                        ).length}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* فلاتر البحث */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث في السجل..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-[200px]">
                      <Filter className="h-4 w-4 ml-2" />
                      <SelectValue placeholder="نوع الإجراء" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الإجراءات</SelectItem>
                      {uniqueActions.map(action => (
                        <SelectItem key={action} value={action}>{action}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={resourceFilter} onValueChange={setResourceFilter}>
                    <SelectTrigger className="w-[200px]">
                      <Filter className="h-4 w-4 ml-2" />
                      <SelectValue placeholder="نوع المورد" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الموارد</SelectItem>
                      {uniqueResources.map(resource => (
                        <SelectItem key={resource} value={resource}>{resource}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* جدول السجل */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  سجل العمليات ({filteredLogs.length})
                </CardTitle>
                <CardDescription>
                  جميع العمليات الحساسة المسجلة في النظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد عمليات مسجلة</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>التاريخ والوقت</TableHead>
                          <TableHead>المستخدم</TableHead>
                          <TableHead>الإجراء</TableHead>
                          <TableHead>نوع المورد</TableHead>
                          <TableHead>معرف المورد</TableHead>
                          <TableHead>تفاصيل</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLogs.map((log) => {
                          const ActionIcon = getActionIcon(log.action);
                          return (
                            <TableRow key={log.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">
                                    {format(new Date(log.created_at), 'yyyy/MM/dd HH:mm:ss', { locale: ar })}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span>{log.user_name || 'غير معروف'}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={getActionColor(log.action)}>
                                  <ActionIcon className="h-3 w-3 ml-1" />
                                  {log.action}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{log.resource_type}</Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-mono text-muted-foreground">
                                  {log.resource_id ? log.resource_id.slice(0, 8) + '...' : '-'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedLog(log);
                                    setDetailsOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      {/* مودال التفاصيل */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              تفاصيل العملية
            </DialogTitle>
            <DialogDescription>
              معلومات تفصيلية عن هذه العملية
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">المستخدم</label>
                  <p className="font-medium">{selectedLog.user_name || 'غير معروف'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">التاريخ</label>
                  <p className="font-medium">
                    {format(new Date(selectedLog.created_at), 'yyyy/MM/dd HH:mm:ss', { locale: ar })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">الإجراء</label>
                  <Badge className={getActionColor(selectedLog.action)}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">نوع المورد</label>
                  <Badge variant="outline">{selectedLog.resource_type}</Badge>
                </div>
                {selectedLog.resource_id && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">معرف المورد</label>
                    <p className="font-mono text-sm">{selectedLog.resource_id}</p>
                  </div>
                )}
                {selectedLog.ip_address && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">عنوان IP</label>
                    <p className="font-mono text-sm">{String(selectedLog.ip_address)}</p>
                  </div>
                )}
              </div>

              {selectedLog.new_data && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">البيانات</label>
                  <ScrollArea className="h-48 mt-2">
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto" dir="ltr">
                      {JSON.stringify(selectedLog.new_data, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              )}

              {selectedLog.old_data && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">البيانات السابقة</label>
                  <ScrollArea className="h-48 mt-2">
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto" dir="ltr">
                      {JSON.stringify(selectedLog.old_data, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </SidebarProvider>
  );
}