import { CheckCircle, Clock, Loader2, User, Wrench, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TicketTimelineProps {
  ticket: {
    id: string;
    ticket_number: string;
    status: string;
    issue_type: string | null;
    issue_description: string;
    created_at: string;
    scheduled_date?: string | null;
    resolved_at?: string | null;
    notes?: string | null;
  };
}

const statusSteps = [
  { key: 'open', label: 'تم الاستلام', icon: AlertCircle, color: 'text-yellow-500' },
  { key: 'in_progress', label: 'قيد المعالجة', icon: Wrench, color: 'text-blue-500' },
  { key: 'scheduled', label: 'تم الجدولة', icon: Clock, color: 'text-purple-500' },
  { key: 'resolved', label: 'تم الحل', icon: CheckCircle, color: 'text-green-500' },
];

export function TicketTimeline({ ticket }: TicketTimelineProps) {
  const getCurrentStep = () => {
    switch (ticket.status) {
      case 'open': return 0;
      case 'in_progress': return 1;
      case 'scheduled': return 2;
      case 'resolved':
      case 'closed': return 3;
      default: return 0;
    }
  };

  const currentStep = getCurrentStep();

  const getIssueLabel = (issueType: string | null) => {
    const issues: Record<string, string> = {
      'no_internet': 'انقطاع الخدمة',
      'slow_internet': 'انترنت بطيء',
      'intermittent': 'تقطعات متكررة',
      'router_issue': 'مشكلة بالراوتر',
      'emergency': '🚨 طوارئ',
    };
    return issueType ? issues[issueType] || issueType : '-';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-IQ', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardHeader className="pb-3 bg-gradient-to-l from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">{ticket.ticket_number}</span>
          </CardTitle>
          <Badge 
            variant={ticket.status === 'resolved' || ticket.status === 'closed' ? 'default' : 'secondary'}
            className={ticket.status === 'resolved' || ticket.status === 'closed' ? 'bg-green-500' : ''}
          >
            {getIssueLabel(ticket.issue_type)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Timeline */}
        <div className="relative">
          {/* Progress Line Background */}
          <div className="absolute right-3 top-4 bottom-4 w-0.5 bg-muted rounded-full" />
          
          {/* Progress Line Active */}
          <div 
            className="absolute right-3 top-4 w-0.5 bg-primary rounded-full transition-all duration-500"
            style={{ height: `${(currentStep / (statusSteps.length - 1)) * 100}%`, maxHeight: 'calc(100% - 2rem)' }}
          />

          <div className="space-y-4">
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentStep;
              const isCurrent = index === currentStep;
              const StepIcon = step.icon;

              return (
                <div key={step.key} className="flex items-start gap-4 relative">
                  <div 
                    className={`
                      w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all duration-300
                      ${isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                      ${isCurrent ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                    `}
                  >
                    {isCurrent && ticket.status !== 'resolved' && ticket.status !== 'closed' ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <StepIcon className="h-3 w-3" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className={`font-medium text-sm ${isCompleted ? '' : 'text-muted-foreground'}`}>
                      {step.label}
                    </p>
                    {index === 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(ticket.created_at)}
                      </p>
                    )}
                    {index === 2 && ticket.scheduled_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        موعد الزيارة: {formatDate(ticket.scheduled_date)}
                      </p>
                    )}
                    {index === 3 && ticket.resolved_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(ticket.resolved_at)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        {ticket.notes && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">ملاحظات الفني:</p>
            <p className="text-sm">{ticket.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
