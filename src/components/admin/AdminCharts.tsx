import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const AdminCharts = () => {
  const [weeklyTickets, setWeeklyTickets] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [ticketsByStatus, setTicketsByStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartsData();
  }, []);

  const fetchChartsData = async () => {
    try {
      // Weekly tickets
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const weeklyData = await Promise.all(
        last7Days.map(async (date) => {
          const { count } = await supabase
            .from('maintenance_tickets')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', date)
            .lt('created_at', new Date(new Date(date).getTime() + 86400000).toISOString());

          return {
            date: new Date(date).toLocaleDateString('ar-EG', { weekday: 'short' }),
            count: count || 0,
          };
        })
      );
      setWeeklyTickets(weeklyData);

      // Monthly revenue (last 6 months)
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        return { month: date.getMonth(), year: date.getFullYear() };
      });

      const revenueData = await Promise.all(
        last6Months.map(async ({ month, year }) => {
          const startDate = new Date(year, month, 1).toISOString();
          const endDate = new Date(year, month + 1, 0).toISOString();

          const { data } = await supabase
            .from('payments')
            .select('amount')
            .gte('payment_date', startDate)
            .lte('payment_date', endDate);

          const total = data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

          return {
            month: new Date(year, month).toLocaleDateString('ar-EG', { month: 'short' }),
            revenue: total,
          };
        })
      );
      setMonthlyRevenue(revenueData);

      // Tickets by status
      const statuses: Array<'open' | 'in_progress' | 'closed' | 'resolved'> = ['open', 'in_progress', 'closed', 'resolved'];
      const statusData = await Promise.all(
        statuses.map(async (status) => {
          const { count } = await supabase
            .from('maintenance_tickets')
            .select('*', { count: 'exact', head: true })
            .eq('status', status);

          return {
            name: status === 'open' ? 'مفتوح' : status === 'in_progress' ? 'قيد التنفيذ' : status === 'closed' ? 'مغلق' : 'تم الحل',
            value: count || 0,
          };
        })
      );
      setTicketsByStatus(statusData);
    } catch (error) {
      console.error('Error fetching charts data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-64 bg-muted/50" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weekly Tickets Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>الأعطال خلال الأسبوع</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyTickets}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#8884d8" name="عدد التذاكر" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>الإيرادات الشهرية</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#82ca9d" name="الإيرادات" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tickets by Status */}
      <Card>
        <CardHeader>
          <CardTitle>التذاكر حسب الحالة</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ticketsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {ticketsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
