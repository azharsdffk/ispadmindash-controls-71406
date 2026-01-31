import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface MFARequiredState {
  factorId: string;
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  permissions: string[];
  roles: string[];
  mfaRequired: MFARequiredState | null;
  refreshUserData: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any; mfaRequired?: boolean }>;
  signUp: (email: string, password: string, fullName: string, phone?: string, requestedRole?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  completeMFASignIn: (factorId: string, code: string) => Promise<{ error: any }>;
  clearMFARequired: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [mfaRequired, setMfaRequired] = useState<MFARequiredState | null>(null);
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
      (event, session) => {
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && data.session) {
      // Check if MFA is required
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verifiedFactor = factors?.totp.find(f => f.status === 'verified');
      
      if (verifiedFactor) {
        // MFA is required
        setMfaRequired({
          factorId: verifiedFactor.id,
          email,
          password,
        });
        return { error: null, mfaRequired: true };
      }
      
      // No MFA required, proceed with normal login
      await completeSignIn(data);
    }
    return { error };
  };

  const completeSignIn = async (data: { session: Session; user: User }) => {
    // إنشاء سجل للجلسة الجديدة
    try {
      const deviceName = navigator.platform || 'Unknown Device';
      const userAgent = navigator.userAgent;
      
      // حساب تاريخ انتهاء الجلسة (7 أيام من الآن)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      await supabase.functions.invoke('manage-sessions', {
        body: {
          action: 'create',
          sessionToken: data.session.access_token,
          deviceName,
          userAgent,
          expiresAt: expiresAt.toISOString(),
        },
      });
    } catch (sessionError) {
      console.error('Error creating session record:', sessionError);
    }
    
    // جلب دور المستخدم مع حالة الموافقة وتوجيهه للوحة المناسبة
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, approved')
      .eq('user_id', data.user.id);
    
    // التحقق من وجود أدوار معتمدة
    const approvedRoles = userRoles?.filter(r => r.approved === true) || [];
    const userRolesList = approvedRoles.map(r => r.role);
    
    // إذا لم يكن للمستخدم أي دور معتمد، توجيهه لصفحة الانتظار
    if (userRolesList.length === 0) {
      navigate('/pending-approval');
    } else if (userRolesList.includes('accountant') && !userRolesList.includes('admin')) {
      navigate('/accountant');
    } else if (userRolesList.includes('technician') && !userRolesList.includes('admin')) {
      navigate('/technician');
    } else if (userRolesList.includes('client') && !userRolesList.includes('admin')) {
      navigate('/portal');
    } else {
      navigate('/');
    }
  };

  const completeMFASignIn = async (factorId: string, code: string) => {
    try {
      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      // Verify the challenge
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (error) throw error;

      // Clear MFA required state
      setMfaRequired(null);

      // Get current session and complete sign in
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        await completeSignIn({ 
          session: sessionData.session, 
          user: sessionData.session.user 
        });
      }

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const clearMFARequired = () => {
    setMfaRequired(null);
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string, requestedRole?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/pending-approval`,
        data: {
          full_name: fullName,
          phone: phone,
          requested_role: requestedRole,
        }
      }
    });
    
    if (!error && data.user && requestedRole) {
      // إضافة الدور المطلوب للمستخدم الجديد مع حالة غير معتمد (approved = false)
      // المدير سيوافق على هذا الدور لاحقاً
      try {
        await supabase.from('user_roles').insert([{
          user_id: data.user.id,
          role: requestedRole as any,
          approved: false, // الدور غير معتمد حتى يوافق المدير
        }]);
      } catch (roleError) {
        console.error('Error assigning initial role:', roleError);
      }
    }
    
    if (!error) {
      // توجيه المستخدم الجديد إلى صفحة انتظار الموافقة
      navigate('/pending-approval');
    }
    return { error };
  };

  const signOut = async () => {
    try {
      // إلغاء الجلسة الحالية
      if (session?.access_token) {
        try {
          const { data: sessions } = await supabase
            .from('sessions')
            .select('id')
            .eq('session_token', session.access_token)
            .eq('revoked', false)
            .single();
          
          if (sessions) {
            await supabase.functions.invoke('manage-sessions', {
              body: {
                action: 'revoke',
                sessionId: sessions.id,
              },
            });
          }
        } catch (sessionError) {
          console.error('Error revoking session:', sessionError);
        }
      }
      
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
      mfaRequired,
      refreshUserData,
      signIn, 
      signUp, 
      signOut,
      completeMFASignIn,
      clearMFARequired,
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
