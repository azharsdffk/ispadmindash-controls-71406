import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, History, User, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface SubscriberAuditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriberId: string;
  subscriberName: string;
}

type AuditRecord = {
  id: string;
  action: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
  changed_by: string | null;
  notes: string | null;
  profiles?: {
    full_name: string;
  };
};

export const SubscriberAuditModal = ({ 
  open, 
  onOpenChange, 
  subscriberId,
  subscriberName 
}: SubscriberAuditModalProps) => {
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && subscriberId) {
      loadAuditTrail();
    }
  }, [open, subscriberId]);

  const loadAuditTrail = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscriber_audit_trail')
        .select('*')
        .eq('subscriber_id', subscriberId)
        .order('changed_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Fetch profile names separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(r => r.changed_by).filter(Boolean))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
        
        setAuditRecords(data.map(record => ({
          ...record,
          profiles: record.changed_by ? { full_name: profileMap.get(record.changed_by) || 'غير معروف' } : undefined
        })));
      } else {
        setAuditRecords([]);
      }
    } catch (error: any) {
      console.error('Error loading audit trail:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <Badge className="bg-success">إنشاء</Badge>;
      case 'UPDATE':
        return <Badge className="bg-warning">تعديل</Badge>;
      case 'DELETE':
        return <Badge variant="destructive">حذف</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getFieldLabel = (fieldName: string | null) => {
    const labels: Record<string, string> = {
      name: 'الاسم',
      phone: 'الهاتف',
      username: 'اسم المستخدم',
      plan: 'الباقة',
      balance: 'الرصيد',
      status_comment: 'حالة المشترك',
      created: 'إنشاء',
      deleted: 'حذف',
    };
    return fieldName ? labels[fieldName] || fieldName : '-';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <History className="h-6 w-6 text-primary" />
            سجل التدقيق - {subscriberName}
          </DialogTitle>
          <DialogDescription>
            جميع التغييرات والإجراءات المتعلقة بهذا المشترك
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : auditRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد سجلات تدقيق لهذا المشترك
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الإجراء</TableHead>
                  <TableHead>الحقل</TableHead>
                  <TableHead>القيمة القديمة</TableHead>
                  <TableHead>القيمة الجديدة</TableHead>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-muted/50">
                    <TableCell>{getActionBadge(record.action)}</TableCell>
                    <TableCell className="font-medium">
                      {getFieldLabel(record.field_name)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {record.old_value || '-'}
                    </TableCell>
                    <TableCell className="text-success">
                      {record.new_value || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {record.profiles?.full_name || 'النظام'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDistanceToNow(new Date(record.changed_at), {
                          addSuffix: true,
                          locale: ar,
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
