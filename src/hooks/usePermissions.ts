import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        // جلب أدوار المستخدم
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (rolesError) throw rolesError;

        if (!userRoles || userRoles.length === 0) {
          setPermissions([]);
          setLoading(false);
          return;
        }

        // جلب الصلاحيات المرتبطة بهذه الأدوار
        const roles = userRoles.map(r => r.role);
        const { data: rolePermissions, error: permissionsError } = await supabase
          .from('role_permissions')
          .select(`
            permission_id,
            permissions!inner (
              id,
              name,
              description,
              category
            )
          `)
          .in('role', roles);

        if (permissionsError) {
          console.error('❌ خطأ في جلب الصلاحيات:', permissionsError);
          throw permissionsError;
        }

        console.log('✅ تم جلب الصلاحيات بنجاح:', rolePermissions);

        const permissionNames = rolePermissions
          ?.map((rp: any) => rp.permissions?.name)
          .filter(Boolean) || [];

        console.log('📋 أسماء الصلاحيات:', permissionNames);
        setPermissions([...new Set(permissionNames)]);
      } catch (error) {
        console.error('Error fetching permissions:', error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();

    // الاستماع للتحديثات الفورية على role_permissions
    const channel = supabase
      .channel('role_permissions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'role_permissions'
        },
        () => {
          // إعادة جلب الصلاحيات عند أي تغيير
          fetchPermissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const hasPermission = (permissionName: string) => permissions.includes(permissionName);
  
  const hasAnyPermission = (permissionNames: string[]) => 
    permissionNames.some(p => permissions.includes(p));
  
  const hasAllPermissions = (permissionNames: string[]) =>
    permissionNames.every(p => permissions.includes(p));

  return { 
    permissions, 
    hasPermission, 
    hasAnyPermission,
    hasAllPermissions,
    loading 
  };
};
