import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, AlertCircle, User, Package, Phone, MapPin, RefreshCw, MoreHorizontal, Edit, Trash2, FileText, Clock, CheckCircle, XCircle, Pause } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ar } from "date-fns/locale";
import { formatCurrency } from "@/lib/currency";
import { ContractDetailsModal } from "@/components/modals/ContractDetailsModal";
import { usePermissions } from "@/hooks/usePermissions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface Contract {
  id: string;
  contract_number: string;
  subscriber_id: string;
  package_id: string | null;
  start_date: string;
  end_date: string;
  status: string;
  auto_renew: boolean;
  renewal_period_months: number;
  monthly_fee: number;
  currency: string;
  installation_fee: number;
  notes: string | null;
  created_at: string;
  subscribers: {
    name: string;
    phone: string;
    address?: string;
  };
  packages: {
    name: string;
    speed_mbps?: number;
  } | null;
}

interface ContractsTableProps {
  contracts: Contract[];
  loading: boolean;
  viewMode: 'table' | 'grid';
  onRefresh: () => void;
}

export const ContractsTable = ({ contracts, loading, viewMode, onRefresh }: ContractsTableProps) => {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { hasPermission } = usePermissions();

  const canViewContracts = hasPermission('contracts.view');
  const canUpdateContracts = hasPermission('contracts.update');

  const getStatusConfig = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any; color: string }> = {
      active: { label: 'نشط', variant: 'default', icon: CheckCircle, color: 'text-emerald-500' },
      expired: { label: 'منتهي', variant: 'destructive', icon: XCircle, color: 'text-red-500' },
      suspended: { label: 'معلق', variant: 'secondary', icon: Pause, color: 'text-amber-500' },
      cancelled: { label: 'ملغي', variant: 'outline', icon: XCircle, color: 'text-gray-500' },
      pending: { label: 'قيد الانتظار', variant: 'secondary', icon: Clock, color: 'text-blue-500' }
    };

    return statusMap[status] || statusMap.pending;
  };

  const getDaysUntilExpiry = (endDate: string) => {
    return differenceInDays(new Date(endDate), new Date());
  };

  const getContractProgress = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    
    if (now >= end) return 100;
    if (now <= start) return 0;
    
    return Math.round(((now - start) / (end - start)) * 100);
  };

  const viewDetails = (contract: Contract) => {
    setSelectedContract(contract);
    setDetailsOpen(true);
  };

  if (!canViewContracts) {
    return (
      <Card className="border-white/[0.08] bg-card/40 backdrop-blur-xl">
        <CardContent className="p-12 text-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-lg font-medium">ليس لديك صلاحية لعرض العقود</p>
          <p className="text-muted-foreground text-sm mt-2">تواصل مع المسؤول للحصول على الصلاحيات المطلوبة</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-white/[0.08] bg-card/40 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (contracts.length === 0) {
    return (
      <Card className="border-white/[0.08] bg-card/40 backdrop-blur-xl">
        <CardContent className="p-12 text-center">
          <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium">لا توجد عقود</p>
          <p className="text-muted-foreground text-sm mt-2">لم يتم العثور على عقود تطابق معايير البحث</p>
        </CardContent>
      </Card>
    );
  }

  // Grid View
  if (viewMode === 'grid') {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contracts.map((contract) => {
            const statusConfig = getStatusConfig(contract.status);
            const StatusIcon = statusConfig.icon;
            const daysUntilExpiry = getDaysUntilExpiry(contract.end_date);
            const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30 && contract.status === 'active';
            const progress = getContractProgress(contract.start_date, contract.end_date);

            return (
              <Card 
                key={contract.id}
                className="relative overflow-hidden border-white/[0.08] bg-card/40 backdrop-blur-xl hover:border-white/[0.15] transition-all duration-300 group cursor-pointer"
                onClick={() => viewDetails(contract)}
              >
                {isExpiringSoon && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                )}
                
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{contract.contract_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(contract.created_at), 'dd MMM yyyy', { locale: ar })}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusConfig.variant} className="gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {statusConfig.label}
                    </Badge>
                  </div>

                  {/* Subscriber Info */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{contract.subscribers.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{contract.subscribers.phone}</span>
                    </div>
                    {contract.packages && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span>{contract.packages.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>تقدم العقد</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>

                  {/* Dates */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(contract.start_date), 'dd/MM/yy')}</span>
                    </div>
                    <span>→</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(contract.end_date), 'dd/MM/yy')}</span>
                      {isExpiringSoon && (
                        <AlertCircle className="h-3 w-3 text-amber-500" />
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
                    <div className="text-lg font-bold text-primary">
                      {formatCurrency(Number(contract.monthly_fee), contract.currency as 'IQD' | 'USD')}
                      <span className="text-xs font-normal text-muted-foreground">/شهر</span>
                    </div>
                    {contract.auto_renew && (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <RefreshCw className="h-3 w-3" />
                        تجديد تلقائي
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selectedContract && (
          <ContractDetailsModal
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            contract={selectedContract}
            onUpdate={onRefresh}
          />
        )}
      </>
    );
  }

  // Table View
  return (
    <>
      <Card className="border-white/[0.08] bg-card/40 backdrop-blur-xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.08] hover:bg-transparent">
                <TableHead className="text-right">رقم العقد</TableHead>
                <TableHead className="text-right">المشترك</TableHead>
                <TableHead className="text-right">الباقة</TableHead>
                <TableHead className="text-right">المدة</TableHead>
                <TableHead className="text-right">التقدم</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">القيمة الشهرية</TableHead>
                <TableHead className="text-right">تجديد تلقائي</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => {
                const statusConfig = getStatusConfig(contract.status);
                const StatusIcon = statusConfig.icon;
                const daysUntilExpiry = getDaysUntilExpiry(contract.end_date);
                const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30 && contract.status === 'active';
                const progress = getContractProgress(contract.start_date, contract.end_date);
                
                return (
                  <TableRow 
                    key={contract.id} 
                    className="border-white/[0.08] hover:bg-white/[0.02] cursor-pointer group"
                    onClick={() => viewDetails(contract)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{contract.contract_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(contract.created_at), 'dd MMM yyyy', { locale: ar })}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{contract.subscribers.name}</p>
                        <p className="text-sm text-muted-foreground">{contract.subscribers.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {contract.packages?.name || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(contract.start_date), 'dd/MM/yy')} - {format(new Date(contract.end_date), 'dd/MM/yy')}
                        </div>
                        {isExpiringSoon && (
                          <div className="flex items-center gap-1 text-amber-500 text-xs mt-1">
                            <AlertCircle className="h-3 w-3" />
                            ينتهي خلال {daysUntilExpiry} يوم
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-24">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-primary">
                        {formatCurrency(Number(contract.monthly_fee), contract.currency as 'IQD' | 'USD')}
                      </span>
                    </TableCell>
                    <TableCell>
                      {contract.auto_renew ? (
                        <Badge variant="default" className="gap-1">
                          <RefreshCw className="h-3 w-3" />
                          {contract.renewal_period_months} شهر
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">غير مفعّل</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-left" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => viewDetails(contract)}>
                            <Eye className="h-4 w-4 ml-2" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          {canUpdateContracts && (
                            <>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 ml-2" />
                                تعديل العقد
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 ml-2" />
                                إلغاء العقد
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedContract && (
        <ContractDetailsModal
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          contract={selectedContract}
          onUpdate={onRefresh}
        />
      )}
    </>
  );
};
