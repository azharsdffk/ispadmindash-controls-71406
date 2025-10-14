import { Home, Users, FileText, Wrench, DollarSign, BarChart3, Settings, UserCog, Download, Shield, Package, LayoutDashboard, User, Bell, MapPin, Calendar, Box, Key, UserCheck, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { usePermissions } from "@/hooks/usePermissions";

const menuItems = [
  { icon: Home, label: "الرئيسية", path: "/", permission: null },
  { icon: LayoutDashboard, label: "لوحة التحكم", path: "/dashboard", permission: "view_dashboard" },
  { icon: User, label: "بوابة العميل", path: "/portal", permission: null },
  { icon: Package, label: "الباقات", path: "/plans", permission: "view_packages" },
  { icon: Bell, label: "الإشعارات", path: "/notifications", permission: null },
  { icon: MapPin, label: "التتبع", path: "/tracking", permission: "view_location_tracking" },
  { icon: Calendar, label: "الجدولة", path: "/schedule", permission: "view_schedule" },
  { icon: Box, label: "المخزون", path: "/inventory", permission: "view_inventory" },
  { icon: Users, label: "المشتركين", path: "/subscribers", permission: "view_subscribers" },
  { icon: FileText, label: "الفواتير", path: "/invoices", permission: "view_invoices" },
  { icon: DollarSign, label: "السندات", path: "/vouchers", permission: "view_vouchers" },
  { icon: Wrench, label: "الصيانة", path: "/maintenance", permission: "view_maintenance" },
  { icon: BarChart3, label: "التقارير", path: "/reports", permission: "view_reports" },
  { icon: UserCog, label: "الموظفين", path: "/employees", permission: "view_employees" },
  { icon: Download, label: "استيراد", path: "/import", permission: "import_data" },
  { icon: Settings, label: "الإعدادات", path: "/settings", permission: null },
];

export const AppSidebar = () => {
  const { isAdmin, isAccountant } = useUserRole();
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

  return (
    <aside className="w-64 bg-sidebar border-l border-sidebar-border flex-shrink-0">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          // إخفاء العناصر التي تتطلب صلاحيات غير متوفرة
          if (item.permission && !hasPermission(item.permission)) {
            return null;
          }

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
        })}
        
        {isAccountant && !isAdmin && (
          <NavLink
            to="/accountant"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive && "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-md"
              )
            }
          >
            <Calculator className="h-5 w-5 flex-shrink-0" />
            <span>لوحة المحاسب</span>
          </NavLink>
        )}
        
        {isAdmin && (
          <>
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
          </>
        )}
      </nav>
    </aside>
  );
};
