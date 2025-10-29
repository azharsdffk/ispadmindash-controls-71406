import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Gift, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

export const ReferralProgramManager = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({ total: 0, pending: 0, completed: 0, rewarded: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .order('referred_at', { ascending: false });

      if (error) throw error;
      
      const referralsData = (data || []) as any;
      setReferrals(referralsData);

      const statsData: ReferralStats = {
        total: referralsData.length,
        pending: referralsData.filter((r: Referral) => r.status === 'pending').length,
        completed: referralsData.filter((r: Referral) => r.status === 'completed').length,
        rewarded: referralsData.filter((r: Referral) => r.reward_applied).length,
      };
      setStats(statsData);
    } catch (error: any) {
      console.error('Error fetching referrals:', error);
      toast.error('فشل تحميل الإحالات');
    } finally {
      setLoading(false);
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

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 'pending') return <Clock className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = (status: string) => {
    if (status === 'completed') return 'مكتملة';
    if (status === 'pending') return 'قيد الانتظار';
    return 'ملغاة';
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 text-center">جاري التحميل...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* إحصائيات برنامج الإحالة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">إجمالي الإحالات</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">قيد الانتظار</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <div className="text-sm text-muted-foreground">مكتملة</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Gift className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.rewarded}</div>
                <div className="text-sm text-muted-foreground">تم مكافأتها</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول الإحالات */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>سجل الإحالات</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد إحالات حالياً
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>كود الإحالة</TableHead>
                  <TableHead>المُحيل</TableHead>
                  <TableHead>المُحال</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>المكافأة</TableHead>
                  <TableHead>تاريخ الإحالة</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell>
                      <code className="font-mono font-bold text-primary">{referral.referral_code}</code>
                    </TableCell>
                    <TableCell>{referral.referrer_id.substring(0, 8)}...</TableCell>
                    <TableCell>
                      {referral.referred_id ? referral.referred_id.substring(0, 8) + '...' : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(referral.status)}
                        <span>{getStatusText(referral.status)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {referral.reward_applied ? (
                        <Badge variant="default">تم التطبيق</Badge>
                      ) : referral.reward_value ? (
                        <Badge variant="outline">
                          {referral.reward_value.toLocaleString()} {referral.reward_type}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(referral.referred_at).toLocaleDateString('ar-IQ')}
                    </TableCell>
                    <TableCell className="text-left">
                      {!referral.reward_applied && referral.status === 'completed' && (
                        <Button 
                          size="sm"
                          onClick={() => applyReward(referral.id)}
                        >
                          تطبيق المكافأة
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
