import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  permissions: string[];
  roles: string[];
  refreshUserData: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const navigate = useNavigate();

  const fetchUserPermissions = async (userId: string) => {
    try {
      // جلب الأدوار
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      const rolesList = userRoles?.map(r => r.role) || [];
      setRoles(rolesList);

      // جلب الصلاحيات
      const { data: rolePermissions } = await supabase
        .from('role_permissions')
        .select('permission_id, permissions(name)')
        .in('role', rolesList);

      const permissionsList = rolePermissions
        ?.map((rp: any) => rp.permissions?.name)
        .filter(Boolean) || [];
      
      setPermissions([...new Set(permissionsList)]);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions([]);
      setRoles([]);
    }
  };

  const refreshUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchUserPermissions(session.user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          // Clear all state on sign out
          setPermissions([]);
          setRoles([]);
          setSession(null);
          setUser(null);
          // Clear localStorage
          localStorage.clear();
        } else if (session?.user) {
          setTimeout(() => {
            fetchUserPermissions(session.user.id);
          }, 0);
        } else {
          setPermissions([]);
          setRoles([]);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserPermissions(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) {
      navigate('/');
    }
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName,
          phone: phone,
        }
      }
    });
    if (!error) {
      navigate('/');
    }
    return { error };
  };

  const signOut = async () => {
    try {
      // Clear all local state first
      setPermissions([]);
      setRoles([]);
      setSession(null);
      setUser(null);
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear all localStorage
      localStorage.clear();
      
      // Navigate to auth page
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      // Force navigation even if sign out fails
      navigate('/auth');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      permissions, 
      roles,
      refreshUserData,
      signIn, 
      signUp, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
