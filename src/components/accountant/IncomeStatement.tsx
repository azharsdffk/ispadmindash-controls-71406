import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileDown, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';

export const IncomeStatement = () => {
  const { toast } = useToast();

  // بيانات قائمة الدخل
  const incomeData = {
    revenues: [
      { account: 'إيرادات الاشتراكات', amount: 45000000 },
      { account: 'إيرادات التركيبات', amount: 8500000 },
      { account: 'إيرادات الصيانة', amount: 3200000 },
    ],
    operatingExpenses: [
      { account: 'رواتب الموظفين', amount: 15000000 },
      { account: 'إيجار المكتب', amount: 5000000 },
      { account: 'مصاريف الكهرباء والماء', amount: 2500000 },
      { account: 'مصاريف الصيانة', amount: 1800000 },
      { account: 'مصاريف التسويق', amount: 3000000 },
    ],
    otherExpenses: [
      { account: 'فوائد القروض', amount: 1200000 },
      { account: 'مصاريف أخرى', amount: 800000 },
    ],
  };

  const totalRevenue = incomeData.revenues.reduce((sum, item) => sum + item.amount, 0);
  const totalOperatingExpenses = incomeData.operatingExpenses.reduce((sum, item) => sum + item.amount, 0);
  const operatingProfit = totalRevenue - totalOperatingExpenses;
  const totalOtherExpenses = incomeData.otherExpenses.reduce((sum, item) => sum + item.amount, 0);
  const netProfit = operatingProfit - totalOtherExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : '0.00';

  const handleExport = () => {
    toast({
      title: 'تصدير قائمة الدخل',
      description: 'سيتم تصدير قائمة الدخل إلى PDF...',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">قائمة الدخل</h2>
          <p className="text-muted-foreground">للفترة المنتهية في 31 ديسمبر 2024</p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <FileDown className="h-4 w-4" />
          تصدير PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الدخل التفصيلية</CardTitle>
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
              {/* الإيرادات */}
              <TableRow className="bg-muted/50">
                <TableCell className="font-bold" colSpan={2}>الإيرادات</TableCell>
              </TableRow>
              {incomeData.revenues.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="pr-8">{item.account}</TableCell>
                  <TableCell className="text-left font-mono">
                    {formatCurrency(item.amount, 'IQD')}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-primary/5">
                <TableCell>إجمالي الإيرادات</TableCell>
                <TableCell className="text-left font-mono">
                  {formatCurrency(totalRevenue, 'IQD')}
                </TableCell>
              </TableRow>

              {/* المصاريف التشغيلية */}
              <TableRow className="bg-muted/50">
                <TableCell className="font-bold pt-4" colSpan={2}>المصاريف التشغيلية</TableCell>
              </TableRow>
              {incomeData.operatingExpenses.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="pr-8">{item.account}</TableCell>
                  <TableCell className="text-left font-mono">
                    {formatCurrency(item.amount, 'IQD')}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-orange-50 dark:bg-orange-950">
                <TableCell>إجمالي المصاريف التشغيلية</TableCell>
                <TableCell className="text-left font-mono">
                  {formatCurrency(totalOperatingExpenses, 'IQD')}
                </TableCell>
              </TableRow>

              {/* الربح التشغيلي */}
              <TableRow className="font-bold bg-blue-50 dark:bg-blue-950">
                <TableCell className="flex items-center gap-2">
                  {operatingProfit >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  الربح التشغيلي
                </TableCell>
                <TableCell className="text-left font-mono">
                  {formatCurrency(operatingProfit, 'IQD')}
                </TableCell>
              </TableRow>

              {/* مصاريف أخرى */}
              <TableRow className="bg-muted/50">
                <TableCell className="font-bold pt-4" colSpan={2}>مصاريف أخرى</TableCell>
              </TableRow>
              {incomeData.otherExpenses.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="pr-8">{item.account}</TableCell>
                  <TableCell className="text-left font-mono">
                    {formatCurrency(item.amount, 'IQD')}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-orange-50 dark:bg-orange-950">
                <TableCell>إجمالي المصاريف الأخرى</TableCell>
                <TableCell className="text-left font-mono">
                  {formatCurrency(totalOtherExpenses, 'IQD')}
                </TableCell>
              </TableRow>

              {/* صافي الربح */}
              <TableRow className="font-bold text-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                <TableCell className="flex items-center gap-2">
                  {netProfit >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                  صافي الربح
                </TableCell>
                <TableCell className="text-left font-mono text-lg">
                  {formatCurrency(netProfit, 'IQD')}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* النسب المالية */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">هامش الربح الإجمالي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profitMargin}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              نسبة صافي الربح إلى الإيرادات
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">الربح التشغيلي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(operatingProfit, 'IQD')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              الربح قبل المصاريف الأخرى
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">نسبة المصاريف</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRevenue > 0 ? ((totalOperatingExpenses / totalRevenue) * 100).toFixed(2) : '0.00'}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              نسبة المصاريف إلى الإيرادات
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};