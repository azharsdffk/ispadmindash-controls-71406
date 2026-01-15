import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, AlertCircle, UserPlus, Users, Search, 
  LayoutGrid, LayoutList, RefreshCw, Eye, Trash2, 
  Mail, Phone, Calendar, Clock, ShieldCheck, ShieldX,
  Crown, Calculator, Wrench, User, Key, Settings,
  Copy, Check, Activity, Lock, Unlock, Filter,
  ChevronDown, MoreVertical, Edit, UserCog, Save, X
} from "lucide-react";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { AddUserModal } from "@/components/modals/AddUserModal";
import { DeleteConfirmDialog } from "@/components/modals/DeleteConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type AppRole = 'admin' | 'accountant' | 'technician' | 'client' | 'super_admin' | 'technical_manager' | 'finance_manager';

type UserWithRoles = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  roles: string[];
  created_at: string;
  last_sign_in_at: string | null;
};

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const ROLES: { value: AppRole; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'super_admin', label: 'المدير العام', icon: <Crown className="h-4 w-4" />, color: 'bg-amber-600 text-white' },
  { value: 'admin', label: 'مدير النظام', icon: <Crown className="h-4 w-4" />, color: 'bg-destructive text-destructive-foreground' },
  { value: 'technical_manager', label: 'المدير الفني', icon: <Wrench className="h-4 w-4" />, color: 'bg-emerald-600 text-white' },
  { value: 'finance_manager', label: 'المدير المالي', icon: <Calculator className="h-4 w-4" />, color: 'bg-indigo-600 text-white' },
  { value: 'accountant', label: 'محاسب', icon: <Calculator className="h-4 w-4" />, color: 'bg-blue-500 text-white' },
  { value: 'technician', label: 'فني', icon: <Wrench className="h-4 w-4" />, color: 'bg-green-500 text-white' },
  { value: 'client', label: 'عميل', icon: <User className="h-4 w-4" />, color: 'bg-orange-500 text-white' }
];

const RoleManagement = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<{ userId: string; role: string; userName: string } | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Permissions management states
  const [permissionsTab, setPermissionsTab] = useState('users');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Map<AppRole, Set<string>>>(new Map());
  const [tempRolePermissions, setTempRolePermissions] = useState<Map<AppRole, Set<string>>>(new Map());
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<AppRole>('admin');
  
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("غير مصرح لك بالوصول إلى هذه الصفحة");
      navigate('/');
    }
  }, [isAdmin, roleLoading, navigate]);

  const fetchUsers = async (retryCount = 0) => {
    const maxRetries = 3;
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('manage-user-roles', {
        body: { action: 'list_users' }
      });

      if (error) {
        // إذا كان خطأ اتصال وما زال هناك محاولات متبقية
        if (error.message?.includes('Failed to fetch') && retryCount < maxRetries) {
          console.log(`إعادة محاولة الاتصال... (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchUsers(retryCount + 1);
        }
        throw error;
      }

      const usersWithData = data.users.map((user: any) => ({
        id: user.id,
        email: user.email || 'لا يوجد',
        full_name: user.full_name || 'غير محدد',
        phone: user.phone || 'لا يوجد',
        roles: user.roles || [],
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at
      }));

      setUsers(usersWithData);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error("فشل تحميل المستخدمين: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const { data: permissionsData, error: permError } = await supabase
        .from('permissions')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (permError) throw permError;

      const { data: rolePermsData, error: rolePermsError } = await supabase
        .from('role_permissions')
        .select('role, permission_id');

      if (rolePermsError) throw rolePermsError;

      const rolePermsMap = new Map<AppRole, Set<string>>();
      ROLES.forEach(role => {
        rolePermsMap.set(role.value, new Set());
      });

      rolePermsData?.forEach((rp: any) => {
        const role = rp.role as AppRole;
        const permSet = rolePermsMap.get(role) || new Set();
        permSet.add(rp.permission_id);
        rolePermsMap.set(role, permSet);
      });

      setPermissions(permissionsData || []);
      setRolePermissions(rolePermsMap);
      setTempRolePermissions(new Map(rolePermsMap));
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('حدث خطأ أثناء جلب الصلاحيات');
    }
  };

  const assignRole = async (userId: string, role: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-user-roles', {
        body: { action: 'assign_role', userId, role }
      });

      if (error) throw error;
      
      toast.success(data.message || "تم تعيين الدور بنجاح");
      fetchUsers();
    } catch (error: any) {
      toast.error("فشل تعيين الدور: " + error.message);
    }
  };

  const handleRemoveRoleClick = (userId: string, role: string, userName: string) => {
    setRoleToDelete({ userId, role, userName });
    setDeleteDialogOpen(true);
  };

  const removeRole = async () => {
    if (!roleToDelete) return;

    try {
      const { data, error } = await supabase.functions.invoke('manage-user-roles', {
        body: { action: 'remove_role', userId: roleToDelete.userId, role: roleToDelete.role }
      });

      if (error) throw error;
      
      toast.success(data.message || "تم إزالة الدور بنجاح");
      fetchUsers();
      setRoleToDelete(null);
    } catch (error: any) {
      toast.error("فشل إزالة الدور: " + error.message);
    }
  };

  const togglePermission = (role: AppRole, permissionId: string) => {
    const currentPerms = tempRolePermissions.get(role) || new Set();
    const newPerms = new Set(currentPerms);
    
    if (newPerms.has(permissionId)) {
      newPerms.delete(permissionId);
    } else {
      newPerms.add(permissionId);
    }
    
    const newTempRolePermissions = new Map(tempRolePermissions);
    newTempRolePermissions.set(role, newPerms);
    setTempRolePermissions(newTempRolePermissions);
  };

  const hasPermissionChanges = useMemo(() => {
    for (const [role, perms] of tempRolePermissions) {
      const originalPerms = rolePermissions.get(role) || new Set();
      if (perms.size !== originalPerms.size) return true;
      for (const perm of perms) {
        if (!originalPerms.has(perm)) return true;
      }
    }
    return false;
  }, [tempRolePermissions, rolePermissions]);

  const savePermissionChanges = async () => {
    setSavingPermissions(true);
    try {
      for (const [role, newPerms] of tempRolePermissions) {
        const oldPerms = rolePermissions.get(role) || new Set();
        
        const toDelete = [...oldPerms].filter(p => !newPerms.has(p));
        const toAdd = [...newPerms].filter(p => !oldPerms.has(p));

        if (toDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('role_permissions')
            .delete()
            .eq('role', role)
            .in('permission_id', toDelete);

          if (deleteError) throw deleteError;
        }

        if (toAdd.length > 0) {
          const { error: insertError } = await supabase
            .from('role_permissions')
            .insert(toAdd.map(permId => ({ role, permission_id: permId })));

          if (insertError && insertError.code !== '23505') {
            throw insertError;
          }
        }
      }

      setRolePermissions(new Map(tempRolePermissions));
      toast.success('تم حفظ التغييرات بنجاح');
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('حدث خطأ أثناء حفظ التغييرات');
      fetchPermissions();
    } finally {
      setSavingPermissions(false);
    }
  };

  const cancelPermissionChanges = () => {
    setTempRolePermissions(new Map(rolePermissions));
    toast.info('تم إلغاء التغييرات');
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchPermissions();
    }
  }, [isAdmin]);

  // Statistics
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const adminCount = users.filter(u => u.roles.includes('admin')).length;
    const accountantCount = users.filter(u => u.roles.includes('accountant')).length;
    const technicianCount = users.filter(u => u.roles.includes('technician')).length;
    const clientCount = users.filter(u => u.roles.includes('client')).length;
    const noRoleCount = users.filter(u => u.roles.length === 0).length;
    const activeToday = users.filter(u => {
      if (!u.last_sign_in_at) return false;
      const lastSignIn = new Date(u.last_sign_in_at);
      const today = new Date();
      return lastSignIn.toDateString() === today.toDateString();
    }).length;
    
    return { totalUsers, adminCount, accountantCount, technicianCount, clientCount, noRoleCount, activeToday };
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    let result = [...users];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(u => 
        u.full_name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.phone.includes(query)
      );
    }
    
    if (roleFilter !== 'all') {
      if (roleFilter === 'none') {
        result = result.filter(u => u.roles.length === 0);
      } else {
        result = result.filter(u => u.roles.includes(roleFilter));
      }
    }
    
    if (activeTab !== 'all') {
      if (activeTab === 'none') {
        result = result.filter(u => u.roles.length === 0);
      } else {
        result = result.filter(u => u.roles.includes(activeTab));
      }
    }
    
    return result;
  }, [users, searchQuery, roleFilter, activeTab]);

  // Permissions grouped by category
  const permissionsByCategory = useMemo(() => {
    return permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {} as Record<string, Permission[]>);
  }, [permissions]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success('تم النسخ');
  };

  const getRoleLabel = (role: string) => {
    const found = ROLES.find(r => r.value === role);
    return found?.label || role;
  };

  const getRoleBadgeClass = (role: string) => {
    const found = ROLES.find(r => r.value === role);
    return found?.color || 'bg-muted text-muted-foreground';
  };

  const getRoleIcon = (role: string) => {
    const found = ROLES.find(r => r.value === role);
    return found?.icon || <User className="h-4 w-4" />;
  };

  const openViewModal = (user: UserWithRoles) => {
    setSelectedUser(user);
    setIsViewOpen(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'لم يتم تسجيل الدخول';
    return new Date(dateString).toLocaleString('ar-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const activePercentage = stats.totalUsers > 0 
    ? Math.round((stats.totalUsers - stats.noRoleCount) / stats.totalUsers * 100) 
    : 0;

  if (roleLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Helmet>
        <title>إدارة المستخدمين والصلاحيات | لوحة التحكم</title>
        <meta name="description" content="إدارة حسابات المستخدمين وتعيين الأدوار والصلاحيات" />
      </Helmet>
      
      <div className="min-h-screen bg-background flex flex-col w-full" dir="rtl">
        <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
        
        <div className="flex flex-1 w-full">
          <AppSidebar />
          
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">إدارة المستخدمين والصلاحيات</h1>
                    <p className="text-muted-foreground mt-1">إنشاء حسابات جديدة وإدارة أدوار ومصرحيات المستخدمين</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => { fetchUsers(); fetchPermissions(); }}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => setAddUserOpen(true)} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    إضافة مستخدم
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-2xl font-bold">{stats.totalUsers}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">إجمالي المستخدمين</p>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-destructive/10 rounded-lg">
                        <Crown className="h-5 w-5 text-destructive" />
                      </div>
                      <span className="text-2xl font-bold">{stats.adminCount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">المدراء</p>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Calculator className="h-5 w-5 text-blue-500" />
                      </div>
                      <span className="text-2xl font-bold">{stats.accountantCount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">المحاسبين</p>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <Wrench className="h-5 w-5 text-green-500" />
                      </div>
                      <span className="text-2xl font-bold">{stats.technicianCount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">الفنيين</p>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-orange-500/10 rounded-lg">
                        <User className="h-5 w-5 text-orange-500" />
                      </div>
                      <span className="text-2xl font-bold">{stats.clientCount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">العملاء</p>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-muted rounded-lg">
                        <ShieldX className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <span className="text-2xl font-bold">{stats.noRoleCount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">بدون دور</p>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <Activity className="h-5 w-5 text-green-500" />
                      </div>
                      <span className="text-2xl font-bold">{stats.activeToday}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">نشط اليوم</p>
                  </CardContent>
                </Card>
              </div>

              {/* Progress Bar */}
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">نسبة المستخدمين المعينين لأدوار</span>
                    <span className="text-sm font-bold text-primary">{activePercentage}%</span>
                  </div>
                  <Progress value={activePercentage} className="h-2" />
                </CardContent>
              </Card>

              {/* Security Warning */}
              <Card className="border-warning/50 bg-warning/5">
                <CardContent className="pt-4 pb-3">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-warning">تحذير أمني</p>
                      <p className="text-sm text-muted-foreground">
                        تعيين الأدوار يمنح صلاحيات وصول حساسة. تأكد من مراجعة الصلاحيات قبل تعيين أي دور.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Main Tabs: Users & Permissions */}
              <Tabs value={permissionsTab} onValueChange={setPermissionsTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="users" className="gap-2">
                    <Users className="h-4 w-4" />
                    إدارة المستخدمين
                  </TabsTrigger>
                  <TabsTrigger value="permissions" className="gap-2">
                    <Key className="h-4 w-4" />
                    إدارة الصلاحيات
                  </TabsTrigger>
                </TabsList>

                {/* Users Tab */}
                <TabsContent value="users" className="space-y-4">
                  {/* Quick Filter Tabs */}
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="all">الكل ({users.length})</TabsTrigger>
                      <TabsTrigger value="admin">المدراء ({stats.adminCount})</TabsTrigger>
                      <TabsTrigger value="accountant">المحاسبين ({stats.accountantCount})</TabsTrigger>
                      <TabsTrigger value="technician">الفنيين ({stats.technicianCount})</TabsTrigger>
                      <TabsTrigger value="client">العملاء ({stats.clientCount})</TabsTrigger>
                      <TabsTrigger value="none">بدون دور ({stats.noRoleCount})</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Filters & View Toggle */}
                  <Card>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <div className="relative flex-1 md:w-80">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="بحث بالاسم أو البريد أو الهاتف..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pr-10"
                            />
                          </div>
                          <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-40">
                              <Filter className="h-4 w-4 ml-2" />
                              <SelectValue placeholder="تصفية بالدور" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">جميع الأدوار</SelectItem>
                              <SelectItem value="admin">مدير</SelectItem>
                              <SelectItem value="accountant">محاسب</SelectItem>
                              <SelectItem value="technician">فني</SelectItem>
                              <SelectItem value="client">عميل</SelectItem>
                              <SelectItem value="none">بدون دور</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {filteredUsers.length} نتيجة
                          </span>
                          <Separator orientation="vertical" className="h-6" />
                          <Button
                            variant={viewMode === 'table' ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => setViewMode('table')}
                          >
                            <LayoutList className="h-4 w-4" />
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
                    </CardContent>
                  </Card>

                  {/* Users Content */}
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">جاري تحميل المستخدمين...</p>
                    </div>
                  ) : viewMode === 'table' ? (
                    <Card>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[500px]">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>المستخدم</TableHead>
                                <TableHead>البريد الإلكتروني</TableHead>
                                <TableHead>الهاتف</TableHead>
                                <TableHead>الأدوار</TableHead>
                                <TableHead>آخر نشاط</TableHead>
                                <TableHead>تعيين دور</TableHead>
                                <TableHead className="w-[80px]">إجراءات</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredUsers.map((user) => (
                                <TableRow key={user.id} className="hover:bg-muted/50">
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="text-lg font-bold text-primary">
                                          {user.full_name.charAt(0)}
                                        </span>
                                      </div>
                                      <span className="font-medium">{user.full_name}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                  <TableCell className="text-muted-foreground">{user.phone}</TableCell>
                                  <TableCell>
                                    <div className="flex gap-1 flex-wrap">
                                      {user.roles.length === 0 ? (
                                        <Badge variant="outline" className="text-muted-foreground">
                                          <ShieldX className="h-3 w-3 ml-1" />
                                          لا يوجد
                                        </Badge>
                                      ) : (
                                        user.roles.map((role) => (
                                          <Badge 
                                            key={role} 
                                            className={`${getRoleBadgeClass(role)} cursor-pointer hover:opacity-80 gap-1`}
                                            onClick={() => handleRemoveRoleClick(user.id, role, user.full_name)}
                                          >
                                            {getRoleIcon(role)}
                                            {getRoleLabel(role)}
                                            <X className="h-3 w-3" />
                                          </Badge>
                                        ))
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {formatDate(user.last_sign_in_at)}
                                  </TableCell>
                                  <TableCell>
                                    <Select onValueChange={(role) => assignRole(user.id, role)}>
                                      <SelectTrigger className="w-32 h-8">
                                        <SelectValue placeholder="اختر دور" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {ROLES.map((role) => (
                                          <SelectItem key={role.value} value={role.value}>
                                            <div className="flex items-center gap-2">
                                              {role.icon}
                                              {role.label}
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => openViewModal(user)}>
                                          <Eye className="h-4 w-4 ml-2" />
                                          عرض التفاصيل
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredUsers.map((user) => (
                        <Card key={user.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-xl font-bold text-primary">
                                    {user.full_name.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <h3 className="font-semibold">{user.full_name}</h3>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openViewModal(user)}>
                                    <Eye className="h-4 w-4 ml-2" />
                                    عرض التفاصيل
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                {user.phone}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {formatDate(user.last_sign_in_at)}
                              </div>
                            </div>
                            
                            <Separator className="my-4" />
                            
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-1">
                                {user.roles.length === 0 ? (
                                  <Badge variant="outline" className="text-muted-foreground">
                                    <ShieldX className="h-3 w-3 ml-1" />
                                    لا يوجد أدوار
                                  </Badge>
                                ) : (
                                  user.roles.map((role) => (
                                    <Badge 
                                      key={role} 
                                      className={`${getRoleBadgeClass(role)} cursor-pointer hover:opacity-80 gap-1`}
                                      onClick={() => handleRemoveRoleClick(user.id, role, user.full_name)}
                                    >
                                      {getRoleIcon(role)}
                                      {getRoleLabel(role)}
                                      <X className="h-3 w-3" />
                                    </Badge>
                                  ))
                                )}
                              </div>
                              
                              <Select onValueChange={(role) => assignRole(user.id, role)}>
                                <SelectTrigger className="w-full h-9">
                                  <SelectValue placeholder="إضافة دور جديد" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ROLES.map((role) => (
                                    <SelectItem key={role.value} value={role.value}>
                                      <div className="flex items-center gap-2">
                                        {role.icon}
                                        {role.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Permissions Tab */}
                <TabsContent value="permissions" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        إدارة صلاحيات الأدوار
                      </CardTitle>
                      <CardDescription>
                        قم بتخصيص الصلاحيات لكل دور في النظام
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs value={selectedRoleForPerms} onValueChange={(v) => setSelectedRoleForPerms(v as AppRole)}>
                        <TabsList className="grid w-full grid-cols-4 mb-6">
                          {ROLES.map(role => (
                            <TabsTrigger key={role.value} value={role.value} className="gap-2">
                              {role.icon}
                              {role.label}
                              <Badge variant="secondary" className="mr-1 text-xs">
                                {tempRolePermissions.get(role.value)?.size || 0}
                              </Badge>
                            </TabsTrigger>
                          ))}
                        </TabsList>

                        {ROLES.map(role => (
                          <TabsContent key={role.value} value={role.value}>
                            <ScrollArea className="h-[400px] rounded-md border p-4">
                              <div className="space-y-6">
                                {Object.entries(permissionsByCategory).map(([category, perms]) => (
                                  <div key={category}>
                                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-primary">
                                      <Shield className="h-4 w-4" />
                                      {category}
                                    </h3>
                                    <div className="grid gap-2">
                                      {perms.map(perm => (
                                        <div
                                          key={perm.id}
                                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                                        >
                                          <div className="flex items-center gap-3">
                                            <Checkbox
                                              id={`${role.value}-${perm.id}`}
                                              checked={tempRolePermissions.get(role.value)?.has(perm.id)}
                                              onCheckedChange={() => togglePermission(role.value, perm.id)}
                                            />
                                            <Label htmlFor={`${role.value}-${perm.id}`} className="cursor-pointer">
                                              <p className="font-medium">{perm.description}</p>
                                              <p className="text-xs text-muted-foreground">{perm.name}</p>
                                            </Label>
                                          </div>
                                          {tempRolePermissions.get(role.value)?.has(perm.id) ? (
                                            <Unlock className="h-4 w-4 text-green-500" />
                                          ) : (
                                            <Lock className="h-4 w-4 text-muted-foreground" />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </CardContent>
                    {hasPermissionChanges && (
                      <CardFooter className="flex gap-3 justify-end border-t pt-4">
                        <Badge variant="destructive" className="animate-pulse ml-auto">
                          تغييرات غير محفوظة
                        </Badge>
                        <Button variant="outline" onClick={cancelPermissionChanges} disabled={savingPermissions}>
                          <X className="h-4 w-4 ml-2" />
                          إلغاء
                        </Button>
                        <Button onClick={savePermissionChanges} disabled={savingPermissions}>
                          {savingPermissions ? (
                            <>
                              <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                              جاري الحفظ...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 ml-2" />
                              حفظ التغييرات
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>

        {/* View User Modal */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                تفاصيل المستخدم
              </DialogTitle>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-6">
                {/* User Header */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">
                      {selectedUser.full_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedUser.full_name}</h2>
                    <p className="text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>

                {/* User Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">البريد الإلكتروني</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedUser.email}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(selectedUser.email, 'email')}
                      >
                        {copiedField === 'email' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">الهاتف</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedUser.phone}</span>
                      {selectedUser.phone !== 'لا يوجد' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(selectedUser.phone, 'phone')}
                        >
                          {copiedField === 'phone' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">تاريخ الإنشاء</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(selectedUser.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">آخر نشاط</Label>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(selectedUser.last_sign_in_at)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Roles Section */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">الأدوار المعينة</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.roles.length === 0 ? (
                      <Badge variant="outline" className="text-muted-foreground">
                        <ShieldX className="h-4 w-4 ml-1" />
                        لا يوجد أدوار معينة
                      </Badge>
                    ) : (
                      selectedUser.roles.map((role) => (
                        <Badge key={role} className={`${getRoleBadgeClass(role)} gap-1`}>
                          {getRoleIcon(role)}
                          {getRoleLabel(role)}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">إضافة دور سريع</Label>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.filter(r => !selectedUser.roles.includes(r.value)).map((role) => (
                      <Button
                        key={role.value}
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                          assignRole(selectedUser.id, role.value);
                          setSelectedUser({
                            ...selectedUser,
                            roles: [...selectedUser.roles, role.value]
                          });
                        }}
                      >
                        {role.icon}
                        إضافة {role.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

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
          description={`هل أنت متأكد من إزالة دور "${roleToDelete?.role ? getRoleLabel(roleToDelete.role) : ''}" من المستخدم "${roleToDelete?.userName}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        />
      </div>
    </SidebarProvider>
  );
};

export default RoleManagement;
