import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Phone, 
  Wifi, 
  MapPin, 
  Package,
  Calendar,
  Shield,
  ExternalLink
} from 'lucide-react';

interface Subscriber {
  id: string;
  name: string;
  phone: string;
  username: string | null;
  address: string | null;
  balance: number;
}

interface Agent {
  id: string;
  name: string;
  phone: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
}

interface Contract {
  id: string;
  status: string;
  end_date: string;
  monthly_fee: number;
  package: {
    name: string;
    speed_mbps: number;
  } | null;
}

interface CustomerDataDisplayProps {
  subscriber: Subscriber;
  agent: Agent | null;
  contract: Contract | null;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: 'فعال', color: 'bg-emerald-500' },
  suspended: { label: 'معلق', color: 'bg-amber-500' },
  expired: { label: 'منتهي', color: 'bg-destructive' },
  cancelled: { label: 'ملغي', color: 'bg-muted' },
};

export function CustomerDataDisplay({ subscriber, agent, contract }: CustomerDataDisplayProps) {
  const contractStatus = contract ? statusLabels[contract.status] || statusLabels.active : null;

  const openMap = () => {
    if (!agent?.latitude || !agent?.longitude) return;
    window.open(`https://www.google.com/maps?q=${agent.latitude},${agent.longitude}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Client Info */}
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="pb-2 bg-gradient-to-l from-primary/10 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            بيانات العميل
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">الاسم</p>
              <p className="font-bold">{subscriber.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">رقم الهاتف</p>
              <p className="font-mono" dir="ltr">{subscriber.phone}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">رقم الخدمة (Service ID)</p>
              <p className="font-mono font-bold text-primary">{subscriber.username || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">الرصيد</p>
              <p className={`font-bold ${subscriber.balance < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                {subscriber.balance.toLocaleString()} د.ع
              </p>
            </div>
          </div>
          
          {subscriber.address && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <MapPin className="h-3 w-3" />
                العنوان
              </div>
              <p className="text-sm">{subscriber.address}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract & Package Info */}
      {contract && (
        <Card className="shadow-lg border-amber-500/20">
          <CardHeader className="pb-2 bg-gradient-to-l from-amber-500/10 to-transparent">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-500" />
                الاشتراك والباقة
              </span>
              {contractStatus && (
                <Badge className={`${contractStatus.color} text-white`}>
                  {contractStatus.label}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {contract.package && (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">نوع الباقة</p>
                    <p className="font-bold">{contract.package.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">السرعة</p>
                    <p className="font-bold flex items-center gap-1">
                      <Wifi className="h-4 w-4 text-primary" />
                      {contract.package.speed_mbps} Mbps
                    </p>
                  </div>
                </>
              )}
              <div>
                <p className="text-xs text-muted-foreground">الرسوم الشهرية</p>
                <p className="font-bold">{contract.monthly_fee.toLocaleString()} د.ع</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  تاريخ الانتهاء
                </p>
                <p className="font-bold">
                  {new Date(contract.end_date).toLocaleDateString('ar-IQ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Info */}
      {agent && (
        <Card className="shadow-lg border-blue-500/20">
          <CardHeader className="pb-2 bg-gradient-to-l from-blue-500/10 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              وكيل الخدمة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">{agent.name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {agent.region}
                </p>
                <p className="text-sm font-mono mt-1" dir="ltr">{agent.phone}</p>
              </div>
              {agent.latitude && agent.longitude && (
                <Button variant="outline" size="sm" onClick={openMap}>
                  <ExternalLink className="h-4 w-4 ml-1" />
                  الموقع
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
