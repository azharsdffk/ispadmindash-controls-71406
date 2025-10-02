import { Home, Users, FileText, Wrench, DollarSign, BarChart3, Settings, UserCog, Download, Shield, Package, LayoutDashboard, User, Bell, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

const menuItems = [
  { icon: Home, label: "الرئيسية", path: "/" },
  { icon: LayoutDashboard, label: "لوحة التحكم المتقدمة", path: "/dashboard" },
  { icon: User, label: "بوابة العميل", path: "/portal" },
  { icon: Package, label: "إدارة الباقات", path: "/plans" },
  { icon: Bell, label: "الإشعارات", path: "/notifications" },
  { icon: MapPin, label: "تتبع الموظفين", path: "/tracking" },
  { icon: Users, label: "المشتركين", path: "/subscribers" },
  { icon: FileText, label: "الفواتير", path: "/invoices" },
  { icon: DollarSign, label: "السندات المالية", path: "/vouchers" },
  { icon: Wrench, label: "الصيانة", path: "/maintenance" },
  { icon: BarChart3, label: "التقارير", path: "/reports" },
  { icon: UserCog, label: "إدارة الموظفين", path: "/employees" },
  { icon: Download, label: "استيراد البيانات", path: "/import" },
  { icon: Settings, label: "الإعدادات", path: "/settings" },
];

export const AppSidebar = () => {
  const { isAdmin } = useUserRole();

  return (
    <aside className="w-64 bg-sidebar border-l border-sidebar-border flex-shrink-0">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
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
        ))}
        
        {isAdmin && (
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
        )}
      </nav>
    </aside>
  );
};
