import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { Loader2, Shield, Users, Key, Save, X } from 'lucide-react';
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
  const [tempRolePermissions, setTempRolePermissions] = useState<Map<AppRole, Set<string>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

      // الاستماع للتحديثات الفورية
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
      setTempRolePermissions(new Map(rolePermsMap));
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
      // حذف جميع الصلاحيات القديمة وإضافة الجديدة لكل دور
      for (const [role, newPerms] of tempRolePermissions) {
        const oldPerms = rolePermissions.get(role) || new Set();
        
        // الصلاحيات المحذوفة
        const toDelete = [...oldPerms].filter(p => !newPerms.has(p));
        // الصلاحيات المضافة
        const toAdd = [...newPerms].filter(p => !oldPerms.has(p));

        // حذف الصلاحيات
        if (toDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('role_permissions')
            .delete()
            .eq('role', role)
            .in('permission_id', toDelete);

          if (deleteError) throw deleteError;
        }

        // إضافة الصلاحيات
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
                          {tempRolePermissions.get(role.value)?.size || 0} صلاحية
                        </Badge>
                        {hasChanges && (
                          <Badge variant="destructive" className="animate-pulse">
                            غير محفوظ
                          </Badge>
                        )}
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
                                      checked={tempRolePermissions.get(role.value)?.has(perm.id)}
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
                    {hasChanges && (
                      <CardFooter className="flex gap-3 justify-end border-t pt-4">
                        <Button
                          variant="outline"
                          onClick={cancelChanges}
                          disabled={saving}
                        >
                          <X className="h-4 w-4 ml-2" />
                          إلغاء
                        </Button>
                        <Button
                          onClick={saveChanges}
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
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
              ))}
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
