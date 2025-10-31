import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DashboardWidget {
  id: string;
  title: string;
  icon: string;
  order: number;
}

export interface AccountantLayout {
  iconOrder: string[];
  viewMode: 'grid' | 'list';
  widgets: DashboardWidget[];
}

export const useDashboardLayout = () => {
  const { user } = useAuth();
  const [layout, setLayout] = useState<AccountantLayout>({
    iconOrder: [],
    viewMode: 'grid',
    widgets: [],
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
        const layoutData = data.layout_data as any;
        if (layoutData.accountant) {
          setLayout(layoutData.accountant);
        }
      }
    } catch (error) {
      console.error('Error fetching layout:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveLayout = async (newLayout: Partial<AccountantLayout>) => {
    if (!user) return;

    try {
      const updatedLayout = { ...layout, ...newLayout };
      
      const { error } = await supabase
        .from('user_dashboard_layout')
        .upsert({
          user_id: user.id,
          layout_data: {
            accountant: updatedLayout,
          } as any,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setLayout(updatedLayout);
      toast.success('تم حفظ الإعدادات');
    } catch (error) {
      console.error('Error saving layout:', error);
      toast.error('فشل حفظ الإعدادات');
    }
  };

  const updateIconOrder = async (newOrder: string[]) => {
    await saveLayout({ iconOrder: newOrder });
  };

  const updateViewMode = async (mode: 'grid' | 'list') => {
    await saveLayout({ viewMode: mode });
  };

  const updateWidgets = async (widgets: DashboardWidget[]) => {
    await saveLayout({ widgets });
  };

  return {
    layout,
    loading,
    updateIconOrder,
    updateViewMode,
    updateWidgets,
  };
};
