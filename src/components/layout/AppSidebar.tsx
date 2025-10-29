import { Home, Users, FileText, Wrench, DollarSign, BarChart3, Settings, UserCog, Download, Shield, Package, LayoutDashboard, User, Bell, MapPin, Calendar, Box, Key, UserCheck, Calculator, FileCheck, FileSignature, Gift } from "lucide-react";
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
    { icon: Download, label: "استيراد البيانات", path: "/import", permission: "import_data", roles: ['admin'] },
    { icon: Bell, label: "الإشعارات", path: "/notifications", permission: null, roles: ['admin', 'accountant', 'technician', 'client'] },
    { icon: Settings, label: "الإعدادات", path: "/settings", permission: null, roles: ['admin', 'accountant', 'technician', 'client'] },
  ],
};

export const AppSidebar = () => {
  const { isAdmin, isAccountant, roles } = useUserRole();
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return (
      <aside className="w-64 bg-sidebar border-l border-sidebar-border flex-shrink-0">
        <nav className="p-4 space-y-2">
          <div className="animate-pulse space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 bg-sidebar-accent rounded-lg" />
            ))}
          </div>
        </nav>
      </aside>
    );
  }

  const renderMenuItem = (item: any) => {
    const basicPaths = ['/', '/settings', '/notifications'];
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
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
            "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isActive && "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-md"
          )
        }
      >
        <item.icon className="h-5 w-5 flex-shrink-0" />
        <span>{item.label}</span>
      </NavLink>
    );
  };

  return (
    <aside className="w-64 bg-sidebar border-l border-sidebar-border flex-shrink-0 overflow-y-auto">
      <nav className="p-4 space-y-6">
        {/* القائمة الرئيسية */}
        <div className="space-y-1">
          <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            القائمة الرئيسية
          </h3>
          {menuGroups.main.map(renderMenuItem)}
        </div>

        {/* العمليات */}
        {(isAdmin || isAccountant) && (
          <div className="space-y-1">
            <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              العمليات اليومية
            </h3>
            {menuGroups.operations.map(renderMenuItem)}
          </div>
        )}

        {/* الصيانة */}
        {(isAdmin || roles.includes('technician')) && (
          <div className="space-y-1">
            <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              الصيانة والدعم
            </h3>
            {menuGroups.maintenance.map(renderMenuItem)}
          </div>
        )}

        {/* الإدارة */}
        {(isAdmin || isAccountant) && (
          <div className="space-y-1">
            <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              الإدارة والتقارير
            </h3>
            {menuGroups.management.map(renderMenuItem)}
          </div>
        )}

        {/* النظام */}
        <div className="space-y-1">
          <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            النظام
          </h3>
          {menuGroups.system.map(renderMenuItem)}
        </div>

        {/* الصلاحيات */}
        {(isAccountant || isAdmin) && (
          <div className="space-y-1">
            <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              الصلاحيات
            </h3>
            <NavLink
              to="/accountant/permissions"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive && "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-md"
                )
              }
            >
              <FileCheck className="h-5 w-5 flex-shrink-0" />
              <span>صلاحياتي</span>
            </NavLink>
          </div>
        )}
        
        {/* إدارة متقدمة - للمدراء فقط */}
        {isAdmin && (
          <div className="space-y-1 border-t border-sidebar-border pt-4">
            <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              إدارة متقدمة
            </h3>
            <NavLink
              to="/accounts"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive && "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-md"
                )
              }
            >
              <UserCheck className="h-5 w-5 flex-shrink-0" />
              <span>إدارة الحسابات</span>
            </NavLink>
            <NavLink
              to="/roles"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive && "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-md"
                )
              }
            >
              <Shield className="h-5 w-5 flex-shrink-0" />
              <span>إدارة الأدوار</span>
            </NavLink>
            <NavLink
              to="/permissions"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive && "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-md"
                )
              }
            >
              <Key className="h-5 w-5 flex-shrink-0" />
              <span>إدارة الصلاحيات</span>
            </NavLink>
          </div>
        )}
      </nav>
    </aside>
  );
};
