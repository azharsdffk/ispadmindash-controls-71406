import { Home, Users, FileText, Wrench, DollarSign, BarChart3, Settings, UserCog, Download, Shield, Package, LayoutDashboard, User, Bell, MapPin, Calendar, Box, Key, UserCheck, Calculator, FileCheck, FileSignature, Gift, Building2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";
import { useUserRole, type AppRole } from "@/hooks/useUserRole";
import { usePermissions } from "@/hooks/usePermissions";
import logo from "@/assets/logo.png";

const menuGroups = {
  main: [
    { icon: Home, label: "الرئيسية", path: "/", permission: null, roles: ['admin', 'accountant', 'technician', 'client'] },
    { icon: LayoutDashboard, label: "لوحة التحكم", path: "/dashboard", permission: "view_dashboard", roles: ['admin'] },
    { icon: Calculator, label: "لوحة المحاسب", path: "/accountant", permission: "view_accountant_dashboard", roles: ['admin', 'accountant'] },
    { icon: Wrench, label: "لوحة الفني", path: "/technician", permission: null, roles: ['technician'] },
    { icon: User, label: "بوابة العميل", path: "/customer", permission: null, roles: ['client'] },
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

  const isLoading = rolesLoading || permissionsLoading;

  if (isLoading) {
    return (
      <aside className="w-60 bg-sidebar flex-shrink-0 overflow-y-auto h-screen sticky top-0">
        <nav className="p-3 space-y-4">
          <div className="flex items-center gap-3 p-3">
            <div className="w-10 h-10 rounded-lg bg-sidebar-accent animate-pulse" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 bg-sidebar-accent rounded animate-pulse w-20" />
              <div className="h-3 bg-sidebar-accent rounded animate-pulse w-28" />
            </div>
          </div>
          <div className="animate-pulse space-y-1.5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-10 bg-sidebar-accent/50 rounded-lg" />
            ))}
          </div>
        </nav>
      </aside>
    );
  }

  if (roles.length === 0) {
    return (
      <aside className="w-60 bg-sidebar flex-shrink-0 overflow-y-auto h-screen sticky top-0">
        <nav className="p-3">
          <div className="p-4 rounded-lg bg-destructive/20 border border-destructive/30">
            <p className="text-sm text-destructive-foreground text-center">لم يتم تعيين صلاحيات</p>
            <p className="text-xs text-sidebar-foreground/60 text-center mt-1">يرجى التواصل مع المدير</p>
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
            "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm",
            "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            isActive && "bg-sidebar-primary text-sidebar-primary-foreground font-bold"
          )
        }
      >
        <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
        <span>{item.label}</span>
      </NavLink>
    );
  };

  const renderSectionTitle = (title: string) => (
    <h3 className="px-3 text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-wider mb-1.5 mt-1">
      {title}
    </h3>
  );

  return (
    <aside className="w-60 bg-sidebar flex-shrink-0 overflow-y-auto h-screen sticky top-0 custom-scrollbar">
      {/* Logo section */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={logo} alt="ISP Pro" className="h-10 w-10 rounded-lg object-contain bg-white/10 p-0.5" />
          <div>
            <h2 className="text-sm font-bold text-sidebar-foreground">ISP Pro</h2>
            <p className="text-[10px] text-sidebar-foreground/50">إدارة شبكات الإنترنت</p>
          </div>
        </div>
      </div>
      
      <nav className="p-3 space-y-4">
        <div className="space-y-0.5">
          {renderSectionTitle("القائمة الرئيسية")}
          {menuGroups.main.map(renderMenuItem)}
        </div>

        {(isAdmin || isAccountant) && (
          <div className="space-y-0.5">
            {renderSectionTitle("العمليات اليومية")}
            {menuGroups.operations.map(renderMenuItem)}
          </div>
        )}

        {(isAdmin || roles.includes('technician')) && (
          <div className="space-y-0.5">
            {renderSectionTitle("الصيانة والدعم")}
            {menuGroups.maintenance.map(renderMenuItem)}
          </div>
        )}

        {(isAdmin || isAccountant) && (
          <div className="space-y-0.5">
            {renderSectionTitle("الإدارة والتقارير")}
            {menuGroups.management.map(renderMenuItem)}
          </div>
        )}

        <div className="space-y-0.5">
          {renderSectionTitle("النظام")}
          {menuGroups.system.map(renderMenuItem)}
        </div>

        {(isAccountant || isAdmin) && (
          <div className="space-y-0.5">
            {renderSectionTitle("الصلاحيات")}
            <NavLink
              to="/accountant/permissions"
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm",
                  "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                  isActive && "bg-sidebar-primary text-sidebar-primary-foreground font-bold"
                )
              }
            >
              <FileCheck className="h-4.5 w-4.5 flex-shrink-0" />
              <span>صلاحياتي</span>
            </NavLink>
          </div>
        )}
        
        {isAdmin && (
          <div className="space-y-0.5 border-t border-sidebar-border pt-3">
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
                    "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm",
                    "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                    isActive && "bg-sidebar-primary text-sidebar-primary-foreground font-bold"
                  )
                }
              >
                <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}
        
        {/* Footer */}
        <div className="pt-3 border-t border-sidebar-border">
          <div className="px-3 py-2.5 rounded-lg bg-sidebar-accent/50">
            <div className="flex items-center gap-2 mb-0.5">
              <Sparkles className="h-3.5 w-3.5 text-sidebar-primary" />
              <span className="text-xs font-bold text-sidebar-foreground">ISP Pro v1.0</span>
            </div>
            <p className="text-[10px] text-sidebar-foreground/50">نظام إدارة متكامل</p>
          </div>
        </div>
      </nav>
    </aside>
  );
};
