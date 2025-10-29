import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { formatCurrency } from "@/lib/currency";
import { ContractDetailsModal } from "@/components/modals/ContractDetailsModal";
import { usePermissions } from "@/hooks/usePermissions";

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
  };
  packages: {
    name: string;
  } | null;
}

export const ContractsTable = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { hasPermission } = usePermissions();

  const canViewContracts = hasPermission('contracts.view');

  useEffect(() => {
    if (canViewContracts) {
      fetchContracts();
    }
  }, [canViewContracts]);

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          subscribers (name, phone),
          packages (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error: any) {
      console.error('Error fetching contracts:', error);
      toast.error('فشل تحميل العقود');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'نشط', variant: 'default' },
      expired: { label: 'منتهي', variant: 'destructive' },
      suspended: { label: 'معلق', variant: 'secondary' },
      cancelled: { label: 'ملغي', variant: 'outline' },
      pending: { label: 'قيد الانتظار', variant: 'secondary' }
    };

    const { label, variant } = statusMap[status] || statusMap.pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const viewDetails = (contract: Contract) => {
    setSelectedContract(contract);
    setDetailsOpen(true);
  };

  if (!canViewContracts) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          ليس لديك صلاحية لعرض العقود
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          جاري تحميل العقود...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>قائمة العقود</CardTitle>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد عقود حالياً
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم العقد</TableHead>
                  <TableHead>المشترك</TableHead>
                  <TableHead>الباقة</TableHead>
                  <TableHead>تاريخ البدء</TableHead>
                  <TableHead>تاريخ الانتهاء</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>القيمة الشهرية</TableHead>
                  <TableHead>تجديد تلقائي</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => {
                  const daysUntilExpiry = getDaysUntilExpiry(contract.end_date);
                  const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;
                  
                  return (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">{contract.contract_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{contract.subscribers.name}</p>
                          <p className="text-sm text-muted-foreground">{contract.subscribers.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>{contract.packages?.name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(contract.start_date), 'dd/MM/yyyy', { locale: ar })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(contract.end_date), 'dd/MM/yyyy', { locale: ar })}
                          {isExpiringSoon && contract.status === 'active' && (
                            <div className="inline-flex" title={`ينتهي خلال ${daysUntilExpiry} يوم`}>
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(contract.status)}</TableCell>
                      <TableCell>
                        {formatCurrency(Number(contract.monthly_fee), contract.currency as 'IQD' | 'USD')}
                      </TableCell>
                      <TableCell>
                        {contract.auto_renew ? (
                          <Badge variant="default">مفعّل ({contract.renewal_period_months} شهر)</Badge>
                        ) : (
                          <Badge variant="outline">غير مفعّل</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-left">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewDetails(contract)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedContract && (
        <ContractDetailsModal
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          contract={selectedContract}
          onUpdate={fetchContracts}
        />
      )}
    </>
  );
};
