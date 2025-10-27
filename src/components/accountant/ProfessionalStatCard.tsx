import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ProfessionalStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  colorScheme: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'cyan';
  className?: string;
}

const colorSchemes = {
  primary: {
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30',
    icon: 'text-blue-600 dark:text-blue-400',
    value: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    glow: 'hover:shadow-blue-500/20',
  },
  success: {
    bg: 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/50 dark:to-emerald-900/30',
    icon: 'text-green-600 dark:text-green-400',
    value: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
    glow: 'hover:shadow-green-500/20',
  },
  warning: {
    bg: 'bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/50 dark:to-amber-900/30',
    icon: 'text-orange-600 dark:text-orange-400',
    value: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
    glow: 'hover:shadow-orange-500/20',
  },
  danger: {
    bg: 'bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/50 dark:to-rose-900/30',
    icon: 'text-red-600 dark:text-red-400',
    value: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    glow: 'hover:shadow-red-500/20',
  },
  info: {
    bg: 'bg-gradient-to-br from-cyan-50 to-sky-100 dark:from-cyan-950/50 dark:to-sky-900/30',
    icon: 'text-cyan-600 dark:text-cyan-400',
    value: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-800',
    glow: 'hover:shadow-cyan-500/20',
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950/50 dark:to-violet-900/30',
    icon: 'text-purple-600 dark:text-purple-400',
    value: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    glow: 'hover:shadow-purple-500/20',
  },
  cyan: {
    bg: 'bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-teal-950/50 dark:to-cyan-900/30',
    icon: 'text-teal-600 dark:text-teal-400',
    value: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800',
    glow: 'hover:shadow-teal-500/20',
  },
};

export const ProfessionalStatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  colorScheme,
  className,
}: ProfessionalStatCardProps) => {
  const colors = colorSchemes[colorScheme];

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
        colors.bg,
        colors.border,
        colors.glow,
        'border-2',
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className={cn('text-3xl font-bold tracking-tight', colors.value)}>
              {value}
            </h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
            )}
          </div>
          <div className={cn('p-3 rounded-xl bg-white/50 dark:bg-black/20 backdrop-blur-sm', colors.icon)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        
        {trend && trendValue && (
          <div className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                'font-semibold',
                trend === 'up' && 'text-green-600 dark:text-green-400',
                trend === 'down' && 'text-red-600 dark:text-red-400',
                trend === 'neutral' && 'text-gray-600 dark:text-gray-400'
              )}
            >
              {trend === 'up' && '↗'} {trend === 'down' && '↘'} {trendValue}
            </span>
            <span className="text-muted-foreground">مقارنة بالشهر الماضي</span>
          </div>
        )}
      </CardContent>
      
      {/* Decorative Gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-white/20 to-transparent rounded-full blur-2xl -translate-y-16 translate-x-16" />
    </Card>
  );
};
