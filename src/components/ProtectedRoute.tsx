import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import type { AppRole } from '@/hooks/useUserRole';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRole();

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // إذا كانت هناك أدوار محددة، تحقق من أن المستخدم لديه واحد منها على الأقل
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAllowedRole = roles.some(role => allowedRoles.includes(role));
    if (!hasAllowedRole) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
