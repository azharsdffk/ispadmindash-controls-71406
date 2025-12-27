import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AdminLayout {
  tabOrder: string[];
  accountingTabOrder: string[];
}

const DEFAULT_TAB_ORDER = [
  'overview',
  'tickets',
  'technicians',
  'subscribers',
  'customers',
  'finance',
  'accounting',
  'reports',
  'statements',
  'activity',
];

const DEFAULT_ACCOUNTING_TAB_ORDER = [
  'overview',
  'financial',
  'entries',
  'ledger',
  'balance',
  'income',
  'cashflow',
  'advanced',
];

export const useAdminLayout = () => {
  const { user } = useAuth();
  const [layout, setLayout] = useState<AdminLayout>({
    tabOrder: DEFAULT_TAB_ORDER,
    accountingTabOrder: DEFAULT_ACCOUNTING_TAB_ORDER,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLayout();
    }
  }, [user]);

  const fetchLayout = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_dashboard_layout')
        .select('layout_data')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.layout_data && typeof data.layout_data === 'object') {
        const layoutData = data.layout_data as Record<string, unknown>;
        if (layoutData.admin && typeof layoutData.admin === 'object') {
          const adminData = layoutData.admin as AdminLayout;
          setLayout({
            tabOrder: adminData.tabOrder || DEFAULT_TAB_ORDER,
            accountingTabOrder: adminData.accountingTabOrder || DEFAULT_ACCOUNTING_TAB_ORDER,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching admin layout:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveLayout = async (newLayout: Partial<AdminLayout>) => {
    if (!user) return;

    try {
      // First get existing data
      const { data: existingData } = await supabase
        .from('user_dashboard_layout')
        .select('layout_data')
        .eq('user_id', user.id)
        .single();

      const existingLayoutData = (existingData?.layout_data as Record<string, unknown>) || {};
      const updatedLayout = { ...layout, ...newLayout };
      
      const { error } = await supabase
        .from('user_dashboard_layout')
        .upsert(
          {
            user_id: user.id,
            layout_data: {
              ...existingLayoutData,
              admin: updatedLayout,
            },
          },
          {
            onConflict: 'user_id',
          }
        );

      if (error) throw error;

      setLayout(updatedLayout);
      toast.success('تم حفظ ترتيب التبويبات');
    } catch (error) {
      console.error('Error saving admin layout:', error);
      toast.error('فشل حفظ الترتيب');
    }
  };

  const updateTabOrder = async (newOrder: string[]) => {
    await saveLayout({ tabOrder: newOrder });
  };

  const updateAccountingTabOrder = async (newOrder: string[]) => {
    await saveLayout({ accountingTabOrder: newOrder });
  };

  const resetToDefault = async () => {
    await saveLayout({
      tabOrder: DEFAULT_TAB_ORDER,
      accountingTabOrder: DEFAULT_ACCOUNTING_TAB_ORDER,
    });
  };

  return {
    layout,
    loading,
    updateTabOrder,
    updateAccountingTabOrder,
    resetToDefault,
    DEFAULT_TAB_ORDER,
    DEFAULT_ACCOUNTING_TAB_ORDER,
  };
};
