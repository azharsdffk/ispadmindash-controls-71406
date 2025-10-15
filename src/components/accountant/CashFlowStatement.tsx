import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileDown, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';

export const CashFlowStatement = () => {
  const { toast } = useToast();

  // بيانات قائمة التدفقات النقدية
  const cashFlowData = {
    operating: [
      { item: 'صافي الربح', amount: 18700000, isSubtotal: true },
      { item: 'تعديلات:', amount: 0, isHeader: true },
      { item: 'استهلاك الأصول الثابتة', amount: 2000000 },
      { item: 'الزيادة في الذمم المدينة', amount: -3500000 },
      { item: 'الزيادة في المخزون', amount: -1200000 },
      { item: 'الزيادة في الذمم الدائنة', amount: 1800000 },
    ],
    investing: [
      { item: 'شراء معدات', amount: -8000000 },
      { item: 'شراء أصول ثابتة', amount: -5000000 },
      { item: 'استثمارات طويلة الأجل', amount: -2000000 },
    ],
    financing: [
      { item: 'قرض بنكي جديد', amount: 10000000 },
      { item: 'سداد أقساط قروض', amount: -4000000 },
      { item: 'توزيعات أرباح', amount: -3000000 },
    ],
  };

  const operatingCashFlow = cashFlowData.operating
    .filter(item => !item.isHeader)
    .reduce((sum, item) => sum + item.amount, 0);
  
  const investingCashFlow = cashFlowData.investing
    .reduce((sum, item) => sum + item.amount, 0);
  
  const financingCashFlow = cashFlowData.financing
    .reduce((sum, item) => sum + item.amount, 0);
  
  const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;
  
  const openingCash = 12000000; // رصيد أول المدة
  const closingCash = openingCash + netCashFlow;

  const handleExport = () => {
    toast({
      title: 'تصدير قائمة التدفقات النقدية',
      description: 'سيتم تصدير القائمة إلى PDF...',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">قائمة التدفقات النقدية</h2>
          <p className="text-muted-foreground">للفترة المنتهية في 31 ديسمبر 2024</p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <FileDown className="h-4 w-4" />
          تصدير PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>التدفقات النقدية</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">البيان</TableHead>
                <TableHead className="text-left">المبلغ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* التدفقات النقدية من الأنشطة التشغيلية */}
              <TableRow className="bg-blue-50 dark:bg-blue-950">
                <TableCell className="font-bold" colSpan={2}>
                  التدفقات النقدية من الأنشطة التشغيلية
                </TableCell>
              </TableRow>
              {cashFlowData.operating.map((item, index) => (
                <TableRow key={index} className={item.isHeader ? 'bg-muted/50' : ''}>
                  <TableCell className={`${item.isHeader ? 'font-semibold' : 'pr-8'} ${item.isSubtotal ? 'font-bold' : ''}`}>
                    {item.item}
                  </TableCell>
                  {!item.isHeader && (
                    <TableCell className={`text-left font-mono ${item.isSubtotal ? 'font-bold' : ''}`}>
                      {formatCurrency(item.amount, 'IQD')}
                    </TableCell>
                  )}
                  {item.isHeader && <TableCell />}
                </TableRow>
              ))}
              <TableRow className="font-bold bg-blue-100 dark:bg-blue-900">
                <TableCell className="flex items-center gap-2">
                  {operatingCashFlow >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  صافي التدفق النقدي من الأنشطة التشغيلية
                </TableCell>
                <TableCell className="text-left font-mono">
                  {formatCurrency(operatingCashFlow, 'IQD')}
                </TableCell>
              </TableRow>

              {/* التدفقات النقدية من الأنشطة الاستثمارية */}
              <TableRow className="bg-orange-50 dark:bg-orange-950">
                <TableCell className="font-bold pt-4" colSpan={2}>
                  التدفقات النقدية من الأنشطة الاستثمارية
                </TableCell>
              </TableRow>
              {cashFlowData.investing.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="pr-8">{item.item}</TableCell>
                  <TableCell className="text-left font-mono">
                    {formatCurrency(item.amount, 'IQD')}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-orange-100 dark:bg-orange-900">
                <TableCell className="flex items-center gap-2">
                  {investingCashFlow >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  صافي التدفق النقدي من الأنشطة الاستثمارية
                </TableCell>
                <TableCell className="text-left font-mono">
                  {formatCurrency(investingCashFlow, 'IQD')}
                </TableCell>
              </TableRow>

              {/* التدفقات النقدية من الأنشطة التمويلية */}
              <TableRow className="bg-purple-50 dark:bg-purple-950">
                <TableCell className="font-bold pt-4" colSpan={2}>
                  التدفقات النقدية من الأنشطة التمويلية
                </TableCell>
              </TableRow>
              {cashFlowData.financing.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="pr-8">{item.item}</TableCell>
                  <TableCell className="text-left font-mono">
                    {formatCurrency(item.amount, 'IQD')}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-purple-100 dark:bg-purple-900">
                <TableCell className="flex items-center gap-2">
                  {financingCashFlow >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  صافي التدفق النقدي من الأنشطة التمويلية
                </TableCell>
                <TableCell className="text-left font-mono">
                  {formatCurrency(financingCashFlow, 'IQD')}
                </TableCell>
              </TableRow>

              {/* صافي التغير في النقدية */}
              <TableRow className="font-bold text-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                <TableCell className="flex items-center gap-2 pt-4">
                  {netCashFlow >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                  صافي التغير في النقدية
                </TableCell>
                <TableCell className="text-left font-mono text-lg pt-4">
                  {formatCurrency(netCashFlow, 'IQD')}
                </TableCell>
              </TableRow>

              {/* النقدية في بداية ونهاية الفترة */}
              <TableRow>
                <TableCell className="pt-4">النقدية في بداية الفترة</TableCell>
                <TableCell className="text-left font-mono pt-4">
                  {formatCurrency(openingCash, 'IQD')}
                </TableCell>
              </TableRow>
              <TableRow className="font-bold text-lg bg-primary/10">
                <TableCell>النقدية في نهاية الفترة</TableCell>
                <TableCell className="text-left font-mono text-lg">
                  {formatCurrency(closingCash, 'IQD')}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ملخص التدفقات */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">التدفقات التشغيلية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(operatingCashFlow, 'IQD')}</div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">التدفقات الاستثمارية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(investingCashFlow, 'IQD')}</div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">التدفقات التمويلية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(financingCashFlow, 'IQD')}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">صافي التدفق النقدي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(netCashFlow, 'IQD')}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};