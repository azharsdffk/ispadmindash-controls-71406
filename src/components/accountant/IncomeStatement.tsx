import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  FileDown, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent,
  BarChart3,
  PieChart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  FileSpreadsheet,
  Target,
  Wallet,
  CreditCard,
  Building2,
  Users,
  Zap,
  TrendingUp as Growth,
  Calculator
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export const IncomeStatement = () => {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedView, setSelectedView] = useState('detailed');

  // بيانات قائمة الدخل التفصيلية
  const incomeData = {
    // إيرادات التشغيل الرئيسية
    operatingRevenues: [
      { account: 'إيرادات الاشتراكات الشهرية', amount: 45000000, budget: 48000000, lastYear: 38000000, category: 'اشتراكات' },
      { account: 'إيرادات التركيبات الجديدة', amount: 8500000, budget: 10000000, lastYear: 6500000, category: 'تركيبات' },
      { account: 'إيرادات خدمات الصيانة', amount: 3200000, budget: 3000000, lastYear: 2800000, category: 'صيانة' },
      { account: 'إيرادات ترقية الباقات', amount: 2100000, budget: 2500000, lastYear: 1500000, category: 'ترقيات' },
      { account: 'إيرادات رسوم الاستئناف', amount: 850000, budget: 800000, lastYear: 700000, category: 'رسوم' },
    ],
    // إيرادات أخرى
    otherRevenues: [
      { account: 'إيرادات فوائد البنك', amount: 450000, budget: 400000, lastYear: 380000 },
      { account: 'إيرادات بيع معدات', amount: 320000, budget: 200000, lastYear: 150000 },
      { account: 'إيرادات متنوعة', amount: 180000, budget: 150000, lastYear: 120000 },
    ],
    // تكلفة المبيعات والخدمات
    costOfSales: [
      { account: 'تكلفة خدمة الإنترنت (ISP)', amount: 12000000, budget: 11500000, lastYear: 10000000, category: 'تكاليف مباشرة' },
      { account: 'تكلفة المعدات المباعة', amount: 4500000, budget: 5000000, lastYear: 3800000, category: 'تكاليف مباشرة' },
      { account: 'تكلفة التركيب والتمديد', amount: 2800000, budget: 3000000, lastYear: 2200000, category: 'تكاليف مباشرة' },
      { account: 'تكلفة الصيانة المباشرة', amount: 1200000, budget: 1500000, lastYear: 1000000, category: 'تكاليف مباشرة' },
    ],
    // المصاريف التشغيلية
    operatingExpenses: {
      personnel: [
        { account: 'رواتب الموظفين', amount: 8500000, budget: 8000000, lastYear: 7500000 },
        { account: 'رواتب الفنيين', amount: 4200000, budget: 4000000, lastYear: 3800000 },
        { account: 'المكافآت والحوافز', amount: 1500000, budget: 2000000, lastYear: 1200000 },
        { account: 'التأمينات الاجتماعية', amount: 850000, budget: 800000, lastYear: 750000 },
        { account: 'بدلات السفر والانتقال', amount: 620000, budget: 600000, lastYear: 550000 },
      ],
      administrative: [
        { account: 'إيجار المكتب الرئيسي', amount: 3600000, budget: 3600000, lastYear: 3000000 },
        { account: 'إيجار المستودعات', amount: 1200000, budget: 1200000, lastYear: 1000000 },
        { account: 'الكهرباء والماء', amount: 1850000, budget: 1500000, lastYear: 1400000 },
        { account: 'الاتصالات والإنترنت', amount: 450000, budget: 400000, lastYear: 380000 },
        { account: 'اللوازم المكتبية', amount: 280000, budget: 300000, lastYear: 250000 },
        { account: 'صيانة المباني والأثاث', amount: 350000, budget: 400000, lastYear: 300000 },
      ],
      marketing: [
        { account: 'الإعلانات والدعاية', amount: 2200000, budget: 2500000, lastYear: 1800000 },
        { account: 'عمولات المبيعات', amount: 1100000, budget: 1200000, lastYear: 900000 },
        { account: 'الهدايا والضيافة', amount: 380000, budget: 400000, lastYear: 320000 },
        { account: 'المشاركة في المعارض', amount: 250000, budget: 300000, lastYear: 200000 },
      ],
      depreciation: [
        { account: 'إهلاك المعدات والأجهزة', amount: 1800000, budget: 1800000, lastYear: 1500000 },
        { account: 'إهلاك الأثاث والتجهيزات', amount: 450000, budget: 450000, lastYear: 400000 },
        { account: 'إهلاك السيارات', amount: 680000, budget: 700000, lastYear: 600000 },
        { account: 'إهلاك البرمجيات', amount: 320000, budget: 300000, lastYear: 280000 },
      ],
    },
    // مصاريف غير تشغيلية
    nonOperatingExpenses: [
      { account: 'فوائد القروض البنكية', amount: 1200000, budget: 1000000, lastYear: 1100000 },
      { account: 'رسوم بنكية', amount: 180000, budget: 150000, lastYear: 140000 },
      { account: 'خسائر فروق العملة', amount: 85000, budget: 100000, lastYear: 60000 },
      { account: 'مخصص الديون المشكوك فيها', amount: 650000, budget: 500000, lastYear: 400000 },
    ],
    // الضرائب
    taxes: [
      { account: 'ضريبة الدخل', amount: 2500000, budget: 2800000, lastYear: 2100000 },
    ],
  };

  // حسابات الإجماليات
  const totalOperatingRevenues = incomeData.operatingRevenues.reduce((sum, item) => sum + item.amount, 0);
  const totalOtherRevenues = incomeData.otherRevenues.reduce((sum, item) => sum + item.amount, 0);
  const totalRevenues = totalOperatingRevenues + totalOtherRevenues;

  const totalCostOfSales = incomeData.costOfSales.reduce((sum, item) => sum + item.amount, 0);
  const grossProfit = totalOperatingRevenues - totalCostOfSales;

  const totalPersonnelExpenses = incomeData.operatingExpenses.personnel.reduce((sum, item) => sum + item.amount, 0);
  const totalAdministrativeExpenses = incomeData.operatingExpenses.administrative.reduce((sum, item) => sum + item.amount, 0);
  const totalMarketingExpenses = incomeData.operatingExpenses.marketing.reduce((sum, item) => sum + item.amount, 0);
  const totalDepreciationExpenses = incomeData.operatingExpenses.depreciation.reduce((sum, item) => sum + item.amount, 0);
  const totalOperatingExpenses = totalPersonnelExpenses + totalAdministrativeExpenses + totalMarketingExpenses + totalDepreciationExpenses;

  const operatingProfit = grossProfit - totalOperatingExpenses + totalOtherRevenues;
  
  const totalNonOperatingExpenses = incomeData.nonOperatingExpenses.reduce((sum, item) => sum + item.amount, 0);
  const profitBeforeTax = operatingProfit - totalNonOperatingExpenses;
  
  const totalTaxes = incomeData.taxes.reduce((sum, item) => sum + item.amount, 0);
  const netProfit = profitBeforeTax - totalTaxes;

  // النسب المالية
  const grossProfitMargin = ((grossProfit / totalOperatingRevenues) * 100).toFixed(1);
  const operatingProfitMargin = ((operatingProfit / totalRevenues) * 100).toFixed(1);
  const netProfitMargin = ((netProfit / totalRevenues) * 100).toFixed(1);
  const expenseRatio = ((totalOperatingExpenses / totalRevenues) * 100).toFixed(1);

  // مقارنة بالميزانية
  const budgetTotalRevenues = [...incomeData.operatingRevenues, ...incomeData.otherRevenues].reduce((sum, item) => sum + item.budget, 0);
  const revenueVariance = ((totalRevenues - budgetTotalRevenues) / budgetTotalRevenues * 100).toFixed(1);

  // مقارنة بالعام السابق
  const lastYearTotalRevenues = [...incomeData.operatingRevenues, ...incomeData.otherRevenues].reduce((sum, item) => sum + item.lastYear, 0);
  const yearOverYearGrowth = ((totalRevenues - lastYearTotalRevenues) / lastYearTotalRevenues * 100).toFixed(1);

  const handleExportPDF = () => {
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>قائمة الدخل</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 30px; background: white; direction: rtl; font-size: 12px; }
          .header { text-align: center; margin-bottom: 25px; border-bottom: 3px solid #1e40af; padding-bottom: 15px; }
          .header h1 { color: #1e40af; font-size: 24px; margin-bottom: 8px; }
          .header p { color: #666; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 8px 12px; text-align: right; border-bottom: 1px solid #e5e7eb; }
          th { background: #f8fafc; font-weight: bold; color: #374151; }
          .section-header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; font-weight: bold; }
          .section-header td { padding: 10px 12px; }
          .subsection-header { background: #f1f5f9; font-weight: 600; }
          .total-row { background: #dbeafe; font-weight: bold; }
          .grand-total { background: linear-gradient(135deg, #166534, #22c55e); color: white; font-weight: bold; font-size: 14px; }
          .amount { text-align: left; font-family: monospace; }
          .indent { padding-right: 30px !important; }
          .ratios { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 25px; }
          .ratio-card { background: #f8fafc; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb; }
          .ratio-card .value { font-size: 20px; font-weight: bold; color: #1e40af; }
          .ratio-card .label { font-size: 11px; color: #64748b; margin-top: 4px; }
          .footer { margin-top: 30px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 15px; }
          .positive { color: #16a34a; }
          .negative { color: #dc2626; }
          @media print { body { padding: 15px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>قائمة الدخل</h1>
          <p>للفترة المنتهية في ${new Date().toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>البيان</th>
              <th class="amount">المبلغ (د.ع)</th>
              <th class="amount">الإجمالي (د.ع)</th>
            </tr>
          </thead>
          <tbody>
            <tr class="section-header"><td colspan="3">الإيرادات التشغيلية</td></tr>
            ${incomeData.operatingRevenues.map(item => `
              <tr><td class="indent">${item.account}</td><td class="amount">${item.amount.toLocaleString('en-US')}</td><td></td></tr>
            `).join('')}
            <tr class="total-row"><td>إجمالي الإيرادات التشغيلية</td><td></td><td class="amount">${totalOperatingRevenues.toLocaleString('en-US')}</td></tr>
            
            <tr class="section-header"><td colspan="3">تكلفة المبيعات والخدمات</td></tr>
            ${incomeData.costOfSales.map(item => `
              <tr><td class="indent">${item.account}</td><td class="amount">(${item.amount.toLocaleString('en-US')})</td><td></td></tr>
            `).join('')}
            <tr class="total-row"><td>إجمالي تكلفة المبيعات</td><td></td><td class="amount">(${totalCostOfSales.toLocaleString('en-US')})</td></tr>
            
            <tr class="total-row" style="background: #dcfce7;"><td><strong>مجمل الربح</strong></td><td></td><td class="amount"><strong>${grossProfit.toLocaleString('en-US')}</strong></td></tr>
            
            <tr class="section-header"><td colspan="3">المصاريف التشغيلية</td></tr>
            
            <tr class="subsection-header"><td colspan="3">مصاريف الموظفين</td></tr>
            ${incomeData.operatingExpenses.personnel.map(item => `
              <tr><td class="indent">${item.account}</td><td class="amount">(${item.amount.toLocaleString('en-US')})</td><td></td></tr>
            `).join('')}
            
            <tr class="subsection-header"><td colspan="3">المصاريف الإدارية</td></tr>
            ${incomeData.operatingExpenses.administrative.map(item => `
              <tr><td class="indent">${item.account}</td><td class="amount">(${item.amount.toLocaleString('en-US')})</td><td></td></tr>
            `).join('')}
            
            <tr class="subsection-header"><td colspan="3">مصاريف التسويق والمبيعات</td></tr>
            ${incomeData.operatingExpenses.marketing.map(item => `
              <tr><td class="indent">${item.account}</td><td class="amount">(${item.amount.toLocaleString('en-US')})</td><td></td></tr>
            `).join('')}
            
            <tr class="subsection-header"><td colspan="3">الإهلاكات والاستهلاكات</td></tr>
            ${incomeData.operatingExpenses.depreciation.map(item => `
              <tr><td class="indent">${item.account}</td><td class="amount">(${item.amount.toLocaleString('en-US')})</td><td></td></tr>
            `).join('')}
            
            <tr class="total-row"><td>إجمالي المصاريف التشغيلية</td><td></td><td class="amount">(${totalOperatingExpenses.toLocaleString('en-US')})</td></tr>
            
            <tr class="section-header"><td colspan="3">إيرادات أخرى</td></tr>
            ${incomeData.otherRevenues.map(item => `
              <tr><td class="indent">${item.account}</td><td class="amount">${item.amount.toLocaleString('en-US')}</td><td></td></tr>
            `).join('')}
            <tr class="total-row"><td>إجمالي الإيرادات الأخرى</td><td></td><td class="amount">${totalOtherRevenues.toLocaleString('en-US')}</td></tr>
            
            <tr class="total-row" style="background: #dbeafe;"><td><strong>الربح التشغيلي</strong></td><td></td><td class="amount"><strong>${operatingProfit.toLocaleString('en-US')}</strong></td></tr>
            
            <tr class="section-header"><td colspan="3">مصاريف غير تشغيلية</td></tr>
            ${incomeData.nonOperatingExpenses.map(item => `
              <tr><td class="indent">${item.account}</td><td class="amount">(${item.amount.toLocaleString('en-US')})</td><td></td></tr>
            `).join('')}
            <tr class="total-row"><td>إجمالي المصاريف غير التشغيلية</td><td></td><td class="amount">(${totalNonOperatingExpenses.toLocaleString('en-US')})</td></tr>
            
            <tr class="total-row" style="background: #fef3c7;"><td><strong>الربح قبل الضريبة</strong></td><td></td><td class="amount"><strong>${profitBeforeTax.toLocaleString('en-US')}</strong></td></tr>
            
            <tr class="section-header"><td colspan="3">الضرائب</td></tr>
            ${incomeData.taxes.map(item => `
              <tr><td class="indent">${item.account}</td><td class="amount">(${item.amount.toLocaleString('en-US')})</td><td></td></tr>
            `).join('')}
            
            <tr class="grand-total"><td><strong>صافي الربح</strong></td><td></td><td class="amount"><strong>${netProfit.toLocaleString('en-US')}</strong></td></tr>
          </tbody>
        </table>
        
        <div class="ratios">
          <div class="ratio-card">
            <div class="value">${grossProfitMargin}%</div>
            <div class="label">هامش الربح الإجمالي</div>
          </div>
          <div class="ratio-card">
            <div class="value">${operatingProfitMargin}%</div>
            <div class="label">هامش الربح التشغيلي</div>
          </div>
          <div class="ratio-card">
            <div class="value">${netProfitMargin}%</div>
            <div class="label">هامش صافي الربح</div>
          </div>
          <div class="ratio-card">
            <div class="value">${yearOverYearGrowth}%</div>
            <div class="label">نمو الإيرادات السنوي</div>
          </div>
        </div>
        
        <div class="footer">
          <p>تم إنشاء هذا التقرير بواسطة نظام المحاسبة - ${new Date().toLocaleDateString('ar-IQ')} ${new Date().toLocaleTimeString('ar-IQ')}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
      toast({ title: 'تم فتح نافذة الطباعة', description: 'يمكنك الطباعة أو الحفظ كـ PDF' });
    }
  };

  const handleExportExcel = () => {
    toast({ title: 'جاري التصدير', description: 'سيتم تصدير البيانات إلى Excel' });
  };

  const renderVarianceBadge = (actual: number, budget: number) => {
    const variance = ((actual - budget) / budget * 100);
    const isPositive = variance >= 0;
    return (
      <Badge variant={isPositive ? "default" : "destructive"} className="text-xs">
        {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
        {Math.abs(variance).toFixed(1)}%
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* الهيدر */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <BarChart3 className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">قائمة الدخل</h2>
            <p className="text-muted-foreground text-sm">للفترة المنتهية في {new Date().toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">الشهر الحالي</SelectItem>
              <SelectItem value="quarter">الربع الحالي</SelectItem>
              <SelectItem value="year">السنة الحالية</SelectItem>
              <SelectItem value="custom">فترة مخصصة</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 ml-2" />
            Excel
          </Button>
          <Button onClick={handleExportPDF} size="sm">
            <FileDown className="h-4 w-4 ml-2" />
            تصدير PDF
          </Button>
        </div>
      </div>

      {/* بطاقات الملخص */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <Badge variant="secondary" className="text-xs">{yearOverYearGrowth}%</Badge>
            </div>
            <p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{(totalRevenues / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <Badge variant="secondary" className="text-xs">{grossProfitMargin}%</Badge>
            </div>
            <p className="text-xs text-muted-foreground">مجمل الربح</p>
            <p className="text-lg font-bold text-green-700 dark:text-green-400">{(grossProfit / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-purple-600" />
              <Badge variant="secondary" className="text-xs">{operatingProfitMargin}%</Badge>
            </div>
            <p className="text-xs text-muted-foreground">الربح التشغيلي</p>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{(operatingProfit / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Wallet className="h-5 w-5 text-emerald-600" />
              <Badge variant="secondary" className="text-xs">{netProfitMargin}%</Badge>
            </div>
            <p className="text-xs text-muted-foreground">صافي الربح</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{(netProfit / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CreditCard className="h-5 w-5 text-orange-600" />
              <Badge variant="secondary" className="text-xs">{expenseRatio}%</Badge>
            </div>
            <p className="text-xs text-muted-foreground">المصاريف التشغيلية</p>
            <p className="text-lg font-bold text-orange-700 dark:text-orange-400">{(totalOperatingExpenses / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900 border-cyan-200 dark:border-cyan-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Calculator className="h-5 w-5 text-cyan-600" />
              <Badge variant="secondary" className="text-xs">الضريبة</Badge>
            </div>
            <p className="text-xs text-muted-foreground">ضريبة الدخل</p>
            <p className="text-lg font-bold text-cyan-700 dark:text-cyan-400">{(totalTaxes / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات */}
      <Tabs defaultValue="detailed" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="detailed">القائمة التفصيلية</TabsTrigger>
          <TabsTrigger value="comparison">مقارنة بالميزانية</TabsTrigger>
          <TabsTrigger value="trend">تحليل الاتجاه</TabsTrigger>
          <TabsTrigger value="ratios">النسب المالية</TabsTrigger>
        </TabsList>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                قائمة الدخل التفصيلية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right w-[50%]">البيان</TableHead>
                    <TableHead className="text-left">المبلغ</TableHead>
                    <TableHead className="text-left">الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* الإيرادات التشغيلية */}
                  <TableRow className="bg-blue-50 dark:bg-blue-950">
                    <TableCell className="font-bold" colSpan={3}>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        الإيرادات التشغيلية
                      </div>
                    </TableCell>
                  </TableRow>
                  {incomeData.operatingRevenues.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="pr-8">{item.account}</TableCell>
                      <TableCell className="text-left font-mono">{formatCurrency(item.amount, 'IQD')}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-blue-100 dark:bg-blue-900">
                    <TableCell>إجمالي الإيرادات التشغيلية</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-left font-mono text-blue-700 dark:text-blue-300">{formatCurrency(totalOperatingRevenues, 'IQD')}</TableCell>
                  </TableRow>

                  {/* تكلفة المبيعات */}
                  <TableRow className="bg-red-50 dark:bg-red-950">
                    <TableCell className="font-bold" colSpan={3}>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        تكلفة المبيعات والخدمات
                      </div>
                    </TableCell>
                  </TableRow>
                  {incomeData.costOfSales.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="pr-8">{item.account}</TableCell>
                      <TableCell className="text-left font-mono text-red-600">({formatCurrency(item.amount, 'IQD')})</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-red-100 dark:bg-red-900">
                    <TableCell>إجمالي تكلفة المبيعات</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-left font-mono text-red-700 dark:text-red-300">({formatCurrency(totalCostOfSales, 'IQD')})</TableCell>
                  </TableRow>

                  {/* مجمل الربح */}
                  <TableRow className="font-bold text-lg bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900">
                    <TableCell className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      مجمل الربح
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-left font-mono text-green-700 dark:text-green-300">{formatCurrency(grossProfit, 'IQD')}</TableCell>
                  </TableRow>

                  {/* المصاريف التشغيلية */}
                  <TableRow className="bg-orange-50 dark:bg-orange-950">
                    <TableCell className="font-bold" colSpan={3}>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        المصاريف التشغيلية
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* مصاريف الموظفين */}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-semibold pr-4" colSpan={3}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        مصاريف الموظفين
                      </div>
                    </TableCell>
                  </TableRow>
                  {incomeData.operatingExpenses.personnel.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="pr-10">{item.account}</TableCell>
                      <TableCell className="text-left font-mono text-orange-600">({formatCurrency(item.amount, 'IQD')})</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}

                  {/* المصاريف الإدارية */}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-semibold pr-4" colSpan={3}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        المصاريف الإدارية
                      </div>
                    </TableCell>
                  </TableRow>
                  {incomeData.operatingExpenses.administrative.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="pr-10">{item.account}</TableCell>
                      <TableCell className="text-left font-mono text-orange-600">({formatCurrency(item.amount, 'IQD')})</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}

                  {/* مصاريف التسويق */}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-semibold pr-4" colSpan={3}>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        مصاريف التسويق والمبيعات
                      </div>
                    </TableCell>
                  </TableRow>
                  {incomeData.operatingExpenses.marketing.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="pr-10">{item.account}</TableCell>
                      <TableCell className="text-left font-mono text-orange-600">({formatCurrency(item.amount, 'IQD')})</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}

                  {/* الإهلاكات */}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-semibold pr-4" colSpan={3}>الإهلاكات والاستهلاكات</TableCell>
                  </TableRow>
                  {incomeData.operatingExpenses.depreciation.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="pr-10">{item.account}</TableCell>
                      <TableCell className="text-left font-mono text-orange-600">({formatCurrency(item.amount, 'IQD')})</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}

                  <TableRow className="font-bold bg-orange-100 dark:bg-orange-900">
                    <TableCell>إجمالي المصاريف التشغيلية</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-left font-mono text-orange-700 dark:text-orange-300">({formatCurrency(totalOperatingExpenses, 'IQD')})</TableCell>
                  </TableRow>

                  {/* إيرادات أخرى */}
                  <TableRow className="bg-cyan-50 dark:bg-cyan-950">
                    <TableCell className="font-bold" colSpan={3}>إيرادات أخرى</TableCell>
                  </TableRow>
                  {incomeData.otherRevenues.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="pr-8">{item.account}</TableCell>
                      <TableCell className="text-left font-mono">{formatCurrency(item.amount, 'IQD')}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-cyan-100 dark:bg-cyan-900">
                    <TableCell>إجمالي الإيرادات الأخرى</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-left font-mono text-cyan-700 dark:text-cyan-300">{formatCurrency(totalOtherRevenues, 'IQD')}</TableCell>
                  </TableRow>

                  {/* الربح التشغيلي */}
                  <TableRow className="font-bold text-lg bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900 dark:to-violet-900">
                    <TableCell className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-600" />
                      الربح التشغيلي
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-left font-mono text-purple-700 dark:text-purple-300">{formatCurrency(operatingProfit, 'IQD')}</TableCell>
                  </TableRow>

                  {/* مصاريف غير تشغيلية */}
                  <TableRow className="bg-gray-50 dark:bg-gray-900">
                    <TableCell className="font-bold" colSpan={3}>مصاريف غير تشغيلية</TableCell>
                  </TableRow>
                  {incomeData.nonOperatingExpenses.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="pr-8">{item.account}</TableCell>
                      <TableCell className="text-left font-mono text-red-600">({formatCurrency(item.amount, 'IQD')})</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-gray-100 dark:bg-gray-800">
                    <TableCell>إجمالي المصاريف غير التشغيلية</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-left font-mono">({formatCurrency(totalNonOperatingExpenses, 'IQD')})</TableCell>
                  </TableRow>

                  {/* الربح قبل الضريبة */}
                  <TableRow className="font-bold bg-yellow-100 dark:bg-yellow-900">
                    <TableCell>الربح قبل الضريبة</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-left font-mono text-yellow-700 dark:text-yellow-300">{formatCurrency(profitBeforeTax, 'IQD')}</TableCell>
                  </TableRow>

                  {/* الضرائب */}
                  <TableRow className="bg-gray-50 dark:bg-gray-900">
                    <TableCell className="font-bold" colSpan={3}>الضرائب</TableCell>
                  </TableRow>
                  {incomeData.taxes.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="pr-8">{item.account}</TableCell>
                      <TableCell className="text-left font-mono text-red-600">({formatCurrency(item.amount, 'IQD')})</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}

                  {/* صافي الربح */}
                  <TableRow className="font-bold text-xl bg-gradient-to-r from-green-200 to-emerald-200 dark:from-green-800 dark:to-emerald-800">
                    <TableCell className="flex items-center gap-2">
                      {netProfit >= 0 ? (
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      ) : (
                        <TrendingDown className="h-6 w-6 text-red-600" />
                      )}
                      صافي الربح
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-left font-mono text-green-800 dark:text-green-200 text-xl">{formatCurrency(netProfit, 'IQD')}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>مقارنة الأداء الفعلي بالميزانية المخططة</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">البيان</TableHead>
                    <TableHead className="text-left">الفعلي</TableHead>
                    <TableHead className="text-left">الميزانية</TableHead>
                    <TableHead className="text-left">الفرق</TableHead>
                    <TableHead className="text-center">الأداء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomeData.operatingRevenues.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.account}</TableCell>
                      <TableCell className="text-left font-mono">{formatCurrency(item.amount, 'IQD')}</TableCell>
                      <TableCell className="text-left font-mono">{formatCurrency(item.budget, 'IQD')}</TableCell>
                      <TableCell className={`text-left font-mono ${item.amount >= item.budget ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(item.amount - item.budget, 'IQD')}
                      </TableCell>
                      <TableCell className="text-center">{renderVarianceBadge(item.amount, item.budget)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>مقارنة بالعام السابق</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">البيان</TableHead>
                    <TableHead className="text-left">السنة الحالية</TableHead>
                    <TableHead className="text-left">السنة السابقة</TableHead>
                    <TableHead className="text-left">النمو</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomeData.operatingRevenues.map((item, index) => {
                    const growth = ((item.amount - item.lastYear) / item.lastYear * 100).toFixed(1);
                    return (
                      <TableRow key={index}>
                        <TableCell>{item.account}</TableCell>
                        <TableCell className="text-left font-mono">{formatCurrency(item.amount, 'IQD')}</TableCell>
                        <TableCell className="text-left font-mono">{formatCurrency(item.lastYear, 'IQD')}</TableCell>
                        <TableCell className="text-left">
                          <Badge variant={parseFloat(growth) >= 0 ? "default" : "destructive"}>
                            {parseFloat(growth) >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                            {Math.abs(parseFloat(growth))}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratios" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  هامش الربح الإجمالي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{grossProfitMargin}%</div>
                <Progress value={parseFloat(grossProfitMargin)} className="mt-3" />
                <p className="text-xs text-muted-foreground mt-2">مجمل الربح / إجمالي الإيرادات</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  هامش الربح التشغيلي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{operatingProfitMargin}%</div>
                <Progress value={parseFloat(operatingProfitMargin)} className="mt-3" />
                <p className="text-xs text-muted-foreground mt-2">الربح التشغيلي / إجمالي الإيرادات</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  هامش صافي الربح
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">{netProfitMargin}%</div>
                <Progress value={parseFloat(netProfitMargin)} className="mt-3" />
                <p className="text-xs text-muted-foreground mt-2">صافي الربح / إجمالي الإيرادات</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  نسبة المصاريف التشغيلية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{expenseRatio}%</div>
                <Progress value={parseFloat(expenseRatio)} className="mt-3" />
                <p className="text-xs text-muted-foreground mt-2">المصاريف التشغيلية / الإيرادات</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>تحليل هيكل المصاريف</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    مصاريف الموظفين
                  </span>
                  <div className="flex items-center gap-4">
                    <Progress value={(totalPersonnelExpenses / totalOperatingExpenses) * 100} className="w-32" />
                    <span className="font-mono text-sm w-16 text-left">{((totalPersonnelExpenses / totalOperatingExpenses) * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    المصاريف الإدارية
                  </span>
                  <div className="flex items-center gap-4">
                    <Progress value={(totalAdministrativeExpenses / totalOperatingExpenses) * 100} className="w-32" />
                    <span className="font-mono text-sm w-16 text-left">{((totalAdministrativeExpenses / totalOperatingExpenses) * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    مصاريف التسويق
                  </span>
                  <div className="flex items-center gap-4">
                    <Progress value={(totalMarketingExpenses / totalOperatingExpenses) * 100} className="w-32" />
                    <span className="font-mono text-sm w-16 text-left">{((totalMarketingExpenses / totalOperatingExpenses) * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    الإهلاكات
                  </span>
                  <div className="flex items-center gap-4">
                    <Progress value={(totalDepreciationExpenses / totalOperatingExpenses) * 100} className="w-32" />
                    <span className="font-mono text-sm w-16 text-left">{((totalDepreciationExpenses / totalOperatingExpenses) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
