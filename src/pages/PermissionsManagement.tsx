import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  Loader2, Shield, Users, Key, Save, X, Search, 
  CheckCircle, XCircle, AlertTriangle, Grid3X3, 
  List, Filter, RefreshCw, Info, Lock, Unlock,
  ShieldCheck, ShieldAlert, ChevronDown, ChevronUp,
  Settings, FileText, Database, Bell, Wallet, Wrench,
  UserCog, Building, Eye, Edit, Trash2, Plus, Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SettingsModal } from '@/components/modals/SettingsModal';

type AppRole = 'admin' | 'accountant' | 'technician' | 'client';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const ROLES: { value: AppRole; label: string; icon: React.ElementType; color: string; bgColor: string }[] = [
  { value: 'admin', label: 'مدير النظام', icon: ShieldCheck, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  { value: 'accountant', label: 'محاسب', icon: Wallet, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  { value: 'technician', label: 'فني', icon: Wrench, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  { value: 'client', label: 'عميل', icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' }
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'إدارة المستخدمين': UserCog,
  'إدارة المشتركين': Users,
  'إدارة المالية': Wallet,
  'إدارة الصيانة': Wrench,
  'إدارة التقارير': FileText,
  'إدارة النظام': Settings,
  'إدارة الإشعارات': Bell,
  'إدارة البيانات': Database,
  'إدارة الوكلاء': Building,
  'default': Key
};

export default function PermissionsManagement() {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Map<AppRole, Set<string>>>(new Map());
  const [tempRolePermissions, setTempRolePermissions] = useState<Map<AppRole, Set<string>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'tabs' | 'matrix'>('tabs');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedRole, setSelectedRole] = useState<AppRole>('admin');

  useEffect(() => {
    if (!permissionsLoading && !hasPermission('manage_roles')) {
      toast.error('ليس لديك صلاحية الوصول إلى هذه الصفحة');
      navigate('/');
      return;
    }
  }, [hasPermission, permissionsLoading, navigate]);

  useEffect(() => {
    if (!permissionsLoading && hasPermission('manage_roles')) {
      fetchData();

      const channel = supabase
        .channel('permissions_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'role_permissions'
          },
          () => {
            fetchData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [permissionsLoading]);

  const fetchData = async () => {
    setLoading(true);
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
      
      // توسيع جميع الفئات افتراضياً
      const categories = new Set(permissionsData?.map(p => p.category) || []);
      setExpandedCategories(categories);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('حدث خطأ أثناء جلب البيانات');
    } finally {
      setLoading(false);
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

  const toggleCategoryForRole = (role: AppRole, categoryPerms: Permission[], allChecked: boolean) => {
    const currentPerms = tempRolePermissions.get(role) || new Set();
    const newPerms = new Set(currentPerms);
    
    categoryPerms.forEach(perm => {
      if (allChecked) {
        newPerms.delete(perm.id);
      } else {
        newPerms.add(perm.id);
      }
    });
    
    const newTempRolePermissions = new Map(tempRolePermissions);
    newTempRolePermissions.set(role, newPerms);
    setTempRolePermissions(newTempRolePermissions);
  };

  const toggleAllForRole = (role: AppRole) => {
    const currentPerms = tempRolePermissions.get(role) || new Set();
    const allChecked = currentPerms.size === permissions.length;
    
    const newPerms = new Set<string>();
    if (!allChecked) {
      permissions.forEach(perm => newPerms.add(perm.id));
    }
    
    const newTempRolePermissions = new Map(tempRolePermissions);
    newTempRolePermissions.set(role, newPerms);
    setTempRolePermissions(newTempRolePermissions);
  };

  const hasChanges = useMemo(() => {
    for (const [role, perms] of tempRolePermissions) {
      const originalPerms = rolePermissions.get(role) || new Set();
      if (perms.size !== originalPerms.size) return true;
      for (const perm of perms) {
        if (!originalPerms.has(perm)) return true;
      }
    }
    return false;
  }, [tempRolePermissions, rolePermissions]);

  const saveChanges = async () => {
    setSaving(true);
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
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const cancelChanges = () => {
    setTempRolePermissions(new Map(rolePermissions));
    toast.info('تم إلغاء التغييرات');
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // فلترة الصلاحيات
  const filteredPermissions = useMemo(() => {
    if (!searchQuery) return permissions;
    const query = searchQuery.toLowerCase();
    return permissions.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
  }, [permissions, searchQuery]);

  // تجميع الصلاحيات حسب الفئة
  const permissionsByCategory = useMemo(() => {
    return filteredPermissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {} as Record<string, Permission[]>);
  }, [filteredPermissions]);

  // إحصائيات
  const stats = useMemo(() => {
    const totalPermissions = permissions.length;
    const categories = new Set(permissions.map(p => p.category)).size;
    
    const roleStats = ROLES.map(role => {
      const perms = tempRolePermissions.get(role.value) || new Set();
      return {
        ...role,
        count: perms.size,
        percentage: totalPermissions > 0 ? Math.round((perms.size / totalPermissions) * 100) : 0
      };
    });
    
    return { totalPermissions, categories, roleStats };
  }, [permissions, tempRolePermissions]);

  const getCategoryIcon = (category: string) => {
    return CATEGORY_ICONS[category] || CATEGORY_ICONS['default'];
  };

  if (permissionsLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">جاري تحميل الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission('manage_roles')) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>إدارة الصلاحيات | نظام إدارة الاشتراكات</title>
        <meta name="description" content="إدارة صلاحيات الأدوار في النظام" />
      </Helmet>
      
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background" dir="rtl">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
            
            <main className="flex-1 p-6 overflow-auto">
              <div className="max-w-7xl mx-auto space-y-6">
                {/* العنوان والإجراءات */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Shield className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold">إدارة الصلاحيات</h1>
                        <p className="text-muted-foreground">
                          تخصيص صلاحيات كل دور في النظام
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => fetchData()}
                            disabled={loading}
                          >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>تحديث</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <div className="flex items-center border rounded-lg p-1">
                      <Button
                        variant={viewMode === 'tabs' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('tabs')}
                      >
                        <List className="h-4 w-4 ml-1" />
                        تبويبات
                      </Button>
                      <Button
                        variant={viewMode === 'matrix' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('matrix')}
                      >
                        <Grid3X3 className="h-4 w-4 ml-1" />
                        مصفوفة
                      </Button>
                    </div>
                  </div>
                </div>

                {/* بطاقات الإحصائيات */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">إجمالي الصلاحيات</p>
                          <p className="text-2xl font-bold">{stats.totalPermissions}</p>
                        </div>
                        <Key className="h-8 w-8 text-primary/60" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">الفئات</p>
                          <p className="text-2xl font-bold">{stats.categories}</p>
                        </div>
                        <Database className="h-8 w-8 text-secondary/60" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  {stats.roleStats.map(role => {
                    const RoleIcon = role.icon;
                    return (
                      <Card key={role.value} className={`${role.bgColor} border-transparent`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-xs text-muted-foreground">{role.label}</p>
                              <p className="text-2xl font-bold">{role.count}</p>
                            </div>
                            <RoleIcon className={`h-8 w-8 ${role.color} opacity-60`} />
                          </div>
                          <Progress value={role.percentage} className="h-1.5" />
                          <p className="text-xs text-muted-foreground mt-1">{role.percentage}% من الصلاحيات</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* شريط البحث والفلاتر */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="البحث في الصلاحيات..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pr-10"
                        />
                      </div>
                      
                      {hasChanges && (
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="animate-pulse">
                            <AlertTriangle className="h-3 w-3 ml-1" />
                            تغييرات غير محفوظة
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelChanges}
                            disabled={saving}
                          >
                            <X className="h-4 w-4 ml-1" />
                            إلغاء
                          </Button>
                          <Button
                            size="sm"
                            onClick={saveChanges}
                            disabled={saving}
                          >
                            {saving ? (
                              <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 ml-1" />
                            )}
                            حفظ التغييرات
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* عرض التبويبات */}
                {viewMode === 'tabs' && (
                  <Tabs value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 h-auto p-1">
                      {ROLES.map(role => {
                        const RoleIcon = role.icon;
                        const rolePerms = tempRolePermissions.get(role.value) || new Set();
                        return (
                          <TabsTrigger 
                            key={role.value} 
                            value={role.value}
                            className="flex flex-col gap-1 py-3"
                          >
                            <div className="flex items-center gap-2">
                              <RoleIcon className={`h-4 w-4 ${role.color}`} />
                              <span>{role.label}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {rolePerms.size} صلاحية
                            </Badge>
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>

                    {ROLES.map(role => {
                      const rolePerms = tempRolePermissions.get(role.value) || new Set();
                      const allChecked = rolePerms.size === permissions.length;
                      
                      return (
                        <TabsContent key={role.value} value={role.value}>
                          <Card>
                            <CardHeader className="pb-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${role.bgColor}`}>
                                    <role.icon className={`h-5 w-5 ${role.color}`} />
                                  </div>
                                  <div>
                                    <CardTitle>صلاحيات {role.label}</CardTitle>
                                    <CardDescription>
                                      {rolePerms.size} من {permissions.length} صلاحية مفعلة
                                    </CardDescription>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleAllForRole(role.value)}
                                  >
                                    {allChecked ? (
                                      <>
                                        <XCircle className="h-4 w-4 ml-1" />
                                        إلغاء الكل
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4 ml-1" />
                                        تحديد الكل
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                              <Progress 
                                value={(rolePerms.size / permissions.length) * 100} 
                                className="h-2 mt-4" 
                              />
                            </CardHeader>
                            <CardContent>
                              <ScrollArea className="h-[500px] pr-4">
                                <div className="space-y-4">
                                  {Object.entries(permissionsByCategory).map(([category, perms]) => {
                                    const CategoryIcon = getCategoryIcon(category);
                                    const categoryCheckedCount = perms.filter(p => rolePerms.has(p.id)).length;
                                    const allCategoryChecked = categoryCheckedCount === perms.length;
                                    
                                    return (
                                      <Collapsible
                                        key={category}
                                        open={expandedCategories.has(category)}
                                        onOpenChange={() => toggleCategory(category)}
                                      >
                                        <Card className="border-dashed">
                                          <CollapsibleTrigger asChild>
                                            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors py-3">
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                  <div className="p-2 rounded-lg bg-primary/10">
                                                    <CategoryIcon className="h-4 w-4 text-primary" />
                                                  </div>
                                                  <div>
                                                    <CardTitle className="text-base">{category}</CardTitle>
                                                    <CardDescription className="text-xs">
                                                      {categoryCheckedCount} / {perms.length} صلاحية
                                                    </CardDescription>
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      toggleCategoryForRole(role.value, perms, allCategoryChecked);
                                                    }}
                                                  >
                                                    {allCategoryChecked ? (
                                                      <XCircle className="h-4 w-4" />
                                                    ) : (
                                                      <CheckCircle className="h-4 w-4" />
                                                    )}
                                                  </Button>
                                                  {expandedCategories.has(category) ? (
                                                    <ChevronUp className="h-4 w-4" />
                                                  ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                  )}
                                                </div>
                                              </div>
                                            </CardHeader>
                                          </CollapsibleTrigger>
                                          <CollapsibleContent>
                                            <CardContent className="pt-0">
                                              <div className="grid gap-2">
                                                {perms.map(perm => (
                                                  <div
                                                    key={perm.id}
                                                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                                                      rolePerms.has(perm.id) 
                                                        ? 'bg-primary/5 border-primary/30' 
                                                        : 'bg-muted/30 border-transparent hover:border-muted'
                                                    }`}
                                                  >
                                                    <div className="flex items-center gap-3">
                                                      <Checkbox
                                                        checked={rolePerms.has(perm.id)}
                                                        onCheckedChange={() => togglePermission(role.value, perm.id)}
                                                      />
                                                      <div>
                                                        <p className="font-medium text-sm">{perm.description}</p>
                                                        <p className="text-xs text-muted-foreground font-mono">{perm.name}</p>
                                                      </div>
                                                    </div>
                                                    {rolePerms.has(perm.id) ? (
                                                      <Unlock className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                      <Lock className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            </CardContent>
                                          </CollapsibleContent>
                                        </Card>
                                      </Collapsible>
                                    );
                                  })}
                                </div>
                              </ScrollArea>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                )}

                {/* عرض المصفوفة */}
                {viewMode === 'matrix' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Grid3X3 className="h-5 w-5" />
                        مصفوفة الصلاحيات
                      </CardTitle>
                      <CardDescription>
                        عرض شامل لجميع الصلاحيات وتوزيعها على الأدوار
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[600px]">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                              <TableHead className="w-[300px] text-right">الصلاحية</TableHead>
                              {ROLES.map(role => {
                                const RoleIcon = role.icon;
                                return (
                                  <TableHead key={role.value} className="text-center w-[120px]">
                                    <div className="flex flex-col items-center gap-1">
                                      <RoleIcon className={`h-4 w-4 ${role.color}`} />
                                      <span className="text-xs">{role.label}</span>
                                    </div>
                                  </TableHead>
                                );
                              })}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(permissionsByCategory).map(([category, perms]) => (
                              <>
                                <TableRow key={`cat-${category}`} className="bg-muted/50">
                                  <TableCell colSpan={5} className="font-semibold">
                                    <div className="flex items-center gap-2">
                                      {(() => {
                                        const CategoryIcon = getCategoryIcon(category);
                                        return <CategoryIcon className="h-4 w-4" />;
                                      })()}
                                      {category}
                                      <Badge variant="outline" className="text-xs">
                                        {perms.length}
                                      </Badge>
                                    </div>
                                  </TableCell>
                                </TableRow>
                                {perms.map(perm => (
                                  <TableRow key={perm.id} className="hover:bg-accent/50">
                                    <TableCell>
                                      <div>
                                        <p className="font-medium text-sm">{perm.description}</p>
                                        <p className="text-xs text-muted-foreground font-mono">{perm.name}</p>
                                      </div>
                                    </TableCell>
                                    {ROLES.map(role => {
                                      const rolePerms = tempRolePermissions.get(role.value) || new Set();
                                      const isChecked = rolePerms.has(perm.id);
                                      return (
                                        <TableCell key={role.value} className="text-center">
                                          <div className="flex justify-center">
                                            <Switch
                                              checked={isChecked}
                                              onCheckedChange={() => togglePermission(role.value, perm.id)}
                                              className="data-[state=checked]:bg-primary"
                                            />
                                          </div>
                                        </TableCell>
                                      );
                                    })}
                                  </TableRow>
                                ))}
                              </>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {/* شريط الحفظ الثابت */}
                {hasChanges && (
                  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <Card className="shadow-2xl border-primary/20">
                      <CardContent className="p-4 flex items-center gap-4">
                        <Badge variant="destructive" className="animate-pulse">
                          <AlertTriangle className="h-3 w-3 ml-1" />
                          تغييرات غير محفوظة
                        </Badge>
                        <Button
                          variant="outline"
                          onClick={cancelChanges}
                          disabled={saving}
                        >
                          <X className="h-4 w-4 ml-1" />
                          إلغاء
                        </Button>
                        <Button
                          onClick={saveChanges}
                          disabled={saving}
                          className="min-w-[140px]"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                              جاري الحفظ...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 ml-1" />
                              حفظ التغييرات
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
      
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
