import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Activity, User, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TechnicianHeaderProps {
  fullName: string;
  phone: string | null;
  currentLocation: { lat: number; lng: number } | null;
  openTicketsCount: number;
  completedTicketsCount: number;
  scheduledTicketsCount: number;
}

export const TechnicianHeader = ({
  fullName,
  phone,
  currentLocation,
  openTicketsCount,
  completedTicketsCount,
  scheduledTicketsCount,
}: TechnicianHeaderProps) => {
  const navigate = useNavigate();

  return (
    <Card className="glass-card shadow-glow border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-center gap-6 flex-wrap">
          <Avatar className="h-20 w-20 border-4 border-primary shadow-glow animate-float">
            <AvatarFallback className="gradient-bg text-white text-2xl font-bold">
              {fullName?.charAt(0) || 'ف'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-[200px]">
            <h2 className="text-3xl font-bold gradient-text">
              {fullName || 'الفني'}
            </h2>
            <p className="text-sm text-muted-foreground font-medium mt-2 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {phone || 'لا يوجد رقم هاتف'}
            </p>
            {currentLocation && (
              <div className="flex items-center gap-2 mt-2">
                <Activity className="h-4 w-4 text-green-500 animate-pulse" />
                <p className="text-xs text-green-600 dark:text-green-400 font-bold">
                  🟢 تتبع نشط • {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                </p>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-3 gap-2"
              onClick={() => navigate('/technician/profile')}
            >
              <QrCode className="h-4 w-4" />
              الملف الشخصي الذكي
            </Button>
          </div>
          
          <div className="flex gap-4">
            <div className="text-center p-4 glass-card rounded-2xl min-w-[90px] hover:scale-105 transition-transform">
              <p className="text-3xl font-bold text-yellow-500">{openTicketsCount}</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">جارية</p>
            </div>
            <div className="text-center p-4 glass-card rounded-2xl min-w-[90px] hover:scale-105 transition-transform">
              <p className="text-3xl font-bold text-green-500">{completedTicketsCount}</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">مكتملة</p>
            </div>
            <div className="text-center p-4 glass-card rounded-2xl min-w-[90px] hover:scale-105 transition-transform">
              <p className="text-3xl font-bold text-blue-500">{scheduledTicketsCount}</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">مجدولة</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
