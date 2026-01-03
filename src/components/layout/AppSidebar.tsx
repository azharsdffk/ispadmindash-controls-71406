import { Home, Users, FileText, Wrench, DollarSign, BarChart3, Settings, UserCog, Download, Shield, Package, LayoutDashboard, User, Bell, MapPin, Calendar, Box, Key, UserCheck, Calculator, FileCheck, FileSignature, Gift, Hexagon, Sparkles, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";
import { useUserRole, type AppRole } from "@/hooks/useUserRole";
import { usePermissions } from "@/hooks/usePermissions";

// تنظيم القوائم حسب المجموعات المنطقية
const menuGroups = {
  main: [
    { icon: Home, label: "الرئيسية", path: "/", permission: null, roles: ['admin', 'accountant', 'technician', 'client'] },
    { icon: LayoutDashboard, label: "لوحة التحكم", path: "/dashboard", permission: "view_dashboard", roles: ['admin'] },
    { icon: Calculator, label: "لوحة المحاسب", path: "/accountant", permission: "view_accountant_dashboard", roles: ['admin', 'accountant'] },
    { icon: Wrench, label: "لوحة الفني", path: "/technician", permission: null, roles: ['technician'] },
    { icon: User, label: "بوابة العميل", path: "/portal", permission: null, roles: ['client'] },
  ],
  operations: [
    { icon: Users, label: "المشتركين", path: "/subscribers", permission: "view_subscribers", roles: ['admin', 'accountant'] },
    { icon: FileText, label: "الفواتير", path: "/invoices", permission: "view_invoices", roles: ['admin', 'accountant'] },
    { icon: FileSignature, label: "العقود", path: "/contracts", permission: "view_invoices", roles: ['admin', 'accountant'] },
    { icon: DollarSign, label: "السندات", path: "/vouchers", permission: "view_vouchers", roles: ['admin', 'accountant'] },
    { icon: Gift, label: "الخصومات والعروض", path: "/discounts", permission: null, roles: ['admin'] },
    { icon: Package, label: "الباقات", path: "/plans", permission: "view_packages", roles: ['admin'] },
  ],
  maintenance: [
    { icon: Wrench, label: "الصيانة", path: "/maintenance", permission: "view_maintenance", roles: ['admin', 'technician'] },
    { icon: Calendar, label: "الجدولة", path: "/schedule", permission: "view_schedule", roles: ['admin', 'technician'] },
    { icon: MapPin, label: "التتبع", path: "/tracking", permission: "track_employees", roles: ['admin'] },
  ],
  management: [
    { icon: Box, label: "المخزون", path: "/inventory", permission: "view_inventory", roles: ['admin', 'accountant'] },
    { icon: UserCog, label: "الموظفين", path: "/employees", permission: "manage_employees", roles: ['admin'] },
    { icon: BarChart3, label: "التقارير", path: "/reports", permission: "view_reports", roles: ['admin', 'accountant'] },
  ],
  system: [
    { icon: Shield, label: "الأمان والجلسات", path: "/security", permission: null, roles: ['admin', 'accountant', 'technician', 'client'] },
    { icon: Download, label: "استيراد البيانات", path: "/import", permission: "import_data", roles: ['admin'] },
    { icon: Bell, label: "الإشعارات", path: "/notifications", permission: null, roles: ['admin', 'accountant', 'technician', 'client'] },
    { icon: Settings, label: "الإعدادات", path: "/settings", permission: null, roles: ['admin'] },
  ],
};

export const AppSidebar = () => {
  const { isAdmin, isAccountant, roles, loading: rolesLoading } = useUserRole();
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  // عرض الـ skeleton فقط أثناء تحميل الأدوار
  const isLoading = rolesLoading || permissionsLoading;

  if (isLoading) {
    return (
      <aside className="w-64 bg-sidebar border-l border-primary/15 flex-shrink-0 overflow-y-auto h-screen sticky top-0">
        {/* الخلفية المتحركة */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-40 -left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        </div>
        <nav className="relative z-10 p-4 space-y-6">
          <div className="space-y-1">
            <h3 className="px-4 text-[10px] font-bold text-primary/50 uppercase tracking-widest mb-3 flex items-center gap-2">
              <div className="w-4 h-px bg-gradient-to-r from-primary/50 to-transparent" />
              جاري التحميل...
            </h3>
            <div className="animate-pulse space-y-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-12 bg-primary/5 rounded-xl" />
              ))}
            </div>
          </div>
        </nav>
      </aside>
    );
  }

  // إذا لم يكن هناك أدوار، عرض رسالة مناسبة
  if (roles.length === 0) {
    return (
      <aside className="w-64 bg-sidebar border-l border-primary/15 flex-shrink-0 overflow-y-auto h-screen sticky top-0">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        </div>
        <nav className="relative z-10 p-4 space-y-6">
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive text-center">لم يتم تعيين صلاحيات لحسابك</p>
            <p className="text-xs text-muted-foreground text-center mt-2">يرجى التواصل مع المدير</p>
          </div>
        </nav>
      </aside>
    );
  }

  const renderMenuItem = (item: any) => {
    const basicPaths = ['/', '/notifications', '/security'];
    const isBasicPath = basicPaths.includes(item.path);
    const hasRequiredRole = item.roles && (isBasicPath || item.roles.some((role: AppRole) => roles.includes(role)));
    
    if (!hasRequiredRole) return null;
    if (!isBasicPath && item.permission && !hasPermission(item.permission)) return null;

    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.path === "/"}
        className={({ isActive }) =>
          cn(
            "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden",
            "text-foreground/70 hover:text-primary hover:bg-primary/10",
            isActive && "bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-bold border border-primary/30"
          )
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
            )}
            <div className={cn(
              "relative z-10 p-1.5 rounded-lg transition-all duration-300",
              isActive ? "bg-primary/20 text-primary" : "text-foreground/50 group-hover:text-primary"
            )}>
              <item.icon className="h-5 w-5" />
            </div>
            <span className="relative z-10">{item.label}</span>
            {isActive && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary to-amber-400 rounded-full" />
            )}
          </>
        )}
      </NavLink>
    );
  };

  const renderSectionTitle = (title: string) => (
    <h3 className="px-4 text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-3 flex items-center gap-2">
      <div className="w-4 h-px bg-gradient-to-r from-primary/50 to-transparent" />
      {title}
    </h3>
  );

  return (
    <aside className="w-64 bg-sidebar border-l border-primary/15 flex-shrink-0 overflow-y-auto h-screen sticky top-0 custom-scrollbar">
      {/* الخلفية المتحركة */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 -left-10 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />
      </div>
      
      <nav className="relative z-10 p-4 space-y-6">
        {/* القائمة الرئيسية */}
        <div className="space-y-1">
          {renderSectionTitle("القائمة الرئيسية")}
          {menuGroups.main.map(renderMenuItem)}
        </div>

        {/* العمليات */}
        {(isAdmin || isAccountant) && (
          <div className="space-y-1">
            {renderSectionTitle("العمليات اليومية")}
            {menuGroups.operations.map(renderMenuItem)}
          </div>
        )}

        {/* الصيانة */}
        {(isAdmin || roles.includes('technician')) && (
          <div className="space-y-1">
            {renderSectionTitle("الصيانة والدعم")}
            {menuGroups.maintenance.map(renderMenuItem)}
          </div>
        )}

        {/* الإدارة */}
        {(isAdmin || isAccountant) && (
          <div className="space-y-1">
            {renderSectionTitle("الإدارة والتقارير")}
            {menuGroups.management.map(renderMenuItem)}
          </div>
        )}

        {/* النظام */}
        <div className="space-y-1">
          {renderSectionTitle("النظام")}
          {menuGroups.system.map(renderMenuItem)}
        </div>

        {/* الصلاحيات */}
        {(isAccountant || isAdmin) && (
          <div className="space-y-1">
            {renderSectionTitle("الصلاحيات")}
            <NavLink
              to="/accountant/permissions"
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden",
                  "text-foreground/70 hover:text-primary hover:bg-primary/10",
                  isActive && "bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-bold border border-primary/30"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
                  )}
                  <div className={cn(
                    "relative z-10 p-1.5 rounded-lg transition-all duration-300",
                    isActive ? "bg-primary/20 text-primary" : "text-foreground/50 group-hover:text-primary"
                  )}>
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <span className="relative z-10">صلاحياتي</span>
                  {isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary to-amber-400 rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          </div>
        )}
        
        {/* إدارة متقدمة - للمدراء فقط */}
        {isAdmin && (
          <div className="space-y-1 border-t border-primary/15 pt-4">
            {renderSectionTitle("إدارة متقدمة")}
            {[
              { path: "/agents", icon: Building2, label: "إدارة الوكلاء" },
              { path: "/accounts", icon: UserCheck, label: "إدارة الحسابات" },
              { path: "/roles", icon: Shield, label: "إدارة الأدوار" },
              { path: "/permissions", icon: Key, label: "إدارة الصلاحيات" },
            ].map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden",
                    "text-foreground/70 hover:text-primary hover:bg-primary/10",
                    isActive && "bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-bold border border-primary/30"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
                    )}
                    <div className={cn(
                      "relative z-10 p-1.5 rounded-lg transition-all duration-300",
                      isActive ? "bg-primary/20 text-primary" : "text-foreground/50 group-hover:text-primary"
                    )}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="relative z-10">{item.label}</span>
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary to-amber-400 rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        )}
        
        {/* التذييل */}
        <div className="pt-4 border-t border-primary/15">
          <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-primary/15 to-amber-500/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-foreground">ISP Pro</span>
            </div>
            <p className="text-[10px] text-muted-foreground">نظام إدارة متكامل</p>
          </div>
        </div>
      </nav>
    </aside>
  );
};
