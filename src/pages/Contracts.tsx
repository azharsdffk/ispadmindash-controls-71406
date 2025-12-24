import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { FileText, Plus, Search, Filter, Grid3X3, List, Calendar, TrendingUp, AlertTriangle, CheckCircle, Clock, Ban, RefreshCw, Download, BarChart3 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { ContractsTable } from "@/components/contracts/ContractsTable";
import { AddContractModal } from "@/components/modals/AddContractModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";
import { format, differenceInDays, startOfMonth, endOfMonth } from "date-fns";
import { ar } from "date-fns/locale";

interface ContractStats {
  total: number;
  active: number;
  expired: number;
  suspended: number;
  cancelled: number;
  pending: number;
  expiringSoon: number;
  totalMonthlyRevenue: number;
  autoRenewCount: number;
}

const Contracts = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addContractOpen, setAddContractOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ContractStats>({
    total: 0,
    active: 0,
    expired: 0,
    suspended: 0,
    cancelled: 0,
    pending: 0,
    expiringSoon: 0,
    totalMonthlyRevenue: 0,
    autoRenewCount: 0
  });
  const { hasPermission } = usePermissions();

  const canManageContracts = hasPermission('contracts.create') || hasPermission('contracts.update');
  const canViewContracts = hasPermission('contracts.view');

  useEffect(() => {
    if (canViewContracts) {
      fetchContracts();
    }
  }, [canViewContracts]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          subscribers (name, phone, address),
          packages (name, speed_mbps)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const contractsData = data || [];
      setContracts(contractsData);
      
      // Calculate stats
      const today = new Date();
      const expiringSoonContracts = contractsData.filter(c => {
        const daysUntilExpiry = differenceInDays(new Date(c.end_date), today);
        return c.status === 'active' && daysUntilExpiry > 0 && daysUntilExpiry <= 30;
      });

      setStats({
        total: contractsData.length,
        active: contractsData.filter(c => c.status === 'active').length,
        expired: contractsData.filter(c => c.status === 'expired').length,
        suspended: contractsData.filter(c => c.status === 'suspended').length,
        cancelled: contractsData.filter(c => c.status === 'cancelled').length,
        pending: contractsData.filter(c => c.status === 'pending').length,
        expiringSoon: expiringSoonContracts.length,
        totalMonthlyRevenue: contractsData
          .filter(c => c.status === 'active')
          .reduce((sum, c) => sum + Number(c.monthly_fee), 0),
        autoRenewCount: contractsData.filter(c => c.auto_renew).length
      });
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContracts = useMemo(() => {
    let filtered = [...contracts];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.contract_number?.toLowerCase().includes(query) ||
        c.subscribers?.name?.toLowerCase().includes(query) ||
        c.subscribers?.phone?.includes(query) ||
        c.packages?.name?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'end_date':
          return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
        case 'monthly_fee':
          return Number(b.monthly_fee) - Number(a.monthly_fee);
        case 'subscriber':
          return (a.subscribers?.name || '').localeCompare(b.subscribers?.name || '');
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [contracts, searchQuery, statusFilter, sortBy]);

  const statsCards = [
    {
      title: 'إجمالي العقود',
      value: stats.total,
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'العقود النشطة',
      value: stats.active,
      icon: CheckCircle,
      color: 'from-emerald-500 to-green-500',
      bgColor: 'bg-emerald-500/10'
    },
    {
      title: 'تنتهي قريباً',
      value: stats.expiringSoon,
      icon: AlertTriangle,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10'
    },
    {
      title: 'الإيرادات الشهرية',
      value: formatCurrency(stats.totalMonthlyRevenue, 'IQD'),
      icon: TrendingUp,
      color: 'from-violet-500 to-purple-500',
      bgColor: 'bg-violet-500/10',
      isRevenue: true
    },
    {
      title: 'تجديد تلقائي',
      value: stats.autoRenewCount,
      icon: RefreshCw,
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-500/10'
    },
    {
      title: 'العقود المعلقة',
      value: stats.suspended + stats.pending,
      icon: Clock,
      color: 'from-slate-500 to-gray-500',
      bgColor: 'bg-slate-500/10'
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1 w-full">
        <AppSidebar />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-violet-500/5 to-cyan-500/5 rounded-3xl blur-3xl" />
              <div className="relative bg-card/40 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur-lg opacity-50" />
                      <div className="relative h-14 w-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <FileText className="h-7 w-7 text-white" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        إدارة العقود
                      </h1>
                      <p className="text-muted-foreground text-sm mt-1">
                        إدارة وتتبع جميع العقود والاشتراكات
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      تصدير
                    </Button>
                    {canManageContracts && (
                      <Button 
                        onClick={() => setAddContractOpen(true)}
                        className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                      >
                        <Plus className="h-4 w-4" />
                        عقد جديد
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {statsCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card 
                    key={index}
                    className="relative overflow-hidden border-white/[0.08] bg-card/40 backdrop-blur-xl hover:border-white/[0.15] transition-all duration-300 group"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`h-10 w-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                          <Icon className={`h-5 w-5 bg-gradient-to-r ${stat.color} bg-clip-text`} style={{ color: 'transparent', backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }} />
                        </div>
                      </div>
                      <p className={`text-xl font-bold ${stat.isRevenue ? 'text-base' : ''}`}>
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Filters and Search */}
            <Card className="border-white/[0.08] bg-card/40 backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="البحث بالرقم، المشترك، الهاتف..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10 bg-background/50 border-white/[0.08]"
                    />
                  </div>

                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] bg-background/50 border-white/[0.08]">
                      <Filter className="h-4 w-4 ml-2" />
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="expired">منتهي</SelectItem>
                      <SelectItem value="suspended">معلق</SelectItem>
                      <SelectItem value="cancelled">ملغي</SelectItem>
                      <SelectItem value="pending">قيد الانتظار</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort By */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px] bg-background/50 border-white/[0.08]">
                      <BarChart3 className="h-4 w-4 ml-2" />
                      <SelectValue placeholder="ترتيب حسب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">تاريخ الإنشاء</SelectItem>
                      <SelectItem value="end_date">تاريخ الانتهاء</SelectItem>
                      <SelectItem value="monthly_fee">القيمة الشهرية</SelectItem>
                      <SelectItem value="subscriber">اسم المشترك</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View Mode Toggle */}
                  <div className="flex border border-white/[0.08] rounded-lg overflow-hidden">
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className="rounded-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-none"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Quick Filters */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => setStatusFilter('all')}
                  >
                    الكل ({stats.total})
                  </Badge>
                  <Badge
                    variant={statusFilter === 'active' ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-emerald-500/20 transition-colors"
                    onClick={() => setStatusFilter('active')}
                  >
                    نشط ({stats.active})
                  </Badge>
                  <Badge
                    variant={statusFilter === 'expired' ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-destructive/20 transition-colors"
                    onClick={() => setStatusFilter('expired')}
                  >
                    منتهي ({stats.expired})
                  </Badge>
                  <Badge
                    variant={statusFilter === 'suspended' ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-amber-500/20 transition-colors"
                    onClick={() => setStatusFilter('suspended')}
                  >
                    معلق ({stats.suspended})
                  </Badge>
                  <Badge
                    variant={statusFilter === 'pending' ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-blue-500/20 transition-colors"
                    onClick={() => setStatusFilter('pending')}
                  >
                    قيد الانتظار ({stats.pending})
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Contracts Display */}
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList className="bg-card/40 backdrop-blur-xl border border-white/[0.08]">
                <TabsTrigger value="all">جميع العقود</TabsTrigger>
                <TabsTrigger value="expiring" className="gap-2">
                  تنتهي قريباً
                  {stats.expiringSoon > 0 && (
                    <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                      {stats.expiringSoon}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="auto-renew">تجديد تلقائي</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <ContractsTable 
                  contracts={filteredContracts}
                  loading={loading}
                  viewMode={viewMode}
                  onRefresh={fetchContracts}
                />
              </TabsContent>

              <TabsContent value="expiring" className="mt-4">
                <ContractsTable 
                  contracts={filteredContracts.filter(c => {
                    const daysUntilExpiry = differenceInDays(new Date(c.end_date), new Date());
                    return c.status === 'active' && daysUntilExpiry > 0 && daysUntilExpiry <= 30;
                  })}
                  loading={loading}
                  viewMode={viewMode}
                  onRefresh={fetchContracts}
                />
              </TabsContent>

              <TabsContent value="auto-renew" className="mt-4">
                <ContractsTable 
                  contracts={filteredContracts.filter(c => c.auto_renew)}
                  loading={loading}
                  viewMode={viewMode}
                  onRefresh={fetchContracts}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <AddContractModal open={addContractOpen} onOpenChange={setAddContractOpen} onSuccess={fetchContracts} />
    </div>
  );
};

export default Contracts;
