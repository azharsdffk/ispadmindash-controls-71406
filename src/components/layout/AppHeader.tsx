import { Settings, User, LogOut } from "lucide-react";
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

interface AppHeaderProps {
  onOpenSettings: () => void;
}

export const AppHeader = ({ onOpenSettings }: AppHeaderProps) => {
  const { signOut, user } = useAuth();
  return (
    <header className="glass border-b border-white/20 sticky top-0 z-50">
      <div className="flex items-center justify-between h-16 px-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/30">
            <span className="text-2xl font-bold text-white">ISP</span>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">نظام إدارة الإنترنت</h1>
            <p className="text-xs text-muted-foreground">Internet Service Provider Management</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />

          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-primary/10 hover:scale-110 transition-all"
            onClick={onOpenSettings}
            title="الإعدادات (Alt+S)"
          >
            <Settings className="h-5 w-5 text-primary" />
          </Button>

          <DropdownMenu dir="rtl">
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-primary/10 hover:scale-110 transition-all rounded-full"
              >
                <User className="h-5 w-5 text-primary" />
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
