import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePermissions } from '@/hooks/usePermissions';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Search,
  Filter,
  Lock,
  Unlock,
  TrendingUp,
  AlertTriangle,
  Info,
  Eye,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  PieChart,
  FileText,
  Users,
  Settings,
  Bell,
  Package,
  Wallet,
  ClipboardList,
  Wrench,
  Download,
  Key,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface CategoryInfo {
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const getCategoryInfo = (category: string): CategoryInfo => {
  const categories: Record<string, CategoryInfo> = {
    accounting: { 
      name: 'المحاسبة', 
      icon: <Wallet className="h-5 w-5" />, 
      description: 'القيود المحاسبية والتقارير المالية',
      color: 'bg-emerald-500'
    },
    dashboard: { 
      name: 'لوحة التحكم', 
      icon: <BarChart3 className="h-5 w-5" />, 
      description: 'الوصول إلى لوحات التحكم والإحصائيات',
      color: 'bg-blue-500'
    },
    subscribers: { 
      name: 'المشتركين', 
      icon: <Users className="h-5 w-5" />, 
      description: 'إدارة بيانات المشتركين',
      color: 'bg-violet-500'
    },
    invoices: { 
      name: 'الفواتير', 
      icon: <FileText className="h-5 w-5" />, 
      description: 'إدارة وإصدار الفواتير',
      color: 'bg-amber-500'
    },
    payments: { 
      name: 'المدفوعات', 
      icon: <Wallet className="h-5 w-5" />, 
      description: 'إدارة المدفوعات والسندات',
      color: 'bg-green-500'
    },
    vouchers: { 
      name: 'السندات', 
      icon: <ClipboardList className="h-5 w-5" />, 
      description: 'إدارة سندات القبض والصرف',
      color: 'bg-cyan-500'
    },
    reports: { 
      name: 'التقارير', 
      icon: <PieChart className="h-5 w-5" />, 
      description: 'عرض وتصدير التقارير المالية',
      color: 'bg-indigo-500'
    },
    inventory: { 
      name: 'المخزون', 
      icon: <Package className="h-5 w-5" />, 
      description: 'متابعة المخزون والمستلزمات',
      color: 'bg-orange-500'
    },
    packages: { 
      name: 'الباقات', 
      icon: <Package className="h-5 w-5" />, 
      description: 'عرض وإدارة باقات الخدمة',
      color: 'bg-pink-500'
    },
    notifications: { 
      name: 'الإشعارات', 
      icon: <Bell className="h-5 w-5" />, 
      description: 'إدارة الإشعارات والتنبيهات',
      color: 'bg-yellow-500'
    },
    maintenance: { 
      name: 'الصيانة', 
      icon: <Wrench className="h-5 w-5" />, 
      description: 'متابعة طلبات الصيانة',
      color: 'bg-red-500'
    },
    employees: { 
      name: 'الموظفين', 
      icon: <Users className="h-5 w-5" />, 
      description: 'إدارة ومتابعة الموظفين',
      color: 'bg-teal-500'
    },
    settings: { 
      name: 'الإعدادات', 
      icon: <Settings className="h-5 w-5" />, 
      description: 'إعدادات النظام',
      color: 'bg-slate-500'
    },
    roles: { 
      name: 'الأدوار', 
      icon: <Key className="h-5 w-5" />, 
      description: 'إدارة الأدوار والصلاحيات',
      color: 'bg-purple-500'
    },
    users: { 
      name: 'المستخدمين', 
      icon: <Users className="h-5 w-5" />, 
      description: 'إدارة حسابات المستخدمين',
      color: 'bg-rose-500'
    },
    import: { 
      name: 'الاستيراد', 
      icon: <Download className="h-5 w-5" />, 
      description: 'استيراد البيانات',
      color: 'bg-lime-500'
    },
  };
  
  return categories[category] || { 
    name: category, 
    icon: <Shield className="h-5 w-5" />, 
    description: 'صلاحيات أخرى',
    color: 'bg-gray-500'
  };
};

export default function AccountantPermissions() {
  const navigate = useNavigate();
  const { isAccountant, loading: roleLoading } = useUserRole();
  const { permissions, loading: permissionsLoading } = usePermissions();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!roleLoading && !isAccountant) {
      toast.error('هذه الصفحة متاحة للمحاسبين فقط');
      navigate('/');
      return;
    }
  }, [isAccountant, roleLoading, navigate]);

  useEffect(() => {
    if (isAccountant) {
      fetchAllPermissions();
    }
  }, [isAccountant]);

  const fetchAllPermissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setAllPermissions(data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('حدث خطأ أثناء جلب الصلاحيات');
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading || permissionsLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <p className="text-muted-foreground">جاري تحميل الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!isAccountant) {
    return null;
  }

  // تجميع الصلاحيات حسب الفئة
  const permissionsByCategory = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const categories = Object.keys(permissionsByCategory);
  
  // تصفية الصلاحيات
  const filteredPermissions = allPermissions.filter(perm => {
    const matchesCategory = selectedCategory === 'all' || perm.category === selectedCategory;
    const matchesSearch = perm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         perm.description.toLowerCase().includes(searchQuery.toLowerCase());
    const hasPermission = permissions.includes(perm.name);
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && hasPermission) ||
                         (filterStatus === 'inactive' && !hasPermission);
    return matchesCategory && matchesSearch && matchesStatus;
  });

  // إحصائيات
  const totalPermissions = allPermissions.length;
  const activePermissions = permissions.length;
  const inactivePermissions = totalPermissions - activePermissions;
  const coveragePercentage = totalPermissions > 0 ? Math.round((activePermissions / totalPermissions) * 100) : 0;

  const getCategoryStats = (category: string) => {
    const catPerms = permissionsByCategory[category] || [];
    const activeCount = catPerms.filter(p => permissions.includes(p.name)).length;
    return { total: catPerms.length, active: activeCount, percentage: catPerms.length > 0 ? Math.round((activeCount / catPerms.length) * 100) : 0 };
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20" dir="rtl">
        <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
        <div className="flex">
          <AppSidebar />
          <div className="flex-1 flex">
            {/* Sidebar للفئات */}
            <div className={`border-l bg-card/50 backdrop-blur-sm transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-72'}`}>
              <div className="p-4 border-b flex items-center justify-between">
                {!sidebarCollapsed && (
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-bold">الصلاحيات</h2>
                      <p className="text-xs text-muted-foreground">{activePermissions} مفعّلة</p>
                    </div>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                >
                  {sidebarCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
              
              <div className="p-2 space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* الكل */}
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    selectedCategory === 'all' 
                      ? 'bg-primary text-primary-foreground shadow-lg' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${selectedCategory === 'all' ? 'bg-primary-foreground/20' : 'bg-primary/10'}`}>
                    <Sparkles className="h-4 w-4" />
                  </div>
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-right font-medium">جميع الفئات</span>
                      <Badge variant={selectedCategory === 'all' ? 'secondary' : 'outline'} className="text-xs">
                        {activePermissions}/{totalPermissions}
                      </Badge>
                    </>
                  )}
                </button>

                {/* الفئات */}
                {categories.map((category) => {
                  const info = getCategoryInfo(category);
                  const stats = getCategoryStats(category);
                  const isActive = selectedCategory === category;
                  
                  return (
                    <Tooltip key={category}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setSelectedCategory(category)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                            isActive 
                              ? 'bg-primary text-primary-foreground shadow-lg' 
                              : 'hover:bg-muted'
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${isActive ? 'bg-primary-foreground/20' : info.color + '/10'}`}>
                            <div className={isActive ? '' : `text-${info.color.replace('bg-', '')}`}>
                              {info.icon}
                            </div>
                          </div>
                          {!sidebarCollapsed && (
                            <>
                              <div className="flex-1 text-right">
                                <div className="font-medium text-sm">{info.name}</div>
                                <div className="text-xs opacity-70">{stats.percentage}%</div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge variant={isActive ? 'secondary' : stats.active > 0 ? 'default' : 'outline'} className="text-xs">
                                  {stats.active}/{stats.total}
                                </Badge>
                              </div>
                            </>
                          )}
                        </button>
                      </TooltipTrigger>
                      {sidebarCollapsed && (
                        <TooltipContent side="left">
                          <p>{info.name} ({stats.active}/{stats.total})</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            {/* المحتوى الرئيسي */}
            <main className="flex-1 p-6 overflow-y-auto">
              <Tabs defaultValue="permissions" className="space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-primary to-primary/60 rounded-xl text-primary-foreground">
                        <Shield className="h-6 w-6" />
                      </div>
                      إدارة الصلاحيات
                    </h1>
                    <p className="text-muted-foreground mt-1">عرض وإدارة صلاحيات حسابك</p>
                  </div>
                  
                  <TabsList className="bg-muted/50">
                    <TabsTrigger value="permissions" className="gap-2">
                      <Key className="h-4 w-4" />
                      الصلاحيات
                    </TabsTrigger>
                    <TabsTrigger value="overview" className="gap-2">
                      <PieChart className="h-4 w-4" />
                      نظرة عامة
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="permissions" className="space-y-6">
                  {/* شريط الإحصائيات السريعة */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/10 to-primary/5">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">إجمالي الصلاحيات</p>
                            <p className="text-3xl font-bold text-primary">{totalPermissions}</p>
                          </div>
                          <div className="p-3 bg-primary/20 rounded-full">
                            <Shield className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500/10 to-green-500/5">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">الصلاحيات المفعّلة</p>
                            <p className="text-3xl font-bold text-green-600">{activePermissions}</p>
                          </div>
                          <div className="p-3 bg-green-500/20 rounded-full">
                            <Unlock className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500/10 to-amber-500/5">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">غير المفعّلة</p>
                            <p className="text-3xl font-bold text-amber-600">{inactivePermissions}</p>
                          </div>
                          <div className="p-3 bg-amber-500/20 rounded-full">
                            <Lock className="h-6 w-6 text-amber-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">نسبة التغطية</p>
                            <p className="text-3xl font-bold text-blue-600">{coveragePercentage}%</p>
                          </div>
                          <div className="p-3 bg-blue-500/20 rounded-full">
                            <TrendingUp className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <Progress value={coveragePercentage} className="mt-2 h-2" />
                      </CardContent>
                    </Card>
                  </div>

                  {/* شريط البحث والفلاتر */}
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="ابحث في الصلاحيات..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pr-10"
                          />
                        </div>
                        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                          <SelectTrigger className="w-[180px]">
                            <Filter className="h-4 w-4 ml-2" />
                            <SelectValue placeholder="الحالة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">جميع الصلاحيات</SelectItem>
                            <SelectItem value="active">المفعّلة فقط</SelectItem>
                            <SelectItem value="inactive">غير المفعّلة</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Button
                            variant={viewMode === 'grid' ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => setViewMode('grid')}
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={viewMode === 'list' ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => setViewMode('list')}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* عرض الصلاحيات */}
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredPermissions.map((perm) => {
                        const hasPermission = permissions.includes(perm.name);
                        const categoryInfo = getCategoryInfo(perm.category);
                        
                        return (
                          <Card
                            key={perm.id}
                            className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                              hasPermission 
                                ? 'border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 dark:border-green-900' 
                                : 'border-muted bg-card hover:border-muted-foreground/20'
                            }`}
                            onClick={() => setSelectedPermission(perm)}
                          >
                            <CardContent className="p-5">
                              <div className="flex items-start justify-between mb-3">
                                <div className={`p-2.5 rounded-xl ${hasPermission ? 'bg-green-500/20' : categoryInfo.color + '/10'}`}>
                                  {hasPermission ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <div className="text-muted-foreground">{categoryInfo.icon}</div>
                                  )}
                                </div>
                                <Badge 
                                  variant={hasPermission ? 'default' : 'secondary'}
                                  className={hasPermission ? 'bg-green-600 hover:bg-green-700' : ''}
                                >
                                  {hasPermission ? 'مفعّلة' : 'غير مفعّلة'}
                                </Badge>
                              </div>
                              <h3 className="font-semibold mb-2 line-clamp-2">{perm.description}</h3>
                              <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                                {perm.name}
                              </p>
                              <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  {categoryInfo.icon}
                                  {categoryInfo.name}
                                </span>
                                <Button variant="ghost" size="sm" className="h-6 px-2">
                                  <Eye className="h-3 w-3 ml-1" />
                                  عرض
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <Card className="border-0 shadow-md">
                      <CardContent className="p-0">
                        <div className="divide-y">
                          {filteredPermissions.map((perm) => {
                            const hasPermission = permissions.includes(perm.name);
                            const categoryInfo = getCategoryInfo(perm.category);
                            
                            return (
                              <div
                                key={perm.id}
                                className={`flex items-center gap-4 p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                                  hasPermission ? 'bg-green-50/50 dark:bg-green-950/10' : ''
                                }`}
                                onClick={() => setSelectedPermission(perm)}
                              >
                                <div className={`p-2.5 rounded-xl ${hasPermission ? 'bg-green-500/20' : 'bg-muted'}`}>
                                  {hasPermission ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <XCircle className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold truncate">{perm.description}</h3>
                                  <p className="text-sm text-muted-foreground font-mono truncate">{perm.name}</p>
                                </div>
                                <Badge variant="outline" className="flex items-center gap-1">
                                  {categoryInfo.icon}
                                  {categoryInfo.name}
                                </Badge>
                                <Badge 
                                  variant={hasPermission ? 'default' : 'secondary'}
                                  className={hasPermission ? 'bg-green-600 hover:bg-green-700' : ''}
                                >
                                  {hasPermission ? 'مفعّلة' : 'غير مفعّلة'}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {filteredPermissions.length === 0 && (
                    <Card className="border-dashed">
                      <CardContent className="py-12 text-center">
                        <div className="p-4 bg-muted rounded-full w-fit mx-auto mb-4">
                          <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">لا توجد صلاحيات</h3>
                        <p className="text-muted-foreground">لم يتم العثور على صلاحيات تطابق معايير البحث</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="overview" className="space-y-6">
                  {/* نظرة عامة على الفئات */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => {
                      const info = getCategoryInfo(category);
                      const stats = getCategoryStats(category);
                      
                      return (
                        <Card 
                          key={category} 
                          className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
                          onClick={() => {
                            setSelectedCategory(category);
                          }}
                        >
                          <CardContent className="p-5">
                            <div className="flex items-center gap-4 mb-4">
                              <div className={`p-3 rounded-xl ${info.color} text-white`}>
                                {info.icon}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-lg">{info.name}</h3>
                                <p className="text-sm text-muted-foreground">{info.description}</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>التقدم</span>
                                <span className="font-medium">{stats.active}/{stats.total}</span>
                              </div>
                              <Progress value={stats.percentage} className="h-2" />
                              <div className="flex justify-between items-center mt-2">
                                <Badge variant={stats.percentage === 100 ? 'default' : stats.percentage > 0 ? 'secondary' : 'outline'}>
                                  {stats.percentage}%
                                </Badge>
                                {stats.percentage === 100 ? (
                                  <span className="text-green-600 text-xs flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    مكتمل
                                  </span>
                                ) : stats.percentage > 0 ? (
                                  <span className="text-amber-600 text-xs flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    جزئي
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-xs flex items-center gap-1">
                                    <Lock className="h-3 w-3" />
                                    غير مفعّل
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* ملخص شامل */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        ملخص الصلاحيات
                      </CardTitle>
                      <CardDescription>
                        نظرة عامة على جميع صلاحياتك في النظام
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg">التوزيع حسب الحالة</h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded-full bg-green-500"></div>
                              <span className="flex-1">الصلاحيات المفعّلة</span>
                              <span className="font-bold">{activePermissions}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                              <span className="flex-1">الصلاحيات غير المفعّلة</span>
                              <span className="font-bold">{inactivePermissions}</span>
                            </div>
                          </div>
                          <Progress value={coveragePercentage} className="h-3" />
                          <p className="text-sm text-muted-foreground">
                            لديك وصول إلى {coveragePercentage}% من إجمالي صلاحيات النظام
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg">أعلى الفئات تفعيلاً</h4>
                          <div className="space-y-2">
                            {categories
                              .map(cat => ({ category: cat, ...getCategoryStats(cat), info: getCategoryInfo(cat) }))
                              .sort((a, b) => b.percentage - a.percentage)
                              .slice(0, 5)
                              .map(({ category, percentage, active, total, info }) => (
                                <div key={category} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                                  <div className={`p-2 rounded-lg ${info.color}/10`}>
                                    {info.icon}
                                  </div>
                                  <span className="flex-1 font-medium">{info.name}</span>
                                  <Badge variant={percentage === 100 ? 'default' : 'secondary'}>
                                    {active}/{total}
                                  </Badge>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </main>
          </div>
        </div>

        {/* Modal تفاصيل الصلاحية */}
        <Dialog open={!!selectedPermission} onOpenChange={() => setSelectedPermission(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {selectedPermission && permissions.includes(selectedPermission.name) ? (
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                ) : (
                  <div className="p-2 bg-muted rounded-lg">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                تفاصيل الصلاحية
              </DialogTitle>
              <DialogDescription>
                معلومات تفصيلية عن هذه الصلاحية
              </DialogDescription>
            </DialogHeader>
            {selectedPermission && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">{selectedPermission.description}</h4>
                  <p className="text-sm font-mono text-muted-foreground bg-background px-2 py-1 rounded">
                    {selectedPermission.name}
                  </p>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <span className="text-sm text-muted-foreground">الفئة</span>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getCategoryInfo(selectedPermission.category).icon}
                    {getCategoryInfo(selectedPermission.category).name}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <span className="text-sm text-muted-foreground">الحالة</span>
                  <Badge 
                    variant={permissions.includes(selectedPermission.name) ? 'default' : 'secondary'}
                    className={permissions.includes(selectedPermission.name) ? 'bg-green-600' : ''}
                  >
                    {permissions.includes(selectedPermission.name) ? 'مفعّلة' : 'غير مفعّلة'}
                  </Badge>
                </div>
                {!permissions.includes(selectedPermission.name) && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800 dark:text-amber-200">صلاحية غير مفعّلة</p>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          تواصل مع مدير النظام لتفعيل هذه الصلاحية
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
