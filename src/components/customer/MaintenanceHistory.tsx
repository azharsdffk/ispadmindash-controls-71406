import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  History, 
  Calendar, 
  User, 
  Wrench,
  CheckCircle,
  Image as ImageIcon
} from 'lucide-react';

interface MaintenanceRecord {
  id: string;
  ticket_number: string;
  issue_type: string | null;
  issue_description: string;
  resolved_at: string | null;
  notes: string | null;
  technician_name?: string;
}

interface MaintenanceHistoryProps {
  records: MaintenanceRecord[];
}

const issueTypeLabels: Record<string, string> = {
  no_internet: 'انقطاع الإنترنت',
  slow_internet: 'إنترنت بطيء',
  intermittent: 'تقطعات متكررة',
  router_issue: 'مشكلة بالراوتر',
  billing: 'مشكلة بالفواتير',
  upgrade: 'طلب ترقية',
  emergency: 'طوارئ',
  other: 'أخرى',
};

export function MaintenanceHistory({ records }: MaintenanceHistoryProps) {
  const resolvedRecords = records.filter(r => r.resolved_at);

  if (resolvedRecords.length === 0) {
    return (
      <Card className="shadow-md">
        <CardContent className="py-12 text-center text-muted-foreground">
          <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>لا يوجد سجل صيانة سابق</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3 bg-gradient-to-l from-primary/10 to-transparent">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            سجل الصيانة
          </span>
          <Badge variant="secondary">{resolvedRecords.length} عملية</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-4 space-y-4">
            {resolvedRecords.map((record) => (
              <Card key={record.id} className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-mono text-sm text-primary">{record.ticket_number}</p>
                        <Badge variant="outline" className="mt-1">
                          {issueTypeLabels[record.issue_type || ''] || record.issue_type || 'غير محدد'}
                        </Badge>
                      </div>
                    </div>
                    {record.resolved_at && (
                      <div className="text-left">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          تاريخ الزيارة
                        </div>
                        <p className="text-sm font-medium">
                          {new Date(record.resolved_at).toLocaleDateString('ar-IQ')}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    {record.technician_name && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">الفني:</span>
                        <span className="font-medium">{record.technician_name}</span>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-2">
                      <Wrench className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground">الإجراء:</span>
                      <span>{record.issue_description}</span>
                    </div>

                    {record.notes && (
                      <div className="mt-2 p-2 bg-background/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">ملاحظات الفني:</p>
                        <p className="text-sm">{record.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
