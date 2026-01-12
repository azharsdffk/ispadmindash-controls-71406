import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { 
  AlertCircle, UserPlus, Shield, X, Users, UserCheck, UserX, Settings, Search,
  RefreshCw, Eye, Edit, Trash2, Key, Clock, Calendar, Mail, Activity, 
  Loader2, ShieldCheck, ShieldAlert, ShieldOff, User, Crown, Wrench, Calculator,
  LayoutGrid, List, Copy, ExternalLink, Lock, Unlock, CheckCircle, XCircle, Building2
} from 'lucide-react';
import { AddUserModal } from '@/components/modals/AddUserModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { DeleteConfirmDialog } from '@/components/modals/DeleteConfirmDialog';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

type AppRole = 'admin' | 'accountant' | 'technician' | 'client' | 'agent';

interface UserWithDetails {
  id: string;
  email: string;
  full_name: string;
  roles: AppRole[];
  last_login?: string;
  login_count: number;
  created_at: string;
}

interface UserStats {
  totalUsers: number;
  admins: number;
  accountants: number;
  technicians: number;
  clients: number;
  noRole: number;
  activeToday: number;
}

export default function UserAccountsManagement() {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<{ userId: string; role: AppRole; userName: string } | null>(null);
  const [viewUserOpen, setViewUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    admins: 0,
    accountants: 0,
    technicians: 0,
    clients: 0,
    noRole: 0,
    activeToday: 0,
  });

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error('غير مصرح لك بالوصول إلى هذه الصفحة');
      navigate('/');
      return;
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('manage-user-roles', {
        body: { action: 'list_users' }
      });

      if (error) throw error;

      const usersWithLoginInfo = await Promise.all(
        data.users.map(async (user: any) => {
          const { data: loginData } = await supabase
            .from('login_attempts')
            .select('created_at, success')
            .eq('user_id', user.id)
            .eq('success', true)
            .order('created_at', { ascending: false })
            .limit(1);

          const { count } = await supabase
            .from('login_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('success', true);

          return {
            ...user,
            last_login: loginData?.[0]?.created_at,
            login_count: count || 0
          };
        })
      );

      setUsers(usersWithLoginInfo);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const statsData: UserStats = {
        totalUsers: usersWithLoginInfo.length,
        admins: usersWithLoginInfo.filter((u: UserWithDetails) => u.roles.includes('admin')).length,
        accountants: usersWithLoginInfo.filter((u: UserWithDetails) => u.roles.includes('accountant')).length,
        technicians: usersWithLoginInfo.filter((u: UserWithDetails) => u.roles.includes('technician')).length,
        clients: usersWithLoginInfo.filter((u: UserWithDetails) => u.roles.includes('client')).length,
        noRole: usersWithLoginInfo.filter((u: UserWithDetails) => u.roles.length === 0).length,
        activeToday: usersWithLoginInfo.filter((u: UserWithDetails) => {
          if (!u.last_login) return false;
          const loginDate = new Date(u.last_login);
          loginDate.setHours(0, 0, 0, 0);
          return loginDate.getTime() === today.getTime();
        }).length,
      };
      
      setStats(statsData);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('فشل في جلب بيانات المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase.functions.invoke('manage-user-roles', {
        body: {
          action: 'assign_role',
          userId,
          role
        }
      });

      if (error) throw error;

      toast.success('تم تعيين الدور بنجاح');
      fetchUsers();
    } catch (error: any) {
      console.error('Error assigning role:', error);
      toast.error('فشل في تعيين الدور');
    }
  };

  const handleRemoveRoleClick = (userId: string, role: AppRole, userName: string) => {
    setRoleToDelete({ userId, role, userName });
    setDeleteDialogOpen(true);
  };

  const removeRole = async () => {
    if (!roleToDelete) return;

    try {
      const { error } = await supabase.functions.invoke('manage-user-roles', {
        body: {
          action: 'remove_role',
          userId: roleToDelete.userId,
          role: roleToDelete.role
        }
      });

      if (error) throw error;

      toast.success('تم إزالة الدور بنجاح');
      fetchUsers();
      setRoleToDelete(null);
    } catch (error: any) {
      console.error('Error removing role:', error);
      toast.error('فشل في إزالة الدور');
    }
  };

  const getRoleLabel = (role: AppRole): string => {
    const labels: Record<AppRole, string> = {
      admin: 'مدير',
      accountant: 'محاسب',
      technician: 'فني',
      agent: 'وكيل',
      client: 'عميل'
    };
    return labels[role] || role;
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    const variants: Record<AppRole, "default" | "secondary" | "destructive" | "outline"> = {
      admin: 'destructive',
      accountant: 'default',
      technician: 'secondary',
      agent: 'default',
      client: 'outline'
    };
    return variants[role] || 'default';
  };

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case 'admin': return Crown;
      case 'accountant': return Calculator;
      case 'technician': return Wrench;
      case 'agent': return Building2;
      case 'client': return User;
      default: return User;
    }
  };

  const getRoleColor = (role: AppRole) => {
    switch (role) {
      case 'admin': return { text: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-500/20' };
      case 'accountant': return { text: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
      case 'technician': return { text: 'text-yellow-600', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' };
      case 'agent': return { text: 'text-purple-600', bg: 'bg-purple-500/10', border: 'border-purple-500/20' };
      case 'client': return { text: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-500/20' };
      default: return { text: 'text-gray-600', bg: 'bg-gray-500/10', border: 'border-gray-500/20' };
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTab = activeTab === 'all' ||
        (activeTab === 'admins' && user.roles.includes('admin')) ||
        (activeTab === 'accountants' && user.roles.includes('accountant')) ||
        (activeTab === 'technicians' && user.roles.includes('technician')) ||
        (activeTab === 'clients' && user.roles.includes('client')) ||
        (activeTab === 'noRole' && user.roles.length === 0);
      
      const matchesRoleFilter = roleFilter === 'all' || 
        user.roles.includes(roleFilter as AppRole) ||
        (roleFilter === 'noRole' && user.roles.length === 0);
      
      return matchesSearch && matchesTab && matchesRoleFilter;
    });
  }, [users, searchQuery, activeTab, roleFilter]);

  const openViewModal = (user: UserWithDetails) => {
    setSelectedUser(user);
    setViewUserOpen(true);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${label}`);
  };

  const statCards = [
    { 
      label: 'إجمالي المستخدمين', 
      value: stats.totalUsers, 
      icon: Users, 
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20'
    },
    { 
      label: 'المدراء', 
      value: stats.admins, 
      icon: Crown, 
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    },
    { 
      label: 'المحاسبين', 
      value: stats.accountants, 
      icon: Calculator, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    { 
      label: 'الفنيين', 
      value: stats.technicians, 
      icon: Wrench, 
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20'
    },
    { 
      label: 'العملاء', 
      value: stats.clients, 
      icon: User, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    { 
      label: 'بدون دور', 
      value: stats.noRole, 
      icon: ShieldOff, 
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20'
    },
  ];

  const activePercentage = stats.totalUsers > 0 
    ? ((stats.totalUsers - stats.noRole) / stats.totalUsers) * 100 
    : 0;

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>إدارة الحسابات والصلاحيات | لوحة التحكم</title>
        <meta name="description" content="إدارة حسابات المستخدمين وتعيين الصلاحيات والأدوار" />
      </Helmet>

      <SidebarProvider>
        <div className="min-h-screen flex w-full" dir="rtl">
          <AppSidebar />
          <div className="flex-1">
            <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
            <main className="p-6 space-y-6">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">إدارة الحسابات والصلاحيات</h1>
                    <p className="text-muted-foreground">إدارة حسابات المستخدمين وتعيين الصلاحيات والأدوار</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={fetchUsers} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
                    تحديث
                  </Button>
                  <Button onClick={() => setAddUserOpen(true)}>
                    <UserPlus className="h-4 w-4 ml-2" />
                    إضافة مستخدم
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {statCards.map((stat, index) => (
                  <Card key={index} className={`border ${stat.borderColor} transition-all hover:shadow-md cursor-pointer`}
                    onClick={() => setActiveTab(
                      stat.label === 'إجمالي المستخدمين' ? 'all' :
                      stat.label === 'المدراء' ? 'admins' :
                      stat.label === 'المحاسبين' ? 'accountants' :
                      stat.label === 'الفنيين' ? 'technicians' :
                      stat.label === 'العملاء' ? 'clients' : 'noRole'
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                          <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Progress Bar */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">نسبة المستخدمين بأدوار محددة</span>
                    <span className="text-sm font-bold text-primary">{activePercentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={activePercentage} className="h-2" />
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{stats.totalUsers - stats.noRole} مستخدم بأدوار</span>
                    <span>من أصل {stats.totalUsers} مستخدم</span>
                  </div>
                </CardContent>
              </Card>

              {/* Alert */}
              <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-700 dark:text-blue-300">
                  تعيين الأدوار يؤثر على صلاحيات الوصول للنظام. تأكد من تعيين الأدوار المناسبة لكل مستخدم. اضغط على الدور لإزالته.
                </AlertDescription>
              </Alert>

              {/* Main Content */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <TabsList className="grid w-full md:w-auto grid-cols-3 lg:grid-cols-6">
                    <TabsTrigger value="all" className="gap-1 text-xs">
                      <Users className="h-3 w-3" />
                      الكل
                    </TabsTrigger>
                    <TabsTrigger value="admins" className="gap-1 text-xs">
                      <Crown className="h-3 w-3" />
                      مدراء
                    </TabsTrigger>
                    <TabsTrigger value="accountants" className="gap-1 text-xs">
                      <Calculator className="h-3 w-3" />
                      محاسبين
                    </TabsTrigger>
                    <TabsTrigger value="technicians" className="gap-1 text-xs">
                      <Wrench className="h-3 w-3" />
                      فنيين
                    </TabsTrigger>
                    <TabsTrigger value="clients" className="gap-1 text-xs">
                      <User className="h-3 w-3" />
                      عملاء
                    </TabsTrigger>
                    <TabsTrigger value="noRole" className="gap-1 text-xs">
                      <ShieldOff className="h-3 w-3" />
                      بدون دور
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setViewMode('table')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setViewMode('grid')}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Filters */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="بحث بالاسم أو البريد الإلكتروني..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pr-10"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Content */}
                <TabsContent value={activeTab} className="space-y-4 mt-0">
                  {viewMode === 'table' ? (
                    <Card>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="text-right font-semibold">المستخدم</TableHead>
                                <TableHead className="text-right font-semibold">البريد الإلكتروني</TableHead>
                                <TableHead className="text-right font-semibold">الأدوار</TableHead>
                                <TableHead className="text-right font-semibold">آخر دخول</TableHead>
                                <TableHead className="text-right font-semibold">مرات الدخول</TableHead>
                                <TableHead className="text-right font-semibold">تاريخ الإنشاء</TableHead>
                                <TableHead className="text-right font-semibold">إضافة دور</TableHead>
                                <TableHead className="text-right font-semibold">إجراءات</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredUsers.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={8} className="text-center py-12">
                                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                    <p className="text-muted-foreground">لا يوجد مستخدمين</p>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                filteredUsers.map((user) => (
                                  <TableRow 
                                    key={user.id} 
                                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                                    onClick={() => openViewModal(user)}
                                  >
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                          {user.roles.includes('admin') ? (
                                            <Crown className="h-5 w-5 text-red-500" />
                                          ) : (
                                            <User className="h-5 w-5 text-primary" />
                                          )}
                                        </div>
                                        <span className="font-medium">{user.full_name}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                      <div className="flex flex-wrap gap-1">
                                        {user.roles.length === 0 ? (
                                          <Badge variant="outline" className="text-muted-foreground">
                                            <ShieldOff className="h-3 w-3 ml-1" />
                                            بدون دور
                                          </Badge>
                                        ) : (
                                          user.roles.map((role) => {
                                            const RoleIcon = getRoleIcon(role);
                                            return (
                                              <Badge
                                                key={role}
                                                variant={getRoleBadgeVariant(role)}
                                                className="gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => handleRemoveRoleClick(user.id, role, user.full_name)}
                                              >
                                                <RoleIcon className="h-3 w-3" />
                                                {getRoleLabel(role)}
                                                <X className="h-3 w-3" />
                                              </Badge>
                                            );
                                          })
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                      {user.last_login ? (
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {format(new Date(user.last_login), 'dd/MM/yyyy HH:mm', { locale: ar })}
                                        </div>
                                      ) : (
                                        <span className="text-orange-500">لم يسجل دخول</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="secondary" className="gap-1">
                                        <Activity className="h-3 w-3" />
                                        {user.login_count}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                      {user.created_at ? (
                                        <div className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ar })}
                                        </div>
                                      ) : '-'}
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                      <Select onValueChange={(value) => assignRole(user.id, value as AppRole)}>
                                        <SelectTrigger className="w-[130px]">
                                          <SelectValue placeholder="إضافة دور" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="admin">
                                            <div className="flex items-center gap-2">
                                              <Crown className="h-4 w-4 text-red-500" />
                                              مدير
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="accountant">
                                            <div className="flex items-center gap-2">
                                              <Calculator className="h-4 w-4 text-blue-500" />
                                              محاسب
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="technician">
                                            <div className="flex items-center gap-2">
                                              <Wrench className="h-4 w-4 text-yellow-500" />
                                              فني
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="client">
                                            <div className="flex items-center gap-2">
                                              <User className="h-4 w-4 text-green-500" />
                                              عميل
                                            </div>
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                      <Button variant="ghost" size="icon" onClick={() => openViewModal(user)}>
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredUsers.length === 0 ? (
                        <Card className="col-span-full">
                          <CardContent className="flex flex-col items-center justify-center py-12">
                            <Users className="h-12 w-12 mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">لا يوجد مستخدمين</p>
                          </CardContent>
                        </Card>
                      ) : (
                        filteredUsers.map((user) => (
                          <Card 
                            key={user.id} 
                            className="cursor-pointer transition-all hover:shadow-lg"
                            onClick={() => openViewModal(user)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    {user.roles.includes('admin') ? (
                                      <Crown className="h-6 w-6 text-red-500" />
                                    ) : (
                                      <User className="h-6 w-6 text-primary" />
                                    )}
                                  </div>
                                  <div>
                                    <CardTitle className="text-lg">{user.full_name}</CardTitle>
                                    <CardDescription className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {user.email}
                                    </CardDescription>
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                                {user.roles.length === 0 ? (
                                  <Badge variant="outline" className="text-muted-foreground">
                                    <ShieldOff className="h-3 w-3 ml-1" />
                                    بدون دور
                                  </Badge>
                                ) : (
                                  user.roles.map((role) => {
                                    const RoleIcon = getRoleIcon(role);
                                    return (
                                      <Badge
                                        key={role}
                                        variant={getRoleBadgeVariant(role)}
                                        className="gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => handleRemoveRoleClick(user.id, role, user.full_name)}
                                      >
                                        <RoleIcon className="h-3 w-3" />
                                        {getRoleLabel(role)}
                                        <X className="h-3 w-3" />
                                      </Badge>
                                    );
                                  })
                                )}
                              </div>

                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Activity className="h-3 w-3" />
                                  {user.login_count} دخول
                                </span>
                                {user.last_login && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(user.last_login), 'dd/MM', { locale: ar })}
                                  </span>
                                )}
                              </div>

                              <div className="pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                                <Select onValueChange={(value) => assignRole(user.id, value as AppRole)}>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="إضافة دور" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">
                                      <div className="flex items-center gap-2">
                                        <Crown className="h-4 w-4 text-red-500" />
                                        مدير
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="accountant">
                                      <div className="flex items-center gap-2">
                                        <Calculator className="h-4 w-4 text-blue-500" />
                                        محاسب
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="technician">
                                      <div className="flex items-center gap-2">
                                        <Wrench className="h-4 w-4 text-yellow-500" />
                                        فني
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="client">
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-green-500" />
                                        عميل
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </main>
          </div>
        </div>
      </SidebarProvider>

      {/* View User Modal */}
      <AlertDialog open={viewUserOpen} onOpenChange={setViewUserOpen}>
        <AlertDialogContent className="max-w-2xl" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                {selectedUser?.roles.includes('admin') ? (
                  <Crown className="h-6 w-6 text-red-500" />
                ) : (
                  <User className="h-6 w-6 text-primary" />
                )}
              </div>
              <div>
                <span className="block">{selectedUser?.full_name}</span>
                <span className="text-sm font-normal text-muted-foreground">{selectedUser?.email}</span>
              </div>
            </AlertDialogTitle>
          </AlertDialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* Roles */}
              <div>
                <h4 className="text-sm font-medium mb-2">الأدوار والصلاحيات</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.roles.length === 0 ? (
                    <Badge variant="outline" className="text-muted-foreground py-2 px-3">
                      <ShieldOff className="h-4 w-4 ml-2" />
                      بدون أدوار - لا يمكن الوصول للنظام
                    </Badge>
                  ) : (
                    selectedUser.roles.map((role) => {
                      const RoleIcon = getRoleIcon(role);
                      const colors = getRoleColor(role);
                      return (
                        <div key={role} className={`flex items-center gap-2 p-2 rounded-lg ${colors.bg} ${colors.border} border`}>
                          <RoleIcon className={`h-4 w-4 ${colors.text}`} />
                          <span className={`font-medium ${colors.text}`}>{getRoleLabel(role)}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-muted/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Activity className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{selectedUser.login_count}</p>
                      <p className="text-sm text-muted-foreground">مرات الدخول</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Clock className="h-8 w-8 text-orange-500" />
                    <div>
                      <p className="text-lg font-bold">
                        {selectedUser.last_login 
                          ? format(new Date(selectedUser.last_login), 'dd MMM', { locale: ar })
                          : 'لا يوجد'
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">آخر دخول</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">البريد الإلكتروني</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{selectedUser.email}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(selectedUser.email, 'البريد الإلكتروني')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {selectedUser.last_login && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">آخر تسجيل دخول</span>
                    </div>
                    <span className="font-medium">
                      {format(new Date(selectedUser.last_login), 'dd MMMM yyyy - HH:mm', { locale: ar })}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">تاريخ الإنشاء</span>
                  </div>
                  <span className="font-medium">
                    {selectedUser.created_at 
                      ? format(new Date(selectedUser.created_at), 'dd MMMM yyyy', { locale: ar })
                      : '-'
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">معرف المستخدم</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{selectedUser.id.slice(0, 8)}...</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(selectedUser.id, 'معرف المستخدم')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إغلاق</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <AddUserModal 
        open={addUserOpen} 
        onOpenChange={setAddUserOpen}
        onUserCreated={fetchUsers}
      />
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={removeRole}
        title="إزالة الدور"
        description={`هل أنت متأكد من إزالة دور "${roleToDelete ? getRoleLabel(roleToDelete.role) : ''}" من المستخدم "${roleToDelete?.userName}"؟ قد يفقد المستخدم الوصول لبعض أجزاء النظام.`}
      />
    </>
  );
}
