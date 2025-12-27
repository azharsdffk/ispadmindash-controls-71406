import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, Phone, Shield, Calendar, Clock, Award, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProfileData {
  full_name: string;
  phone: string | null;
  username: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface UserRole {
  role: string;
}

export const ProfileModal = ({ open, onOpenChange }: ProfileModalProps) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginCount, setLoginCount] = useState(0);
  const [lastLogin, setLastLogin] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      fetchProfileData();
    }
  }, [open, user]);

  const fetchProfileData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // جلب بيانات الملف الشخصي
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // جلب الأدوار
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesData) {
        setRoles(rolesData.map((r: UserRole) => r.role));
      }

      // جلب سجل تسجيل الدخول
      const { data: loginData, count } = await supabase
        .from('login_attempts')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('success', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (count) {
        setLoginCount(count);
      }

      if (loginData && loginData.length > 0) {
        setLastLogin(loginData[0].created_at);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      admin: 'مدير النظام',
      accountant: 'محاسب',
      technician: 'فني',
      client: 'عميل',
    };
    return roleLabels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      admin: 'bg-red-500/20 text-red-400 border-red-500/30',
      accountant: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      technician: 'bg-green-500/20 text-green-400 border-green-500/30',
      client: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    };
    return roleColors[role] || 'bg-muted text-muted-foreground';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'غير متوفر';
    return format(new Date(dateString), 'dd MMMM yyyy - hh:mm a', { locale: ar });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-xl border-white/[0.08]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/30">
              <User className="h-5 w-5 text-primary" />
            </div>
            الملف الشخصي
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-20 bg-white/[0.03] rounded-xl" />
            <div className="h-32 bg-white/[0.03] rounded-xl" />
            <div className="h-24 bg-white/[0.03] rounded-xl" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* معلومات المستخدم الأساسية */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-violet-500/10 border border-primary/20">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success border-2 border-card flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">
                    {profile?.full_name || 'مستخدم'}
                  </h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {roles.map((role) => (
                      <Badge 
                        key={role} 
                        variant="outline" 
                        className={`text-xs ${getRoleColor(role)}`}
                      >
                        <Shield className="h-3 w-3 ml-1" />
                        {getRoleLabel(role)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-white/[0.06]" />

            {/* تفاصيل الحساب */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                تفاصيل الحساب
              </h4>
              
              <div className="grid gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <Mail className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
                    <p className="text-sm font-medium">{user?.email || 'غير متوفر'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <Phone className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">رقم الهاتف</p>
                    <p className="text-sm font-medium">{profile?.phone || 'غير متوفر'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <User className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">اسم المستخدم</p>
                    <p className="text-sm font-medium">{profile?.username || 'غير متوفر'}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-white/[0.06]" />

            {/* إحصائيات النشاط */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4" />
                إحصائيات النشاط
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
                  <div className="text-2xl font-bold text-primary">{loginCount}</div>
                  <p className="text-xs text-muted-foreground">مرات الدخول</p>
                </div>

                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
                  <div className="text-2xl font-bold text-success">{roles.length}</div>
                  <p className="text-xs text-muted-foreground">الأدوار</p>
                </div>
              </div>
            </div>

            <Separator className="bg-white/[0.06]" />

            {/* التواريخ المهمة */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                التواريخ المهمة
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    تاريخ الإنشاء
                  </span>
                  <span className="font-medium">{formatDate(profile?.created_at || null)}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    آخر تحديث
                  </span>
                  <span className="font-medium">{formatDate(profile?.updated_at || null)}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5" />
                    آخر تسجيل دخول
                  </span>
                  <span className="font-medium">{formatDate(lastLogin)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
