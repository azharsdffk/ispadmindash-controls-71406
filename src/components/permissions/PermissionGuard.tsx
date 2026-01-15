import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useUserRole } from '@/hooks/useUserRole';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface PermissionGuardProps {
  children: ReactNode;
  permission: string | string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  hideOnNoPermission?: boolean;
}

export const PermissionGuard = ({ 
  children, 
  permission, 
  requireAll = false,
  fallback,
  hideOnNoPermission = false
}: PermissionGuardProps) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();
  const { isAdmin, isSuperAdmin, loading: roleLoading } = useUserRole();

  if (loading || roleLoading) {
    return null;
  }

  // المدراء العامين والمدراء لديهم وصول كامل
  if (isAdmin || isSuperAdmin) {
    return <>{children}</>;
  }

  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = requireAll 
    ? hasAllPermissions(permissions)
    : Array.isArray(permission) 
      ? hasAnyPermission(permissions)
      : hasPermission(permission);

  if (!hasAccess) {
    if (hideOnNoPermission) {
      return null;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          ليس لديك صلاحية الوصول إلى هذا المحتوى
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};
