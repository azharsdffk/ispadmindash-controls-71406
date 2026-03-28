import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Wrench, Bell, User, MapPin, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

interface MobileBottomNavProps {
  role: 'customer' | 'technician';
}

const customerNav: NavItem[] = [
  { icon: Home, label: 'الرئيسية', path: '/customer' },
  { icon: Wrench, label: 'طلباتي', path: '/customer?tab=tickets' },
  { icon: Bell, label: 'الإشعارات', path: '/customer?tab=notifications' },
  { icon: User, label: 'حسابي', path: '/customer?tab=profile' },
];

const technicianNav: NavItem[] = [
  { icon: Home, label: 'الرئيسية', path: '/technician' },
  { icon: Wrench, label: 'الطلبات', path: '/technician?tab=tickets' },
  { icon: MapPin, label: 'الخريطة', path: '/technician?tab=map' },
  { icon: Bell, label: 'الإشعارات', path: '/technician?tab=notifications' },
];

export const MobileBottomNav = ({ role }: MobileBottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const items = role === 'customer' ? customerNav : technicianNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const isActive = location.pathname + location.search === item.path || 
            (location.pathname === item.path.split('?')[0] && !item.path.includes('?') && !location.search);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
