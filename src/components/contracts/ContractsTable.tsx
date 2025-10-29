import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Contract {
  id: string;
  contract_number: string;
  subscriber_id: string;
  subscribers: { name: string; phone: string } | null;
  packages: { name: string } | null;
  start_date: string;
  end_date: string;
  status: string;
  auto_renew: boolean;
  monthly_fee: number;
  currency: string;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "نشط", variant: "default" },
  expired: { label: "منتهي", variant: "destructive" },
  suspended: { label: "معلق", variant: "secondary" },
  cancelled: { label: "ملغي", variant: "outline" },
  pending: { label: "قيد الانتظار", variant: "secondary" },
};

export const ContractsTable = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          subscribers (name, phone),
          packages (name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      toast.error("حدث خطأ أثناء تحميل العقود");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();

    const channel = supabase
      .channel("contracts_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contracts" },
        () => {
          fetchContracts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("contracts")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast.success("تم حذف العقد بنجاح");
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting contract:", error);
      toast.error("حدث خطأ أثناء حذف العقد");
    }
  };

  const handleRenew = async (id: string) => {
    try {
      const contract = contracts.find(c => c.id === id);
      if (!contract) return;

      const newEndDate = new Date(contract.end_date);
      newEndDate.setMonth(newEndDate.getMonth() + 12);

      const { error } = await supabase
        .from("contracts")
        .update({
          end_date: format(newEndDate, "yyyy-MM-dd"),
          status: "active",
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("تم تجديد العقد بنجاح");
    } catch (error) {
      console.error("Error renewing contract:", error);
      toast.error("حدث خطأ أثناء تجديد العقد");
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">رقم العقد</TableHead>
              <TableHead className="text-right">المشترك</TableHead>
              <TableHead className="text-right">الباقة</TableHead>
              <TableHead className="text-right">تاريخ البدء</TableHead>
              <TableHead className="text-right">تاريخ الانتهاء</TableHead>
              <TableHead className="text-right">الرسوم الشهرية</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">تجديد تلقائي</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  لا توجد عقود
                </TableCell>
              </TableRow>
            ) : (
              contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">
                    {contract.contract_number}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{contract.subscribers?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {contract.subscribers?.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{contract.packages?.name || "-"}</TableCell>
                  <TableCell>
                    {format(new Date(contract.start_date), "dd/MM/yyyy", {
                      locale: ar,
                    })}
                  </TableCell>
                  <TableCell>
                    {format(new Date(contract.end_date), "dd/MM/yyyy", {
                      locale: ar,
                    })}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(contract.monthly_fee, contract.currency as any)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusLabels[contract.status]?.variant}>
                      {statusLabels[contract.status]?.label || contract.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {contract.auto_renew ? (
                      <Badge variant="default">نعم</Badge>
                    ) : (
                      <Badge variant="outline">لا</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {contract.status === "expired" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRenew(contract.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteId(contract.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا العقد؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
