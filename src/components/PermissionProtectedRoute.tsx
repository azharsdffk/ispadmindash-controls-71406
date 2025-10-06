import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface PermissionProtectedRouteProps {
  children: ReactNode;
  permission: string | string[];
  requireAll?: boolean;
}

export const PermissionProtectedRoute = ({ 
  children, 
  permission,
  requireAll = false 
}: PermissionProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading: permissionsLoading } = usePermissions();

  if (authLoading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = requireAll 
    ? hasAllPermissions(permissions)
    : Array.isArray(permission) 
      ? hasAnyPermission(permissions)
      : hasPermission(permission);

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            ليس لديك صلاحية الوصول إلى هذه الصفحة. يرجى التواصل مع المسؤول إذا كنت تعتقد أن هذا خطأ.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};
