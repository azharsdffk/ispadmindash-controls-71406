import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, AlertCircle, Info, DollarSign, FileText, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/currency';

interface Notification {
  id: string;
  type: 'invoice' | 'payment' | 'inventory' | 'report';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  amount?: number;
}

export const AccountingNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // محاكاة الإشعارات - في التطبيق الحقيقي ستأتي من قاعدة البيانات
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'invoice',
        title: 'فاتورة متأخرة',
        message: 'الفاتورة INV-2024-123 متأخرة عن موعد الدفع بـ 5 أيام',
        severity: 'error',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        read: false,
        actionUrl: '/invoices',
        amount: 500000
      },
      {
        id: '2',
        type: 'payment',
        title: 'دفعة جديدة',
        message: 'تم استلام دفعة جديدة من المشترك أحمد محمد',
        severity: 'success',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        read: false,
        amount: 300000
      },
      {
        id: '3',
        type: 'inventory',
        title: 'تنبيه مخزون',
        message: 'كابل الشبكة CAT6 أقل من الحد الأدنى (10 وحدات متبقية)',
        severity: 'warning',
        timestamp: new Date(Date.now() - 1000 * 60 * 120),
        read: false,
        actionUrl: '/inventory'
      },
      {
        id: '4',
        type: 'report',
        title: 'تقرير شهري جاهز',
        message: 'تقرير الإيرادات والمصروفات لشهر ديسمبر جاهز للمراجعة',
        severity: 'info',
        timestamp: new Date(Date.now() - 1000 * 60 * 180),
        read: true,
        actionUrl: '/reports'
      }
    ];

    setNotifications(mockNotifications);

    // الاستماع للتحديثات الفورية
    const channel = supabase
      .channel('accounting-notifications')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'invoices' }, 
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new.status === 'overdue') {
            toast({
              title: 'فاتورة متأخرة',
              description: `الفاتورة ${payload.new.invoice_number} أصبحت متأخرة`,
              variant: 'destructive'
            });
          }
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'payments' },
        (payload) => {
          toast({
            title: 'دفعة جديدة',
            description: `تم استلام دفعة بمبلغ ${formatCurrency(payload.new.amount, 'IQD')}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'invoice': return FileText;
      case 'payment': return DollarSign;
      case 'inventory': return Package;
      case 'report': return Info;
    }
  };

  const getSeverityColor = (severity: Notification['severity']) => {
    switch (severity) {
      case 'error': return 'border-red-500 bg-red-50 dark:bg-red-950';
      case 'warning': return 'border-orange-500 bg-orange-50 dark:bg-orange-950';
      case 'success': return 'border-green-500 bg-green-50 dark:bg-green-950';
      case 'info': return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
    }
  };

  const getSeverityIcon = (severity: Notification['severity']) => {
    switch (severity) {
      case 'error': return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'info': return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast({
      title: 'تم وضع علامة قراءة',
      description: 'تم وضع علامة قراءة على جميع الإشعارات'
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <CardTitle>الإشعارات المحاسبية</CardTitle>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="rounded-full">
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            وضع علامة قراءة على الكل
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد إشعارات
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = getIcon(notification.type);
              return (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border-r-4 transition-all ${getSeverityColor(notification.severity)} ${
                    notification.read ? 'opacity-60' : ''
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getSeverityIcon(notification.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <h4 className="font-semibold text-sm">{notification.title}</h4>
                          {!notification.read && (
                            <Badge variant="default" className="text-xs">جديد</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(notification.timestamp).toLocaleTimeString('ar-IQ', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      {notification.amount && (
                        <p className="text-sm font-semibold mt-2">
                          المبلغ: {formatCurrency(notification.amount, 'IQD')}
                        </p>
                      )}
                      {notification.actionUrl && (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto mt-2"
                          onClick={() => window.location.href = notification.actionUrl!}
                        >
                          عرض التفاصيل ←
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};