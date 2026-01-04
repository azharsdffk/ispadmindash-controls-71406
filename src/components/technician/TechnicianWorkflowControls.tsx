import { useState } from 'react';
import { 
  Car, MapPin, Wrench, CheckCircle, Clock, 
  Navigation, Phone, MessageCircle, Camera,
  Play, StopCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTechnicianTracking } from '@/hooks/useTechnicianTracking';
import { cn } from '@/lib/utils';

interface TechnicianWorkflowControlsProps {
  technicianId: string;
  ticket: {
    id: string;
    ticket_number: string;
    status: string;
    subscriber: {
      name: string;
      phone: string;
      address: string | null;
      latitude: number | null;
      longitude: number | null;
    };
  };
  onStatusChange?: () => void;
}

export function TechnicianWorkflowControls({
  technicianId,
  ticket,
  onStatusChange,
}: TechnicianWorkflowControlsProps) {
  const {
    currentLocation,
    isTracking,
    status,
    startJourney,
    checkIn,
    startWork,
    completeWork,
    stopTracking,
  } = useTechnicianTracking(technicianId);

  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState(30);

  const handleStartJourney = async () => {
    setIsLoading(true);
    await startJourney(ticket.id, etaMinutes);
    onStatusChange?.();
    setIsLoading(false);
  };

  const handleCheckIn = async () => {
    setIsLoading(true);
    await checkIn(ticket.id);
    onStatusChange?.();
    setIsLoading(false);
  };

  const handleStartWork = async () => {
    setIsLoading(true);
    await startWork(ticket.id);
    onStatusChange?.();
    setIsLoading(false);
  };

  const handleCompleteWork = async () => {
    setIsLoading(true);
    await completeWork(ticket.id, completionNotes);
    setShowCompleteDialog(false);
    onStatusChange?.();
    setIsLoading(false);
  };

  const getNavigationUrl = () => {
    if (!ticket.subscriber.latitude || !ticket.subscriber.longitude) return '#';
    return `https://www.google.com/maps/dir/?api=1&destination=${ticket.subscriber.latitude},${ticket.subscriber.longitude}`;
  };

  const getStatusConfig = () => {
    switch (ticket.status) {
      case 'tech_assigned':
        return {
          label: 'تم تعيينك',
          color: 'bg-indigo-500',
          icon: Wrench,
          nextAction: 'ابدأ الرحلة',
        };
      case 'tech_on_the_way':
        return {
          label: 'في الطريق',
          color: 'bg-orange-500',
          icon: Car,
          nextAction: 'تسجيل الوصول',
        };
      case 'tech_arrived':
        return {
          label: 'وصلت للموقع',
          color: 'bg-cyan-500',
          icon: MapPin,
          nextAction: 'بدء العمل',
        };
      case 'in_progress':
        return {
          label: 'جاري العمل',
          color: 'bg-purple-500',
          icon: Wrench,
          nextAction: 'إنهاء الصيانة',
        };
      case 'resolved':
        return {
          label: 'مكتملة',
          color: 'bg-green-500',
          icon: CheckCircle,
          nextAction: null,
        };
      default:
        return {
          label: 'جديد',
          color: 'bg-gray-500',
          icon: Clock,
          nextAction: 'ابدأ الرحلة',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <StatusIcon className="h-5 w-5" />
              أدوات التحكم
            </CardTitle>
            <Badge className={cn('text-white', statusConfig.color)}>
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Customer Info */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="font-semibold">{ticket.subscriber.name}</p>
            {ticket.subscriber.address && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {ticket.subscriber.address}
              </p>
            )}
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" asChild>
                <a href={`tel:${ticket.subscriber.phone}`}>
                  <Phone className="h-4 w-4 ml-1" />
                  اتصال
                </a>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a 
                  href={`https://wa.me/${ticket.subscriber.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4 ml-1" />
                  واتساب
                </a>
              </Button>
            </div>
          </div>

          {/* Location Tracking Status */}
          {isTracking && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-600">التتبع نشط</span>
              </div>
              {currentLocation && (
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </p>
              )}
            </div>
          )}

          {/* Workflow Buttons */}
          <div className="space-y-3">
            {ticket.status === 'tech_assigned' && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm">الوقت المتوقع:</label>
                  <select 
                    value={etaMinutes}
                    onChange={(e) => setEtaMinutes(Number(e.target.value))}
                    className="rounded-md border bg-background px-3 py-1 text-sm"
                  >
                    <option value={15}>15 دقيقة</option>
                    <option value={30}>30 دقيقة</option>
                    <option value={45}>45 دقيقة</option>
                    <option value={60}>ساعة</option>
                    <option value={90}>ساعة ونصف</option>
                    <option value={120}>ساعتين</option>
                  </select>
                </div>
                <Button 
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  onClick={handleStartJourney}
                  disabled={isLoading}
                >
                  <Car className="h-4 w-4 ml-2" />
                  ابدأ الرحلة للعميل
                </Button>
              </>
            )}

            {ticket.status === 'tech_on_the_way' && (
              <>
                <Button 
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <a href={getNavigationUrl()} target="_blank" rel="noopener noreferrer">
                    <Navigation className="h-4 w-4 ml-2" />
                    فتح الملاحة
                  </a>
                </Button>
                <Button 
                  className="w-full bg-cyan-500 hover:bg-cyan-600"
                  onClick={handleCheckIn}
                  disabled={isLoading}
                >
                  <MapPin className="h-4 w-4 ml-2" />
                  وصلت إلى الموقع
                </Button>
              </>
            )}

            {ticket.status === 'tech_arrived' && (
              <Button 
                className="w-full bg-purple-500 hover:bg-purple-600"
                onClick={handleStartWork}
                disabled={isLoading}
              >
                <Play className="h-4 w-4 ml-2" />
                بدء العمل
              </Button>
            )}

            {ticket.status === 'in_progress' && (
              <Button 
                className="w-full bg-green-500 hover:bg-green-600"
                onClick={() => setShowCompleteDialog(true)}
                disabled={isLoading}
              >
                <CheckCircle className="h-4 w-4 ml-2" />
                إنهاء الصيانة
              </Button>
            )}

            {ticket.status === 'resolved' && (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="font-semibold text-green-600">تم إنهاء الصيانة</p>
              </div>
            )}

            {isTracking && ticket.status !== 'resolved' && (
              <Button 
                variant="destructive"
                size="sm"
                onClick={stopTracking}
                className="w-full"
              >
                <StopCircle className="h-4 w-4 ml-2" />
                إيقاف التتبع
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Complete Work Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إنهاء الصيانة</DialogTitle>
            <DialogDescription>
              أضف ملاحظاتك وأكمل العمل
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">ملاحظات الصيانة</label>
              <Textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="اكتب ما تم إنجازه..."
                className="mt-1"
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" disabled>
                <Camera className="h-4 w-4 ml-2" />
                صورة قبل
              </Button>
              <Button variant="outline" className="flex-1" disabled>
                <Camera className="h-4 w-4 ml-2" />
                صورة بعد
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              إلغاء
            </Button>
            <Button 
              className="bg-green-500 hover:bg-green-600"
              onClick={handleCompleteWork}
              disabled={isLoading}
            >
              <CheckCircle className="h-4 w-4 ml-2" />
              تأكيد الإنهاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
