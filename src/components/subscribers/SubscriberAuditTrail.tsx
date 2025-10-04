import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AuditTrailEntry {
  id: string;
  action: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
  changed_by: string | null;
  notes: string | null;
}

interface SubscriberAuditTrailProps {
  subscriberId: string;
}

export const SubscriberAuditTrail = ({ subscriberId }: SubscriberAuditTrailProps) => {
  const [auditEntries, setAuditEntries] = useState<AuditTrailEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditTrail();
  }, [subscriberId]);

  const fetchAuditTrail = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriber_audit_trail')
        .select('*')
        .eq('subscriber_id', subscriberId)
        .order('changed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAuditEntries(data || []);
    } catch (error) {
      console.error('Error fetching audit trail:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, any> = {
      INSERT: 'default',
      UPDATE: 'secondary',
      DELETE: 'destructive',
    };
    return (
      <Badge variant={variants[action] || 'outline'}>
        {action === 'INSERT' ? 'إضافة' : action === 'UPDATE' ? 'تعديل' : 'حذف'}
      </Badge>
    );
  };

  const getFieldNameArabic = (fieldName: string | null) => {
    const fieldNames: Record<string, string> = {
      name: 'الاسم',
      phone: 'الهاتف',
      username: 'اسم المستخدم',
      plan: 'الباقة',
      balance: 'الرصيد',
      status_comment: 'التعليق',
      email: 'البريد الإلكتروني',
      address: 'العنوان',
      created: 'إنشاء',
      deleted: 'حذف',
    };
    return fieldNames[fieldName || ''] || fieldName || '-';
  };

  if (loading) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="py-8 text-center text-muted-foreground">
          جاري التحميل...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          سجل التدقيق والتغييرات
        </CardTitle>
      </CardHeader>
      <CardContent>
        {auditEntries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد سجلات تدقيق لهذا المشترك
          </div>
        ) : (
          <div className="custom-scrollbar max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الإجراء</TableHead>
                  <TableHead>الحقل</TableHead>
                  <TableHead>القيمة القديمة</TableHead>
                  <TableHead>القيمة الجديدة</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditEntries.map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-muted/50">
                    <TableCell>{getActionBadge(entry.action)}</TableCell>
                    <TableCell className="font-medium">
                      {getFieldNameArabic(entry.field_name)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.old_value || '-'}
                    </TableCell>
                    <TableCell className="text-primary font-medium">
                      {entry.new_value || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(entry.changed_at), 'PPp', { locale: ar })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
