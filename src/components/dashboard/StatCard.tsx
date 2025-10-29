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
      className="animate-fade-in group overflow-hidden relative"
      style={{ animationDelay: delay }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-3 rounded-2xl ${gradient} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 glow`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-4xl font-bold gradient-text">{value}</div>
        {subtitle && (
          <div className="mt-2">{subtitle}</div>
        )}
      </CardContent>
    </Card>
  );
};
