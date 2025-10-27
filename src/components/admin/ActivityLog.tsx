import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Activity, User, Edit, Trash, Plus } from 'lucide-react';

export const ActivityLog = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();

    const channel = supabase
      .channel('admin-audit-logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, fetchActivities)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActivities = async () => {
    try {
      const { data } = await supabase
        .from('audit_logs')
        .select('*, profiles:user_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(50);

      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <Plus className="h-4 w-4" />;
      case 'UPDATE':
        return <Edit className="h-4 w-4" />;
      case 'DELETE':
        return <Trash className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-500/10 text-green-500';
      case 'UPDATE':
        return 'bg-blue-500/10 text-blue-500';
      case 'DELETE':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'إضافة';
      case 'UPDATE':
        return 'تعديل';
      case 'DELETE':
        return 'حذف';
      default:
        return action;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Activity className="h-6 w-6" />
          سجل الأحداث
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${getActionColor(activity.action)}`}>
                    {getActionIcon(activity.action)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={getActionColor(activity.action)}>
                        {getActionLabel(activity.action)}
                      </Badge>
                      <span className="text-sm font-medium">{activity.table_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{activity.profiles?.full_name || 'غير معروف'}</span>
                      <span>•</span>
                      <span>{new Date(activity.created_at).toLocaleString('ar-EG')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
