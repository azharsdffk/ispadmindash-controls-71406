import { Settings, Bell, User, LogOut } from "lucide-react";
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

interface AppHeaderProps {
  onOpenSettings: () => void;
}

export const AppHeader = ({ onOpenSettings }: AppHeaderProps) => {
  const { signOut, user } = useAuth();
  return (
    <header className="h-16 border-b bg-gradient-to-r from-primary to-primary-hover text-primary-foreground shadow-md sticky top-0 z-50">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <span className="text-2xl font-bold">ISP</span>
          </div>
          <div>
            <h1 className="text-xl font-bold">نظام إدارة الإنترنت</h1>
            <p className="text-xs text-primary-foreground/80">Internet Service Provider Management</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-white/20 relative"
            title="الإشعارات"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-white/20"
            onClick={onOpenSettings}
            title="الإعدادات (Alt+S)"
          >
            <Settings className="h-5 w-5" />
          </Button>

          <DropdownMenu dir="rtl">
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-white/20 rounded-full"
              >
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <div>حسابي</div>
                  {user?.email && (
                    <div className="text-xs font-normal text-muted-foreground">{user.email}</div>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>الملف الشخصي</DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenSettings}>الإعدادات</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive">
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
