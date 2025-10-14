import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, AlertCircle, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { AddUserModal } from "@/components/modals/AddUserModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";

type UserWithRoles = {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
};

const RoleManagement = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("غير مصرح لك بالوصول إلى هذه الصفحة");
      navigate('/');
    }
  }, [isAdmin, roleLoading, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Call edge function to get users (secure way)
      const { data, error } = await supabase.functions.invoke('manage-user-roles', {
        body: { action: 'list_users' }
      });

      if (error) throw error;

      const usersWithData = data.users.map((user: any) => ({
        id: user.id,
        email: user.email || 'لا يوجد',
        full_name: user.profile?.full_name || 'غير محدد',
        roles: user.roles || []
      }));

      setUsers(usersWithData);
    } catch (error: any) {
      toast.error("فشل تحميل المستخدمين: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId: string, role: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-user-roles', {
        body: { action: 'assign_role', userId, role }
      });

      if (error) throw error;
      
      toast.success(data.message || "تم تعيين الدور بنجاح");
      fetchUsers();
    } catch (error: any) {
      toast.error("فشل تعيين الدور: " + error.message);
    }
  };

  const removeRole = async (userId: string, role: string) => {
    if (!confirm(`هل أنت متأكد من إزالة دور "${role}" من هذا المستخدم؟`)) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('manage-user-roles', {
        body: { action: 'remove_role', userId, role }
      });

      if (error) throw error;
      
      toast.success(data.message || "تم إزالة الدور بنجاح");
      fetchUsers();
    } catch (error: any) {
      toast.error("فشل إزالة الدور: " + error.message);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  if (roleLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1 w-full">
        <AppSidebar />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold">إدارة المستخدمين والصلاحيات</h1>
                  <p className="text-muted-foreground mt-1">إنشاء حسابات جديدة وإدارة أدوار المستخدمين</p>
                </div>
              </div>
              <Button onClick={() => setAddUserOpen(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                إضافة مستخدم جديد
              </Button>
            </div>

            <Card className="border-warning bg-warning/5">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-semibold text-warning">تحذير أمني</p>
                    <p className="text-sm text-muted-foreground">
                      تعيين الأدوار يمنح صلاحيات وصول حساسة. كن حذراً عند تعيين الأدوار للمستخدمين.
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li><strong>مدير (admin):</strong> وصول كامل لجميع البيانات والإعدادات</li>
                      <li><strong>محاسب (accountant):</strong> وصول كامل للفواتير والمدفوعات والمشتركين</li>
                      <li><strong>فني (technician):</strong> وصول محدود للمشتركين المعينين فقط</li>
                      <li><strong>عميل (client):</strong> وصول لبياناته الخاصة فقط (فواتير، دفعات، تذاكر)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>قائمة المستخدمين ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">جاري التحميل...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>البريد الإلكتروني</TableHead>
                        <TableHead>الأدوار الحالية</TableHead>
                        <TableHead>تعيين دور</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <div className="flex gap-2 flex-wrap">
                              {user.roles.length === 0 ? (
                                <Badge variant="outline">لا يوجد أدوار</Badge>
                              ) : (
                                user.roles.map((role) => (
                                  <Badge 
                                    key={role} 
                                    variant={role === 'admin' ? 'destructive' : 'default'}
                                    className="cursor-pointer hover:opacity-70"
                                    onClick={() => removeRole(user.id, role)}
                                  >
                                     {role === 'admin' && 'مدير'}
                                    {role === 'accountant' && 'محاسب'}
                                    {role === 'technician' && 'فني'}
                                    {role === 'client' && 'عميل'}
                                    {' ✕'}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select onValueChange={(role) => assignRole(user.id, role)}>
                              <SelectTrigger className="w-40">
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
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <AddUserModal 
        open={addUserOpen} 
        onOpenChange={setAddUserOpen}
        onUserCreated={fetchUsers}
      />
    </div>
  );
};

export default RoleManagement;
