import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, TrendingUp, Calculator, Building2, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

export const BalanceSheet = () => {
  const { toast } = useToast();

  const balanceSheetData = {
    assets: {
      current: [
        { name: 'النقدية في الصندوق', amount: 5000000 },
        { name: 'النقدية في البنك', amount: 15000000 },
        { name: 'الذمم المدينة', amount: 8000000 },
        { name: 'مخزون المعدات', amount: 3000000 },
      ],
      fixed: [
        { name: 'المعدات والأجهزة', amount: 25000000 },
        { name: 'الأثاث والتجهيزات', amount: 5000000 },
        { name: 'السيارات', amount: 10000000 },
        { name: 'المباني', amount: 50000000 },
      ]
    },
    liabilities: {
      current: [
        { name: 'الذمم الدائنة', amount: 4000000 },
        { name: 'المصروفات المستحقة', amount: 2000000 },
        { name: 'قروض قصيرة الأجل', amount: 5000000 },
      ],
      longTerm: [
        { name: 'قروض طويلة الأجل', amount: 20000000 },
        { name: 'التزامات أخرى', amount: 3000000 },
      ]
    }
  };

  const totalCurrentAssets = balanceSheetData.assets.current.reduce((sum, item) => sum + item.amount, 0);
  const totalFixedAssets = balanceSheetData.assets.fixed.reduce((sum, item) => sum + item.amount, 0);
  const totalAssets = totalCurrentAssets + totalFixedAssets;

  const totalCurrentLiabilities = balanceSheetData.liabilities.current.reduce((sum, item) => sum + item.amount, 0);
  const totalLongTermLiabilities = balanceSheetData.liabilities.longTerm.reduce((sum, item) => sum + item.amount, 0);
  const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

  const equity = totalAssets - totalLiabilities;

  const handleExport = () => {
    toast({
      title: 'تصدير الميزانية',
      description: 'سيتم تصدير الميزانية العمومية قريباً'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">الميزانية العمومية</h2>
            <p className="text-sm text-muted-foreground">كما في {new Date().toLocaleDateString('ar-IQ')}</p>
          </div>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 ml-2" />
          تصدير PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* الأصول */}
        <Card>
          <CardHeader className="bg-green-50 dark:bg-green-950">
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <TrendingUp className="h-5 w-5" />
              الأصول (Assets)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* الأصول المتداولة */}
            <div>
              <h3 className="font-semibold mb-3 text-lg">الأصول المتداولة</h3>
              <div className="space-y-2">
                {balanceSheetData.assets.current.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 hover:bg-muted/50 rounded">
                    <span className="text-sm">{item.name}</span>
                    <span className="font-medium">{formatCurrency(item.amount, 'IQD')}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center p-2 bg-green-100 dark:bg-green-950 rounded font-semibold">
                  <span>إجمالي الأصول المتداولة</span>
                  <span className="text-green-600">{formatCurrency(totalCurrentAssets, 'IQD')}</span>
                </div>
              </div>
            </div>

            {/* الأصول الثابتة */}
            <div>
              <h3 className="font-semibold mb-3 text-lg">الأصول الثابتة</h3>
              <div className="space-y-2">
                {balanceSheetData.assets.fixed.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 hover:bg-muted/50 rounded">
                    <span className="text-sm">{item.name}</span>
                    <span className="font-medium">{formatCurrency(item.amount, 'IQD')}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center p-2 bg-green-100 dark:bg-green-950 rounded font-semibold">
                  <span>إجمالي الأصول الثابتة</span>
                  <span className="text-green-600">{formatCurrency(totalFixedAssets, 'IQD')}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-green-600">
              <div className="flex justify-between items-center p-3 bg-green-200 dark:bg-green-900 rounded-lg">
                <span className="font-bold text-lg">إجمالي الأصول</span>
                <span className="font-bold text-lg text-green-700 dark:text-green-400">
                  {formatCurrency(totalAssets, 'IQD')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* الخصوم وحقوق الملكية */}
        <Card>
          <CardHeader className="bg-blue-50 dark:bg-blue-950">
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Wallet className="h-5 w-5" />
              الخصوم وحقوق الملكية (Liabilities & Equity)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* الخصوم المتداولة */}
            <div>
              <h3 className="font-semibold mb-3 text-lg">الخصوم المتداولة</h3>
              <div className="space-y-2">
                {balanceSheetData.liabilities.current.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 hover:bg-muted/50 rounded">
                    <span className="text-sm">{item.name}</span>
                    <span className="font-medium">{formatCurrency(item.amount, 'IQD')}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center p-2 bg-blue-100 dark:bg-blue-950 rounded font-semibold">
                  <span>إجمالي الخصوم المتداولة</span>
                  <span className="text-blue-600">{formatCurrency(totalCurrentLiabilities, 'IQD')}</span>
                </div>
              </div>
            </div>

            {/* الخصوم طويلة الأجل */}
            <div>
              <h3 className="font-semibold mb-3 text-lg">الخصوم طويلة الأجل</h3>
              <div className="space-y-2">
                {balanceSheetData.liabilities.longTerm.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 hover:bg-muted/50 rounded">
                    <span className="text-sm">{item.name}</span>
                    <span className="font-medium">{formatCurrency(item.amount, 'IQD')}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center p-2 bg-blue-100 dark:bg-blue-950 rounded font-semibold">
                  <span>إجمالي الخصوم طويلة الأجل</span>
                  <span className="text-blue-600">{formatCurrency(totalLongTermLiabilities, 'IQD')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center p-2 bg-blue-100 dark:bg-blue-950 rounded font-semibold">
              <span>إجمالي الخصوم</span>
              <span className="text-blue-600">{formatCurrency(totalLiabilities, 'IQD')}</span>
            </div>

            {/* حقوق الملكية */}
            <div>
              <h3 className="font-semibold mb-3 text-lg">حقوق الملكية</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 hover:bg-muted/50 rounded">
                  <span className="text-sm">رأس المال</span>
                  <span className="font-medium">{formatCurrency(equity * 0.6, 'IQD')}</span>
                </div>
                <div className="flex justify-between items-center p-2 hover:bg-muted/50 rounded">
                  <span className="text-sm">الأرباح المحتجزة</span>
                  <span className="font-medium">{formatCurrency(equity * 0.4, 'IQD')}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-100 dark:bg-purple-950 rounded font-semibold">
                  <span>إجمالي حقوق الملكية</span>
                  <span className="text-purple-600">{formatCurrency(equity, 'IQD')}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-blue-600">
              <div className="flex justify-between items-center p-3 bg-blue-200 dark:bg-blue-900 rounded-lg">
                <span className="font-bold text-lg">إجمالي الخصوم وحقوق الملكية</span>
                <span className="font-bold text-lg text-blue-700 dark:text-blue-400">
                  {formatCurrency(totalLiabilities + equity, 'IQD')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* النسب المالية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            النسب المالية المستخرجة من الميزانية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">نسبة التداول</p>
              <p className="text-2xl font-bold text-blue-600">
                {(totalCurrentAssets / totalCurrentLiabilities).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">الأصول المتداولة / الخصوم المتداولة</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">نسبة الملكية</p>
              <p className="text-2xl font-bold text-green-600">
                {((equity / totalAssets) * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">حقوق الملكية / إجمالي الأصول</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">نسبة المديونية</p>
              <p className="text-2xl font-bold text-orange-600">
                {((totalLiabilities / totalAssets) * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">إجمالي الخصوم / إجمالي الأصول</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">رأس المال العامل</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(totalCurrentAssets - totalCurrentLiabilities, 'IQD')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">الأصول المتداولة - الخصوم المتداولة</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};