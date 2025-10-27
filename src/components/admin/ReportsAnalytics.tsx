import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, BarChart } from 'lucide-react';

export const ReportsAnalytics = () => {
  const reports = [
    {
      title: 'تقرير يومي بالأعطال',
      description: 'تقرير تفصيلي بجميع الأعطال المسجلة خلال اليوم',
      icon: FileText,
    },
    {
      title: 'تقرير أسبوعي بأداء الفنيين',
      description: 'تحليل أداء الفنيين خلال الأسبوع الماضي',
      icon: BarChart,
    },
    {
      title: 'تقرير شهري بالإيرادات',
      description: 'تقرير مالي شامل للإيرادات والمصاريف الشهرية',
      icon: FileText,
    },
    {
      title: 'تحليل الأعطال المتكررة',
      description: 'تحليل الأعطال المتكررة حسب المنطقة ونوع الخدمة',
      icon: BarChart,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report, index) => (
          <Card key={index} className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <report.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg mb-2">{report.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {report.description}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="h-4 w-4 ml-2" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="h-4 w-4 ml-2" />
                  Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Section */}
      <Card>
        <CardHeader>
          <CardTitle>التحليلات الذكية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <BarChart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg">تحليلات وتوقعات ذكية</p>
            <p className="text-sm mt-2">توقع المناطق الأكثر عرضة للانقطاع واقتراحات توزيع الفنيين</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
