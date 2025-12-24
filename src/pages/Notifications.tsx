import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  Bell, 
  BellOff, 
  Check, 
  Trash2, 
  Eye, 
  Mail, 
  MessageSquare,
  Search,
  RefreshCw,
  CheckCheck,
  Filter,
  Calendar,
  Clock,
  AlertCircle,
  Info,
  AlertTriangle,
  Loader2,
  XCircle,
  Archive,
  Inbox,
  Star,
  StarOff,
  ChevronDown,
  MoreVertical,
  Sparkles,
  Zap,
  BellRing,
  Volume2,
  VolumeX,
  Settings,
  Ticket
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteConfirmDialog } from "@/components/modals/DeleteConfirmDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  action_url: string | null;
  created_at: string;
}

type TabType = 'all' | 'unread' | 'read';
type FilterType = 'all' | 'today' | 'week' | 'email' | 'message' | 'alert' | 'ticket';

const Notifications = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<{ id: string; title: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [viewNotification, setViewNotification] = useState<Notification | null>(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const unsubscribe = subscribeToNotifications();
      return unsubscribe;
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('فشل تحميل الإشعارات');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
    toast.success('تم تحديث الإشعارات');
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          toast.info(newNotification.title, {
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      toast.success('تم وضع علامة مقروء');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('فشل تحديث الإشعار');
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('تم وضع علامة مقروء على جميع الإشعارات');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('فشل تحديث الإشعارات');
    }
  };

  const markSelectedAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', Array.from(selectedNotifications));

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => selectedNotifications.has(n.id) ? { ...n, read: true } : n)
      );
      setSelectedNotifications(new Set());
      setSelectMode(false);
      toast.success('تم وضع علامة مقروء على الإشعارات المحددة');
    } catch (error) {
      console.error('Error marking selected as read:', error);
      toast.error('فشل تحديث الإشعارات');
    }
  };

  const handleDeleteClick = (id: string, title: string) => {
    setNotificationToDelete({ id, title });
    setDeleteDialogOpen(true);
  };

  const deleteNotification = async () => {
    if (!notificationToDelete) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationToDelete.id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationToDelete.id));
      toast.success('تم حذف الإشعار');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('فشل حذف الإشعار');
    }
  };

  const deleteAllRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user?.id)
        .eq('read', true);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => !n.read));
      toast.success('تم حذف جميع الإشعارات المقروءة');
    } catch (error) {
      console.error('Error deleting read notifications:', error);
      toast.error('فشل حذف الإشعارات');
    }
  };

  const deleteSelectedNotifications = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', Array.from(selectedNotifications));

      if (error) throw error;

      setNotifications(prev => prev.filter(n => !selectedNotifications.has(n.id)));
      setSelectedNotifications(new Set());
      setSelectMode(false);
      toast.success('تم حذف الإشعارات المحددة');
    } catch (error) {
      console.error('Error deleting selected notifications:', error);
      toast.error('فشل حذف الإشعارات');
    }
  };

  const toggleSelectNotification = (id: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotifications(newSelected);
  };

  const selectAll = () => {
    const currentNotifications = getFilteredNotifications();
    setSelectedNotifications(new Set(currentNotifications.map(n => n.id)));
  };

  const deselectAll = () => {
    setSelectedNotifications(new Set());
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-5 w-5 text-info" />;
      case 'message':
        return <MessageSquare className="h-5 w-5 text-success" />;
      case 'alert':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'ticket':
        return <Ticket className="h-5 w-5 text-primary" />;
      case 'info':
        return <Info className="h-5 w-5 text-info" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  const getNotificationIconBg = (type: string) => {
    switch (type) {
      case 'email':
        return 'bg-info/10 border-info/20';
      case 'message':
        return 'bg-success/10 border-success/20';
      case 'alert':
        return 'bg-warning/10 border-warning/20';
      case 'ticket':
        return 'bg-primary/10 border-primary/20';
      case 'info':
        return 'bg-info/10 border-info/20';
      case 'error':
        return 'bg-destructive/10 border-destructive/20';
      default:
        return 'bg-primary/10 border-primary/20';
    }
  };

  const getTimeGroup = (date: Date): string => {
    if (isToday(date)) return 'اليوم';
    if (isYesterday(date)) return 'أمس';
    if (isThisWeek(date)) return 'هذا الأسبوع';
    return 'سابقاً';
  };

  // Statistics
  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const read = total - unread;
    const today = notifications.filter(n => isToday(new Date(n.created_at))).length;
    const emails = notifications.filter(n => n.type === 'email').length;
    const messages = notifications.filter(n => n.type === 'message').length;
    const alerts = notifications.filter(n => n.type === 'alert').length;
    const tickets = notifications.filter(n => n.type === 'ticket').length;

    return { total, unread, read, today, emails, messages, alerts, tickets };
  }, [notifications]);

  // Filtered notifications
  const getFilteredNotifications = () => {
    let filtered = notifications;

    // Tab filter
    if (activeTab === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (activeTab === 'read') {
      filtered = filtered.filter(n => n.read);
    }

    // Type filter
    if (filterType === 'today') {
      filtered = filtered.filter(n => isToday(new Date(n.created_at)));
    } else if (filterType === 'week') {
      filtered = filtered.filter(n => isThisWeek(new Date(n.created_at)));
    } else if (filterType !== 'all') {
      filtered = filtered.filter(n => n.type === filterType);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();

  // Group notifications by time
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {};
    
    filteredNotifications.forEach(notification => {
      const group = getTimeGroup(new Date(notification.created_at));
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(notification);
    });

    return groups;
  }, [filteredNotifications]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <BellRing className="h-16 w-16 text-primary relative z-10" />
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-lg">جاري تحميل الإشعارات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      <AppSidebar />
      
      <main className="lg:mr-64 pt-16 p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-info/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            
            <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-2xl animate-pulse" />
                  <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                    <Bell className="h-10 w-10 text-primary-foreground" />
                  </div>
                  {stats.unread > 0 && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs font-bold animate-bounce">
                      {stats.unread > 99 ? '99+' : stats.unread}
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    الإشعارات
                    {stats.unread > 0 && (
                      <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                        <Sparkles className="h-3 w-3 ml-1" />
                        {stats.unread} جديد
                      </Badge>
                    )}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    إجمالي {stats.total} إشعار • {stats.today} اليوم
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRefresh}
                        disabled={refreshing}
                      >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>تحديث</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {stats.unread > 0 && (
                  <Button onClick={markAllAsRead} variant="outline" className="gap-2">
                    <CheckCheck className="h-4 w-4" />
                    قراءة الكل
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setSelectMode(!selectMode)}>
                      {selectMode ? <XCircle className="h-4 w-4 ml-2" /> : <Check className="h-4 w-4 ml-2" />}
                      {selectMode ? 'إلغاء التحديد' : 'تحديد متعدد'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setDeleteAllDialogOpen(true)}
                      className="text-destructive"
                      disabled={stats.read === 0}
                    >
                      <Trash2 className="h-4 w-4 ml-2" />
                      حذف المقروءة
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:shadow-lg transition-all hover:-translate-y-1 col-span-1">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                    <Inbox className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{stats.total}</p>
                    <p className="text-[10px] text-muted-foreground">الإجمالي</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20 hover:shadow-lg transition-all hover:-translate-y-1 col-span-1">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-destructive/20 border border-destructive/30">
                    <BellRing className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{stats.unread}</p>
                    <p className="text-[10px] text-muted-foreground">غير مقروء</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20 hover:shadow-lg transition-all hover:-translate-y-1 col-span-1">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-success/20 border border-success/30">
                    <Check className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{stats.read}</p>
                    <p className="text-[10px] text-muted-foreground">مقروء</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-info/10 to-info/5 border-info/20 hover:shadow-lg transition-all hover:-translate-y-1 col-span-1">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-info/20 border border-info/30">
                    <Calendar className="h-4 w-4 text-info" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{stats.today}</p>
                    <p className="text-[10px] text-muted-foreground">اليوم</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-info/10 to-info/5 border-info/20 hover:shadow-lg transition-all hover:-translate-y-1 col-span-1">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-info/20 border border-info/30">
                    <Mail className="h-4 w-4 text-info" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{stats.emails}</p>
                    <p className="text-[10px] text-muted-foreground">بريد</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20 hover:shadow-lg transition-all hover:-translate-y-1 col-span-1">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-success/20 border border-success/30">
                    <MessageSquare className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{stats.messages}</p>
                    <p className="text-[10px] text-muted-foreground">رسائل</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20 hover:shadow-lg transition-all hover:-translate-y-1 col-span-1">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-warning/20 border border-warning/30">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{stats.alerts}</p>
                    <p className="text-[10px] text-muted-foreground">تنبيهات</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:shadow-lg transition-all hover:-translate-y-1 col-span-1">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                    <Ticket className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{stats.tickets}</p>
                    <p className="text-[10px] text-muted-foreground">تذاكر</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          {stats.total > 0 && (
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">نسبة الإشعارات المقروءة</span>
                  <span className="text-sm font-medium text-foreground">
                    {Math.round((stats.read / stats.total) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={(stats.read / stats.total) * 100} 
                  className="h-2"
                />
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          <Card className="bg-card border-border overflow-hidden">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
              <CardHeader className="border-b border-border bg-muted/30 pb-0">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <TabsList className="bg-background/50 border h-auto p-1">
                    <TabsTrigger 
                      value="all" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
                    >
                      <Inbox className="h-4 w-4" />
                      <span>الكل</span>
                      <Badge variant="secondary" className="mr-1 text-xs">
                        {stats.total}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="unread" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
                    >
                      <BellRing className="h-4 w-4" />
                      <span>غير مقروء</span>
                      <Badge variant="secondary" className="mr-1 text-xs bg-destructive/10 text-destructive">
                        {stats.unread}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="read" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
                    >
                      <Check className="h-4 w-4" />
                      <span>مقروء</span>
                      <Badge variant="secondary" className="mr-1 text-xs">
                        {stats.read}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex items-center gap-2 pb-4 lg:pb-0">
                    <div className="relative flex-1 lg:w-64">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث في الإشعارات..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-9 bg-background"
                      />
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Filter className="h-4 w-4" />
                          فلتر
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => setFilterType('all')}>
                          <Inbox className="h-4 w-4 ml-2" />
                          الكل
                          {filterType === 'all' && <Check className="h-4 w-4 mr-auto" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterType('today')}>
                          <Calendar className="h-4 w-4 ml-2" />
                          اليوم
                          {filterType === 'today' && <Check className="h-4 w-4 mr-auto" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterType('week')}>
                          <Clock className="h-4 w-4 ml-2" />
                          هذا الأسبوع
                          {filterType === 'week' && <Check className="h-4 w-4 mr-auto" />}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setFilterType('email')}>
                          <Mail className="h-4 w-4 ml-2" />
                          بريد
                          {filterType === 'email' && <Check className="h-4 w-4 mr-auto" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterType('message')}>
                          <MessageSquare className="h-4 w-4 ml-2" />
                          رسائل
                          {filterType === 'message' && <Check className="h-4 w-4 mr-auto" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterType('alert')}>
                          <AlertTriangle className="h-4 w-4 ml-2" />
                          تنبيهات
                          {filterType === 'alert' && <Check className="h-4 w-4 mr-auto" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterType('ticket')}>
                          <Ticket className="h-4 w-4 ml-2" />
                          تذاكر
                          {filterType === 'ticket' && <Check className="h-4 w-4 mr-auto" />}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Selection Actions Bar */}
                {selectMode && (
                  <div className="flex items-center gap-2 py-3 border-t border-border mt-4">
                    <Button variant="outline" size="sm" onClick={selectAll}>
                      تحديد الكل
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAll}>
                      إلغاء التحديد
                    </Button>
                    {selectedNotifications.size > 0 && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={markSelectedAsRead}
                          className="gap-2"
                        >
                          <Check className="h-4 w-4" />
                          قراءة ({selectedNotifications.size})
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={deleteSelectedNotifications}
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          حذف ({selectedNotifications.size})
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-0">
                <TabsContent value={activeTab} className="m-0">
                  {filteredNotifications.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-muted/50 rounded-full animate-ping" />
                        <div className="relative p-4 rounded-full bg-muted">
                          <BellOff className="h-12 w-12 text-muted-foreground" />
                        </div>
                      </div>
                      <p className="text-muted-foreground mt-4 text-lg">
                        {activeTab === 'unread' 
                          ? 'لا توجد إشعارات غير مقروءة' 
                          : activeTab === 'read'
                          ? 'لا توجد إشعارات مقروءة'
                          : 'لا توجد إشعارات'}
                      </p>
                      {searchTerm && (
                        <p className="text-sm text-muted-foreground mt-2">
                          حاول تغيير معايير البحث
                        </p>
                      )}
                    </div>
                  ) : (
                    <ScrollArea className="h-[600px]">
                      {Object.entries(groupedNotifications).map(([group, groupNotifications]) => (
                        <div key={group}>
                          <div className="sticky top-0 z-10 px-4 py-2 bg-muted/80 backdrop-blur-sm border-b border-border">
                            <span className="text-sm font-medium text-muted-foreground">
                              {group}
                            </span>
                          </div>
                          <div className="divide-y divide-border">
                            {groupNotifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={`flex items-start gap-4 p-4 hover:bg-muted/50 transition-all cursor-pointer ${
                                  !notification.read ? 'bg-primary/5' : ''
                                } ${selectedNotifications.has(notification.id) ? 'bg-primary/10 ring-1 ring-primary/30' : ''}`}
                                onClick={() => {
                                  if (selectMode) {
                                    toggleSelectNotification(notification.id);
                                  } else {
                                    setViewNotification(notification);
                                    if (!notification.read) {
                                      markAsRead(notification.id);
                                    }
                                  }
                                }}
                              >
                                {selectMode && (
                                  <div className="flex items-center justify-center w-5 h-5 mt-1">
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                      selectedNotifications.has(notification.id) 
                                        ? 'bg-primary border-primary' 
                                        : 'border-muted-foreground'
                                    }`}>
                                      {selectedNotifications.has(notification.id) && (
                                        <Check className="h-3 w-3 text-primary-foreground" />
                                      )}
                                    </div>
                                  </div>
                                )}

                                <div className={`p-2.5 rounded-xl border ${getNotificationIconBg(notification.type)} shrink-0`}>
                                  {getNotificationIcon(notification.type)}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className={`font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                          {notification.title}
                                        </h3>
                                        {!notification.read && (
                                          <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                                            جديد
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {notification.message}
                                      </p>
                                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ar })}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          {format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm')}
                                        </span>
                                      </div>
                                    </div>

                                    {!selectMode && (
                                      <div className="flex items-center gap-1">
                                        {!notification.read && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead(notification.id);
                                                  }}
                                                >
                                                  <Eye className="h-4 w-4" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>تحديد كمقروء</TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteClick(notification.id, notification.title);
                                                }}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>حذف</TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </main>

      {/* Delete Single Notification Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={deleteNotification}
        title="حذف إشعار"
        description="هل أنت متأكد من حذف هذا الإشعار؟ لا يمكن التراجع عن هذا الإجراء."
        itemName={notificationToDelete?.title}
      />

      {/* Delete All Read Dialog */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent dir="rtl" className="bg-card border-border">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-destructive/10">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-foreground text-xl">حذف الإشعارات المقروءة</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground">
              هل أنت متأكد من حذف جميع الإشعارات المقروءة ({stats.read})؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="gap-2">
              <XCircle className="h-4 w-4" />
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteAllRead}
              className="bg-destructive hover:bg-destructive/90 gap-2"
            >
              <Trash2 className="h-4 w-4" />
              حذف الكل
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Notification Details Dialog */}
      <AlertDialog open={!!viewNotification} onOpenChange={(open) => !open && setViewNotification(null)}>
        <AlertDialogContent dir="rtl" className="bg-card border-border max-w-lg">
          <AlertDialogHeader>
            <div className="flex items-start gap-4">
              {viewNotification && (
                <div className={`p-3 rounded-xl border ${getNotificationIconBg(viewNotification.type)} shrink-0`}>
                  {getNotificationIcon(viewNotification.type)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <AlertDialogTitle className="text-foreground text-xl">
                    {viewNotification?.title}
                  </AlertDialogTitle>
                  {viewNotification && !viewNotification.read && (
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                      جديد
                    </Badge>
                  )}
                </div>
                {viewNotification && (
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(viewNotification.created_at), { addSuffix: true, locale: ar })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(viewNotification.created_at), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </AlertDialogHeader>
          
          <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {viewNotification?.message}
            </p>
          </div>

          {viewNotification?.action_url && (
            <div className="mt-4">
              <Button 
                className="w-full gap-2" 
                onClick={() => {
                  window.location.href = viewNotification.action_url!;
                }}
              >
                <Eye className="h-4 w-4" />
                عرض التفاصيل
              </Button>
            </div>
          )}

          <AlertDialogFooter className="mt-4 gap-2">
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={() => {
                if (viewNotification) {
                  handleDeleteClick(viewNotification.id, viewNotification.title);
                  setViewNotification(null);
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              حذف
            </Button>
            <AlertDialogCancel className="gap-2">
              <XCircle className="h-4 w-4" />
              إغلاق
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default Notifications;
