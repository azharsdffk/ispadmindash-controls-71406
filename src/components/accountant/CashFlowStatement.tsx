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
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  Wallet,
  Building2,
  CreditCard,
  PiggyBank,
  BarChart3,
  CircleDollarSign,
  ArrowRightLeft,
  Receipt,
  Landmark,
  HandCoins,
  TrendingUp as Growth,
  Calculator,
  Percent,
  Target
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export const CashFlowStatement = () => {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedMethod, setSelectedMethod] = useState('indirect');

  // بيانات قائمة التدفقات النقدية التفصيلية
  const cashFlowData = {
    // الأنشطة التشغيلية - الطريقة غير المباشرة
    operatingIndirect: {
      netIncome: { item: 'صافي الربح للفترة', amount: 18700000, lastYear: 15200000 },
      adjustments: [
        { item: 'إهلاك الأصول الثابتة', amount: 3250000, lastYear: 2800000, category: 'إهلاكات' },
        { item: 'إطفاء الأصول غير الملموسة', amount: 320000, lastYear: 280000, category: 'إهلاكات' },
        { item: 'مخصص الديون المشكوك فيها', amount: 650000, lastYear: 400000, category: 'مخصصات' },
        { item: 'مخصص مكافأة نهاية الخدمة', amount: 450000, lastYear: 380000, category: 'مخصصات' },
        { item: 'خسائر بيع أصول ثابتة', amount: 120000, lastYear: 0, category: 'أرباح/خسائر' },
        { item: 'فوائد مستحقة على القروض', amount: 180000, lastYear: 150000, category: 'فوائد' },
      ],
      workingCapitalChanges: [
        { item: 'الذمم المدينة', amount: -3500000, lastYear: -2100000, direction: 'زيادة' },
        { item: 'المخزون', amount: -1200000, lastYear: -800000, direction: 'زيادة' },
        { item: 'المصروفات المدفوعة مقدماً', amount: -280000, lastYear: 150000, direction: 'زيادة' },
        { item: 'الذمم الدائنة', amount: 1800000, lastYear: 1200000, direction: 'زيادة' },
        { item: 'المصروفات المستحقة', amount: 650000, lastYear: 480000, direction: 'زيادة' },
        { item: 'الإيرادات المؤجلة', amount: 920000, lastYear: 650000, direction: 'زيادة' },
      ],
      taxes: [
        { item: 'ضريبة الدخل المدفوعة', amount: -2500000, lastYear: -2100000 },
      ],
    },
    // الأنشطة التشغيلية - الطريقة المباشرة
    operatingDirect: {
      receipts: [
        { item: 'النقد المحصل من العملاء', amount: 55200000, lastYear: 46800000 },
        { item: 'النقد المحصل من الفوائد', amount: 450000, lastYear: 380000 },
        { item: 'متحصلات تشغيلية أخرى', amount: 320000, lastYear: 250000 },
      ],
      payments: [
        { item: 'النقد المدفوع للموردين', amount: -18500000, lastYear: -15200000 },
        { item: 'النقد المدفوع للموظفين', amount: -15670000, lastYear: -13500000 },
        { item: 'النقد المدفوع للإيجارات', amount: -4800000, lastYear: -4000000 },
        { item: 'النقد المدفوع للمرافق', amount: -1850000, lastYear: -1400000 },
        { item: 'النقد المدفوع للتسويق', amount: -3930000, lastYear: -3200000 },
        { item: 'النقد المدفوع للفوائد', amount: -1380000, lastYear: -1200000 },
        { item: 'النقد المدفوع للضرائب', amount: -2500000, lastYear: -2100000 },
        { item: 'مدفوعات تشغيلية أخرى', amount: -780000, lastYear: -650000 },
      ],
    },
    // الأنشطة الاستثمارية
    investing: {
      purchases: [
        { item: 'شراء معدات وأجهزة شبكات', amount: -8500000, lastYear: -6200000, category: 'معدات' },
        { item: 'شراء سيارات', amount: -3200000, lastYear: -2500000, category: 'سيارات' },
        { item: 'شراء أثاث ومعدات مكتبية', amount: -850000, lastYear: -600000, category: 'أثاث' },
        { item: 'شراء برمجيات وتراخيص', amount: -1200000, lastYear: -800000, category: 'برمجيات' },
        { item: 'تحسينات على المباني المستأجرة', amount: -650000, lastYear: -400000, category: 'تحسينات' },
      ],
      sales: [
        { item: 'متحصلات من بيع معدات قديمة', amount: 380000, lastYear: 250000 },
        { item: 'متحصلات من بيع سيارات', amount: 520000, lastYear: 0 },
      ],
      investments: [
        { item: 'استثمارات في أوراق مالية', amount: -2000000, lastYear: -1500000 },
        { item: 'ودائع بنكية طويلة الأجل', amount: -1500000, lastYear: -1000000 },
      ],
    },
    // الأنشطة التمويلية
    financing: {
      borrowings: [
        { item: 'قرض بنكي جديد', amount: 15000000, lastYear: 8000000, type: 'تدفق داخل' },
        { item: 'تسهيلات ائتمانية', amount: 3000000, lastYear: 2000000, type: 'تدفق داخل' },
      ],
      repayments: [
        { item: 'سداد أقساط القروض البنكية', amount: -6500000, lastYear: -5200000, type: 'تدفق خارج' },
        { item: 'سداد التسهيلات الائتمانية', amount: -2000000, lastYear: -1500000, type: 'تدفق خارج' },
        { item: 'فوائد القروض المدفوعة', amount: -1200000, lastYear: -1100000, type: 'تدفق خارج' },
      ],
      equity: [
        { item: 'زيادة في رأس المال', amount: 5000000, lastYear: 0, type: 'تدفق داخل' },
        { item: 'توزيعات أرباح نقدية', amount: -4000000, lastYear: -3500000, type: 'تدفق خارج' },
      ],
    },
  };

  // الأرصدة
  const openingCash = 12000000;
  const lastYearOpeningCash = 8500000;

  // حسابات التدفقات - الطريقة غير المباشرة
  const netIncome = cashFlowData.operatingIndirect.netIncome.amount;
  const totalAdjustments = cashFlowData.operatingIndirect.adjustments.reduce((sum, item) => sum + item.amount, 0);
  const totalWorkingCapitalChanges = cashFlowData.operatingIndirect.workingCapitalChanges.reduce((sum, item) => sum + item.amount, 0);
  const totalTaxesPaid = cashFlowData.operatingIndirect.taxes.reduce((sum, item) => sum + item.amount, 0);
  const operatingCashFlowIndirect = netIncome + totalAdjustments + totalWorkingCapitalChanges + totalTaxesPaid;

  // حسابات التدفقات - الطريقة المباشرة
  const totalReceipts = cashFlowData.operatingDirect.receipts.reduce((sum, item) => sum + item.amount, 0);
  const totalPayments = cashFlowData.operatingDirect.payments.reduce((sum, item) => sum + item.amount, 0);
  const operatingCashFlowDirect = totalReceipts + totalPayments;

  // التدفقات الاستثمارية
  const totalPurchases = cashFlowData.investing.purchases.reduce((sum, item) => sum + item.amount, 0);
  const totalSales = cashFlowData.investing.sales.reduce((sum, item) => sum + item.amount, 0);
  const totalInvestments = cashFlowData.investing.investments.reduce((sum, item) => sum + item.amount, 0);
  const investingCashFlow = totalPurchases + totalSales + totalInvestments;

  // التدفقات التمويلية
  const totalBorrowings = cashFlowData.financing.borrowings.reduce((sum, item) => sum + item.amount, 0);
  const totalRepayments = cashFlowData.financing.repayments.reduce((sum, item) => sum + item.amount, 0);
  const totalEquity = cashFlowData.financing.equity.reduce((sum, item) => sum + item.amount, 0);
  const financingCashFlow = totalBorrowings + totalRepayments + totalEquity;

  // صافي التدفق والرصيد الختامي
  const operatingCashFlow = selectedMethod === 'indirect' ? operatingCashFlowIndirect : operatingCashFlowDirect;
  const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;
  const closingCash = openingCash + netCashFlow;

  // حسابات العام السابق
  const lastYearOperating = cashFlowData.operatingIndirect.netIncome.lastYear + 
    cashFlowData.operatingIndirect.adjustments.reduce((sum, item) => sum + item.lastYear, 0) +
    cashFlowData.operatingIndirect.workingCapitalChanges.reduce((sum, item) => sum + item.lastYear, 0) +
    cashFlowData.operatingIndirect.taxes.reduce((sum, item) => sum + item.lastYear, 0);
  const lastYearInvesting = [...cashFlowData.investing.purchases, ...cashFlowData.investing.sales, ...cashFlowData.investing.investments]
    .reduce((sum, item) => sum + item.lastYear, 0);
  const lastYearFinancing = [...cashFlowData.financing.borrowings, ...cashFlowData.financing.repayments, ...cashFlowData.financing.equity]
    .reduce((sum, item) => sum + item.lastYear, 0);
  const lastYearNetCashFlow = lastYearOperating + lastYearInvesting + lastYearFinancing;
  const lastYearClosingCash = lastYearOpeningCash + lastYearNetCashFlow;

  // النسب المالية
  const operatingCashRatio = ((operatingCashFlow / Math.abs(totalPayments)) * 100).toFixed(1);
  const cashFlowCoverage = (operatingCashFlow / Math.abs(totalRepayments)).toFixed(2);
  const freeСashFlow = operatingCashFlow + investingCashFlow;
  const cashFlowGrowth = ((operatingCashFlow - lastYearOperating) / lastYearOperating * 100).toFixed(1);

  const handleExportPDF = () => {
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>قائمة التدفقات النقدية</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 30px; background: white; direction: rtl; font-size: 11px; }
          .header { text-align: center; margin-bottom: 25px; border-bottom: 3px solid #1e40af; padding-bottom: 15px; }
          .header h1 { color: #1e40af; font-size: 22px; margin-bottom: 8px; }
          .header p { color: #666; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th, td { padding: 6px 10px; text-align: right; border-bottom: 1px solid #e5e7eb; }
          th { background: #f8fafc; font-weight: bold; color: #374151; font-size: 10px; }
          .section-header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; font-weight: bold; }
          .section-header td { padding: 8px 10px; }
          .section-header.operating { background: linear-gradient(135deg, #0369a1, #0ea5e9); }
          .section-header.investing { background: linear-gradient(135deg, #c2410c, #f97316); }
          .section-header.financing { background: linear-gradient(135deg, #7c3aed, #a855f7); }
          .subsection-header { background: #f1f5f9; font-weight: 600; }
          .total-row { background: #dbeafe; font-weight: bold; }
          .grand-total { background: linear-gradient(135deg, #166534, #22c55e); color: white; font-weight: bold; font-size: 12px; }
          .amount { text-align: left; font-family: monospace; }
          .indent { padding-right: 25px !important; }
          .positive { color: #16a34a; }
          .negative { color: #dc2626; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 20px; }
          .summary-card { background: #f8fafc; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb; }
          .summary-card .value { font-size: 16px; font-weight: bold; color: #1e40af; }
          .summary-card .label { font-size: 10px; color: #64748b; margin-top: 4px; }
          .footer { margin-top: 25px; text-align: center; color: #9ca3af; font-size: 9px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
          @media print { body { padding: 15px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>قائمة التدفقات النقدية</h1>
          <p>للفترة المنتهية في ${new Date().toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' })} - الطريقة غير المباشرة</p>
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
            <tr class="section-header operating"><td colspan="3">أولاً: التدفقات النقدية من الأنشطة التشغيلية</td></tr>
            <tr><td>صافي الربح للفترة</td><td class="amount">${netIncome.toLocaleString('en-US')}</td><td></td></tr>
            
            <tr class="subsection-header"><td colspan="3">تعديلات لتسوية صافي الربح:</td></tr>
            ${cashFlowData.operatingIndirect.adjustments.map(item => `
              <tr><td class="indent">${item.item}</td><td class="amount">${item.amount.toLocaleString('en-US')}</td><td></td></tr>
            `).join('')}
            <tr class="total-row"><td>إجمالي التعديلات</td><td></td><td class="amount">${totalAdjustments.toLocaleString('en-US')}</td></tr>
            
            <tr class="subsection-header"><td colspan="3">التغيرات في رأس المال العامل:</td></tr>
            ${cashFlowData.operatingIndirect.workingCapitalChanges.map(item => `
              <tr><td class="indent">${item.direction === 'زيادة' ? (item.amount < 0 ? 'زيادة' : 'نقص') : ''} في ${item.item}</td><td class="amount ${item.amount >= 0 ? 'positive' : 'negative'}">${item.amount.toLocaleString('en-US')}</td><td></td></tr>
            `).join('')}
            <tr class="total-row"><td>إجمالي التغير في رأس المال العامل</td><td></td><td class="amount">${totalWorkingCapitalChanges.toLocaleString('en-US')}</td></tr>
            
            ${cashFlowData.operatingIndirect.taxes.map(item => `
              <tr><td class="indent">${item.item}</td><td class="amount negative">(${Math.abs(item.amount).toLocaleString('en-US')})</td><td></td></tr>
            `).join('')}
            
            <tr class="total-row" style="background: #bae6fd;"><td><strong>صافي التدفق النقدي من الأنشطة التشغيلية</strong></td><td></td><td class="amount"><strong>${operatingCashFlow.toLocaleString('en-US')}</strong></td></tr>
            
            <tr class="section-header investing"><td colspan="3">ثانياً: التدفقات النقدية من الأنشطة الاستثمارية</td></tr>
            <tr class="subsection-header"><td colspan="3">المشتريات الرأسمالية:</td></tr>
            ${cashFlowData.investing.purchases.map(item => `
              <tr><td class="indent">${item.item}</td><td class="amount negative">(${Math.abs(item.amount).toLocaleString('en-US')})</td><td></td></tr>
            `).join('')}
            
            <tr class="subsection-header"><td colspan="3">متحصلات بيع الأصول:</td></tr>
            ${cashFlowData.investing.sales.map(item => `
              <tr><td class="indent">${item.item}</td><td class="amount positive">${item.amount.toLocaleString('en-US')}</td><td></td></tr>
            `).join('')}
            
            <tr class="subsection-header"><td colspan="3">الاستثمارات:</td></tr>
            ${cashFlowData.investing.investments.map(item => `
              <tr><td class="indent">${item.item}</td><td class="amount negative">(${Math.abs(item.amount).toLocaleString('en-US')})</td><td></td></tr>
            `).join('')}
            
            <tr class="total-row" style="background: #fed7aa;"><td><strong>صافي التدفق النقدي من الأنشطة الاستثمارية</strong></td><td></td><td class="amount"><strong>${investingCashFlow.toLocaleString('en-US')}</strong></td></tr>
            
            <tr class="section-header financing"><td colspan="3">ثالثاً: التدفقات النقدية من الأنشطة التمويلية</td></tr>
            <tr class="subsection-header"><td colspan="3">الاقتراض:</td></tr>
            ${cashFlowData.financing.borrowings.map(item => `
              <tr><td class="indent">${item.item}</td><td class="amount positive">${item.amount.toLocaleString('en-US')}</td><td></td></tr>
            `).join('')}
            
            <tr class="subsection-header"><td colspan="3">سداد القروض:</td></tr>
            ${cashFlowData.financing.repayments.map(item => `
              <tr><td class="indent">${item.item}</td><td class="amount negative">(${Math.abs(item.amount).toLocaleString('en-US')})</td><td></td></tr>
            `).join('')}
            
            <tr class="subsection-header"><td colspan="3">حقوق الملكية:</td></tr>
            ${cashFlowData.financing.equity.map(item => `
              <tr><td class="indent">${item.item}</td><td class="amount ${item.amount >= 0 ? 'positive' : 'negative'}">${item.amount >= 0 ? item.amount.toLocaleString('en-US') : '(' + Math.abs(item.amount).toLocaleString('en-US') + ')'}</td><td></td></tr>
            `).join('')}
            
            <tr class="total-row" style="background: #e9d5ff;"><td><strong>صافي التدفق النقدي من الأنشطة التمويلية</strong></td><td></td><td class="amount"><strong>${financingCashFlow.toLocaleString('en-US')}</strong></td></tr>
            
            <tr style="background: #fef3c7;"><td><strong>صافي التغير في النقدية</strong></td><td></td><td class="amount"><strong>${netCashFlow.toLocaleString('en-US')}</strong></td></tr>
            <tr><td>النقدية في بداية الفترة</td><td></td><td class="amount">${openingCash.toLocaleString('en-US')}</td></tr>
            <tr class="grand-total"><td><strong>النقدية في نهاية الفترة</strong></td><td></td><td class="amount"><strong>${closingCash.toLocaleString('en-US')}</strong></td></tr>
          </tbody>
        </table>
        
        <div class="summary">
          <div class="summary-card">
            <div class="value">${(operatingCashFlow / 1000000).toFixed(1)}M</div>
            <div class="label">التدفقات التشغيلية</div>
          </div>
          <div class="summary-card">
            <div class="value">${(investingCashFlow / 1000000).toFixed(1)}M</div>
            <div class="label">التدفقات الاستثمارية</div>
          </div>
          <div class="summary-card">
            <div class="value">${(financingCashFlow / 1000000).toFixed(1)}M</div>
            <div class="label">التدفقات التمويلية</div>
          </div>
          <div class="summary-card">
            <div class="value">${(freeСashFlow / 1000000).toFixed(1)}M</div>
            <div class="label">التدفق النقدي الحر</div>
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

  return (
    <div className="space-y-6">
      {/* الهيدر */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
            <Banknote className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">قائمة التدفقات النقدية</h2>
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
            </SelectContent>
          </Select>
          <Select value={selectedMethod} onValueChange={setSelectedMethod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="indirect">الطريقة غير المباشرة</SelectItem>
              <SelectItem value="direct">الطريقة المباشرة</SelectItem>
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
        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900 border-cyan-200 dark:border-cyan-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CircleDollarSign className="h-5 w-5 text-cyan-600" />
              <Badge variant="secondary" className="text-xs">تشغيلي</Badge>
            </div>
            <p className="text-xs text-muted-foreground">التدفق التشغيلي</p>
            <p className={`text-lg font-bold ${operatingCashFlow >= 0 ? 'text-cyan-700 dark:text-cyan-400' : 'text-red-600'}`}>
              {(operatingCashFlow / 1000000).toFixed(1)}M
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="h-5 w-5 text-orange-600" />
              <Badge variant="secondary" className="text-xs">استثماري</Badge>
            </div>
            <p className="text-xs text-muted-foreground">التدفق الاستثماري</p>
            <p className={`text-lg font-bold ${investingCashFlow >= 0 ? 'text-green-600' : 'text-orange-700 dark:text-orange-400'}`}>
              {(investingCashFlow / 1000000).toFixed(1)}M
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Landmark className="h-5 w-5 text-purple-600" />
              <Badge variant="secondary" className="text-xs">تمويلي</Badge>
            </div>
            <p className="text-xs text-muted-foreground">التدفق التمويلي</p>
            <p className={`text-lg font-bold ${financingCashFlow >= 0 ? 'text-purple-700 dark:text-purple-400' : 'text-red-600'}`}>
              {(financingCashFlow / 1000000).toFixed(1)}M
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <ArrowRightLeft className="h-5 w-5 text-green-600" />
              <Badge variant="secondary" className="text-xs">صافي</Badge>
            </div>
            <p className="text-xs text-muted-foreground">صافي التغير</p>
            <p className={`text-lg font-bold ${netCashFlow >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600'}`}>
              {(netCashFlow / 1000000).toFixed(1)}M
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              <Badge variant="secondary" className="text-xs">ختامي</Badge>
            </div>
            <p className="text-xs text-muted-foreground">رصيد النقدية</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{(closingCash / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <HandCoins className="h-5 w-5 text-emerald-600" />
              <Badge variant="secondary" className="text-xs">حر</Badge>
            </div>
            <p className="text-xs text-muted-foreground">التدفق الحر</p>
            <p className={`text-lg font-bold ${freeСashFlow >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600'}`}>
              {(freeСashFlow / 1000000).toFixed(1)}M
            </p>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات */}
      <Tabs defaultValue="statement" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="statement">القائمة التفصيلية</TabsTrigger>
          <TabsTrigger value="comparison">مقارنة سنوية</TabsTrigger>
          <TabsTrigger value="analysis">تحليل التدفقات</TabsTrigger>
          <TabsTrigger value="ratios">النسب المالية</TabsTrigger>
        </TabsList>

        <TabsContent value="statement" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                قائمة التدفقات النقدية - {selectedMethod === 'indirect' ? 'الطريقة غير المباشرة' : 'الطريقة المباشرة'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right w-[55%]">البيان</TableHead>
                    <TableHead className="text-left">المبلغ</TableHead>
                    <TableHead className="text-left">الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* الأنشطة التشغيلية */}
                  <TableRow className="bg-cyan-50 dark:bg-cyan-950">
                    <TableCell className="font-bold" colSpan={3}>
                      <div className="flex items-center gap-2">
                        <CircleDollarSign className="h-4 w-4" />
                        أولاً: التدفقات النقدية من الأنشطة التشغيلية
                      </div>
                    </TableCell>
                  </TableRow>

                  {selectedMethod === 'indirect' ? (
                    <>
                      <TableRow>
                        <TableCell className="font-semibold">صافي الربح للفترة</TableCell>
                        <TableCell className="text-left font-mono">{formatCurrency(netIncome, 'IQD')}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>

                      <TableRow className="bg-muted/50">
                        <TableCell className="font-semibold" colSpan={3}>تعديلات لتسوية صافي الربح:</TableCell>
                      </TableRow>
                      {cashFlowData.operatingIndirect.adjustments.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="pr-8">{item.item}</TableCell>
                          <TableCell className="text-left font-mono text-green-600">{formatCurrency(item.amount, 'IQD')}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-semibold bg-cyan-100/50 dark:bg-cyan-900/50">
                        <TableCell>إجمالي التعديلات</TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-left font-mono">{formatCurrency(totalAdjustments, 'IQD')}</TableCell>
                      </TableRow>

                      <TableRow className="bg-muted/50">
                        <TableCell className="font-semibold" colSpan={3}>التغيرات في رأس المال العامل:</TableCell>
                      </TableRow>
                      {cashFlowData.operatingIndirect.workingCapitalChanges.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="pr-8">
                            {item.amount < 0 ? 'زيادة' : 'نقص'} في {item.item}
                          </TableCell>
                          <TableCell className={`text-left font-mono ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.amount >= 0 ? formatCurrency(item.amount, 'IQD') : `(${formatCurrency(Math.abs(item.amount), 'IQD')})`}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-semibold bg-cyan-100/50 dark:bg-cyan-900/50">
                        <TableCell>إجمالي التغير في رأس المال العامل</TableCell>
                        <TableCell></TableCell>
                        <TableCell className={`text-left font-mono ${totalWorkingCapitalChanges >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {totalWorkingCapitalChanges >= 0 ? formatCurrency(totalWorkingCapitalChanges, 'IQD') : `(${formatCurrency(Math.abs(totalWorkingCapitalChanges), 'IQD')})`}
                        </TableCell>
                      </TableRow>

                      {cashFlowData.operatingIndirect.taxes.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="pr-8">{item.item}</TableCell>
                          <TableCell className="text-left font-mono text-red-600">({formatCurrency(Math.abs(item.amount), 'IQD')})</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : (
                    <>
                      <TableRow className="bg-muted/50">
                        <TableCell className="font-semibold" colSpan={3}>
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4" />
                            المتحصلات النقدية:
                          </div>
                        </TableCell>
                      </TableRow>
                      {cashFlowData.operatingDirect.receipts.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="pr-8">{item.item}</TableCell>
                          <TableCell className="text-left font-mono text-green-600">{formatCurrency(item.amount, 'IQD')}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-semibold bg-green-100/50 dark:bg-green-900/50">
                        <TableCell>إجمالي المتحصلات</TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-left font-mono text-green-600">{formatCurrency(totalReceipts, 'IQD')}</TableCell>
                      </TableRow>

                      <TableRow className="bg-muted/50">
                        <TableCell className="font-semibold" colSpan={3}>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            المدفوعات النقدية:
                          </div>
                        </TableCell>
                      </TableRow>
                      {cashFlowData.operatingDirect.payments.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="pr-8">{item.item}</TableCell>
                          <TableCell className="text-left font-mono text-red-600">({formatCurrency(Math.abs(item.amount), 'IQD')})</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-semibold bg-red-100/50 dark:bg-red-900/50">
                        <TableCell>إجمالي المدفوعات</TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-left font-mono text-red-600">({formatCurrency(Math.abs(totalPayments), 'IQD')})</TableCell>
                      </TableRow>
                    </>
                  )}

                  <TableRow className="font-bold text-lg bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900 dark:to-blue-900">
                    <TableCell className="flex items-center gap-2">
                      {operatingCashFlow >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                      صافي التدفق النقدي من الأنشطة التشغيلية
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className={`text-left font-mono ${operatingCashFlow >= 0 ? 'text-cyan-700 dark:text-cyan-300' : 'text-red-600'}`}>
                      {formatCurrency(operatingCashFlow, 'IQD')}
                    </TableCell>
                  </TableRow>

                  {/* الأنشطة الاستثمارية */}
                  <TableRow className="bg-orange-50 dark:bg-orange-950">
                    <TableCell className="font-bold pt-4" colSpan={3}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        ثانياً: التدفقات النقدية من الأنشطة الاستثمارية
                      </div>
                    </TableCell>
                  </TableRow>

                  <TableRow className="bg-muted/50">
                    <TableCell className="font-semibold" colSpan={3}>المشتريات الرأسمالية:</TableCell>
                  </TableRow>
                  {cashFlowData.investing.purchases.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="pr-8">{item.item}</TableCell>
                      <TableCell className="text-left font-mono text-red-600">({formatCurrency(Math.abs(item.amount), 'IQD')})</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}

                  <TableRow className="bg-muted/50">
                    <TableCell className="font-semibold" colSpan={3}>متحصلات بيع الأصول:</TableCell>
                  </TableRow>
                  {cashFlowData.investing.sales.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="pr-8">{item.item}</TableCell>
                      <TableCell className="text-left font-mono text-green-600">{formatCurrency(item.amount, 'IQD')}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}

                  <TableRow className="bg-muted/50">
                    <TableCell className="font-semibold" colSpan={3}>الاستثمارات:</TableCell>
                  </TableRow>
                  {cashFlowData.investing.investments.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="pr-8">{item.item}</TableCell>
                      <TableCell className="text-left font-mono text-red-600">({formatCurrency(Math.abs(item.amount), 'IQD')})</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}

                  <TableRow className="font-bold bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900 dark:to-amber-900">
                    <TableCell className="flex items-center gap-2">
                      {investingCashFlow >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-orange-600" />
                      )}
                      صافي التدفق النقدي من الأنشطة الاستثمارية
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className={`text-left font-mono ${investingCashFlow >= 0 ? 'text-green-600' : 'text-orange-700 dark:text-orange-300'}`}>
                      {investingCashFlow >= 0 ? formatCurrency(investingCashFlow, 'IQD') : `(${formatCurrency(Math.abs(investingCashFlow), 'IQD')})`}
                    </TableCell>
                  </TableRow>

                  {/* الأنشطة التمويلية */}
                  <TableRow className="bg-purple-50 dark:bg-purple-950">
                    <TableCell className="font-bold pt-4" colSpan={3}>
                      <div className="flex items-center gap-2">
                        <Landmark className="h-4 w-4" />
                        ثالثاً: التدفقات النقدية من الأنشطة التمويلية
                      </div>
                    </TableCell>
                  </TableRow>

                  <TableRow className="bg-muted/50">
                    <TableCell className="font-semibold" colSpan={3}>الاقتراض:</TableCell>
                  </TableRow>
                  {cashFlowData.financing.borrowings.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="pr-8">{item.item}</TableCell>
                      <TableCell className="text-left font-mono text-green-600">{formatCurrency(item.amount, 'IQD')}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}

                  <TableRow className="bg-muted/50">
                    <TableCell className="font-semibold" colSpan={3}>سداد القروض:</TableCell>
                  </TableRow>
                  {cashFlowData.financing.repayments.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="pr-8">{item.item}</TableCell>
                      <TableCell className="text-left font-mono text-red-600">({formatCurrency(Math.abs(item.amount), 'IQD')})</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}

                  <TableRow className="bg-muted/50">
                    <TableCell className="font-semibold" colSpan={3}>حقوق الملكية:</TableCell>
                  </TableRow>
                  {cashFlowData.financing.equity.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="pr-8">{item.item}</TableCell>
                      <TableCell className={`text-left font-mono ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.amount >= 0 ? formatCurrency(item.amount, 'IQD') : `(${formatCurrency(Math.abs(item.amount), 'IQD')})`}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}

                  <TableRow className="font-bold bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900 dark:to-violet-900">
                    <TableCell className="flex items-center gap-2">
                      {financingCashFlow >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                      صافي التدفق النقدي من الأنشطة التمويلية
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className={`text-left font-mono ${financingCashFlow >= 0 ? 'text-purple-700 dark:text-purple-300' : 'text-red-600'}`}>
                      {financingCashFlow >= 0 ? formatCurrency(financingCashFlow, 'IQD') : `(${formatCurrency(Math.abs(financingCashFlow), 'IQD')})`}
                    </TableCell>
                  </TableRow>

                  {/* الملخص */}
                  <TableRow className="font-bold bg-yellow-100 dark:bg-yellow-900">
                    <TableCell className="flex items-center gap-2 pt-4">
                      <ArrowRightLeft className="h-5 w-5" />
                      صافي التغير في النقدية
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className={`text-left font-mono pt-4 ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {netCashFlow >= 0 ? formatCurrency(netCashFlow, 'IQD') : `(${formatCurrency(Math.abs(netCashFlow), 'IQD')})`}
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>النقدية في بداية الفترة</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-left font-mono">{formatCurrency(openingCash, 'IQD')}</TableCell>
                  </TableRow>

                  <TableRow className="font-bold text-xl bg-gradient-to-r from-green-200 to-emerald-200 dark:from-green-800 dark:to-emerald-800">
                    <TableCell className="flex items-center gap-2">
                      <Wallet className="h-6 w-6 text-green-600" />
                      النقدية في نهاية الفترة
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-left font-mono text-green-800 dark:text-green-200 text-xl">
                      {formatCurrency(closingCash, 'IQD')}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>مقارنة التدفقات النقدية - السنة الحالية مقابل السابقة</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">البيان</TableHead>
                    <TableHead className="text-left">السنة الحالية</TableHead>
                    <TableHead className="text-left">السنة السابقة</TableHead>
                    <TableHead className="text-left">التغير</TableHead>
                    <TableHead className="text-center">النسبة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-cyan-50 dark:bg-cyan-950">
                    <TableCell className="font-bold">التدفقات التشغيلية</TableCell>
                    <TableCell className="text-left font-mono">{formatCurrency(operatingCashFlow, 'IQD')}</TableCell>
                    <TableCell className="text-left font-mono">{formatCurrency(lastYearOperating, 'IQD')}</TableCell>
                    <TableCell className={`text-left font-mono ${operatingCashFlow - lastYearOperating >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(operatingCashFlow - lastYearOperating, 'IQD')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={operatingCashFlow >= lastYearOperating ? "default" : "destructive"}>
                        {operatingCashFlow >= lastYearOperating ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                        {Math.abs(((operatingCashFlow - lastYearOperating) / lastYearOperating * 100)).toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-orange-50 dark:bg-orange-950">
                    <TableCell className="font-bold">التدفقات الاستثمارية</TableCell>
                    <TableCell className="text-left font-mono">{formatCurrency(investingCashFlow, 'IQD')}</TableCell>
                    <TableCell className="text-left font-mono">{formatCurrency(lastYearInvesting, 'IQD')}</TableCell>
                    <TableCell className={`text-left font-mono ${investingCashFlow - lastYearInvesting >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(investingCashFlow - lastYearInvesting, 'IQD')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {Math.abs(((investingCashFlow - lastYearInvesting) / Math.abs(lastYearInvesting) * 100)).toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-purple-50 dark:bg-purple-950">
                    <TableCell className="font-bold">التدفقات التمويلية</TableCell>
                    <TableCell className="text-left font-mono">{formatCurrency(financingCashFlow, 'IQD')}</TableCell>
                    <TableCell className="text-left font-mono">{formatCurrency(lastYearFinancing, 'IQD')}</TableCell>
                    <TableCell className={`text-left font-mono ${financingCashFlow - lastYearFinancing >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(financingCashFlow - lastYearFinancing, 'IQD')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {lastYearFinancing !== 0 ? Math.abs(((financingCashFlow - lastYearFinancing) / Math.abs(lastYearFinancing) * 100)).toFixed(1) : 'N/A'}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow className="font-bold bg-green-100 dark:bg-green-900">
                    <TableCell>صافي التغير في النقدية</TableCell>
                    <TableCell className="text-left font-mono">{formatCurrency(netCashFlow, 'IQD')}</TableCell>
                    <TableCell className="text-left font-mono">{formatCurrency(lastYearNetCashFlow, 'IQD')}</TableCell>
                    <TableCell className={`text-left font-mono ${netCashFlow - lastYearNetCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(netCashFlow - lastYearNetCashFlow, 'IQD')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={netCashFlow >= lastYearNetCashFlow ? "default" : "destructive"}>
                        {netCashFlow >= lastYearNetCashFlow ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                        {lastYearNetCashFlow !== 0 ? Math.abs(((netCashFlow - lastYearNetCashFlow) / Math.abs(lastYearNetCashFlow) * 100)).toFixed(1) : 'N/A'}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow className="font-bold bg-blue-100 dark:bg-blue-900">
                    <TableCell>رصيد النقدية الختامي</TableCell>
                    <TableCell className="text-left font-mono">{formatCurrency(closingCash, 'IQD')}</TableCell>
                    <TableCell className="text-left font-mono">{formatCurrency(lastYearClosingCash, 'IQD')}</TableCell>
                    <TableCell className={`text-left font-mono ${closingCash - lastYearClosingCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(closingCash - lastYearClosingCash, 'IQD')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={closingCash >= lastYearClosingCash ? "default" : "destructive"}>
                        {closingCash >= lastYearClosingCash ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                        {((closingCash - lastYearClosingCash) / lastYearClosingCash * 100).toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="h-5 w-5" />
                  تحليل مصادر واستخدامات النقدية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">مصادر النقدية</span>
                    <span className="text-sm text-green-600 font-bold">
                      {formatCurrency(totalReceipts + totalBorrowings + (totalEquity > 0 ? totalEquity : 0) + totalSales, 'IQD')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>من العمليات التشغيلية</span>
                      <span>{((totalReceipts / (totalReceipts + totalBorrowings + totalSales)) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={(totalReceipts / (totalReceipts + totalBorrowings + totalSales)) * 100} className="h-2" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">استخدامات النقدية</span>
                    <span className="text-sm text-red-600 font-bold">
                      {formatCurrency(Math.abs(totalPayments) + Math.abs(totalPurchases) + Math.abs(totalInvestments) + Math.abs(totalRepayments), 'IQD')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>للعمليات التشغيلية</span>
                      <span>{((Math.abs(totalPayments) / (Math.abs(totalPayments) + Math.abs(totalPurchases) + Math.abs(totalRepayments))) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={(Math.abs(totalPayments) / (Math.abs(totalPayments) + Math.abs(totalPurchases) + Math.abs(totalRepayments))) * 100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  توزيع التدفقات النقدية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                    تشغيلي
                  </span>
                  <div className="flex items-center gap-4">
                    <Progress value={Math.abs(operatingCashFlow / (Math.abs(operatingCashFlow) + Math.abs(investingCashFlow) + Math.abs(financingCashFlow))) * 100} className="w-24" />
                    <span className="font-mono text-sm w-12 text-left">
                      {(Math.abs(operatingCashFlow / (Math.abs(operatingCashFlow) + Math.abs(investingCashFlow) + Math.abs(financingCashFlow))) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    استثماري
                  </span>
                  <div className="flex items-center gap-4">
                    <Progress value={Math.abs(investingCashFlow / (Math.abs(operatingCashFlow) + Math.abs(investingCashFlow) + Math.abs(financingCashFlow))) * 100} className="w-24" />
                    <span className="font-mono text-sm w-12 text-left">
                      {(Math.abs(investingCashFlow / (Math.abs(operatingCashFlow) + Math.abs(investingCashFlow) + Math.abs(financingCashFlow))) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    تمويلي
                  </span>
                  <div className="flex items-center gap-4">
                    <Progress value={Math.abs(financingCashFlow / (Math.abs(operatingCashFlow) + Math.abs(investingCashFlow) + Math.abs(financingCashFlow))) * 100} className="w-24" />
                    <span className="font-mono text-sm w-12 text-left">
                      {(Math.abs(financingCashFlow / (Math.abs(operatingCashFlow) + Math.abs(investingCashFlow) + Math.abs(financingCashFlow))) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ratios" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  نسبة التدفق التشغيلي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-cyan-600">{operatingCashRatio}%</div>
                <Progress value={parseFloat(operatingCashRatio)} className="mt-3" />
                <p className="text-xs text-muted-foreground mt-2">التدفق التشغيلي / المدفوعات</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  نسبة تغطية الديون
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{cashFlowCoverage}x</div>
                <Progress value={Math.min(parseFloat(cashFlowCoverage) * 20, 100)} className="mt-3" />
                <p className="text-xs text-muted-foreground mt-2">التدفق التشغيلي / سداد القروض</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <HandCoins className="h-4 w-4" />
                  التدفق النقدي الحر
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${freeСashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {(freeСashFlow / 1000000).toFixed(1)}M
                </div>
                <Progress value={freeСashFlow >= 0 ? 75 : 25} className="mt-3" />
                <p className="text-xs text-muted-foreground mt-2">التشغيلي + الاستثماري</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Growth className="h-4 w-4" />
                  نمو التدفق التشغيلي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${parseFloat(cashFlowGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {cashFlowGrowth}%
                </div>
                <Progress value={Math.min(Math.abs(parseFloat(cashFlowGrowth)), 100)} className="mt-3" />
                <p className="text-xs text-muted-foreground mt-2">مقارنة بالعام السابق</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
