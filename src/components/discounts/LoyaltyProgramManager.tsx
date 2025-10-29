import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Award, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddLoyaltyPointsModal } from "./AddLoyaltyPointsModal";

interface LoyaltyPoint {
  id: string;
  subscriber_id: string;
  points: number;
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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
        .limit(50);

      if (transactionsError) throw transactionsError;

      setLoyaltyPoints((pointsData || []) as any);
      setTransactions((transactionsData || []) as any);

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

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 text-center">جاري التحميل...</CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* إحصائيات برنامج الولاء */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalSubscribers}</div>
                  <div className="text-sm text-muted-foreground">إجمالي الأعضاء</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.activeMembers}</div>
                  <div className="text-sm text-muted-foreground">أعضاء نشطون</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Award className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalPointsIssued.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">نقاط ممنوحة</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <Award className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalPointsRedeemed.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">نقاط مستبدلة</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* نقاط المشتركين */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>نقاط المشتركين</CardTitle>
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إدارة النقاط
            </Button>
          </CardHeader>
          <CardContent>
            {loyaltyPoints.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد نقاط ولاء حالياً
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المشترك</TableHead>
                    <TableHead>إجمالي النقاط</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                    <TableHead>آخر تحديث</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loyaltyPoints.slice(0, 20).map((point) => (
                    <TableRow key={point.id}>
                      <TableCell className="font-mono text-sm">
                        {point.subscriber_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="text-lg font-bold">
                          {point.points.toLocaleString()} نقطة
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(point.created_at).toLocaleDateString('ar-IQ')}
                      </TableCell>
                      <TableCell>
                        {new Date(point.updated_at).toLocaleDateString('ar-IQ')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* آخر المعاملات */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>آخر معاملات النقاط</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد معاملات حالياً
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المشترك</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>النقاط</TableHead>
                    <TableHead>السبب</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">
                        {transaction.subscriber_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.transaction_type === 'earn' ? 'default' : 'secondary'}>
                          {transaction.transaction_type === 'earn' ? 'كسب' : 'استبدال'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={transaction.points > 0 ? 'text-green-500' : 'text-red-500'}>
                          {transaction.points > 0 ? '+' : ''}{transaction.points.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>{transaction.reason || '-'}</TableCell>
                      <TableCell>
                        {new Date(transaction.created_at).toLocaleDateString('ar-IQ')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
