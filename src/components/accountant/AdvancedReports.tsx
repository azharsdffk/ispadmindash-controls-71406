import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/currency';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Printer,
  BarChart3,
  PieChart,
  LineChart,
  FileSpreadsheet,
  Filter,
  Search,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Building2,
  Wallet,
  Receipt,
  CreditCard,
  Target,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Settings,
  Bookmark,
  Share2,
  Mail,
  Layers,
  Calculator,
  DollarSign,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export const AdvancedReports = () => {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);

  // التقارير المالية المتاحة
  const financialReports = [
    {
      id: 'income-statement',
      title: 'قائمة الدخل',
      titleEn: 'Income Statement',
      description: 'تقرير شامل للإيرادات والمصروفات وصافي الربح',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900',
      category: 'أساسي',
      lastGenerated: '2024-01-15',
      status: 'ready',
      frequency: 'شهري'
    },
    {
      id: 'balance-sheet',
      title: 'الميزانية العمومية',
      titleEn: 'Balance Sheet',
      description: 'تقرير الأصول والخصوم وحقوق الملكية',
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-950 dark:to-cyan-900',
      category: 'أساسي',
      lastGenerated: '2024-01-15',
      status: 'ready',
      frequency: 'شهري'
    },
    {
      id: 'cash-flow',
      title: 'قائمة التدفقات النقدية',
      titleEn: 'Cash Flow Statement',
      description: 'تحليل التدفقات النقدية من الأنشطة المختلفة',
      icon: Wallet,
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-900',
      category: 'أساسي',
      lastGenerated: '2024-01-14',
      status: 'ready',
      frequency: 'شهري'
    },
    {
      id: 'trial-balance',
      title: 'ميزان المراجعة',
      titleEn: 'Trial Balance',
      description: 'قائمة بجميع أرصدة الحسابات المدينة والدائنة',
      icon: Calculator,
      color: 'text-orange-600',
      bgColor: 'bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950 dark:to-amber-900',
      category: 'أساسي',
      lastGenerated: '2024-01-15',
      status: 'ready',
      frequency: 'يومي'
    },
    {
      id: 'accounts-receivable',
      title: 'تقرير الذمم المدينة',
      titleEn: 'Accounts Receivable',
      description: 'تحليل المبالغ المستحقة من العملاء وأعمارها',
      icon: Users,
      color: 'text-cyan-600',
      bgColor: 'bg-gradient-to-br from-cyan-50 to-teal-100 dark:from-cyan-950 dark:to-teal-900',
      category: 'تحليلي',
      lastGenerated: '2024-01-15',
      status: 'ready',
      frequency: 'أسبوعي'
    },
    {
      id: 'accounts-payable',
      title: 'تقرير الذمم الدائنة',
      titleEn: 'Accounts Payable',
      description: 'تحليل المبالغ المستحقة للموردين وتواريخ الاستحقاق',
      icon: CreditCard,
      color: 'text-red-600',
      bgColor: 'bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900',
      category: 'تحليلي',
      lastGenerated: '2024-01-14',
      status: 'pending',
      frequency: 'أسبوعي'
    },
    {
      id: 'revenue-analysis',
      title: 'تحليل الإيرادات',
      titleEn: 'Revenue Analysis',
      description: 'تحليل مفصل لمصادر الإيرادات والنمو',
      icon: LineChart,
      color: 'text-emerald-600',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-900',
      category: 'تحليلي',
      lastGenerated: '2024-01-15',
      status: 'ready',
      frequency: 'شهري'
    },
    {
      id: 'expense-analysis',
      title: 'تحليل المصروفات',
      titleEn: 'Expense Analysis',
      description: 'تحليل تفصيلي للمصروفات حسب الفئات',
      icon: PieChart,
      color: 'text-pink-600',
      bgColor: 'bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-950 dark:to-rose-900',
      category: 'تحليلي',
      lastGenerated: '2024-01-13',
      status: 'ready',
      frequency: 'شهري'
    },
    {
      id: 'budget-variance',
      title: 'تحليل انحرافات الميزانية',
      titleEn: 'Budget Variance',
      description: 'مقارنة الأداء الفعلي بالميزانية المخططة',
      icon: Target,
      color: 'text-indigo-600',
      bgColor: 'bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-950 dark:to-blue-900',
      category: 'إداري',
      lastGenerated: '2024-01-15',
      status: 'ready',
      frequency: 'شهري'
    },
    {
      id: 'profitability',
      title: 'تقرير الربحية',
      titleEn: 'Profitability Report',
      description: 'تحليل هوامش الربح والعائد على الاستثمار',
      icon: Percent,
      color: 'text-yellow-600',
      bgColor: 'bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-950 dark:to-amber-900',
      category: 'إداري',
      lastGenerated: '2024-01-14',
      status: 'ready',
      frequency: 'شهري'
    },
    {
      id: 'financial-ratios',
      title: 'النسب المالية',
      titleEn: 'Financial Ratios',
      description: 'مؤشرات الأداء المالي والسيولة والربحية',
      icon: Activity,
      color: 'text-teal-600',
      bgColor: 'bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-teal-950 dark:to-cyan-900',
      category: 'إداري',
      lastGenerated: '2024-01-15',
      status: 'ready',
      frequency: 'شهري'
    },
    {
      id: 'tax-report',
      title: 'التقرير الضريبي',
      titleEn: 'Tax Report',
      description: 'ملخص الالتزامات الضريبية والمستحقات',
      icon: Receipt,
      color: 'text-slate-600',
      bgColor: 'bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-950 dark:to-gray-900',
      category: 'ضريبي',
      lastGenerated: '2024-01-10',
      status: 'pending',
      frequency: 'ربع سنوي'
    },
  ];

  // بيانات الملخص
  const summaryData = {
    totalRevenue: 59600000,
    totalExpenses: 38900000,
    netProfit: 20700000,
    profitMargin: 34.7,
    revenueGrowth: 18.5,
    expenseGrowth: 12.3,
    cashBalance: 17800000,
    receivables: 8000000,
    payables: 4000000,
  };

  // بيانات الإيرادات حسب المصدر
  const revenueBreakdown = [
    { source: 'اشتراكات شهرية', amount: 45000000, percentage: 75.5, growth: 15.2 },
    { source: 'رسوم التركيب', amount: 8500000, percentage: 14.3, growth: 28.5 },
    { source: 'خدمات الصيانة', amount: 3200000, percentage: 5.4, growth: 12.0 },
    { source: 'ترقيات الباقات', amount: 2100000, percentage: 3.5, growth: 45.0 },
    { source: 'رسوم أخرى', amount: 800000, percentage: 1.3, growth: -5.2 },
  ];

  // بيانات المصروفات حسب الفئة
  const expenseBreakdown = [
    { category: 'رواتب الموظفين', amount: 15670000, percentage: 40.3, budget: 16000000 },
    { category: 'تكلفة الخدمات', amount: 12000000, percentage: 30.8, budget: 11500000 },
    { category: 'الإيجارات والمرافق', amount: 5650000, percentage: 14.5, budget: 5500000 },
    { category: 'التسويق والدعاية', amount: 3930000, percentage: 10.1, budget: 4500000 },
    { category: 'مصاريف إدارية', amount: 1650000, percentage: 4.3, budget: 1800000 },
  ];

  // التقارير المحفوظة
  const savedReports = [
    { id: 1, name: 'قائمة الدخل - ديسمبر 2024', date: '2024-01-15', type: 'PDF', size: '245 KB' },
    { id: 2, name: 'الميزانية العمومية - Q4 2024', date: '2024-01-14', type: 'PDF', size: '312 KB' },
    { id: 3, name: 'تحليل الإيرادات الشهري', date: '2024-01-13', type: 'Excel', size: '156 KB' },
    { id: 4, name: 'تقرير التدفقات النقدية', date: '2024-01-12', type: 'PDF', size: '198 KB' },
  ];

  const handleGenerateReport = (report: any) => {
    setSelectedReport(report);
    setShowReportDialog(true);
    toast({
      title: 'جاري إنشاء التقرير',
      description: `يتم الآن إنشاء تقرير ${report.title}...`
    });
  };

  const handleExportPDF = (reportTitle: string) => {
    toast({
      title: 'تصدير PDF',
      description: `جاري تصدير ${reportTitle} بصيغة PDF...`
    });
  };

  const handleExportExcel = (reportTitle: string) => {
    toast({
      title: 'تصدير Excel',
      description: `جاري تصدير ${reportTitle} بصيغة Excel...`
    });
  };

  const handleScheduleReport = (report: any) => {
    toast({
      title: 'جدولة التقرير',
      description: `تم جدولة تقرير ${report.title} للإنشاء التلقائي`
    });
  };

  const handleShareReport = (report: any) => {
    toast({
      title: 'مشاركة التقرير',
      description: `يمكنك الآن مشاركة تقرير ${report.title}`
    });
  };

  const filteredReports = financialReports.filter(report =>
    report.title.includes(searchQuery) || 
    report.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.description.includes(searchQuery)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />جاهز</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />قيد الإعداد</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />خطأ</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* الهيدر */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <FileText className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">التقارير المتقدمة</h2>
            <p className="text-muted-foreground text-sm">إنشاء وإدارة التقارير المالية والتحليلية</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="بحث في التقارير..." 
              className="pr-10 w-[200px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">اليوم</SelectItem>
              <SelectItem value="week">هذا الأسبوع</SelectItem>
              <SelectItem value="month">هذا الشهر</SelectItem>
              <SelectItem value="quarter">هذا الربع</SelectItem>
              <SelectItem value="year">هذه السنة</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 ml-2" />
            تصفية
          </Button>
          <Button size="sm">
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث الكل
          </Button>
        </div>
      </div>

      {/* بطاقات الملخص */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <Badge variant="secondary" className="text-xs">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                {summaryData.revenueGrowth}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
            <p className="text-lg font-bold text-green-700 dark:text-green-400">{(summaryData.totalRevenue / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CreditCard className="h-5 w-5 text-red-600" />
              <Badge variant="secondary" className="text-xs">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                {summaryData.expenseGrowth}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">إجمالي المصروفات</p>
            <p className="text-lg font-bold text-red-700 dark:text-red-400">{(summaryData.totalExpenses / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-950 dark:to-cyan-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <Badge variant="secondary" className="text-xs">{summaryData.profitMargin}%</Badge>
            </div>
            <p className="text-xs text-muted-foreground">صافي الربح</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{(summaryData.netProfit / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-900 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Wallet className="h-5 w-5 text-purple-600" />
              <Badge variant="secondary" className="text-xs">نقدي</Badge>
            </div>
            <p className="text-xs text-muted-foreground">الرصيد النقدي</p>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{(summaryData.cashBalance / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950 dark:to-amber-900 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-orange-600" />
              <Badge variant="secondary" className="text-xs">مدينة</Badge>
            </div>
            <p className="text-xs text-muted-foreground">الذمم المدينة</p>
            <p className="text-lg font-bold text-orange-700 dark:text-orange-400">{(summaryData.receivables / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-950 dark:to-rose-900 border-pink-200 dark:border-pink-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="h-5 w-5 text-pink-600" />
              <Badge variant="secondary" className="text-xs">دائنة</Badge>
            </div>
            <p className="text-xs text-muted-foreground">الذمم الدائنة</p>
            <p className="text-lg font-bold text-pink-700 dark:text-pink-400">{(summaryData.payables / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات */}
      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="reports">التقارير المتاحة</TabsTrigger>
          <TabsTrigger value="revenue">تحليل الإيرادات</TabsTrigger>
          <TabsTrigger value="expenses">تحليل المصروفات</TabsTrigger>
          <TabsTrigger value="saved">التقارير المحفوظة</TabsTrigger>
          <TabsTrigger value="scheduled">التقارير المجدولة</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report) => {
              const Icon = report.icon;
              return (
                <Card key={report.id} className={`${report.bgColor} hover:shadow-lg transition-shadow cursor-pointer`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-white/50 dark:bg-black/20`}>
                          <Icon className={`h-5 w-5 ${report.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-base">{report.title}</CardTitle>
                          <p className="text-xs text-muted-foreground">{report.titleEn}</p>
                        </div>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {report.lastGenerated}
                      </span>
                      <Badge variant="outline" className="text-xs">{report.frequency}</Badge>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="flex-1"
                        onClick={() => handleGenerateReport(report)}
                      >
                        <Eye className="h-3 w-3 ml-1" />
                        عرض
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleExportPDF(report.title)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleExportExcel(report.title)}
                      >
                        <FileSpreadsheet className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleScheduleReport(report)}
                      >
                        <Clock className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                تحليل الإيرادات حسب المصدر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">مصدر الإيراد</TableHead>
                    <TableHead className="text-left">المبلغ</TableHead>
                    <TableHead className="text-center">النسبة</TableHead>
                    <TableHead className="text-center">النمو</TableHead>
                    <TableHead className="text-center">التوزيع</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueBreakdown.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.source}</TableCell>
                      <TableCell className="text-left font-mono">{formatCurrency(item.amount, 'IQD')}</TableCell>
                      <TableCell className="text-center">{item.percentage}%</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={item.growth >= 0 ? "default" : "destructive"} className="text-xs">
                          {item.growth >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                          {Math.abs(item.growth)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Progress value={item.percentage} className="h-2" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">إجمالي الإيرادات</span>
                  <span className="font-bold text-lg text-green-600">{formatCurrency(summaryData.totalRevenue, 'IQD')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-red-600" />
                تحليل المصروفات حسب الفئة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">فئة المصروف</TableHead>
                    <TableHead className="text-left">الفعلي</TableHead>
                    <TableHead className="text-left">الميزانية</TableHead>
                    <TableHead className="text-center">النسبة</TableHead>
                    <TableHead className="text-center">الأداء</TableHead>
                    <TableHead className="text-center">التوزيع</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseBreakdown.map((item, index) => {
                    const variance = ((item.amount - item.budget) / item.budget * 100).toFixed(1);
                    const isOverBudget = item.amount > item.budget;
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.category}</TableCell>
                        <TableCell className="text-left font-mono">{formatCurrency(item.amount, 'IQD')}</TableCell>
                        <TableCell className="text-left font-mono text-muted-foreground">{formatCurrency(item.budget, 'IQD')}</TableCell>
                        <TableCell className="text-center">{item.percentage}%</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={isOverBudget ? "destructive" : "default"} className="text-xs">
                            {isOverBudget ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                            {variance}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Progress value={item.percentage} className="h-2" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">إجمالي المصروفات</span>
                  <span className="font-bold text-lg text-red-600">{formatCurrency(summaryData.totalExpenses, 'IQD')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5" />
                التقارير المحفوظة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم التقرير</TableHead>
                    <TableHead className="text-center">التاريخ</TableHead>
                    <TableHead className="text-center">النوع</TableHead>
                    <TableHead className="text-center">الحجم</TableHead>
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell className="text-center">{report.date}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={report.type === 'PDF' ? 'default' : 'secondary'}>{report.type}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">{report.size}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                التقارير المجدولة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">قائمة الدخل الشهرية</p>
                      <p className="text-sm text-muted-foreground">يتم إنشاؤه تلقائياً في بداية كل شهر</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">نشط</Badge>
                    <Button variant="outline" size="sm" onClick={() => toast({ title: 'إعدادات التقرير', description: 'فتح إعدادات قائمة الدخل الشهرية' })}>
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">الميزانية العمومية الربع سنوية</p>
                      <p className="text-sm text-muted-foreground">يتم إنشاؤه في نهاية كل ربع</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">نشط</Badge>
                    <Button variant="outline" size="sm" onClick={() => toast({ title: 'إعدادات التقرير', description: 'فتح إعدادات الميزانية العمومية الربع سنوية' })}>
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                      <Users className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">تقرير الذمم المدينة الأسبوعي</p>
                      <p className="text-sm text-muted-foreground">يتم إنشاؤه كل يوم أحد</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">متوقف</Badge>
                    <Button variant="outline" size="sm" onClick={() => toast({ title: 'إعدادات التقرير', description: 'فتح إعدادات تقرير الذمم المدينة الأسبوعي' })}>
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button className="w-full" variant="outline" onClick={() => toast({ title: 'إضافة تقرير مجدول', description: 'سيتم فتح نموذج إضافة تقرير مجدول جديد' })}>
                  <Clock className="h-4 w-4 ml-2" />
                  إضافة تقرير مجدول جديد
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog عرض التقرير */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedReport && (
                <>
                  <selectedReport.icon className={`h-5 w-5 ${selectedReport.color}`} />
                  {selectedReport.title}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date().toLocaleDateString('ar-IQ')}
                </Badge>
                <Badge variant="secondary">{selectedPeriod === 'month' ? 'شهري' : selectedPeriod === 'quarter' ? 'ربع سنوي' : 'سنوي'}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => selectedReport && handleExportPDF(selectedReport.title)}>
                  <Printer className="h-4 w-4 ml-2" />
                  طباعة
                </Button>
                <Button variant="outline" size="sm" onClick={() => selectedReport && handleExportPDF(selectedReport.title)}>
                  <Download className="h-4 w-4 ml-2" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => selectedReport && handleExportExcel(selectedReport.title)}>
                  <FileSpreadsheet className="h-4 w-4 ml-2" />
                  Excel
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground py-12">
                  محتوى التقرير سيظهر هنا بناءً على نوع التقرير المحدد
                </p>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
