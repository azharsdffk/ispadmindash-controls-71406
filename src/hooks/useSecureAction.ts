import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SecureActionOptions {
  action: string;
  resource_type: string;
  resource_id?: string;
  required_permission: string | string[];
  data?: any;
  expected_version?: number;
}

interface SecureActionResult {
  success: boolean;
  error?: string;
  code?: string;
  userId?: string;
  roles?: string[];
  userPermissions?: string[];
}

export const useSecureAction = () => {
  const [loading, setLoading] = useState(false);

  const executeSecureAction = useCallback(async (
    options: SecureActionOptions,
    onSuccess?: () => Promise<void> | void,
    onError?: (error: string, code?: string) => void
  ): Promise<SecureActionResult> => {
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session?.access_token) {
        const result = { success: false, error: 'يرجى تسجيل الدخول أولاً', code: 'NOT_AUTHENTICATED' };
        toast.error(result.error);
        onError?.(result.error, result.code);
        return result;
      }

      const response = await supabase.functions.invoke('protected-action', {
        body: options,
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });

      if (response.error) {
        const result: SecureActionResult = { 
          success: false, 
          error: response.error.message || 'حدث خطأ غير متوقع',
          code: 'FUNCTION_ERROR'
        };
        toast.error(result.error);
        onError?.(result.error, result.code);
        return result;
      }

      const result = response.data as SecureActionResult;

      if (!result.success) {
        if (result.code === 'VERSION_CONFLICT') {
          toast.error(result.error || 'تعارض في الإصدار', {
            description: 'تم تعديل السجل من قبل مستخدم آخر'
          });
        } else if (result.code === 'PERMISSION_DENIED') {
          toast.error(result.error || 'غير مصرح', {
            description: 'ليس لديك الصلاحية المطلوبة'
          });
        } else {
          toast.error(result.error || 'حدث خطأ');
        }
        onError?.(result.error || 'Unknown error', result.code);
        return result;
      }

      // نجاح العملية
      await onSuccess?.();
      return result;

    } catch (error: any) {
      const result: SecureActionResult = { 
        success: false, 
        error: error.message || 'حدث خطأ في الاتصال',
        code: 'NETWORK_ERROR'
      };
      toast.error(result.error);
      onError?.(result.error, result.code);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return { executeSecureAction, loading };
};

// Hook للتحقق من صلاحية معينة في الـ Backend
export const useCheckPermission = () => {
  const [checking, setChecking] = useState(false);

  const checkPermission = useCallback(async (
    permission: string | string[],
    requireAll: boolean = false
  ): Promise<boolean> => {
    setChecking(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session?.access_token) {
        return false;
      }

      const response = await supabase.functions.invoke('check-permission', {
        body: { permission, require_all: requireAll },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });

      if (response.error) {
        console.error('Permission check error:', response.error);
        return false;
      }

      return response.data?.hasPermission || false;

    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  return { checkPermission, checking };
};