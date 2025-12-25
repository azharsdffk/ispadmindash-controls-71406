import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Award, TrendingUp, Users, Search, X, ChevronLeft, ChevronRight, RefreshCw, Download, ArrowUpDown, Star, Coins, ArrowUp, ArrowDown, Crown } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddLoyaltyPointsModal } from "./AddLoyaltyPointsModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface LoyaltyPoint {
  id: string;
  subscriber_id: string;
  points: number;
  lifetime_points: number;
  tier: string | null;
  tier_discount_percentage: number | null;
  created_at: string;
  updated_at: string;
}

interface LoyaltyTransaction {
  id: string;
  subscriber_id: string;
  transaction_type: string;
  points: number;
  reason: string | null;
  created_at: string;
}

interface LoyaltyStats {
  totalSubscribers: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  activeMembers: number;
}

type SortField = 'points' | 'lifetime_points' | 'tier' | 'updated_at';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 15;

export const LoyaltyProgramManager = () => {
  const [loyaltyPoints, setLoyaltyPoints] = useState<LoyaltyPoint[]>([]);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [stats, setStats] = useState<LoyaltyStats>({ 
    totalSubscribers: 0, 
    totalPointsIssued: 0, 
    totalPointsRedeemed: 0,
    activeMembers: 0 
  });
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  
  // Filters for points
  const [pointsSearch, setPointsSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  
  // Filters for transactions
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>("all");
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>("points");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  
  // Pagination
  const [pointsPage, setPointsPage] = useState(1);
  const [transactionsPage, setTransactionsPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // جلب نقاط الولاء
      const { data: pointsData, error: pointsError } = await supabase
        .from('loyalty_points')
        .select('*')
        .order('points', { ascending: false });

      if (pointsError) throw pointsError;

      // جلب المعاملات
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (transactionsError) throw transactionsError;

      setLoyaltyPoints((pointsData || []) as LoyaltyPoint[]);
      setTransactions((transactionsData || []) as LoyaltyTransaction[]);

      // حساب الإحصائيات
      const totalPointsIssued = (transactionsData || [])
        .filter((t: any) => t.transaction_type === 'earn')
        .reduce((sum: number, t: any) => sum + t.points, 0);

      const totalPointsRedeemed = Math.abs((transactionsData || [])
        .filter((t: any) => t.transaction_type === 'redeem')
        .reduce((sum: number, t: any) => sum + t.points, 0));

      setStats({
        totalSubscribers: (pointsData || []).length,
        totalPointsIssued,
        totalPointsRedeemed,
        activeMembers: (pointsData || []).filter((p: any) => p.points > 0).length,
      });

    } catch (error: any) {
      console.error('Error fetching loyalty data:', error);
      toast.error('فشل تحميل بيانات الولاء');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort loyalty points
  const filteredAndSortedPoints = useMemo(() => {
    let result = [...loyaltyPoints];
    
    // Apply search filter
    if (pointsSearch) {
      const query = pointsSearch.toLowerCase();
      result = result.filter(p => p.subscriber_id.toLowerCase().includes(query));
    }
    
    // Apply tier filter
    if (tierFilter !== "all") {
      result = result.filter(p => p.tier === tierFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'updated_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
    
    return result;
  }, [loyaltyPoints, pointsSearch, tierFilter, sortField, sortOrder]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];
    
    if (transactionSearch) {
      const query = transactionSearch.toLowerCase();
      result = result.filter(t => 
        t.subscriber_id.toLowerCase().includes(query) ||
        t.reason?.toLowerCase().includes(query)
      );
    }
    
    if (transactionTypeFilter !== "all") {
      result = result.filter(t => t.transaction_type === transactionTypeFilter);
    }
    
    return result;
  }, [transactions, transactionSearch, transactionTypeFilter]);

  // Pagination
  const pointsTotalPages = Math.ceil(filteredAndSortedPoints.length / ITEMS_PER_PAGE);
  const paginatedPoints = filteredAndSortedPoints.slice(
    (pointsPage - 1) * ITEMS_PER_PAGE,
    pointsPage * ITEMS_PER_PAGE
  );

  const transactionsTotalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (transactionsPage - 1) * ITEMS_PER_PAGE,
    transactionsPage * ITEMS_PER_PAGE
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getTierBadge = (tier: string | null) => {
    const tiers: Record<string, { label: string; color: string; icon: any }> = {
      bronze: { label: 'برونزي', color: 'bg-amber-700/20 text-amber-700', icon: Star },
      silver: { label: 'فضي', color: 'bg-slate-400/20 text-slate-500', icon: Star },
      gold: { label: 'ذهبي', color: 'bg-yellow-500/20 text-yellow-600', icon: Crown },
      platinum: { label: 'بلاتيني', color: 'bg-purple-500/20 text-purple-600', icon: Crown },
    };
    const tierInfo = tiers[tier || 'bronze'] || tiers.bronze;
    const Icon = tierInfo.icon;
    
    return (
      <Badge className={`${tierInfo.color} gap-1`}>
        <Icon className="h-3 w-3" />
        {tierInfo.label}
      </Badge>
    );
  };

  const exportPointsToCSV = () => {
    const headers = ['المشترك', 'النقاط الحالية', 'النقاط الإجمالية', 'المستوى', 'نسبة الخصم', 'آخر تحديث'];
    const rows = filteredAndSortedPoints.map(p => [
      p.subscriber_id.substring(0, 8),
      p.points,
      p.lifetime_points,
      p.tier || 'bronze',
      p.tier_discount_percentage || 0,
      new Date(p.updated_at).toLocaleDateString('ar-IQ')
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `loyalty_points_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('تم تصدير بيانات الولاء');
  };

  const statsCards = [
    { title: "إجمالي الأعضاء", value: stats.totalSubscribers, icon: Users, color: "text-primary", bgColor: "bg-primary/10" },
    { title: "أعضاء نشطون", value: stats.activeMembers, icon: TrendingUp, color: "text-green-500", bgColor: "bg-green-500/10" },
    { title: "نقاط ممنوحة", value: stats.totalPointsIssued.toLocaleString(), icon: Coins, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { title: "نقاط مستبدلة", value: stats.totalPointsRedeemed.toLocaleString(), icon: Award, color: "text-purple-500", bgColor: "bg-purple-500/10" },
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
    <>
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

        {/* نقاط المشتركين */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Award className="h-5 w-5 text-amber-500" />
              </div>
              <CardTitle>نقاط المشتركين</CardTitle>
              <Badge variant="outline" className="text-sm">
                {filteredAndSortedPoints.length} عضو
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="h-4 w-4 ml-2" />
                تحديث
              </Button>
              <Button variant="outline" size="sm" onClick={exportPointsToCSV}>
                <Download className="h-4 w-4 ml-2" />
                تصدير
              </Button>
              <Button onClick={() => setAddModalOpen(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إدارة النقاط
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-xl">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="البحث بمعرف المشترك..."
                    value={pointsSearch}
                    onChange={(e) => { setPointsSearch(e.target.value); setPointsPage(1); }}
                    className="pr-10"
                  />
                </div>
              </div>
              
              <Select value={tierFilter} onValueChange={(v) => { setTierFilter(v); setPointsPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="المستوى" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المستويات</SelectItem>
                  <SelectItem value="bronze">برونزي</SelectItem>
                  <SelectItem value="silver">فضي</SelectItem>
                  <SelectItem value="gold">ذهبي</SelectItem>
                  <SelectItem value="platinum">بلاتيني</SelectItem>
                </SelectContent>
              </Select>
              
              {(pointsSearch || tierFilter !== "all") && (
                <Button variant="ghost" size="sm" onClick={() => { setPointsSearch(""); setTierFilter("all"); setPointsPage(1); }}>
                  <X className="h-4 w-4 ml-2" />
                  مسح الفلاتر
                </Button>
              )}
            </div>

            {paginatedPoints.length === 0 ? (
              <div className="text-center py-12">
                <Award className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">لا توجد نقاط ولاء حالياً</p>
              </div>
            ) : (
              <>
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>المشترك</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => handleSort('points')}
                        >
                          <div className="flex items-center gap-2">
                            النقاط الحالية
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => handleSort('lifetime_points')}
                        >
                          <div className="flex items-center gap-2">
                            النقاط الإجمالية
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => handleSort('tier')}
                        >
                          <div className="flex items-center gap-2">
                            المستوى
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead>نسبة الخصم</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => handleSort('updated_at')}
                        >
                          <div className="flex items-center gap-2">
                            آخر تحديث
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPoints.map((point) => (
                        <TableRow key={point.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell>
                            <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                              {point.subscriber_id.substring(0, 8)}...
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="text-lg font-bold gap-1">
                              <Coins className="h-4 w-4" />
                              {point.points.toLocaleString()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground">
                              {point.lifetime_points.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            {getTierBadge(point.tier)}
                          </TableCell>
                          <TableCell>
                            {point.tier_discount_percentage ? (
                              <Badge variant="outline" className="text-green-600">
                                {point.tier_discount_percentage}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {new Date(point.updated_at).toLocaleDateString('ar-IQ')}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pointsTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-muted-foreground">
                      عرض {((pointsPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(pointsPage * ITEMS_PER_PAGE, filteredAndSortedPoints.length)} من {filteredAndSortedPoints.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPointsPage(p => Math.max(1, p - 1))}
                        disabled={pointsPage === 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <span className="text-sm">
                        {pointsPage} / {pointsTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPointsPage(p => Math.min(pointsTotalPages, p + 1))}
                        disabled={pointsPage === pointsTotalPages}
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

        {/* آخر المعاملات */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <CardTitle>آخر معاملات النقاط</CardTitle>
              <Badge variant="outline" className="text-sm">
                {filteredTransactions.length} معاملة
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-xl">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="البحث..."
                    value={transactionSearch}
                    onChange={(e) => { setTransactionSearch(e.target.value); setTransactionsPage(1); }}
                    className="pr-10"
                  />
                </div>
              </div>
              
              <Select value={transactionTypeFilter} onValueChange={(v) => { setTransactionTypeFilter(v); setTransactionsPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="earn">كسب</SelectItem>
                  <SelectItem value="redeem">استبدال</SelectItem>
                </SelectContent>
              </Select>
              
              {(transactionSearch || transactionTypeFilter !== "all") && (
                <Button variant="ghost" size="sm" onClick={() => { setTransactionSearch(""); setTransactionTypeFilter("all"); setTransactionsPage(1); }}>
                  <X className="h-4 w-4 ml-2" />
                  مسح الفلاتر
                </Button>
              )}
            </div>

            {paginatedTransactions.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">لا توجد معاملات حالياً</p>
              </div>
            ) : (
              <>
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>المشترك</TableHead>
                        <TableHead>النوع</TableHead>
                        <TableHead>النقاط</TableHead>
                        <TableHead>السبب</TableHead>
                        <TableHead>التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTransactions.map((transaction) => (
                        <TableRow key={transaction.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell>
                            <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                              {transaction.subscriber_id.substring(0, 8)}...
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={transaction.transaction_type === 'earn' ? 'default' : 'secondary'} className="gap-1">
                              {transaction.transaction_type === 'earn' ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )}
                              {transaction.transaction_type === 'earn' ? 'كسب' : 'استبدال'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`font-bold ${transaction.points > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {transaction.points > 0 ? '+' : ''}{transaction.points.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {transaction.reason || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleDateString('ar-IQ')}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {transactionsTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-muted-foreground">
                      عرض {((transactionsPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(transactionsPage * ITEMS_PER_PAGE, filteredTransactions.length)} من {filteredTransactions.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTransactionsPage(p => Math.max(1, p - 1))}
                        disabled={transactionsPage === 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <span className="text-sm">
                        {transactionsPage} / {transactionsTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTransactionsPage(p => Math.min(transactionsTotalPages, p + 1))}
                        disabled={transactionsPage === transactionsTotalPages}
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

      <AddLoyaltyPointsModal 
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSuccess={fetchData}
      />
    </>
  );
};
