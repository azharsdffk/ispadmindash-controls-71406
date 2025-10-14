import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, UserPlus, Shield, X } from 'lucide-react';
import { AddUserModal } from '@/components/modals/AddUserModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

type AppRole = 'admin' | 'accountant' | 'technician' | 'client';

interface UserWithDetails {
  id: string;
  email: string;
  full_name: string;
  roles: AppRole[];
  last_login?: string;
  login_count: number;
  created_at: string;
}

export default function UserAccountsManagement() {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error('غير مصرح لك بالوصول إلى هذه الصفحة');
      navigate('/');
      return;
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('manage-user-roles', {
        body: { action: 'list_users' }
      });

      if (error) throw error;

      // جلب معلومات تسجيل الدخول لكل مستخدم
      const usersWithLoginInfo = await Promise.all(
        data.users.map(async (user: any) => {
          const { data: loginData } = await supabase
            .from('login_attempts')
            .select('created_at, success')
            .eq('user_id', user.id)
            .eq('success', true)
            .order('created_at', { ascending: false })
            .limit(1);

          const { count } = await supabase
            .from('login_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('success', true);

          return {
            ...user,
            last_login: loginData?.[0]?.created_at,
            login_count: count || 0
          };
        })
      );

      setUsers(usersWithLoginInfo);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('فشل في جلب بيانات المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase.functions.invoke('manage-user-roles', {
        body: {
          action: 'assign_role',
          userId,
          role
        }
      });

      if (error) throw error;

      toast.success('تم تعيين الدور بنجاح');
      fetchUsers();
    } catch (error: any) {
      console.error('Error assigning role:', error);
      toast.error('فشل في تعيين الدور');
    }
  };

  const removeRole = async (userId: string, role: AppRole) => {
    if (!confirm(`هل أنت متأكد من إزالة دور "${getRoleLabel(role)}"؟`)) {
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('manage-user-roles', {
        body: {
          action: 'remove_role',
          userId,
          role
        }
      });

      if (error) throw error;

      toast.success('تم إزالة الدور بنجاح');
      fetchUsers();
    } catch (error: any) {
      console.error('Error removing role:', error);
      toast.error('فشل في إزالة الدور');
    }
  };

  const getRoleLabel = (role: AppRole): string => {
    const labels: Record<AppRole, string> = {
      admin: 'مدير',
      accountant: 'محاسب',
      technician: 'فني',
      client: 'عميل'
    };
    return labels[role] || role;
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    const variants: Record<AppRole, "default" | "secondary" | "destructive" | "outline"> = {
      admin: 'destructive',
      accountant: 'default',
      technician: 'secondary',
      client: 'outline'
    };
    return variants[role] || 'default';
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex">
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Shield className="h-8 w-8" />
                  إدارة الحسابات والصلاحيات
                </h1>
                <p className="text-muted-foreground mt-2">
                  عرض وإدارة جميع حسابات المستخدمين وصلاحياتهم
                </p>
              </div>
              <Button onClick={() => setAddUserOpen(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                إضافة مستخدم جديد
              </Button>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                تعيين الأدوار يؤثر على صلاحيات الوصول للنظام. تأكد من تعيين الأدوار المناسبة لكل مستخدم.
              </AlertDescription>
            </Alert>

            <div className="bg-card rounded-lg border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">البريد الإلكتروني</TableHead>
                    <TableHead className="text-right">الأدوار الحالية</TableHead>
                    <TableHead className="text-right">آخر تسجيل دخول</TableHead>
                    <TableHead className="text-right">عدد مرات الدخول</TableHead>
                    <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                    <TableHead className="text-right">إضافة دور</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        لا يوجد مستخدمين
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {user.roles.length === 0 ? (
                              <Badge variant="outline">لا يوجد دور</Badge>
                            ) : (
                              user.roles.map((role) => (
                                <Badge
                                  key={role}
                                  variant={getRoleBadgeVariant(role)}
                                  className="gap-1 cursor-pointer hover:opacity-80"
                                  onClick={() => removeRole(user.id, role)}
                                >
                                  {getRoleLabel(role)}
                                  <X className="h-3 w-3" />
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.last_login 
                            ? format(new Date(user.last_login), 'dd/MM/yyyy HH:mm', { locale: ar })
                            : 'لم يسجل دخول بعد'
                          }
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{user.login_count}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.created_at 
                            ? format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ar })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <Select
                            onValueChange={(value) => assignRole(user.id, value as AppRole)}
                          >
                            <SelectTrigger className="w-[150px]">
                              <SelectValue placeholder="اختر دور" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">مدير</SelectItem>
                              <SelectItem value="accountant">محاسب</SelectItem>
                              <SelectItem value="technician">فني</SelectItem>
                              <SelectItem value="client">عميل</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>

        <AppSidebar />
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <AddUserModal 
        open={addUserOpen} 
        onOpenChange={setAddUserOpen}
        onUserCreated={fetchUsers}
      />
    </div>
  );
}
