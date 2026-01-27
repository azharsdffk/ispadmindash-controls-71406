import { Skeleton } from "./skeleton";
import { Card, CardContent, CardHeader } from "./card";
import { cn } from "@/lib/utils";

// Skeleton لبطاقة الإحصائيات
export const StatCardSkeleton = ({ className }: { className?: string }) => (
  <Card className={cn("glass-card overflow-hidden", className)}>
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </CardContent>
  </Card>
);

// Skeleton لصف الجدول
export const TableRowSkeleton = ({ columns = 5 }: { columns?: number }) => (
  <tr className="border-b border-border/30">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="p-4">
        <Skeleton className="h-5 w-full max-w-[120px]" />
      </td>
    ))}
  </tr>
);

// Skeleton لجدول كامل
export const TableSkeleton = ({ 
  rows = 5, 
  columns = 5 
}: { 
  rows?: number; 
  columns?: number;
}) => (
  <div className="glass-card rounded-xl overflow-hidden">
    {/* Header */}
    <div className="p-4 border-b border-border/30">
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
    </div>
    {/* Rows */}
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-border/20 last:border-0">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-5 w-24" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Skeleton لبطاقة تذكرة
export const TicketCardSkeleton = () => (
  <Card className="glass-card border-r-4 border-r-muted animate-pulse">
    <CardHeader className="pb-2">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="pt-2 border-t border-border/20 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Skeleton لقائمة تذاكر
export const TicketListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <TicketCardSkeleton key={i} />
    ))}
  </div>
);

// Skeleton للداشبورد
export const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Stats Grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    
    {/* Charts Area */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="glass-card">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-xl" />
        </CardContent>
      </Card>
      <Card className="glass-card">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-xl" />
        </CardContent>
      </Card>
    </div>
    
    {/* Table */}
    <TableSkeleton rows={5} columns={5} />
  </div>
);

// Skeleton لصفحة كاملة مع Header
export const PageSkeleton = ({ 
  title = true,
  stats = 4,
  table = true
}: { 
  title?: boolean;
  stats?: number;
  table?: boolean;
}) => (
  <div className="space-y-6 animate-pulse">
    {/* Page Header */}
    {title && (
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-48" />
      </div>
    )}
    
    {/* Stats */}
    {stats > 0 && (
      <div className={`grid grid-cols-2 md:grid-cols-${Math.min(stats, 4)} gap-4`}>
        {Array.from({ length: stats }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )}
    
    {/* Table */}
    {table && <TableSkeleton />}
  </div>
);

// Skeleton للـ Form
export const FormSkeleton = ({ fields = 4 }: { fields?: number }) => (
  <Card className="glass-card">
    <CardHeader>
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 rounded-lg mt-6" />
    </CardContent>
  </Card>
);
