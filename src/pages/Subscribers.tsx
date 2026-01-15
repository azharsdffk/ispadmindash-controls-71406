import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, UserPlus, MapPin, Phone, Mail, Edit2, Trash2, Shield, History, 
  Search, Filter, Download, RefreshCw, ChevronLeft, ChevronRight, 
  ArrowUpDown, ArrowUp, ArrowDown, UserCheck, UserX, CreditCard,
  TrendingUp, TrendingDown, Building, Eye, FileText, MoreHorizontal,
  X, CheckCircle, AlertCircle, Clock, Wifi, WifiOff, Lock, Unlock
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AddSubscriberModal } from "@/components/modals/AddSubscriberModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { SubscriberAuditModal } from "@/components/modals/SubscriberAuditModal";
import { SubscriberDetailsModal } from "@/components/modals/SubscriberDetailsModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteConfirmDialog } from "@/components/modals/DeleteConfirmDialog";
import { formatCurrency } from "@/lib/currency";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Subscriber = {
  id: string;
  name: string;
  phone: string;
  phone_secondary?: string;
  username?: string;
  email?: string;
  address?: string;
  plan?: string;
  balance: number;
  status_comment?: string;
  address_notes?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  agent_id?: string;
  mac_address?: string | null;
  mac_locked?: boolean | null;
  agents?: { name: string; region: string } | null;
};

type SortConfig = {
  key: keyof Subscriber | null;
  direction: 'asc' | 'desc';
};

const ITEMS_PER_PAGE = 20;

const Subscribers = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addSubscriberOpen, setAddSubscriberOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState<{ id: string; name: string } | null>(null);
  const [selectedSubscriberDetails, setSelectedSubscriberDetails] = useState<Subscriber | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isAdmin, isAccountant, isTechnician, loading: roleLoading } = useUserRole();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subscriberToDelete, setSubscriberToDelete] = useState<{ id: string; name: string } | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [balanceFilter, setBalanceFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  
  // Sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  
  // Agents list
  const [agents, setAgents] = useState<{ id: string; name: string; region: string }[]>([]);
  
  // Plans list
  const [plans, setPlans] = useState<string[]>([]);

  const openAuditModal = (subscriber: Subscriber) => {
    setSelectedSubscriber({ id: subscriber.id, name: subscriber.name });
    setAuditModalOpen(true);
  };

  const openDetailsModal = (subscriber: Subscriber) => {
    setSelectedSubscriberDetails(subscriber);
    setDetailsModalOpen(true);
  };

  const fetchSubscribers = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('*, agents(name, region)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscribers(data || []);
      
      // Extract unique plans
      const uniquePlans = [...new Set(data?.map(s => s.plan).filter(Boolean) as string[])];
      setPlans(uniquePlans);

      // Track PII access for compliance
      if (data && data.length > 0) {
        const { trackSubscriberView } = await import('@/utils/piiTracking');
        data.forEach(subscriber => trackSubscriberView(subscriber.id));
      }
    } catch (error: any) {
      toast.error("فشل تحميل المشتركين: " + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('id, name, region')
        .eq('active', true);
      
      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setSubscriberToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!subscriberToDelete) return;

    try {
      const { error } = await supabase
        .from('subscribers')
        .delete()
        .eq('id', subscriberToDelete.id);

      if (error) throw error;
      toast.success("تم حذف المشترك بنجاح");
      fetchSubscribers();
    } catch (error: any) {
      toast.error("فشل حذف المشترك: " + error.message);
    }
  };

  useEffect(() => {
    if (!roleLoading) {
      fetchSubscribers();
      fetchAgents();
    }
  }, [roleLoading]);

  // Filtered and sorted subscribers
  const filteredSubscribers = useMemo(() => {
    let result = [...subscribers];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.phone.includes(query) ||
        s.username?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query) ||
        s.address?.toLowerCase().includes(query) ||
        s.mac_address?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(s => {
        const status = s.status_comment?.toLowerCase() || '';
        if (statusFilter === 'active') return status.includes('active') || status.includes('نشط') || !s.status_comment;
        if (statusFilter === 'inactive') return status.includes('inactive') || status.includes('غير نشط') || status.includes('موقوف');
        if (statusFilter === 'pending') return status.includes('pending') || status.includes('معلق');
        return true;
      });
    }

    // Plan filter
    if (planFilter !== "all") {
      result = result.filter(s => s.plan === planFilter);
    }

    // Balance filter
    if (balanceFilter !== "all") {
      if (balanceFilter === 'positive') result = result.filter(s => s.balance > 0);
      if (balanceFilter === 'negative') result = result.filter(s => s.balance < 0);
      if (balanceFilter === 'zero') result = result.filter(s => s.balance === 0);
    }

    // Agent filter
    if (agentFilter !== "all") {
      result = result.filter(s => s.agent_id === agentFilter);
    }

    // Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue, 'ar')
            : bValue.localeCompare(aValue, 'ar');
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
      });
    }

    return result;
  }, [subscribers, searchQuery, statusFilter, planFilter, balanceFilter, agentFilter, sortConfig]);

  // Paginated subscribers
  const paginatedSubscribers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSubscribers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSubscribers, currentPage]);

  const totalPages = Math.ceil(filteredSubscribers.length / ITEMS_PER_PAGE);

  // Statistics
  const stats = useMemo(() => {
    const total = subscribers.length;
    const active = subscribers.filter(s => {
      const status = s.status_comment?.toLowerCase() || '';
      return status.includes('active') || status.includes('نشط') || !s.status_comment;
    }).length;
    const inactive = total - active;
    const positiveBalance = subscribers.filter(s => s.balance > 0).reduce((sum, s) => sum + s.balance, 0);
    const negativeBalance = subscribers.filter(s => s.balance < 0).reduce((sum, s) => sum + Math.abs(s.balance), 0);
    const totalBalance = subscribers.reduce((sum, s) => sum + s.balance, 0);
    
    return { total, active, inactive, positiveBalance, negativeBalance, totalBalance };
  }, [subscribers]);

  const handleSort = (key: keyof Subscriber) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: keyof Subscriber) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-primary" />
      : <ArrowDown className="h-4 w-4 text-primary" />;
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPlanFilter("all");
    setBalanceFilter("all");
    setAgentFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || planFilter !== "all" || balanceFilter !== "all" || agentFilter !== "all";

  const exportToCSV = () => {
    const headers = ['الاسم', 'اسم المستخدم', 'الهاتف', 'البريد', 'العنوان', 'الخطة', 'الرصيد', 'الحالة'];
    const rows = filteredSubscribers.map(s => [
      s.name,
      s.username || '',
      s.phone,
      s.email || '',
      s.address || '',
      s.plan || '',
      s.balance.toString(),
      s.status_comment || ''
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `subscribers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('تم تصدير البيانات بنجاح');
  };

  const getStatusBadge = (statusComment?: string) => {
    const status = statusComment?.toLowerCase() || '';
    if (status.includes('inactive') || status.includes('غير نشط') || status.includes('موقوف')) {
      return <Badge variant="destructive" className="gap-1"><WifiOff className="h-3 w-3" /> غير نشط</Badge>;
    }
    if (status.includes('pending') || status.includes('معلق')) {
      return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> معلق</Badge>;
    }
    return <Badge className="gap-1 bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/30"><Wifi className="h-3 w-3" /> نشط</Badge>;
  };

  const canManageSubscribers = isAdmin || isAccountant;
  const hasAccess = isAdmin || isAccountant || isTechnician;

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>إدارة المشتركين - نظام الإنترنت</title>
        <meta name="description" content="إدارة ومتابعة جميع المشتركين في خدمة الإنترنت" />
      </Helmet>

      <SidebarProvider>
        <div className="min-h-screen bg-background flex w-full" dir="rtl">
          <AppSidebar />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
            
            <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-muted/20">
              <div className="container mx-auto p-4 md:p-6 space-y-6">
                {/* Professional Header */}
                <div className="glass-card p-4 md:p-6 rounded-2xl">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl gradient-bg">
                        <Users className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h1 className="text-2xl md:text-3xl font-bold gradient-text">إدارة المشتركين</h1>
                        <p className="text-sm text-muted-foreground">إدارة ومتابعة جميع المشتركين في النظام</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => fetchSubscribers(true)}
                        disabled={refreshing}
                      >
                        <RefreshCw className={`h-4 w-4 ml-2 ${refreshing ? 'animate-spin' : ''}`} />
                        تحديث
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={exportToCSV}
                        disabled={filteredSubscribers.length === 0}
                      >
                        <Download className="h-4 w-4 ml-2" />
                        تصدير
                      </Button>
                      {canManageSubscribers && (
                        <Button onClick={() => setAddSubscriberOpen(true)} className="gradient-bg">
                          <UserPlus className="h-5 w-5 ml-2" />
                          إضافة مشترك
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {!hasAccess && (
                  <Alert variant="destructive">
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      ليس لديك صلاحية الوصول إلى بيانات المشتركين.
                    </AlertDescription>
                  </Alert>
                )}

                {hasAccess && (
                  <>
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <Card className="border-r-4 border-r-primary">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">إجمالي المشتركين</p>
                              <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-r-4 border-r-green-500">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                              <UserCheck className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">نشط</p>
                              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-r-4 border-r-destructive">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-destructive/10">
                              <UserX className="h-5 w-5 text-destructive" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">غير نشط</p>
                              <p className="text-2xl font-bold text-destructive">{stats.inactive}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-r-4 border-r-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                              <TrendingUp className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">أرصدة دائنة</p>
                              <p className="text-lg font-bold text-blue-600">{formatCurrency(stats.positiveBalance)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-r-4 border-r-orange-500">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-500/10">
                              <TrendingDown className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">مديونيات</p>
                              <p className="text-lg font-bold text-orange-600">{formatCurrency(stats.negativeBalance)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-r-4 border-r-purple-500">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                              <CreditCard className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">صافي الأرصدة</p>
                              <p className={`text-lg font-bold ${stats.totalBalance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                                {formatCurrency(stats.totalBalance)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Filters Section */}
                    <Card>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-muted-foreground" />
                            <CardTitle className="text-lg">فلترة وبحث</CardTitle>
                          </div>
                          {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                              <X className="h-4 w-4 ml-1" />
                              مسح الفلاتر
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                          {/* Search */}
                          <div className="lg:col-span-2 relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="بحث بالاسم، الهاتف، البريد، العنوان..."
                              value={searchQuery}
                              onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                              }}
                              className="pr-10"
                            />
                          </div>
                          
                          {/* Status Filter */}
                          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                            <SelectTrigger>
                              <SelectValue placeholder="الحالة" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">جميع الحالات</SelectItem>
                              <SelectItem value="active">نشط</SelectItem>
                              <SelectItem value="inactive">غير نشط</SelectItem>
                              <SelectItem value="pending">معلق</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {/* Plan Filter */}
                          <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setCurrentPage(1); }}>
                            <SelectTrigger>
                              <SelectValue placeholder="الخطة" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">جميع الخطط</SelectItem>
                              {plans.map(plan => (
                                <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {/* Balance Filter */}
                          <Select value={balanceFilter} onValueChange={(v) => { setBalanceFilter(v); setCurrentPage(1); }}>
                            <SelectTrigger>
                              <SelectValue placeholder="الرصيد" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">جميع الأرصدة</SelectItem>
                              <SelectItem value="positive">رصيد دائن</SelectItem>
                              <SelectItem value="negative">مديونية</SelectItem>
                              <SelectItem value="zero">رصيد صفر</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Agent Filter - Second Row */}
                        {agents.length > 0 && (
                          <div className="mt-4">
                            <Select value={agentFilter} onValueChange={(v) => { setAgentFilter(v); setCurrentPage(1); }}>
                              <SelectTrigger className="w-full md:w-64">
                                <Building className="h-4 w-4 ml-2" />
                                <SelectValue placeholder="الوكيل" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">جميع الوكلاء</SelectItem>
                                {agents.map(agent => (
                                  <SelectItem key={agent.id} value={agent.id}>
                                    {agent.name} - {agent.region}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        
                        {/* Active Filters Summary */}
                        {hasActiveFilters && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="text-sm text-muted-foreground">الفلاتر النشطة:</span>
                            {searchQuery && (
                              <Badge variant="secondary">
                                بحث: {searchQuery}
                                <X className="h-3 w-3 mr-1 cursor-pointer" onClick={() => setSearchQuery("")} />
                              </Badge>
                            )}
                            {statusFilter !== "all" && (
                              <Badge variant="secondary">
                                الحالة: {statusFilter === 'active' ? 'نشط' : statusFilter === 'inactive' ? 'غير نشط' : 'معلق'}
                                <X className="h-3 w-3 mr-1 cursor-pointer" onClick={() => setStatusFilter("all")} />
                              </Badge>
                            )}
                            {planFilter !== "all" && (
                              <Badge variant="secondary">
                                الخطة: {planFilter}
                                <X className="h-3 w-3 mr-1 cursor-pointer" onClick={() => setPlanFilter("all")} />
                              </Badge>
                            )}
                            {balanceFilter !== "all" && (
                              <Badge variant="secondary">
                                الرصيد: {balanceFilter === 'positive' ? 'دائن' : balanceFilter === 'negative' ? 'مدين' : 'صفر'}
                                <X className="h-3 w-3 mr-1 cursor-pointer" onClick={() => setBalanceFilter("all")} />
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Subscribers Table */}
                    <Card>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            قائمة المشتركين
                            <Badge variant="outline">{filteredSubscribers.length}</Badge>
                          </CardTitle>
                          <div className="text-sm text-muted-foreground">
                            عرض {paginatedSubscribers.length} من {filteredSubscribers.length}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {loading ? (
                          <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                              <Skeleton key={i} className="h-16 w-full" />
                            ))}
                          </div>
                        ) : filteredSubscribers.length === 0 ? (
                          <div className="text-center py-12">
                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg font-medium text-muted-foreground">
                              {hasActiveFilters ? 'لا توجد نتائج مطابقة للفلتر' : 'لا يوجد مشتركين حالياً'}
                            </p>
                            {hasActiveFilters && (
                              <Button variant="link" onClick={clearFilters}>مسح الفلاتر</Button>
                            )}
                          </div>
                        ) : (
                          <>
                            <ScrollArea className="w-full">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('name')}>
                                      <div className="flex items-center gap-2">
                                        الاسم {getSortIcon('name')}
                                      </div>
                                    </TableHead>
                                    <TableHead>اسم المستخدم</TableHead>
                                    <TableHead>الهاتف</TableHead>
                                    <TableHead>البريد</TableHead>
                                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('plan')}>
                                      <div className="flex items-center gap-2">
                                        الخطة {getSortIcon('plan')}
                                      </div>
                                    </TableHead>
                                    <TableHead>MAC Address</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('balance')}>
                                      <div className="flex items-center gap-2">
                                        الرصيد {getSortIcon('balance')}
                                      </div>
                                    </TableHead>
                                    <TableHead>الوكيل</TableHead>
                                    <TableHead className="w-[100px]">الإجراءات</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {paginatedSubscribers.map((subscriber) => (
                                    <TableRow key={subscriber.id} className="hover:bg-muted/50 transition-colors">
                                      <TableCell 
                                        className="font-medium cursor-pointer hover:text-primary transition-colors"
                                        onClick={() => openDetailsModal(subscriber)}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-sm font-bold text-primary">
                                              {subscriber.name.charAt(0)}
                                            </span>
                                          </div>
                                          {subscriber.name}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        {subscriber.username ? (
                                          <span className="text-sm px-2 py-1 bg-accent/10 rounded-md font-mono">
                                            {subscriber.username}
                                          </span>
                                        ) : (
                                          <span className="text-muted-foreground">-</span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-2">
                                            <Phone className="h-3 w-3 text-muted-foreground" />
                                            <span className="font-mono text-sm">{subscriber.phone}</span>
                                          </div>
                                          {subscriber.phone_secondary && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                              <Phone className="h-3 w-3" />
                                              <span className="font-mono text-xs">{subscriber.phone_secondary}</span>
                                            </div>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        {subscriber.email ? (
                                          <div className="flex items-center gap-2">
                                            <Mail className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-sm max-w-[150px] truncate">{subscriber.email}</span>
                                          </div>
                                        ) : (
                                          <span className="text-muted-foreground">-</span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {subscriber.plan ? (
                                          <Badge variant="outline" className="bg-primary/5">
                                            {subscriber.plan}
                                          </Badge>
                                        ) : (
                                          <span className="text-muted-foreground">-</span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {subscriber.mac_address ? (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <div className="flex items-center gap-2">
                                                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                                    {subscriber.mac_address}
                                                  </span>
                                                  {subscriber.mac_locked && (
                                                    <Lock className="h-3 w-3 text-amber-500" />
                                                  )}
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                {subscriber.mac_locked ? 'MAC مقفل' : 'MAC غير مقفل'}
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        ) : (
                                          <span className="text-muted-foreground text-xs">-</span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {getStatusBadge(subscriber.status_comment)}
                                      </TableCell>
                                      <TableCell>
                                        <span className={`font-bold ${
                                          subscriber.balance > 0 ? 'text-green-600' : 
                                          subscriber.balance < 0 ? 'text-destructive' : 'text-muted-foreground'
                                        }`}>
                                          {formatCurrency(subscriber.balance)}
                                        </span>
                                      </TableCell>
                                      <TableCell>
                                        {subscriber.agents ? (
                                          <div className="flex items-center gap-1 text-sm">
                                            <Building className="h-3 w-3 text-muted-foreground" />
                                            <span className="truncate max-w-[100px]">{subscriber.agents.name}</span>
                                          </div>
                                        ) : (
                                          <span className="text-muted-foreground">-</span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openDetailsModal(subscriber)}>
                                              <Eye className="h-4 w-4 ml-2" />
                                              عرض التفاصيل
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openAuditModal(subscriber)}>
                                              <History className="h-4 w-4 ml-2" />
                                              سجل التدقيق
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                              <Edit2 className="h-4 w-4 ml-2" />
                                              تعديل
                                            </DropdownMenuItem>
                                            {isAdmin && (
                                              <DropdownMenuItem 
                                                onClick={() => handleDeleteClick(subscriber.id, subscriber.name)}
                                                className="text-destructive"
                                              >
                                                <Trash2 className="h-4 w-4 ml-2" />
                                                حذف
                                              </DropdownMenuItem>
                                            )}
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </ScrollArea>

                            {/* Pagination */}
                            {totalPages > 1 && (
                              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                <div className="text-sm text-muted-foreground">
                                  صفحة {currentPage} من {totalPages}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                    let page;
                                    if (totalPages <= 5) {
                                      page = i + 1;
                                    } else if (currentPage <= 3) {
                                      page = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                      page = totalPages - 4 + i;
                                    } else {
                                      page = currentPage - 2 + i;
                                    }
                                    return (
                                      <Button
                                        key={page}
                                        variant={currentPage === page ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(page)}
                                        className="w-8"
                                      >
                                        {page}
                                      </Button>
                                    );
                                  })}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <AddSubscriberModal 
        open={addSubscriberOpen} 
        onOpenChange={setAddSubscriberOpen}
        onSuccess={fetchSubscribers}
      />
      {selectedSubscriber && (
        <SubscriberAuditModal
          open={auditModalOpen}
          onOpenChange={setAuditModalOpen}
          subscriberId={selectedSubscriber.id}
          subscriberName={selectedSubscriber.name}
        />
      )}

      <SubscriberDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        subscriber={selectedSubscriberDetails}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="حذف مشترك"
        description="هل أنت متأكد من حذف هذا المشترك؟ سيتم حذف جميع البيانات المتعلقة به."
        itemName={subscriberToDelete?.name}
      />
    </>
  );
};

export default Subscribers;