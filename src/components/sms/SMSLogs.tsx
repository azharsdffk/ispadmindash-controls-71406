import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export const SMSLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('sms_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching SMS logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      pending: { label: 'قيد الانتظار', variant: 'secondary' },
      sent: { label: 'تم الإرسال', variant: 'default' },
      delivered: { label: 'تم التسليم', variant: 'default' },
      failed: { label: 'فشل', variant: 'destructive' },
      queued: { label: 'في الطابور', variant: 'secondary' }
    };

    const { label, variant } = statusMap[status] || statusMap.pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return <Card><CardContent className="p-6">جاري التحميل...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>سجل الرسائل المرسلة</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد رسائل مرسلة
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المستلم</TableHead>
                <TableHead>رقم الهاتف</TableHead>
                <TableHead>الرسالة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الإرسال</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.recipient_name || '-'}</TableCell>
                  <TableCell dir="ltr" className="text-right">{log.recipient_phone}</TableCell>
                  <TableCell className="max-w-md truncate">{log.message}</TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell>
                    {log.sent_at 
                      ? format(new Date(log.sent_at), 'dd/MM/yyyy HH:mm', { locale: ar })
                      : '-'
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
