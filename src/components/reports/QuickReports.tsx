import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Users, 
  CreditCard, 
  Wrench, 
  TrendingUp, 
  Calendar,
  Download,
  Eye,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { ReportViewModal } from './ReportViewModal';

interface QuickReportsProps {
  dateRange: { from: string; to: string };
}

export const QuickReports = ({ dateRange }: QuickReportsProps) => {
  const [selectedReport, setSelectedReport] = useState<{ id: string; title: string } | null>(null);

  const reports = [
    {
      id: 'subscribers',
      title: 'تقرير المشتركين',
      description: 'قائمة كاملة بالمشتركين وحالاتهم',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
    },
    {
      id: 'invoices',
      title: 'تقرير الفواتير',
      description: 'جميع الفواتير المصدرة والمعلقة',
      icon: FileText,
      color: 'from-amber-500 to-orange-500',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
    },
    {
      id: 'payments',
      title: 'تقرير المدفوعات',
      description: 'سجل المدفوعات وطرق الدفع',
      icon: CreditCard,
      color: 'from-emerald-500 to-green-500',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
    },
    {
      id: 'maintenance',
      title: 'تقرير الصيانة',
      description: 'تذاكر الصيانة وأداء الفنيين',
      icon: Wrench,
      color: 'from-rose-500 to-pink-500',
      iconBg: 'bg-rose-500/10',
      iconColor: 'text-rose-500',
    },
    {
      id: 'revenue',
      title: 'تقرير الإيرادات',
      description: 'تحليل الإيرادات والأرباح',
      icon: TrendingUp,
      color: 'from-violet-500 to-purple-500',
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-500',
    },
    {
      id: 'monthly',
      title: 'التقرير الشهري',
      description: 'ملخص شامل للشهر الحالي',
      icon: Calendar,
      color: 'from-indigo-500 to-blue-600',
      iconBg: 'bg-indigo-500/10',
      iconColor: 'text-indigo-500',
    },
  ];

  const handleView = (reportId: string, title: string) => {
    setSelectedReport({ id: reportId, title });
  };

  const handleDownload = (reportId: string, title: string) => {
    toast.success(`جاري تحميل ${title}...`);
  };

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="h-5 w-5 text-primary" />
            التقارير السريعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="group relative overflow-hidden rounded-xl border bg-card p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                {/* Gradient accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${report.color}`} />
                
                <div className="flex items-start gap-3">
                  <div className={`${report.iconBg} p-3 rounded-xl shrink-0`}>
                    <report.icon className={`h-6 w-6 ${report.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{report.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{report.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 h-8 text-xs"
                    onClick={() => handleView(report.id, report.title)}
                  >
                    <Eye className="h-3.5 w-3.5 ml-1" />
                    عرض
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 h-8 text-xs"
                    onClick={() => handleDownload(report.id, report.title)}
                  >
                    <Download className="h-3.5 w-3.5 ml-1" />
                    تحميل
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ReportViewModal
        open={!!selectedReport}
        onOpenChange={(open) => !open && setSelectedReport(null)}
        reportId={selectedReport?.id || ''}
        reportTitle={selectedReport?.title || ''}
        dateRange={dateRange}
      />
    </>
  );
};
