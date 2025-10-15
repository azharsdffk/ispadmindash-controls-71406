import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/hooks/usePermissions';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';
import { Loader2, Shield, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface CategoryInfo {
  name: string;
  icon: string;
  description: string;
}

const categoryInfo: Record<string, CategoryInfo> = {
  accounting: { name: 'المحاسبة', icon: '🧮', description: 'القيود المحاسبية والتقارير المالية' },
  dashboard: { name: 'لوحة التحكم', icon: '📊', description: 'الوصول إلى لوحات التحكم والإحصائيات' },
  subscribers: { name: 'المشتركين', icon: '👥', description: 'إدارة بيانات المشتركين' },
  invoices: { name: 'الفواتير', icon: '📄', description: 'إدارة وإصدار الفواتير' },
  payments: { name: 'المدفوعات', icon: '💰', description: 'إدارة المدفوعات والسندات' },
  vouchers: { name: 'السندات', icon: '🧾', description: 'إدارة سندات القبض والصرف' },
  reports: { name: 'التقارير', icon: '📈', description: 'عرض وتصدير التقارير المالية' },
  inventory: { name: 'المخزون', icon: '📦', description: 'متابعة المخزون والمستلزمات' },
  packages: { name: 'الباقات', icon: '📱', description: 'عرض وإدارة باقات الخدمة' },
  notifications: { name: 'الإشعارات', icon: '🔔', description: 'إدارة الإشعارات والتنبيهات' },
  maintenance: { name: 'الصيانة', icon: '🔧', description: 'متابعة طلبات الصيانة' },
  employees: { name: 'الموظفين', icon: '👷', description: 'إدارة ومتابعة الموظفين' },
  settings: { name: 'الإعدادات', icon: '⚙️', description: 'إعدادات النظام' },
  roles: { name: 'الأدوار', icon: '🔑', description: 'إدارة الأدوار والصلاحيات' },
  users: { name: 'المستخدمين', icon: '👤', description: 'إدارة حسابات المستخدمين' },
  import: { name: 'الاستيراد', icon: '📥', description: 'استيراد البيانات' },
};

export default function AccountantPermissions() {
  const navigate = useNavigate();
  const { isAccountant, loading: roleLoading } = useUserRole();
  const { permissions, loading: permissionsLoading } = usePermissions();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

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
      
      // تحديد أول فئة كافتراضية
      const categories = [...new Set(data?.map(p => p.category) || [])];
      if (categories.length > 0 && !selectedCategory) {
        setSelectedCategory(categories[0]);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('حدث خطأ أثناء جلب الصلاحيات');
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading || permissionsLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
  const selectedCategoryPerms = permissionsByCategory[selectedCategory] || [];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      <div className="flex">
        <AppSidebar />
        <SidebarProvider>
          <div className="flex w-full">
            {/* Sidebar للصلاحيات */}
            <Sidebar className="border-l">
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupLabel className="text-lg font-semibold flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    صلاحياتي
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {categories.map((category) => {
                        const info = categoryInfo[category] || { name: category, icon: '📋', description: '' };
                        const categoryPerms = permissionsByCategory[category];
                        const hasPerms = categoryPerms.some(p => permissions.includes(p.name));
                        
                        return (
                          <SidebarMenuItem key={category}>
                            <SidebarMenuButton
                              onClick={() => setSelectedCategory(category)}
                              isActive={selectedCategory === category}
                              className="flex items-center gap-3"
                            >
                              <span className="text-xl">{info.icon}</span>
                              <div className="flex-1">
                                <div className="font-medium">{info.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {categoryPerms.filter(p => permissions.includes(p.name)).length} / {categoryPerms.length}
                                </div>
                              </div>
                              {hasPerms ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                              )}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>

            {/* المحتوى الرئيسي */}
            <main className="flex-1 p-6">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">
                      {categoryInfo[selectedCategory]?.icon || '📋'}
                    </span>
                    <div>
                      <h1 className="text-3xl font-bold">
                        {categoryInfo[selectedCategory]?.name || selectedCategory}
                      </h1>
                      <p className="text-muted-foreground">
                        {categoryInfo[selectedCategory]?.description || 'صلاحيات هذا القسم'}
                      </p>
                    </div>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>الصلاحيات المتاحة</span>
                      <Badge variant="secondary">
                        {selectedCategoryPerms.filter(p => permissions.includes(p.name)).length} من {selectedCategoryPerms.length}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      الصلاحيات التي تمتلكها في فئة {categoryInfo[selectedCategory]?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedCategoryPerms.map((perm) => {
                        const hasPermission = permissions.includes(perm.name);
                        
                        return (
                          <div
                            key={perm.id}
                            className={`flex items-start gap-4 p-4 border rounded-lg transition-colors ${
                              hasPermission 
                                ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900'
                                : 'bg-muted/30 border-muted'
                            }`}
                          >
                            <div className="mt-0.5">
                              {hasPermission ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                              ) : (
                                <XCircle className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">{perm.description}</h3>
                              <p className="text-sm text-muted-foreground font-mono">
                                {perm.name}
                              </p>
                            </div>
                            <Badge variant={hasPermission ? 'default' : 'secondary'}>
                              {hasPermission ? 'مفعّلة' : 'غير مفعّلة'}
                            </Badge>
                          </div>
                        );
                      })}
                      
                      {selectedCategoryPerms.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          لا توجد صلاحيات في هذه الفئة
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* ملخص الصلاحيات */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>ملخص الصلاحيات الكلي</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-primary/10 rounded-lg">
                        <div className="text-3xl font-bold text-primary">
                          {permissions.length}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          إجمالي الصلاحيات
                        </div>
                      </div>
                      <div className="text-center p-4 bg-green-100 dark:bg-green-950/30 rounded-lg">
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                          {categories.filter(cat => 
                            permissionsByCategory[cat].some(p => permissions.includes(p.name))
                          ).length}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          الفئات المفعّلة
                        </div>
                      </div>
                      <div className="text-center p-4 bg-blue-100 dark:bg-blue-950/30 rounded-lg">
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {categories.length}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          إجمالي الفئات
                        </div>
                      </div>
                      <div className="text-center p-4 bg-orange-100 dark:bg-orange-950/30 rounded-lg">
                        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                          {Math.round((permissions.length / allPermissions.length) * 100)}%
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          نسبة التغطية
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </main>
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
}
