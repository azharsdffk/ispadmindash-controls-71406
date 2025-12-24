import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar
} from 'recharts';
import { formatCurrency } from '@/lib/currency';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Coins,
  Wallet,
  Users,
  FileText,
  Banknote,
  AlertCircle,
  CheckCircle2,
  Clock,
  Target,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon,
  Percent,
  CreditCard,
  Building2,
  Archive,
  RefreshCw,
  Eye,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OverviewDashboardProps {
  stats: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    pendingInvoices: number;
    paidInvoices: number;
    todayPayments: number;
    lowStockItems: number;
    totalReceivables: number;
    totalPayables: number;
    cashFlow: number;
    inventoryValue: number;
    profitMargin: number;
    overdueInvoices: number;
  };
  recentInvoices: any[];
  recentPayments: any[];
}

export const OverviewDashboard = ({ stats, recentInvoices, recentPayments }: OverviewDashboardProps) => {
  const { toast } = useToast();

  // بيانات الأشهر الـ 12 الماضية
  const monthlyTrendData = [
    { month: 'يناير', revenue: 42000000, expenses: 26000000, profit: 16000000, subscribers: 850 },
    { month: 'فبراير', revenue: 45000000, expenses: 28000000, profit: 17000000, subscribers: 890 },
    { month: 'مارس', revenue: 48000000, expenses: 29000000, profit: 19000000, subscribers: 920 },
    { month: 'أبريل', revenue: 52000000, expenses: 31000000, profit: 21000000, subscribers: 960 },
    { month: 'مايو', revenue: 49000000, expenses: 30000000, profit: 19000000, subscribers: 980 },
    { month: 'يونيو', revenue: 55000000, expenses: 32000000, profit: 23000000, subscribers: 1020 },
    { month: 'يوليو', revenue: 58000000, expenses: 34000000, profit: 24000000, subscribers: 1050 },
    { month: 'أغسطس', revenue: 54000000, expenses: 33000000, profit: 21000000, subscribers: 1080 },
    { month: 'سبتمبر', revenue: 60000000, expenses: 35000000, profit: 25000000, subscribers: 1120 },
    { month: 'أكتوبر', revenue: 62000000, expenses: 36000000, profit: 26000000, subscribers: 1150 },
    { month: 'نوفمبر', revenue: 58000000, expenses: 35000000, profit: 23000000, subscribers: 1180 },
    { month: 'ديسمبر', revenue: 65000000, expenses: 38000000, profit: 27000000, subscribers: 1220 },
  ];

  // بيانات توزيع الإيرادات
  const revenueDistribution = [
    { name: 'اشتراكات شهرية', value: 45000000, percentage: 69.2, color: '#10b981' },
    { name: 'رسوم التركيب', value: 12000000, percentage: 18.5, color: '#3b82f6' },
    { name: 'خدمات الصيانة', value: 5000000, percentage: 7.7, color: '#8b5cf6' },
    { name: 'ترقيات الباقات', value: 2000000, percentage: 3.1, color: '#f59e0b' },
    { name: 'رسوم أخرى', value: 1000000, percentage: 1.5, color: '#ef4444' },
  ];

  // بيانات توزيع المصروفات
  const expenseDistribution = [
    { name: 'رواتب', value: 15000000, percentage: 39.5, color: '#ef4444' },
    { name: 'تكلفة الخدمات', value: 12000000, percentage: 31.6, color: '#f97316' },
    { name: 'إيجارات', value: 6000000, percentage: 15.8, color: '#eab308' },
    { name: 'تسويق', value: 3000000, percentage: 7.9, color: '#22c55e' },
    { name: 'إدارية', value: 2000000, percentage: 5.2, color: '#3b82f6' },
  ];

  // مؤشرات الأداء الرئيسية
  const kpis = [
    { 
      name: 'نسبة التحصيل', 
      value: 87, 
      target: 95, 
      color: '#10b981',
      icon: Percent,
      description: 'نسبة الفواتير المحصلة'
    },
    { 
      name: 'معدل نمو الإيرادات', 
      value: 18.5, 
      target: 20, 
      color: '#3b82f6',
      icon: TrendingUp,
      description: 'مقارنة بالفترة السابقة'
    },
    { 
      name: 'كفاءة التشغيل', 
      value: 72, 
      target: 80, 
      color: '#8b5cf6',
      icon: Activity,
      description: 'نسبة المصروفات للإيرادات'
    },
    { 
      name: 'رضا العملاء', 
      value: 92, 
      target: 90, 
      color: '#f59e0b',
      icon: Users,
      description: 'بناءً على التقييمات'
    },
  ];

  // بيانات أعمار الذمم
  const agingData = [
    { range: '0-30 يوم', amount: 3500000, percentage: 43.8, status: 'جيد' },
    { range: '31-60 يوم', amount: 2200000, percentage: 27.5, status: 'متوسط' },
    { range: '61-90 يوم', amount: 1500000, percentage: 18.7, status: 'متأخر' },
    { range: 'أكثر من 90', amount: 800000, percentage: 10.0, status: 'حرج' },
  ];

  // بيانات التدفق النقدي الأسبوعي
  const weeklyCashFlow = [
    { week: 'الأسبوع 1', inflow: 12000000, outflow: 8000000 },
    { week: 'الأسبوع 2', inflow: 15000000, outflow: 9000000 },
    { week: 'الأسبوع 3', inflow: 11000000, outflow: 10000000 },
    { week: 'الأسبوع 4', inflow: 18000000, outflow: 11000000 },
  ];

  // ملخص مالي سريع
  const financialSummary = [
    { label: 'إجمالي الأصول', value: 125000000, change: 8.5, positive: true },
    { label: 'إجمالي الخصوم', value: 45000000, change: -3.2, positive: true },
    { label: 'حقوق الملكية', value: 80000000, change: 12.3, positive: true },
    { label: 'رأس المال العامل', value: 35000000, change: 5.8, positive: true },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      paid: "default",
      pending: "secondary",
      overdue: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="text-sm font-medium mb-1">{payload[0].payload.month || payload[0].payload.week}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value, 'IQD')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* بطاقات المؤشرات الرئيسية المحسنة */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* إجمالي الإيرادات */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/5" />
          <CardContent className="p-5 relative">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                <Coins className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-green-500/10 text-green-600 border-0">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +18.5%
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">إجمالي الإيرادات</p>
              <h3 className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalRevenue, 'IQD')}
              </h3>
              <p className="text-xs text-muted-foreground mt-2">
                مقارنة بـ {formatCurrency(stats.totalRevenue * 0.845, 'IQD')} الشهر الماضي
              </p>
            </div>
          </CardContent>
        </Card>

        {/* إجمالي المصروفات */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-rose-500/5" />
          <CardContent className="p-5 relative">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-600">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-red-500/10 text-red-600 border-0">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12.3%
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">إجمالي المصروفات</p>
              <h3 className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.totalExpenses, 'IQD')}
              </h3>
              <p className="text-xs text-muted-foreground mt-2">
                ضمن الميزانية المحددة
              </p>
            </div>
          </CardContent>
        </Card>

        {/* صافي الربح */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/5" />
          <CardContent className="p-5 relative">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stats.netProfit >= 0 ? 'from-blue-500 to-cyan-600' : 'from-red-500 to-rose-600'}`}>
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <Badge className={`border-0 ${stats.netProfit >= 0 ? 'bg-blue-500/10 text-blue-600' : 'bg-red-500/10 text-red-600'}`}>
                {stats.netProfit >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {stats.profitMargin.toFixed(1)}%
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">صافي الربح</p>
              <h3 className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(stats.netProfit, 'IQD')}
              </h3>
              <p className="text-xs text-muted-foreground mt-2">
                هامش الربح: {stats.profitMargin.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* التدفق النقدي */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-violet-500/5" />
          <CardContent className="p-5 relative">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stats.cashFlow >= 0 ? 'from-purple-500 to-violet-600' : 'from-red-500 to-rose-600'}`}>
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <Badge className={`border-0 ${stats.cashFlow >= 0 ? 'bg-purple-500/10 text-purple-600' : 'bg-red-500/10 text-red-600'}`}>
                {stats.cashFlow >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                صافي
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">التدفق النقدي</p>
              <h3 className={`text-2xl font-bold ${stats.cashFlow >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                {formatCurrency(stats.cashFlow, 'IQD')}
              </h3>
              <p className="text-xs text-muted-foreground mt-2">
                سيولة إيجابية
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* مؤشرات الأداء الرئيسية KPIs */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              مؤشرات الأداء الرئيسية
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => toast({ title: 'تحديث', description: 'جاري تحديث المؤشرات...' })}>
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, index) => {
              const Icon = kpi.icon;
              const isAchieved = kpi.value >= kpi.target;
              return (
                <div key={index} className="p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${kpi.color}20` }}>
                      <Icon className="h-4 w-4" style={{ color: kpi.color }} />
                    </div>
                    <Badge variant={isAchieved ? "default" : "secondary"} className="text-xs">
                      {isAchieved ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                      {isAchieved ? 'محقق' : 'قيد التحقيق'}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium mb-1">{kpi.name}</p>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}%</span>
                    <span className="text-xs text-muted-foreground mb-1">/ {kpi.target}%</span>
                  </div>
                  <Progress value={(kpi.value / kpi.target) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">{kpi.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* رسوم بيانية التحليل */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid grid-cols-4 gap-2 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="trends" className="flex items-center gap-2 rounded-lg">
            <LineChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">الاتجاهات</span>
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-2 rounded-lg">
            <PieChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">التوزيع</span>
          </TabsTrigger>
          <TabsTrigger value="cashflow" className="flex items-center gap-2 rounded-lg">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">التدفقات</span>
          </TabsTrigger>
          <TabsTrigger value="aging" className="flex items-center gap-2 rounded-lg">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">أعمار الذمم</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* مخطط الاتجاه الشهري */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-5 w-5 text-primary" />
                  تطور الإيرادات والمصروفات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyTrendData}>
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
                    <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '11px' }} tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" name="الإيرادات" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                    <Area type="monotone" dataKey="expenses" name="المصروفات" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* مخطط صافي الربح */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                  تطور صافي الربح
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '11px' }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '11px' }} tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="profit" name="صافي الربح" stroke="hsl(var(--secondary))" strokeWidth={3} dot={{ fill: 'hsl(var(--secondary))', r: 5 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* توزيع الإيرادات */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Coins className="h-5 w-5 text-green-600" />
                  توزيع الإيرادات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row items-center gap-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={revenueDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {revenueDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value, 'IQD')} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 w-full lg:w-auto">
                    {revenueDistribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* توزيع المصروفات */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-5 w-5 text-red-600" />
                  توزيع المصروفات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row items-center gap-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={expenseDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {expenseDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value, 'IQD')} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 w-full lg:w-auto">
                    {expenseDistribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-5 w-5 text-purple-600" />
                التدفقات النقدية الأسبوعية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={weeklyCashFlow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="inflow" name="التدفقات الداخلة" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="outflow" name="التدفقات الخارجة" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5 text-orange-600" />
                تحليل أعمار الذمم المدينة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الفترة</TableHead>
                    <TableHead className="text-center">المبلغ</TableHead>
                    <TableHead className="text-center">النسبة</TableHead>
                    <TableHead className="text-center">الحالة</TableHead>
                    <TableHead className="text-center">التوزيع</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agingData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.range}</TableCell>
                      <TableCell className="text-center font-mono">{formatCurrency(item.amount, 'IQD')}</TableCell>
                      <TableCell className="text-center">{item.percentage}%</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={
                          item.status === 'جيد' ? 'default' : 
                          item.status === 'متوسط' ? 'secondary' : 
                          item.status === 'متأخر' ? 'outline' : 'destructive'
                        }>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Progress value={item.percentage} className="h-2" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* إحصائيات سريعة ومعاملات حديثة */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* إحصائيات سريعة */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-5 w-5 text-primary" />
              إحصائيات سريعة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm">فواتير مدفوعة</span>
              </div>
              <span className="text-lg font-bold">{stats.paidInvoices}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <span className="text-sm">فواتير معلقة</span>
              </div>
              <span className="text-lg font-bold">{stats.pendingInvoices}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <span className="text-sm">فواتير متأخرة</span>
              </div>
              <span className="text-lg font-bold">{stats.overdueInvoices}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Banknote className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm">مدفوعات اليوم</span>
              </div>
              <span className="text-sm font-bold">{formatCurrency(stats.todayPayments, 'IQD')}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Archive className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-sm">مخزون منخفض</span>
              </div>
              <span className="text-lg font-bold">{stats.lowStockItems}</span>
            </div>
          </CardContent>
        </Card>

        {/* آخر الفواتير */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-primary" />
                آخر الفواتير
              </CardTitle>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا توجد فواتير حالياً</p>
                </div>
              ) : (
                recentInvoices.slice(0, 5).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{invoice.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{invoice.subscribers?.name || 'غير محدد'}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold">{formatCurrency(invoice.net_amount || invoice.amount, 'IQD')}</p>
                      {getStatusBadge(invoice.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* آخر المدفوعات */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Banknote className="h-5 w-5 text-secondary" />
                آخر المدفوعات
              </CardTitle>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Banknote className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا توجد مدفوعات حالياً</p>
                </div>
              ) : (
                recentPayments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{payment.subscribers?.name || 'غير محدد'}</p>
                      <p className="text-xs text-muted-foreground">{payment.payment_method}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-secondary">{formatCurrency(payment.amount, 'IQD')}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.payment_date).toLocaleDateString('ar-IQ')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ملخص مالي */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              الملخص المالي
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => toast({ title: 'تصدير', description: 'جاري تصدير الملخص المالي...' })}>
              <Download className="h-4 w-4 ml-2" />
              تصدير
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {financialSummary.map((item, index) => (
              <div key={index} className="p-4 rounded-xl border bg-muted/30">
                <p className="text-sm text-muted-foreground mb-2">{item.label}</p>
                <p className="text-xl font-bold mb-1">{formatCurrency(item.value, 'IQD')}</p>
                <div className="flex items-center gap-1">
                  {item.positive ? (
                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-600" />
                  )}
                  <span className={`text-xs ${item.positive ? 'text-green-600' : 'text-red-600'}`}>
                    {item.change > 0 ? '+' : ''}{item.change}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
