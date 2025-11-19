import { StatCard } from '@/components/dashboard/StatCard';
import { ListTodo, Clock, CheckCircle, CalendarClock, Bell } from 'lucide-react';

interface TechnicianStatsProps {
  totalTickets: number;
  openTickets: number;
  completedTickets: number;
  scheduledTickets: number;
}

export const TechnicianStats = ({
  totalTickets,
  openTickets,
  completedTickets,
  scheduledTickets,
}: TechnicianStatsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-5">
      <StatCard
        title="إجمالي التذاكر"
        value={totalTickets}
        icon={ListTodo}
        gradient="bg-gradient-to-br from-primary to-primary-hover"
        borderColor="border-l-primary"
      />
      <StatCard
        title="التذاكر الجارية"
        value={openTickets}
        icon={Clock}
        gradient="bg-gradient-to-br from-warning to-warning/80"
        borderColor="border-l-warning"
      />
      <StatCard
        title="التذاكر المكتملة"
        value={completedTickets}
        icon={CheckCircle}
        gradient="bg-gradient-to-br from-success to-success/80"
        borderColor="border-l-success"
      />
      <StatCard
        title="التذاكر المجدولة"
        value={scheduledTickets}
        icon={CalendarClock}
        gradient="bg-gradient-to-br from-info to-info/80"
        borderColor="border-l-info"
      />
      <StatCard
        title="الإشعارات"
        value={0}
        icon={Bell}
        gradient="bg-gradient-to-br from-accent to-accent/80"
        borderColor="border-l-accent"
      />
    </div>
  );
};
