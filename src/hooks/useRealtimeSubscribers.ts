import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useRealtimeSubscribers = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchCount = async () => {
      const { count: initialCount } = await supabase
        .from('subscribers')
        .select('*', { count: 'exact', head: true });
      setCount(initialCount || 0);
      setLoading(false);
    };

    fetchCount();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('subscribers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscribers'
        },
        (payload) => {
          console.log('Subscriber change:', payload);
          if (payload.eventType === 'INSERT') {
            setCount(prev => prev + 1);
            toast.success('تمت إضافة مشترك جديد', {
              description: `العدد الإجمالي: ${count + 1}`,
            });
          } else if (payload.eventType === 'DELETE') {
            setCount(prev => prev - 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { count, loading };
};
