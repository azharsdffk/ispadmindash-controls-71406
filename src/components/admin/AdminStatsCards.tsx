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
      setLoading(true);
      
      // Execute all queries in parallel for better performance
      const [
        openTicketsResult,
        todayTicketsResult,
        urgentTicketsResult,
        subscribersResult,
        techniciansResult,
        paymentsResult
      ] = await Promise.all([
        // Open tickets
        supabase
          .from('maintenance_tickets')
          .select('*', { count: 'exact', head: true })
          .in('status', ['open', 'in_progress'])
          .then(res => ({ count: res.count, error: res.error })),
        
        // Today's tickets
        supabase
          .from('maintenance_tickets')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date().toISOString().split('T')[0])
          .then(res => ({ count: res.count, error: res.error })),
        
        // Urgent tickets
        supabase
          .from('maintenance_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('priority', 'urgent')
          .in('status', ['open', 'in_progress'])
          .then(res => ({ count: res.count, error: res.error })),
        
        // Active subscribers
        supabase
          .from('subscribers')
          .select('*', { count: 'exact', head: true })
          .then(res => ({ count: res.count, error: res.error })),
        
        // Active technicians
        supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'technician')
          .then(res => ({ count: res.count, error: res.error })),
        
        // Monthly revenue
        supabase
          .from('payments')
          .select('amount')
          .gte('payment_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
          .then(res => ({ data: res.data, error: res.error }))
      ]);

      // Check for errors
      if (openTicketsResult.error) console.error('Error fetching open tickets:', openTicketsResult.error);
      if (todayTicketsResult.error) console.error('Error fetching today tickets:', todayTicketsResult.error);
      if (urgentTicketsResult.error) console.error('Error fetching urgent tickets:', urgentTicketsResult.error);
      if (subscribersResult.error) console.error('Error fetching subscribers:', subscribersResult.error);
      if (techniciansResult.error) console.error('Error fetching technicians:', techniciansResult.error);
      if (paymentsResult.error) console.error('Error fetching payments:', paymentsResult.error);

      const revenue = paymentsResult.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      setStats({
        openTickets: openTicketsResult.count || 0,
        activeTechnicians: techniciansResult.count || 0,
        activeSubscribers: subscribersResult.count || 0,
        monthlyRevenue: revenue,
        todayTickets: todayTicketsResult.count || 0,
        urgentTickets: urgentTicketsResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default values on error to prevent infinite loading
      setStats({
        openTickets: 0,
        activeTechnicians: 0,
        activeSubscribers: 0,
        monthlyRevenue: 0,
        todayTickets: 0,
        urgentTickets: 0,
      });
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
