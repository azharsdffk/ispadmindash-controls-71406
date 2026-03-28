import { useState } from "react";
import { Settings, User, LogOut, Sparkles, ArrowRight } from "lucide-react";
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
import { LocationTrackingStatus } from "@/components/location/LocationTrackingStatus";
import { useNavigate, useLocation } from "react-router-dom";
import { ProfileModal } from "@/components/modals/ProfileModal";
import { ComprehensiveSettingsModal } from "@/components/settings/ComprehensiveSettingsModal";
import logo from "@/assets/logo.png";

interface AppHeaderProps {
  onOpenSettings?: () => void;
}

export const AppHeader = ({ onOpenSettings }: AppHeaderProps) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const showBackButton = location.pathname !== "/" && location.pathname !== "/dashboard";
  
  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };
  
  return (
    <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoBack}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-lg"
              title="رجوع"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          )}
          <img src={logo} alt="ISP Pro" className="h-9 w-9 rounded-lg object-contain bg-white/10 p-0.5" />
          <div>
            <h1 className="text-base font-bold text-primary-foreground">ISP Pro</h1>
            <p className="text-[10px] text-primary-foreground/70">نظام إدارة شبكات الإنترنت</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-primary-foreground/10">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-primary-foreground/80">متصل</span>
          </div>
          
          <LocationTrackingStatus />
          <NotificationBell />

          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-lg"
            onClick={() => setSettingsOpen(true)}
            title="الإعدادات"
          >
            <Settings className="h-5 w-5" />
          </Button>

          <DropdownMenu dir="rtl">
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-lg"
              >
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <span>حسابي</span>
                  </div>
                  {user?.email && (
                    <div className="text-xs font-normal text-muted-foreground">{user.email}</div>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer">
                <User className="ml-2 h-4 w-4" />
                الملف الشخصي
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="cursor-pointer">
                <Settings className="ml-2 h-4 w-4" />
                الإعدادات
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                <LogOut className="ml-2 h-4 w-4" />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
      <ComprehensiveSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  );
};
