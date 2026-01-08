import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserCheck, UserX, Clock, Shield, Calculator, Wrench, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PendingUser {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

type AppRole = 'admin' | 'accountant' | 'technician' | 'client';

const roleLabels: Record<AppRole, { label: string; icon: React.ReactNode; color: string }> = {
  admin: { label: 'مدير', icon: <Shield className="h-4 w-4" />, color: 'bg-red-500' },
  accountant: { label: 'محاسب', icon: <Calculator className="h-4 w-4" />, color: 'bg-blue-500' },
  technician: { label: 'فني', icon: <Wrench className="h-4 w-4" />, color: 'bg-green-500' },
  client: { label: 'عميل', icon: <User className="h-4 w-4" />, color: 'bg-gray-500' },
};

export const PendingUsersManager = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, AppRole>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPendingUsers = async () => {
    try {
      // Get users without any roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, created_at');

      if (profilesError) throw profilesError;

      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id');

      if (rolesError) throw rolesError;

      const usersWithRoles = new Set(userRoles?.map(r => r.user_id) || []);
      
      // Filter profiles that don't have roles
      const pending = profiles?.filter(p => !usersWithRoles.has(p.id)) || [];

      // Get emails from auth (we need to use edge function for this)
      const pendingWithEmail: PendingUser[] = pending.map(p => ({
        ...p,
        email: 'غير متوفر', // Will be populated if we add edge function
        full_name: p.full_name || 'بدون اسم'
      }));

      setPendingUsers(pendingWithEmail);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast.error('حدث خطأ في جلب المستخدمين المنتظرين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('user_roles_changes_admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        () => fetchPendingUsers()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchPendingUsers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApprove = async (userId: string) => {
    const role = selectedRoles[userId];
    if (!role) {
      toast.error('الرجاء اختيار دور للمستخدم');
      return;
    }

    setProcessing(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) throw error;

      toast.success('تم قبول المستخدم وتعيين الدور بنجاح');
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('حدث خطأ في قبول المستخدم');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (userId: string) => {
    // For now, we just remove them from pending by not assigning a role
    // In a real app, you might want to delete the user or mark them as rejected
    toast.info('لرفض المستخدم، يمكنك ببساطة عدم تعيين دور له');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-orange-500" />
          المستخدمون المنتظرون الموافقة
          {pendingUsers.length > 0 && (
            <Badge variant="destructive" className="mr-2">
              {pendingUsers.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>لا يوجد مستخدمون ينتظرون الموافقة</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{user.full_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {user.phone || 'بدون رقم هاتف'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      تاريخ التسجيل: {formatDate(user.created_at)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedRoles[user.id] || ''}
                      onValueChange={(value: AppRole) => 
                        setSelectedRoles(prev => ({ ...prev, [user.id]: value }))
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="اختر الدور" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(roleLabels) as AppRole[]).map((role) => (
                          <SelectItem key={role} value={role}>
                            <div className="flex items-center gap-2">
                              {roleLabels[role].icon}
                              {roleLabels[role].label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button
                      size="sm"
                      onClick={() => handleApprove(user.id)}
                      disabled={processing === user.id || !selectedRoles[user.id]}
                    >
                      {processing === user.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 ml-1" />
                          قبول
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
