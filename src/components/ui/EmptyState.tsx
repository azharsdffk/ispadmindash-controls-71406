import { cn } from "@/lib/utils";
import { Button } from "./button";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 text-center animate-fade-in",
      className
    )}>
      <div className="p-5 rounded-2xl bg-muted/30 border border-primary/10 mb-6 glow-hover transition-all duration-300">
        <div className="text-muted-foreground">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-bold mb-2 gradient-text">{title}</h3>
      {description && (
        <p className="text-muted-foreground max-w-sm mb-6">{description}</p>
      )}
      {action && (
        <Button 
          onClick={action.onClick}
          className="btn-futuristic"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
