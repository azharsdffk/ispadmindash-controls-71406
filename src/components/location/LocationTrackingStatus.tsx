import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  MapPin, 
  Navigation2, 
  Signal, 
  SignalZero, 
  Settings, 
  Clock,
  Shield,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useAutoLocationTracking } from '@/hooks/useAutoLocationTracking';
import { useAuth } from '@/contexts/AuthContext';

export const LocationTrackingStatus = () => {
  const { user, roles } = useAuth();
  const primaryRole = roles[0] || null;
  
  const {
    isTracking,
    currentLocation,
    lastUpdate,
    error,
    permissionStatus,
    isAutoTrackingEnabled,
    setAutoTrackingEnabled,
    requestPermission,
    startTracking,
    stopTracking,
  } = useAutoLocationTracking(user?.id || null, primaryRole);

  const [settingsOpen, setSettingsOpen] = useState(false);

  // Don't show for non-trackable roles
  if (!user || !['technician', 'admin', 'super_admin', 'technical_manager'].includes(primaryRole || '')) {
    return null;
  }

  const getStatusColor = () => {
    if (error) return 'text-red-400';
    if (isTracking && currentLocation) return 'text-green-400';
    if (isTracking) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getStatusText = () => {
    if (error) return 'خطأ';
    if (isTracking && currentLocation) return 'نشط';
    if (isTracking) return 'جاري التحديد...';
    if (permissionStatus === 'denied') return 'محظور';
    return 'متوقف';
  };

  const StatusIcon = isTracking ? Signal : SignalZero;

  return (
    <TooltipProvider>
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`relative h-9 gap-2 ${getStatusColor()}`}
              >
                <div className="relative">
                  <StatusIcon className="h-4 w-4" />
                  {isTracking && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
                <span className="hidden sm:inline text-xs">{getStatusText()}</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>حالة تتبع الموقع: {getStatusText()}</p>
          </TooltipContent>
        </Tooltip>

        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              إعدادات تتبع الموقع
            </DialogTitle>
            <DialogDescription>
              تحكم في إعدادات تتبع موقعك التلقائي
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Status Card */}
            <Card className={`${isTracking ? 'border-green-500/30 bg-green-500/5' : 'border-gray-500/30'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isTracking ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                      <Navigation2 className={`h-5 w-5 ${isTracking ? 'text-green-500' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className="font-medium">حالة التتبع</p>
                      <p className="text-sm text-muted-foreground">
                        {isTracking ? 'يتم تتبع موقعك الآن' : 'التتبع متوقف'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={isTracking ? 'default' : 'secondary'} className={isTracking ? 'bg-green-500' : ''}>
                    {isTracking ? 'نشط' : 'متوقف'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Current Location */}
            {currentLocation && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    موقعك الحالي
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الإحداثيات:</span>
                    <span className="font-mono text-xs">
                      {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                    </span>
                  </div>
                  {currentLocation.accuracy && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الدقة:</span>
                      <span>{Math.round(currentLocation.accuracy)} متر</span>
                    </div>
                  )}
                  {lastUpdate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">آخر تحديث:</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {lastUpdate.toLocaleTimeString('ar-IQ')}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Permission Status */}
            {permissionStatus === 'denied' && (
              <Card className="border-red-500/30 bg-red-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium text-red-500">إذن الموقع مرفوض</p>
                      <p className="text-sm text-muted-foreground">
                        يرجى السماح بالوصول للموقع من إعدادات المتصفح
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full border-red-500/50 text-red-500 hover:bg-red-500/10"
                    onClick={requestPermission}
                  >
                    طلب الإذن مرة أخرى
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <Card className="border-yellow-500/30 bg-yellow-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="font-medium text-yellow-500">تحذير</p>
                      <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Auto Tracking Toggle */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  الإعدادات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">التتبع التلقائي</p>
                    <p className="text-xs text-muted-foreground">
                      تفعيل تتبع الموقع عند تسجيل الدخول
                    </p>
                  </div>
                  <Switch
                    checked={isAutoTrackingEnabled}
                    onCheckedChange={setAutoTrackingEnabled}
                  />
                </div>

                <div className="border-t pt-4">
                  {isTracking ? (
                    <Button
                      variant="outline"
                      className="w-full border-red-500/50 text-red-500 hover:bg-red-500/10"
                      onClick={stopTracking}
                    >
                      <SignalZero className="h-4 w-4 ml-2" />
                      إيقاف التتبع
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={startTracking}
                      disabled={permissionStatus === 'denied'}
                    >
                      <Signal className="h-4 w-4 ml-2" />
                      بدء التتبع
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Privacy Notice */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-500/5 p-3 rounded-lg border border-blue-500/20">
              <Shield className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <p>
                يتم استخدام بيانات موقعك فقط لأغراض العمل ومتابعة المهام.
                يمكنك إيقاف التتبع في أي وقت.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};