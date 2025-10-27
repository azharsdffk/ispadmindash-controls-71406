import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, Users, UserCheck, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface Stats {
  openTickets: number;
  activeTechnicians: number;
  activeSubscribers: number;
  monthlyRevenue: number;
  todayTickets: number;
  urgentTickets: number;
}

export const AdminStatsCards = () => {
  const [stats, setStats] = useState<Stats>({
    openTickets: 0,
    activeTechnicians: 0,
    activeSubscribers: 0,
    monthlyRevenue: 0,
    todayTickets: 0,
    urgentTickets: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();

    // Realtime updates
    const ticketsChannel = supabase
      .channel('admin-tickets-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_tickets' }, fetchStats)
      .subscribe();

    const paymentsChannel = supabase
      .channel('admin-payments-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, []);

  const fetchStats = async () => {
    try {
      // Open tickets
      const { count: openCount } = await supabase
        .from('maintenance_tickets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress']);

      // Today's tickets
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from('maintenance_tickets')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // Urgent tickets
      const { count: urgentCount } = await supabase
        .from('maintenance_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('priority', 'urgent')
        .in('status', ['open', 'in_progress']);

      // Active subscribers
      const { count: subscribersCount } = await supabase
        .from('subscribers')
        .select('*', { count: 'exact', head: true });

      // Active technicians (users with technician role)
      const { count: techCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'technician');

      // Monthly revenue (current month)
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount')
        .gte('payment_date', startOfMonth);

      const revenue = paymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      setStats({
        openTickets: openCount || 0,
        activeTechnicians: techCount || 0,
        activeSubscribers: subscribersCount || 0,
        monthlyRevenue: revenue,
        todayTickets: todayCount || 0,
        urgentTickets: urgentCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'التذاكر المفتوحة',
      value: stats.openTickets,
      icon: Ticket,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'تذاكر اليوم',
      value: stats.todayTickets,
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'التذاكر العاجلة',
      value: stats.urgentTickets,
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'الفنيين النشطين',
      value: stats.activeTechnicians,
      icon: UserCheck,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'المشتركين الفعالين',
      value: stats.activeSubscribers,
      icon: Users,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'الإيرادات الشهرية',
      value: formatCurrency(stats.monthlyRevenue, 'IQD'),
      icon: DollarSign,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-24 bg-muted/50" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statCards.map((stat, index) => (
        <Card
          key={index}
          className="border-2 hover:shadow-lg transition-all duration-300 hover:scale-105"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
