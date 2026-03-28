import { supabase } from '@/integrations/supabase/client';
import { Shield, Users, Wrench, UserCog, Building2, CheckCircle } from 'lucide-react';

const roleConfig: Record<string, { icon: any; label: string; description: string; gradient: string; bgHover: string; borderHover: string; route: string }> = {
  client: { icon: Users, label: 'العميل', description: 'بوابة العملاء', gradient: 'from-blue-500 to-blue-600', bgHover: 'hover:bg-blue-500/10', borderHover: 'hover:border-blue-500/50', route: '/customer' },
  technician: { icon: Wrench, label: 'الفني', description: 'لوحة الفنيين', gradient: 'from-green-500 to-green-600', bgHover: 'hover:bg-green-500/10', borderHover: 'hover:border-green-500/50', route: '/technician' },
  technical_manager: { icon: Wrench, label: 'مدير التقنية', description: 'إدارة الفنيين', gradient: 'from-teal-500 to-teal-600', bgHover: 'hover:bg-teal-500/10', borderHover: 'hover:border-teal-500/50', route: '/admin' },
  agent: { icon: UserCog, label: 'الوكيل', description: 'إدارة الوكلاء', gradient: 'from-purple-500 to-purple-600', bgHover: 'hover:bg-purple-500/10', borderHover: 'hover:border-purple-500/50', route: '/agent-dashboard' },
  accountant: { icon: Building2, label: 'المحاسب', description: 'لوحة المحاسبة', gradient: 'from-orange-500 to-orange-600', bgHover: 'hover:bg-orange-500/10', borderHover: 'hover:border-orange-500/50', route: '/accountant' },
  finance_manager: { icon: Building2, label: 'مدير المالية', description: 'إدارة المالية', gradient: 'from-yellow-500 to-yellow-600', bgHover: 'hover:bg-yellow-500/10', borderHover: 'hover:border-yellow-500/50', route: '/accountant' },
  admin: { icon: Building2, label: 'المدير', description: 'لوحة التحكم', gradient: 'from-primary to-amber-600', bgHover: 'hover:bg-primary/10', borderHover: 'hover:border-primary/50', route: '/admin' },
  super_admin: { icon: Shield, label: 'المدير العام', description: 'تحكم كامل', gradient: 'from-red-500 to-red-600', bgHover: 'hover:bg-red-500/10', borderHover: 'hover:border-red-500/50', route: '/admin' },
};

export { roleConfig };

interface RoleSelectionGridProps {
  userRoles: string[];
  onRoleSelect: (role: string) => void;
}

export const RoleSelectionGrid = ({ userRoles, onRoleSelect }: RoleSelectionGridProps) => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5" dir="rtl">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="bg-card/80 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 shadow-2xl shadow-primary/10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-amber-600 mb-4 shadow-lg shadow-primary/30">
                <CheckCircle className="w-10 h-10 text-background" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">مرحباً بك!</h1>
              <p className="text-muted-foreground text-sm">
                لديك عدة أدوار في النظام. اختر الدور الذي تريد الدخول به:
              </p>
            </div>

            <div className={`grid gap-4 ${userRoles.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {userRoles.map((role) => {
                const config = roleConfig[role];
                if (!config) return null;
                const Icon = config.icon;
                return (
                  <button
                    key={role}
                    onClick={() => onRoleSelect(role)}
                    className={`group relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-border/50 bg-background/50 transition-all duration-300 ${config.bgHover} ${config.borderHover} hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
                  >
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center mb-3 shadow-md group-hover:shadow-lg transition-shadow`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="font-bold text-foreground text-lg">{config.label}</span>
                    <span className="text-xs text-muted-foreground mt-1">{config.description}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.reload();
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
