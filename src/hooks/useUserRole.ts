import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'accountant' | 'technician' | 'client' | 'super_admin' | 'technical_manager' | 'finance_manager';

export const useUserRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!user) {
        setRoles([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) throw error;
        
        setRoles(data?.map(r => r.role as AppRole) || []);
      } catch (error) {
        console.error('Error fetching user roles:', error);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();

    // الاشتراك في التحديثات الفورية للأدوار
    const channel = supabase
      .channel('user_roles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchRoles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const hasRole = (role: AppRole) => roles.includes(role);
  
  // المدراء العامين والمديرين لديهم كل الصلاحيات
  const isSuperAdmin = hasRole('super_admin');
  const isAdmin = hasRole('admin') || isSuperAdmin;
  const isTechnicalManager = hasRole('technical_manager');
  const isFinanceManager = hasRole('finance_manager');
  const isAccountant = hasRole('accountant') || isFinanceManager;
  const isTechnician = hasRole('technician') || isTechnicalManager;
  const isClient = hasRole('client');
  
  // التحقق من أن المستخدم مدير (أي نوع)
  const isAnyManager = isSuperAdmin || isAdmin || isTechnicalManager || isFinanceManager;

  return { 
    roles, 
    hasRole, 
    isSuperAdmin,
    isAdmin, 
    isTechnicalManager,
    isFinanceManager,
    isAccountant, 
    isTechnician,
    isClient,
    isAnyManager,
    loading 
  };
};
