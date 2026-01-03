import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-primary/30 bg-primary/20 text-primary hover:bg-primary/30",
        secondary: "border-secondary bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-destructive/30 bg-destructive/20 text-destructive hover:bg-destructive/30",
        outline: "border-primary/30 text-foreground hover:bg-primary/10",
        success: "border-success/30 bg-success/20 text-success hover:bg-success/30",
        warning: "border-warning/30 bg-warning/20 text-warning hover:bg-warning/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
