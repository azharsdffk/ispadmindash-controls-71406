import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, TrendingUp, Calculator, Building2, Wallet, Printer } from 'lucide-react';
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

  const handleExportPDF = () => {
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>الميزانية العمومية</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 40px; background: white; direction: rtl; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1e40af; padding-bottom: 20px; }
          .header h1 { color: #1e40af; font-size: 28px; margin-bottom: 10px; }
          .header p { color: #666; font-size: 14px; }
          .content { display: flex; gap: 30px; margin-bottom: 30px; }
          .section { flex: 1; }
          .section-title { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 12px 20px; border-radius: 8px 8px 0 0; font-size: 16px; font-weight: bold; }
          .section-title.assets { background: linear-gradient(135deg, #166534, #22c55e); }
          .section-content { border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px; }
          .category { margin-bottom: 20px; }
          .category-title { font-weight: bold; color: #374151; margin-bottom: 10px; font-size: 14px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          .item { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; border-bottom: 1px dashed #f3f4f6; }
          .item:last-child { border-bottom: none; }
          .subtotal { background: #f9fafb; padding: 10px; border-radius: 6px; margin-top: 10px; font-weight: bold; display: flex; justify-content: space-between; }
          .subtotal.green { background: #dcfce7; color: #166534; }
          .subtotal.blue { background: #dbeafe; color: #1e40af; }
          .subtotal.purple { background: #f3e8ff; color: #7c3aed; }
          .total { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 15px 20px; border-radius: 8px; margin-top: 15px; display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; }
          .total.green { background: linear-gradient(135deg, #166534, #22c55e); }
          .ratios { margin-top: 30px; }
          .ratios-title { font-size: 18px; font-weight: bold; color: #374151; margin-bottom: 15px; text-align: center; }
          .ratios-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
          .ratio-card { background: linear-gradient(135deg, #f8fafc, #e2e8f0); padding: 15px; border-radius: 8px; text-align: center; }
          .ratio-card .label { font-size: 12px; color: #64748b; margin-bottom: 5px; }
          .ratio-card .value { font-size: 24px; font-weight: bold; color: #1e40af; }
          .ratio-card .desc { font-size: 10px; color: #94a3b8; margin-top: 5px; }
          .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          @media print { body { padding: 20px; } .content { flex-direction: row; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>الميزانية العمومية</h1>
          <p>كما في ${new Date().toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        
        <div class="content">
          <div class="section">
            <div class="section-title assets">الأصول (Assets)</div>
            <div class="section-content">
              <div class="category">
                <div class="category-title">الأصول المتداولة</div>
                ${balanceSheetData.assets.current.map(item => `
                  <div class="item">
                    <span>${item.name}</span>
                    <span>${item.amount.toLocaleString('en-US')} د.ع</span>
                  </div>
                `).join('')}
                <div class="subtotal green">
                  <span>إجمالي الأصول المتداولة</span>
                  <span>${totalCurrentAssets.toLocaleString('en-US')} د.ع</span>
                </div>
              </div>
              
              <div class="category">
                <div class="category-title">الأصول الثابتة</div>
                ${balanceSheetData.assets.fixed.map(item => `
                  <div class="item">
                    <span>${item.name}</span>
                    <span>${item.amount.toLocaleString('en-US')} د.ع</span>
                  </div>
                `).join('')}
                <div class="subtotal green">
                  <span>إجمالي الأصول الثابتة</span>
                  <span>${totalFixedAssets.toLocaleString('en-US')} د.ع</span>
                </div>
              </div>
              
              <div class="total green">
                <span>إجمالي الأصول</span>
                <span>${totalAssets.toLocaleString('en-US')} د.ع</span>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">الخصوم وحقوق الملكية</div>
            <div class="section-content">
              <div class="category">
                <div class="category-title">الخصوم المتداولة</div>
                ${balanceSheetData.liabilities.current.map(item => `
                  <div class="item">
                    <span>${item.name}</span>
                    <span>${item.amount.toLocaleString('en-US')} د.ع</span>
                  </div>
                `).join('')}
                <div class="subtotal blue">
                  <span>إجمالي الخصوم المتداولة</span>
                  <span>${totalCurrentLiabilities.toLocaleString('en-US')} د.ع</span>
                </div>
              </div>
              
              <div class="category">
                <div class="category-title">الخصوم طويلة الأجل</div>
                ${balanceSheetData.liabilities.longTerm.map(item => `
                  <div class="item">
                    <span>${item.name}</span>
                    <span>${item.amount.toLocaleString('en-US')} د.ع</span>
                  </div>
                `).join('')}
                <div class="subtotal blue">
                  <span>إجمالي الخصوم طويلة الأجل</span>
                  <span>${totalLongTermLiabilities.toLocaleString('en-US')} د.ع</span>
                </div>
              </div>
              
              <div class="subtotal blue">
                <span>إجمالي الخصوم</span>
                <span>${totalLiabilities.toLocaleString('en-US')} د.ع</span>
              </div>
              
              <div class="category" style="margin-top: 15px;">
                <div class="category-title">حقوق الملكية</div>
                <div class="item">
                  <span>رأس المال</span>
                  <span>${(equity * 0.6).toLocaleString('en-US')} د.ع</span>
                </div>
                <div class="item">
                  <span>الأرباح المحتجزة</span>
                  <span>${(equity * 0.4).toLocaleString('en-US')} د.ع</span>
                </div>
                <div class="subtotal purple">
                  <span>إجمالي حقوق الملكية</span>
                  <span>${equity.toLocaleString('en-US')} د.ع</span>
                </div>
              </div>
              
              <div class="total">
                <span>إجمالي الخصوم وحقوق الملكية</span>
                <span>${(totalLiabilities + equity).toLocaleString('en-US')} د.ع</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="ratios">
          <div class="ratios-title">النسب المالية</div>
          <div class="ratios-grid">
            <div class="ratio-card">
              <div class="label">نسبة التداول</div>
              <div class="value">${(totalCurrentAssets / totalCurrentLiabilities).toFixed(2)}</div>
              <div class="desc">الأصول المتداولة / الخصوم المتداولة</div>
            </div>
            <div class="ratio-card">
              <div class="label">نسبة الملكية</div>
              <div class="value">${((equity / totalAssets) * 100).toFixed(1)}%</div>
              <div class="desc">حقوق الملكية / إجمالي الأصول</div>
            </div>
            <div class="ratio-card">
              <div class="label">نسبة المديونية</div>
              <div class="value">${((totalLiabilities / totalAssets) * 100).toFixed(1)}%</div>
              <div class="desc">إجمالي الخصوم / إجمالي الأصول</div>
            </div>
            <div class="ratio-card">
              <div class="label">رأس المال العامل</div>
              <div class="value">${((totalCurrentAssets - totalCurrentLiabilities) / 1000000).toFixed(1)}M</div>
              <div class="desc">الأصول المتداولة - الخصوم المتداولة</div>
            </div>
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
      printWindow.onload = () => {
        printWindow.print();
      };
      toast({
        title: 'تم فتح نافذة الطباعة',
        description: 'يمكنك طباعة الميزانية أو حفظها كـ PDF'
      });
    } else {
      toast({
        title: 'خطأ',
        description: 'يرجى السماح بالنوافذ المنبثقة لتصدير PDF',
        variant: 'destructive'
      });
    }
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
        <Button onClick={handleExportPDF} variant="outline">
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