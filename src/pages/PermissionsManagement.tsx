import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/hooks/usePermissions';
import { Loader2, Shield, Users, Key } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

type AppRole = 'admin' | 'accountant' | 'technician' | 'client';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const ROLES: { value: AppRole; label: string }[] = [
  { value: 'admin', label: 'مدير النظام' },
  { value: 'accountant', label: 'محاسب' },
  { value: 'technician', label: 'فني' },
  { value: 'client', label: 'عميل' }
];

export default function PermissionsManagement() {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Map<AppRole, Set<string>>>(new Map());
  const [loading, setLoading] = useState(true);

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
    }
  }, [permissionsLoading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // جلب جميع الصلاحيات
      const { data: permissionsData, error: permError } = await supabase
        .from('permissions')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (permError) throw permError;

      // جلب ربط الأدوار بالصلاحيات
      const { data: rolePermsData, error: rolePermsError } = await supabase
        .from('role_permissions')
        .select('role, permission_id');

      if (rolePermsError) throw rolePermsError;

      // بناء خريطة الأدوار والصلاحيات
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
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('حدث خطأ أثناء جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (role: AppRole, permissionId: string) => {
    const currentPerms = rolePermissions.get(role) || new Set();
    const hasPermission = currentPerms.has(permissionId);

    try {
      if (hasPermission) {
        // حذف الصلاحية
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role', role)
          .eq('permission_id', permissionId);

        if (error) throw error;

        const newPerms = new Set(currentPerms);
        newPerms.delete(permissionId);
        
        const newRolePermissions = new Map(rolePermissions);
        newRolePermissions.set(role, newPerms);
        setRolePermissions(newRolePermissions);
        
        toast.success('تم إزالة الصلاحية بنجاح');
      } else {
        // إضافة الصلاحية
        const { error } = await supabase
          .from('role_permissions')
          .insert([{ role, permission_id: permissionId }]);

        if (error) {
          // تحقق من التكرار
          if (error.code === '23505') {
            toast.info('هذه الصلاحية موجودة مسبقاً');
            // تحديث الحالة المحلية فقط
            const newPerms = new Set(currentPerms);
            newPerms.add(permissionId);
            const newRolePermissions = new Map(rolePermissions);
            newRolePermissions.set(role, newPerms);
            setRolePermissions(newRolePermissions);
            return;
          }
          throw error;
        }

        const newPerms = new Set(currentPerms);
        newPerms.add(permissionId);
        
        const newRolePermissions = new Map(rolePermissions);
        newRolePermissions.set(role, newPerms);
        setRolePermissions(newRolePermissions);
        
        toast.success('تم إضافة الصلاحية بنجاح');
      }
    } catch (error) {
      console.error('Error toggling permission:', error);
      toast.error('حدث خطأ أثناء تحديث الصلاحية');
      // إعادة تحميل البيانات في حالة الخطأ
      fetchData();
    }
  };

  if (permissionsLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasPermission('manage_roles')) {
    return null;
  }

  // تجميع الصلاحيات حسب الفئة
  const permissionsByCategory = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">إدارة الصلاحيات</h1>
              </div>
              <p className="text-muted-foreground">
                قم بتخصيص صلاحيات كل دور في النظام
              </p>
            </div>

            <Tabs defaultValue={ROLES[0].value} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                {ROLES.map(role => (
                  <TabsTrigger key={role.value} value={role.value}>
                    {role.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {ROLES.map(role => (
                <TabsContent key={role.value} value={role.value}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        صلاحيات {role.label}
                        <Badge variant="secondary" className="mr-auto">
                          {rolePermissions.get(role.value)?.size || 0} صلاحية
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {Object.entries(permissionsByCategory).map(([category, perms]) => (
                          <div key={category}>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                              <Key className="h-4 w-4" />
                              {category}
                            </h3>
                            <div className="space-y-2">
                              {perms.map(perm => (
                                <div
                                  key={perm.id}
                                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      checked={rolePermissions.get(role.value)?.has(perm.id)}
                                      onCheckedChange={() => togglePermission(role.value, perm.id)}
                                    />
                                    <div>
                                      <p className="font-medium">{perm.description}</p>
                                      <p className="text-sm text-muted-foreground">{perm.name}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
