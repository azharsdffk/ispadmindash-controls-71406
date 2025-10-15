import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { FileText, Download, Calendar, TrendingUp, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const AdvancedReports = () => {
  const { toast } = useToast();

  const reports = [
    {
      id: 1,
      title: 'قائمة الدخل',
      description: 'تقرير شامل للإيرادات والمصروفات',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950'
    },
    {
      id: 2,
      title: 'الميزانية العمومية',
      description: 'تقرير الأصول والخصوم وحقوق الملكية',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950'
    },
    {
      id: 3,
      title: 'قائمة التدفقات النقدية',
      description: 'تحليل التدفقات النقدية الداخلة والخارجة',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950'
    },
    {
      id: 4,
      title: 'تقرير الأرباح والخسائر',
      description: 'تحليل مفصل للأرباح والخسائر الشهرية',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950'
    }
  ];

  const handleGenerateReport = (reportTitle: string) => {
    toast({
      title: 'جاري إنشاء التقرير',
      description: `يتم الآن إنشاء تقرير ${reportTitle}...`
    });
  };

  const handleExportPDF = () => {
    toast({
      title: 'تصدير PDF',
      description: 'سيتم تصدير التقرير بصيغة PDF قريباً'
    });
  };

  const handleExportExcel = () => {
    toast({
      title: 'تصدير Excel',
      description: 'سيتم تصدير التقرير بصيغة Excel قريباً'
    });
  };

  return (
    <div className="space-y-6">
      {/* التقارير المالية الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className={report.bgColor}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${report.color}`} />
                  {report.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{report.description}</p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleGenerateReport(report.title)}
                  >
                    <FileText className="h-4 w-4 ml-2" />
                    عرض التقرير
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleExportPDF}
                  >
                    <Download className="h-4 w-4 ml-2" />
                    PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleExportExcel}
                  >
                    <Download className="h-4 w-4 ml-2" />
                    Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* قائمة الدخل المفصلة */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>قائمة الدخل - نموذج توضيحي</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Printer className="h-4 w-4 ml-2" />
              طباعة
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="h-4 w-4 ml-2" />
              تصدير
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* الإيرادات */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                الإيرادات
                <Badge variant="default">Revenue</Badge>
              </h3>
              <div className="space-y-2 pr-4">
                <div className="flex justify-between text-sm">
                  <span>إيرادات الاشتراكات</span>
                  <span className="font-medium">{formatCurrency(45000000, 'IQD')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>إيرادات التركيب</span>
                  <span className="font-medium">{formatCurrency(8000000, 'IQD')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>إيرادات الصيانة</span>
                  <span className="font-medium">{formatCurrency(5000000, 'IQD')}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>إجمالي الإيرادات</span>
                  <span className="text-green-600">{formatCurrency(58000000, 'IQD')}</span>
                </div>
              </div>
            </div>

            {/* تكلفة الخدمات */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                تكلفة الخدمات
                <Badge variant="secondary">Cost of Services</Badge>
              </h3>
              <div className="space-y-2 pr-4">
                <div className="flex justify-between text-sm">
                  <span>تكلفة المعدات والأجهزة</span>
                  <span className="font-medium">{formatCurrency(12000000, 'IQD')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>تكلفة الصيانة</span>
                  <span className="font-medium">{formatCurrency(5000000, 'IQD')}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>إجمالي تكلفة الخدمات</span>
                  <span className="text-red-600">{formatCurrency(17000000, 'IQD')}</span>
                </div>
              </div>
            </div>

            {/* إجمالي الربح */}
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
              <div className="flex justify-between font-bold text-lg">
                <span>إجمالي الربح</span>
                <span className="text-green-600">{formatCurrency(41000000, 'IQD')}</span>
              </div>
            </div>

            {/* المصروفات التشغيلية */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                المصروفات التشغيلية
                <Badge variant="outline">Operating Expenses</Badge>
              </h3>
              <div className="space-y-2 pr-4">
                <div className="flex justify-between text-sm">
                  <span>الرواتب والأجور</span>
                  <span className="font-medium">{formatCurrency(15000000, 'IQD')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>الإيجارات</span>
                  <span className="font-medium">{formatCurrency(3000000, 'IQD')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>المصاريف الإدارية</span>
                  <span className="font-medium">{formatCurrency(4000000, 'IQD')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>مصاريف التسويق</span>
                  <span className="font-medium">{formatCurrency(2000000, 'IQD')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>الكهرباء والماء</span>
                  <span className="font-medium">{formatCurrency(1500000, 'IQD')}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>إجمالي المصروفات التشغيلية</span>
                  <span className="text-red-600">{formatCurrency(25500000, 'IQD')}</span>
                </div>
              </div>
            </div>

            {/* صافي الربح */}
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <div className="flex justify-between font-bold text-xl">
                <span>صافي الربح</span>
                <span className="text-blue-600">{formatCurrency(15500000, 'IQD')}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                هامش الربح الصافي: 26.7%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};