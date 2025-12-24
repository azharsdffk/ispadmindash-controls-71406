import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  RadialBarChart, RadialBar, ComposedChart, Scatter
} from 'recharts';
import { formatCurrency } from '@/lib/currency';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart as PieIcon,
  BarChart3,
  LineChart as LineChartIcon,
  Calendar,
  Target,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Wallet,
  CreditCard,
  Users,
  Building2,
  Calculator,
  RefreshCw,
  Download,
  Filter,
  Eye,
  Layers,
  Coins,
  TrendingUp as Growth,
  Scale,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

// بيانات 12 شهر
const monthlyData = [
  { month: 'يناير', revenue: 42000000, expenses: 26000000, profit: 16000000, subscribers: 850, arpu: 49400 },
  { month: 'فبراير', revenue: 45000000, expenses: 28000000, profit: 17000000, subscribers: 890, arpu: 50560 },
  { month: 'مارس', revenue: 48000000, expenses: 29000000, profit: 19000000, subscribers: 920, arpu: 52170 },
  { month: 'أبريل', revenue: 52000000, expenses: 31000000, profit: 21000000, subscribers: 960, arpu: 54170 },
  { month: 'مايو', revenue: 49000000, expenses: 30000000, profit: 19000000, subscribers: 980, arpu: 50000 },
  { month: 'يونيو', revenue: 55000000, expenses: 32000000, profit: 23000000, subscribers: 1020, arpu: 53920 },
  { month: 'يوليو', revenue: 58000000, expenses: 34000000, profit: 24000000, subscribers: 1050, arpu: 55240 },
  { month: 'أغسطس', revenue: 54000000, expenses: 33000000, profit: 21000000, subscribers: 1080, arpu: 50000 },
  { month: 'سبتمبر', revenue: 60000000, expenses: 35000000, profit: 25000000, subscribers: 1120, arpu: 53570 },
  { month: 'أكتوبر', revenue: 62000000, expenses: 36000000, profit: 26000000, subscribers: 1150, arpu: 53910 },
  { month: 'نوفمبر', revenue: 58000000, expenses: 35000000, profit: 23000000, subscribers: 1180, arpu: 49150 },
  { month: 'ديسمبر', revenue: 65000000, expenses: 38000000, profit: 27000000, subscribers: 1220, arpu: 53280 },
];

// بيانات المصروفات التفصيلية
const expensesByCategory = [
  { name: 'رواتب الموظفين', value: 15670000, percentage: 40.3, budget: 16000000, color: '#ef4444' },
  { name: 'تكلفة الخدمات', value: 12000000, percentage: 30.8, budget: 11500000, color: '#f97316' },
  { name: 'الإيجارات والمرافق', value: 5650000, percentage: 14.5, budget: 5500000, color: '#eab308' },
  { name: 'التسويق والدعاية', value: 3930000, percentage: 10.1, budget: 4500000, color: '#22c55e' },
  { name: 'مصاريف إدارية', value: 1650000, percentage: 4.3, budget: 1800000, color: '#3b82f6' },
];

// بيانات الإيرادات التفصيلية
const revenueByService = [
  { name: 'اشتراكات شهرية', value: 45000000, percentage: 69.2, growth: 15.2, color: '#10b981' },
  { name: 'رسوم التركيب', value: 12000000, percentage: 18.5, growth: 28.5, color: '#3b82f6' },
  { name: 'خدمات الصيانة', value: 5000000, percentage: 7.7, growth: 12.0, color: '#8b5cf6' },
  { name: 'ترقيات الباقات', value: 2000000, percentage: 3.1, growth: 45.0, color: '#f59e0b' },
  { name: 'رسوم أخرى', value: 1000000, percentage: 1.5, growth: -5.2, color: '#6b7280' },
];

// النسب المالية
const financialRatios = [
  { name: 'هامش الربح الإجمالي', value: 58.5, target: 60, unit: '%', status: 'warning', description: 'نسبة الربح الإجمالي إلى الإيرادات' },
  { name: 'هامش الربح الصافي', value: 34.7, target: 35, unit: '%', status: 'good', description: 'نسبة صافي الربح إلى الإيرادات' },
  { name: 'نسبة التشغيل', value: 65.3, target: 70, unit: '%', status: 'good', description: 'نسبة مصروفات التشغيل إلى الإيرادات' },
  { name: 'العائد على الأصول (ROA)', value: 18.2, target: 15, unit: '%', status: 'excellent', description: 'كفاءة استخدام الأصول في توليد الأرباح' },
  { name: 'العائد على حقوق الملكية (ROE)', value: 24.5, target: 20, unit: '%', status: 'excellent', description: 'العائد المحقق لحملة الأسهم' },
  { name: 'نسبة السيولة السريعة', value: 1.8, target: 1.5, unit: '', status: 'excellent', description: 'قدرة الشركة على سداد الالتزامات قصيرة الأجل' },
  { name: 'نسبة الدين إلى حقوق الملكية', value: 0.45, target: 0.5, unit: '', status: 'good', description: 'نسبة التمويل بالدين مقارنة بحقوق الملكية' },
  { name: 'معدل دوران المدينين', value: 8.5, target: 10, unit: 'مرة', status: 'warning', description: 'سرعة تحصيل المستحقات من العملاء' },
];

// بيانات المقارنة السنوية
const yearlyComparison = [
  { metric: 'إجمالي الإيرادات', current: 648000000, previous: 545000000, change: 18.9 },
  { metric: 'إجمالي المصروفات', current: 387000000, previous: 342000000, change: 13.2 },
  { metric: 'صافي الربح', current: 261000000, previous: 203000000, change: 28.6 },
  { metric: 'عدد المشتركين', current: 1220, previous: 980, change: 24.5 },
  { metric: 'متوسط الإيراد لكل مشترك', current: 531148, previous: 556122, change: -4.5 },
  { metric: 'تكلفة اكتساب العميل', current: 85000, previous: 95000, change: -10.5 },
];

// بيانات التدفق النقدي
const cashFlowData = [
  { month: 'يناير', operating: 18000000, investing: -5000000, financing: -3000000 },
  { month: 'فبراير', operating: 20000000, investing: -3000000, financing: -2000000 },
  { month: 'مارس', operating: 22000000, investing: -8000000, financing: -4000000 },
  { month: 'أبريل', operating: 25000000, investing: -2000000, financing: -3000000 },
  { month: 'مايو', operating: 21000000, investing: -6000000, financing: -2000000 },
  { month: 'يونيو', operating: 27000000, investing: -4000000, financing: -5000000 },
];

// مؤشرات الأداء الرئيسية
const kpiData = [
  { name: 'نمو الإيرادات', value: 18.9, target: 15, icon: TrendingUp, color: '#10b981' },
  { name: 'هامش الربح', value: 34.7, target: 35, icon: Percent, color: '#3b82f6' },
  { name: 'رضا العملاء', value: 92, target: 90, icon: Users, color: '#f59e0b' },
  { name: 'كفاءة التحصيل', value: 87, target: 95, icon: Target, color: '#8b5cf6' },
];

export const FinancialCharts = () => {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('year');
  const [chartType, setChartType] = useState('bar');

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value, 'IQD')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (value: number) => {
    return `${(value / 1000000).toFixed(0)}M`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-500/10';
      case 'good': return 'text-blue-600 bg-blue-500/10';
      case 'warning': return 'text-orange-600 bg-orange-500/10';
      case 'critical': return 'text-red-600 bg-red-500/10';
      default: return 'text-gray-600 bg-gray-500/10';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'excellent': return <Badge className="bg-green-500">ممتاز</Badge>;
      case 'good': return <Badge className="bg-blue-500">جيد</Badge>;
      case 'warning': return <Badge className="bg-orange-500">تحذير</Badge>;
      case 'critical': return <Badge variant="destructive">حرج</Badge>;
      default: return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  const totalRevenue = monthlyData.reduce((sum, d) => sum + d.revenue, 0);
  const totalExpenses = monthlyData.reduce((sum, d) => sum + d.expenses, 0);
  const totalProfit = monthlyData.reduce((sum, d) => sum + d.profit, 0);
  const avgProfitMargin = (totalProfit / totalRevenue * 100);

  return (
    <div className="space-y-6">
      {/* الهيدر */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
            <BarChart3 className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">التحليل المالي</h2>
            <p className="text-muted-foreground text-sm">تحليل شامل للأداء المالي والمؤشرات الرئيسية</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">هذا الشهر</SelectItem>
              <SelectItem value="quarter">هذا الربع</SelectItem>
              <SelectItem value="year">هذه السنة</SelectItem>
              <SelectItem value="all">الكل</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => toast({ title: 'تحديث', description: 'جاري تحديث البيانات...' })}>
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
          <Button size="sm" onClick={() => toast({ title: 'تصدير', description: 'جاري تصدير التقرير...' })}>
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </Button>
        </div>
      </div>

      {/* بطاقات المؤشرات الرئيسية */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          const isAchieved = kpi.value >= kpi.target;
          return (
            <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-gray-800/50" />
              <CardContent className="p-5 relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${kpi.color}20` }}>
                    <Icon className="h-5 w-5" style={{ color: kpi.color }} />
                  </div>
                  <Badge variant={isAchieved ? "default" : "secondary"} className="text-xs">
                    {isAchieved ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                    {isAchieved ? 'محقق' : 'قيد التحقيق'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{kpi.name}</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}%</span>
                  <span className="text-xs text-muted-foreground mb-1">/ {kpi.target}%</span>
                </div>
                <Progress value={(kpi.value / kpi.target) * 100} className="h-1.5 mt-3" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ملخص مالي سريع */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Coins className="h-5 w-5 text-green-600" />
              </div>
              <Badge className="bg-green-500/10 text-green-600 border-0">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +18.9%
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">إجمالي الإيرادات السنوية</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400 mt-1">
              {formatCurrency(totalRevenue, 'IQD')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900 border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <CreditCard className="h-5 w-5 text-red-600" />
              </div>
              <Badge className="bg-red-500/10 text-red-600 border-0">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +13.2%
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">إجمالي المصروفات السنوية</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-400 mt-1">
              {formatCurrency(totalExpenses, 'IQD')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-950 dark:to-cyan-900 border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <Badge className="bg-blue-500/10 text-blue-600 border-0">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +28.6%
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">صافي الربح السنوي</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">
              {formatCurrency(totalProfit, 'IQD')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">هامش الربح: {avgProfitMargin.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات الرئيسية */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid grid-cols-5 gap-2 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="trends" className="flex items-center gap-2 rounded-lg">
            <LineChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">الاتجاهات</span>
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="flex items-center gap-2 rounded-lg">
            <PieIcon className="h-4 w-4" />
            <span className="hidden sm:inline">التوزيع</span>
          </TabsTrigger>
          <TabsTrigger value="ratios" className="flex items-center gap-2 rounded-lg">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">النسب</span>
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2 rounded-lg">
            <Scale className="h-4 w-4" />
            <span className="hidden sm:inline">المقارنة</span>
          </TabsTrigger>
          <TabsTrigger value="cashflow" className="flex items-center gap-2 rounded-lg">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">التدفقات</span>
          </TabsTrigger>
        </TabsList>

        {/* تبويب الاتجاهات */}
        <TabsContent value="trends" className="space-y-4">
          {/* الإيرادات والمصروفات الشهرية */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  تطور الإيرادات والمصروفات الشهرية
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant={chartType === 'bar' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setChartType('bar')}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={chartType === 'area' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setChartType('area')}
                  >
                    <LineChartIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                {chartType === 'bar' ? (
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '11px' }} />
                    <YAxis tickFormatter={formatYAxis} stroke="hsl(var(--muted-foreground))" style={{ fontSize: '11px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="revenue" name="الإيرادات" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="المصروفات" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '11px' }} />
                    <YAxis tickFormatter={formatYAxis} stroke="hsl(var(--muted-foreground))" style={{ fontSize: '11px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" name="الإيرادات" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                    <Area type="monotone" dataKey="expenses" name="المصروفات" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" strokeWidth={2} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* صافي الربح والمشتركين */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  تطور صافي الربح الشهري
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '11px' }} />
                    <YAxis tickFormatter={formatYAxis} stroke="hsl(var(--muted-foreground))" style={{ fontSize: '11px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="profit" name="صافي الربح" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5 text-purple-600" />
                  نمو المشتركين ومتوسط الإيراد (ARPU)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '11px' }} />
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '11px' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '11px' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="subscribers" name="المشتركين" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="arpu" name="ARPU" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تبويب التوزيع */}
        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* توزيع الإيرادات */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Coins className="h-5 w-5 text-green-600" />
                  توزيع الإيرادات حسب المصدر
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row items-center gap-4">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={revenueByService}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {revenueByService.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value, 'IQD')} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {revenueByService.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{item.percentage}%</span>
                        <Badge variant={item.growth >= 0 ? "default" : "destructive"} className="text-xs">
                          {item.growth >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                          {item.growth}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* توزيع المصروفات */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-5 w-5 text-red-600" />
                  توزيع المصروفات حسب الفئة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row items-center gap-4">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={expensesByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {expensesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value, 'IQD')} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {expensesByCategory.map((item, index) => {
                    const variance = ((item.value - item.budget) / item.budget * 100);
                    const isOverBudget = item.value > item.budget;
                    return (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">{item.percentage}%</span>
                          <Badge variant={isOverBudget ? "destructive" : "default"} className="text-xs">
                            {isOverBudget ? 'فوق الميزانية' : 'ضمن الميزانية'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تبويب النسب المالية */}
        <TabsContent value="ratios" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="h-5 w-5 text-primary" />
                النسب والمؤشرات المالية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {financialRatios.map((ratio, index) => (
                  <div key={index} className={`p-4 rounded-xl border ${getStatusColor(ratio.status)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{ratio.name}</span>
                      {getStatusBadge(ratio.status)}
                    </div>
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-2xl font-bold">{ratio.value}</span>
                      <span className="text-sm text-muted-foreground mb-1">{ratio.unit}</span>
                    </div>
                    <Progress value={(ratio.value / ratio.target) * 100} className="h-1.5 mb-2" />
                    <p className="text-xs text-muted-foreground">الهدف: {ratio.target}{ratio.unit}</p>
                    <p className="text-xs text-muted-foreground mt-1">{ratio.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب المقارنة السنوية */}
        <TabsContent value="comparison" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Scale className="h-5 w-5 text-primary" />
                المقارنة السنوية (السنة الحالية vs السنة السابقة)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المؤشر</TableHead>
                    <TableHead className="text-center">السنة الحالية</TableHead>
                    <TableHead className="text-center">السنة السابقة</TableHead>
                    <TableHead className="text-center">التغيير</TableHead>
                    <TableHead className="text-center">التوزيع</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {yearlyComparison.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.metric}</TableCell>
                      <TableCell className="text-center font-mono">
                        {item.metric.includes('عدد') ? item.current.toLocaleString() : formatCurrency(item.current, 'IQD')}
                      </TableCell>
                      <TableCell className="text-center font-mono text-muted-foreground">
                        {item.metric.includes('عدد') ? item.previous.toLocaleString() : formatCurrency(item.previous, 'IQD')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={item.change >= 0 ? "default" : "destructive"}>
                          {item.change >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                          {item.change >= 0 ? '+' : ''}{item.change}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Progress value={Math.min((item.current / item.previous) * 50, 100)} className="h-2" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب التدفقات النقدية */}
        <TabsContent value="cashflow" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-5 w-5 text-purple-600" />
                تحليل التدفقات النقدية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis tickFormatter={formatYAxis} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="operating" name="أنشطة تشغيلية" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="investing" name="أنشطة استثمارية" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="financing" name="أنشطة تمويلية" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* ملخص التدفقات */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-0">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Activity className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium">الأنشطة التشغيلية</span>
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {formatCurrency(cashFlowData.reduce((sum, d) => sum + d.operating, 0), 'IQD')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">صافي التدفق من العمليات</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-950 dark:to-cyan-900 border-0">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">الأنشطة الاستثمارية</span>
                </div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {formatCurrency(cashFlowData.reduce((sum, d) => sum + d.investing, 0), 'IQD')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">صافي التدفق من الاستثمار</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950 dark:to-amber-900 border-0">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Layers className="h-5 w-5 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium">الأنشطة التمويلية</span>
                </div>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                  {formatCurrency(cashFlowData.reduce((sum, d) => sum + d.financing, 0), 'IQD')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">صافي التدفق من التمويل</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
