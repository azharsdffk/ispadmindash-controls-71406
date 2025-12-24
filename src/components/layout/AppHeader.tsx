import { Settings, User, LogOut, Wifi, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useNavigate, useLocation } from "react-router-dom";

interface AppHeaderProps {
  onOpenSettings?: () => void;
}

export const AppHeader = ({ onOpenSettings }: AppHeaderProps) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // تحديد ما إذا كان يجب إظهار زر الرجوع (ليس في الصفحة الرئيسية)
  const showBackButton = location.pathname !== "/" && location.pathname !== "/dashboard";
  
  const handleGoBack = () => {
    // إذا كان هناك تاريخ للتنقل، ارجع للخلف، وإلا اذهب للرئيسية
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };
  
  return (
    <header className="sticky top-0 z-50 bg-card/60 backdrop-blur-2xl border-b border-white/[0.06]">
      {/* الخط المتوهج العلوي */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="flex items-center justify-between h-16 px-6 animate-fade-in">
        <div className="flex items-center gap-4">
          {/* زر الرجوع */}
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoBack}
              className="hover:bg-white/[0.06] hover:scale-110 transition-all rounded-xl border border-transparent hover:border-white/[0.08] group"
              title="رجوع"
            >
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Button>
          )}
          {/* الشعار */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 via-violet-600 to-cyan-600 flex items-center justify-center shadow-lg">
              <Wifi className="h-6 w-6 text-white" />
            </div>
          </div>
          
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              نظام ISP Pro
            </h1>
            <p className="text-xs text-muted-foreground">منصة إدارة شبكات الإنترنت</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* مؤشر الحالة */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-success">متصل</span>
          </div>
          
          <NotificationBell />

          {onOpenSettings && (
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-white/[0.06] hover:scale-110 transition-all rounded-xl border border-transparent hover:border-white/[0.08]"
              onClick={onOpenSettings}
              title="الإعدادات (Alt+S)"
            >
              <Settings className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
            </Button>
          )}

          <DropdownMenu dir="rtl">
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-white/[0.06] hover:scale-110 transition-all rounded-xl border border-transparent hover:border-white/[0.08] overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <User className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors relative z-10" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-xl border-white/[0.08]">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>حسابي</span>
                  </div>
                  {user?.email && (
                    <div className="text-xs font-normal text-muted-foreground">{user.email}</div>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/[0.06]" />
              <DropdownMenuItem className="hover:bg-white/[0.06] cursor-pointer">
                <User className="ml-2 h-4 w-4" />
                الملف الشخصي
              </DropdownMenuItem>
              {onOpenSettings && (
                <DropdownMenuItem onClick={onOpenSettings} className="hover:bg-white/[0.06] cursor-pointer">
                  <Settings className="ml-2 h-4 w-4" />
                  الإعدادات
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-white/[0.06]" />
              <DropdownMenuItem 
                onClick={signOut} 
                className="text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                <LogOut className="ml-2 h-4 w-4" />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
