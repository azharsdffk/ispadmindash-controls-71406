import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Gift, CheckCircle, Clock, XCircle, Search, X, ChevronLeft, ChevronRight, RefreshCw, Download, ArrowUpDown, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface Referral {
  id: string;
  referral_code: string;
  referrer_id: string;
  referred_id: string | null;
  status: string;
  reward_type: string | null;
  reward_value: number | null;
  reward_applied: boolean;
  referred_at: string;
  completed_at: string | null;
  rewarded_at: string | null;
}

interface ReferralStats {
  total: number;
  pending: number;
  completed: number;
  rewarded: number;
}

type SortField = 'referral_code' | 'status' | 'referred_at' | 'reward_value';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

export const ReferralProgramManager = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({ total: 0, pending: 0, completed: 0, rewarded: 0 });
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [rewardFilter, setRewardFilter] = useState<string>("all");
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>("referred_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .order('referred_at', { ascending: false });

      if (error) throw error;
      
      const referralsData = (data || []) as Referral[];
      setReferrals(referralsData);

      const statsData: ReferralStats = {
        total: referralsData.length,
        pending: referralsData.filter((r) => r.status === 'pending').length,
        completed: referralsData.filter((r) => r.status === 'completed').length,
        rewarded: referralsData.filter((r) => r.reward_applied).length,
      };
      setStats(statsData);
    } catch (error: any) {
      console.error('Error fetching referrals:', error);
      toast.error('فشل تحميل الإحالات');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort referrals
  const filteredAndSortedReferrals = useMemo(() => {
    let result = [...referrals];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.referral_code.toLowerCase().includes(query) ||
        r.referrer_id.toLowerCase().includes(query) ||
        r.referred_id?.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(r => r.status === statusFilter);
    }
    
    // Apply reward filter
    if (rewardFilter === "applied") {
      result = result.filter(r => r.reward_applied);
    } else if (rewardFilter === "pending") {
      result = result.filter(r => !r.reward_applied && r.status === 'completed');
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'referred_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
    
    return result;
  }, [referrals, searchQuery, statusFilter, rewardFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedReferrals.length / ITEMS_PER_PAGE);
  const paginatedReferrals = filteredAndSortedReferrals.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const applyReward = async (referralId: string) => {
    try {
      const { error } = await supabase
        .from('referrals')
        .update({ 
          reward_applied: true,
          rewarded_at: new Date().toISOString(),
          status: 'completed'
        })
        .eq('id', referralId);

      if (error) throw error;
      toast.success('تم تطبيق المكافأة بنجاح');
      fetchReferrals();
    } catch (error) {
      toast.error('فشل تطبيق المكافأة');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('تم نسخ كود الإحالة');
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return CheckCircle;
    if (status === 'pending') return Clock;
    return XCircle;
  };

  const getStatusText = (status: string) => {
    if (status === 'completed') return 'مكتملة';
    if (status === 'pending') return 'قيد الانتظار';
    return 'ملغاة';
  };

  const getStatusVariant = (status: string) => {
    if (status === 'completed') return 'default' as const;
    if (status === 'pending') return 'outline' as const;
    return 'destructive' as const;
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setRewardFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || rewardFilter !== "all";

  const exportToCSV = () => {
    const headers = ['كود الإحالة', 'المُحيل', 'المُحال', 'الحالة', 'المكافأة', 'تم التطبيق', 'التاريخ'];
    const rows = filteredAndSortedReferrals.map(r => [
      r.referral_code,
      r.referrer_id.substring(0, 8),
      r.referred_id?.substring(0, 8) || '-',
      getStatusText(r.status),
      r.reward_value ? `${r.reward_value} ${r.reward_type || ''}` : '-',
      r.reward_applied ? 'نعم' : 'لا',
      new Date(r.referred_at).toLocaleDateString('ar-IQ')
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `referrals_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('تم تصدير الإحالات');
  };

  const statsCards = [
    { title: "إجمالي الإحالات", value: stats.total, icon: Users, color: "text-primary", bgColor: "bg-primary/10" },
    { title: "قيد الانتظار", value: stats.pending, icon: Clock, color: "text-amber-500", bgColor: "bg-amber-500/10" },
    { title: "مكتملة", value: stats.completed, icon: CheckCircle, color: "text-green-500", bgColor: "bg-green-500/10" },
    { title: "تم مكافأتها", value: stats.rewarded, icon: Gift, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="glass-card">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="glass-card hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.title}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Referrals Table */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Share2 className="h-5 w-5 text-purple-500" />
            </div>
            <CardTitle>سجل الإحالات</CardTitle>
            <Badge variant="outline" className="text-sm">
              {filteredAndSortedReferrals.length} إحالة
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchReferrals}>
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 ml-2" />
              تصدير
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Section */}
          <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-xl">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث بكود الإحالة..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pr-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="completed">مكتملة</SelectItem>
                <SelectItem value="cancelled">ملغاة</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={rewardFilter} onValueChange={(v) => { setRewardFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="المكافأة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="applied">تم التطبيق</SelectItem>
                <SelectItem value="pending">بانتظار التطبيق</SelectItem>
              </SelectContent>
            </Select>
            
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 ml-2" />
                مسح الفلاتر
              </Button>
            )}
          </div>

          {paginatedReferrals.length === 0 ? (
            <div className="text-center py-12">
              <Share2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {hasActiveFilters ? 'لا توجد نتائج مطابقة للفلاتر' : 'لا توجد إحالات حالياً'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/80 transition-colors"
                        onClick={() => handleSort('referral_code')}
                      >
                        <div className="flex items-center gap-2">
                          كود الإحالة
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>المُحيل</TableHead>
                      <TableHead>المُحال</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/80 transition-colors"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-2">
                          الحالة
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>المكافأة</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/80 transition-colors"
                        onClick={() => handleSort('referred_at')}
                      >
                        <div className="flex items-center gap-2">
                          التاريخ
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedReferrals.map((referral) => {
                      const StatusIcon = getStatusIcon(referral.status);
                      return (
                        <TableRow key={referral.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                                {referral.referral_code}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => copyCode(referral.referral_code)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">
                              {referral.referrer_id.substring(0, 8)}...
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">
                              {referral.referred_id ? referral.referred_id.substring(0, 8) + '...' : '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(referral.status)} className="gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {getStatusText(referral.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {referral.reward_applied ? (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                تم التطبيق
                              </Badge>
                            ) : referral.reward_value ? (
                              <Badge variant="outline">
                                {referral.reward_value.toLocaleString()} {referral.reward_type}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {new Date(referral.referred_at).toLocaleDateString('ar-IQ')}
                            </span>
                          </TableCell>
                          <TableCell className="text-left">
                            {!referral.reward_applied && referral.status === 'completed' && (
                              <Button 
                                size="sm"
                                onClick={() => applyReward(referral.id)}
                              >
                                <Gift className="h-4 w-4 ml-2" />
                                تطبيق المكافأة
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    عرض {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedReferrals.length)} من {filteredAndSortedReferrals.length}
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
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
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
    </div>
  );
};
