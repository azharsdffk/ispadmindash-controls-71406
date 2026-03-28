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
      className="animate-fade-in group overflow-hidden"
      style={{ animationDelay: delay }}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2.5 rounded-xl ${gradient} transition-transform duration-200 group-hover:scale-105`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value}</div>
        {subtitle && (
          <div className="mt-2">{subtitle}</div>
        )}
      </CardContent>
    </Card>
  );
};
