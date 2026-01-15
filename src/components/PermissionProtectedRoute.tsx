import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useUserRole } from '@/hooks/useUserRole';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const { isAdmin, isSuperAdmin, loading: roleLoading } = useUserRole();
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading: permissionsLoading } = usePermissions();

  if (authLoading || permissionsLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // المدراء العامين والمدراء لديهم وصول كامل لجميع الصفحات
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
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">غير مصرح بالوصول</h1>
            <Alert variant="destructive" className="text-right">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ليس لديك صلاحية الوصول إلى هذه الصفحة. 
                <br />
                يرجى التواصل مع المسؤول إذا كنت تعتقد أن هذا خطأ.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => window.history.back()}>
                العودة
              </Button>
              <Button onClick={() => window.location.href = '/'}>
                الصفحة الرئيسية
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
