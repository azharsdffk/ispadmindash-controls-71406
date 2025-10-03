import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
  borderColor: string;
  subtitle?: ReactNode;
  delay?: string;
}

export const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  gradient, 
  borderColor,
  subtitle,
  delay = '0s'
}: StatCardProps) => {
  return (
    <Card 
      className={`stat-card-hover animate-fade-in border-l-4 ${borderColor} group`}
      style={{ animationDelay: delay }}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-3 rounded-lg ${gradient} group-hover:scale-110 transition-transform duration-300 shadow-glow`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {subtitle && (
          <div className="mt-2">{subtitle}</div>
        )}
      </CardContent>
    </Card>
  );
};
