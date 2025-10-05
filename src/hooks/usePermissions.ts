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
          .select('permission_id, permissions(name)')
          .in('role', roles);

        if (permissionsError) throw permissionsError;

        const permissionNames = rolePermissions
          ?.map((rp: any) => rp.permissions?.name)
          .filter(Boolean) || [];

        setPermissions([...new Set(permissionNames)]);
      } catch (error) {
        console.error('Error fetching permissions:', error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
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
