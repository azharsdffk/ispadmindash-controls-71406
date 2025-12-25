import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Bell, CheckCircle, AlertTriangle, Info, X, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  action_url?: string | null;
}

interface CustomerNotificationsProps {
  userId: string;
}

export function CustomerNotifications({ userId }: CustomerNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchNotifications();
    
    // Real-time subscription
    const channel = supabase
      .channel('customer-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'ticket':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diff = now.getTime() - notifDate.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'الآن';
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    return notifDate.toLocaleDateString('ar-IQ');
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayNotifications = showAll ? notifications : notifications.slice(0, 5);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-5 bg-muted rounded w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-l from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="relative">
              <Bell className="h-5 w-5 text-primary" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            الإشعارات
          </CardTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
              تحديد الكل كمقروء
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>لا توجد إشعارات</p>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[300px]">
              <div className="divide-y">
                {displayNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 transition-colors hover:bg-muted/50 ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5">{getIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-medium text-sm ${!notification.read ? 'text-primary' : ''}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              جديد
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            {notifications.length > 5 && (
              <div className="p-3 border-t">
                <Button 
                  variant="ghost" 
                  className="w-full text-sm"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? 'إظهار أقل' : `عرض الكل (${notifications.length})`}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
