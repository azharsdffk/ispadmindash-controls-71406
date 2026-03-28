import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  icon?: string;
  children: ReactNode;
  delay?: string;
  className?: string;
}

export const ChartCard = ({ 
  title, 
  icon, 
  children, 
  delay = '0s',
  className = ''
}: ChartCardProps) => {
  return (
    <Card 
      className={`animate-slide-up ${className}`}
      style={{ animationDelay: delay }}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          {icon && <span>{icon}</span>}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};
