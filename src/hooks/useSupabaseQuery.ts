import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Generic cached query hook for Supabase tables
export function useSupabaseQuery<T = any>(
  key: string[],
  tableName: string,
  options?: {
    select?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      let query = supabase
        .from(tableName)
        .select(options?.select || '*');

      if (options?.filters) {
        Object.entries(options.filters).forEach(([col, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            query = query.eq(col, val);
          }
        });
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? false 
        });
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as T[];
    },
    enabled: options?.enabled !== false,
  });
}

// Mutation hook with cache invalidation
export function useSupabaseMutation(
  tableName: string,
  invalidateKeys: string[][],
  options?: {
    successMessage?: string;
    errorMessage?: string;
  }
) {
  const queryClient = useQueryClient();

  const insertMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      invalidateKeys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      if (options?.successMessage) toast.success(options.successMessage);
    },
    onError: (error: any) => {
      toast.error(options?.errorMessage || `خطأ: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      invalidateKeys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      if (options?.successMessage) toast.success(options.successMessage);
    },
    onError: (error: any) => {
      toast.error(options?.errorMessage || `خطأ: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateKeys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      toast.success('تم الحذف بنجاح');
    },
    onError: (error: any) => {
      toast.error(`خطأ في الحذف: ${error.message}`);
    },
  });

  return {
    insert: insertMutation,
    update: updateMutation,
    remove: deleteMutation,
  };
}
