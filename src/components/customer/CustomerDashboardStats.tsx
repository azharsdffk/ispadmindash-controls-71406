import { Card, CardContent } from '@/components/ui/card';
import { 
  Ticket, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  Bell
} from 'lucide-react';

interface DashboardStatsProps {
  openTickets: number;
  completedTickets: number;
  pendingInvoices: number;
  unreadNotifications: number;
  lastServiceStatus: string;
  lastMaintenanceDate: string | null;
}

export function CustomerDashboardStats({
  openTickets,
  completedTickets,
  pendingInvoices,
  unreadNotifications,
  lastServiceStatus,
  lastMaintenanceDate
}: DashboardStatsProps) {
  const stats = [
    {
      title: 'تكتات مفتوحة',
      value: openTickets,
      icon: Ticket,
      color: 'text-amber-500',
      bgColor: 'from-amber-500/20 to-amber-500/5',
      borderColor: 'border-amber-500/30'
    },
    {
      title: 'تكتات مكتملة',
      value: completedTickets,
      icon: CheckCircle,
      color: 'text-emerald-500',
      bgColor: 'from-emerald-500/20 to-emerald-500/5',
      borderColor: 'border-emerald-500/30'
    },
    {
      title: 'فواتير معلقة',
      value: pendingInvoices,
      icon: FileText,
      color: 'text-rose-500',
      bgColor: 'from-rose-500/20 to-rose-500/5',
      borderColor: 'border-rose-500/30'
    },
    {
      title: 'إشعارات جديدة',
      value: unreadNotifications,
      icon: Bell,
      color: 'text-primary',
      bgColor: 'from-primary/20 to-primary/5',
      borderColor: 'border-primary/30'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => (
          <Card 
            key={index} 
            className={`border ${stat.borderColor} bg-gradient-to-br ${stat.bgColor} backdrop-blur shadow-lg hover:scale-[1.02] transition-transform`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-background/50 flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Last Service Status & Maintenance */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/50 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">آخر حالة خدمة</span>
            </div>
            <p className="font-bold text-sm">
              {lastServiceStatus === 'active' ? '✅ فعال' : 
               lastServiceStatus === 'suspended' ? '⚠️ معلق' : 
               lastServiceStatus === 'expired' ? '❌ منتهي' : 'غير محدد'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">آخر طلب صيانة</span>
            </div>
            <p className="font-bold text-sm">
              {lastMaintenanceDate 
                ? new Date(lastMaintenanceDate).toLocaleDateString('ar-IQ')
                : 'لا يوجد'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
