import { StatCard } from '@/components/dashboard/StatCard';
import { FileText, Clock, CheckCircle2, Calendar, Bell } from 'lucide-react';

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
        icon={FileText}
        gradient="gradient-bg"
        borderColor="border-l-primary"
      />
      <StatCard
        title="التذاكر الجارية"
        value={openTickets}
        icon={Clock}
        gradient="bg-gradient-to-br from-yellow-500 to-yellow-600"
        borderColor="border-l-yellow-500"
      />
      <StatCard
        title="التذاكر المكتملة"
        value={completedTickets}
        icon={CheckCircle2}
        gradient="bg-gradient-to-br from-green-500 to-green-600"
        borderColor="border-l-green-500"
      />
      <StatCard
        title="التذاكر المجدولة"
        value={scheduledTickets}
        icon={Calendar}
        gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        borderColor="border-l-blue-500"
      />
      <StatCard
        title="الإشعارات"
        value={0}
        icon={Bell}
        gradient="bg-gradient-to-br from-purple-500 to-purple-600"
        borderColor="border-l-purple-500"
      />
    </div>
  );
};
