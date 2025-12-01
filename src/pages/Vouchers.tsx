import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Plus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { ReceiptModal } from "@/components/modals/ReceiptModal";
import { VoucherModal } from "@/components/modals/VoucherModal";
import { VoucherDetailsModal } from "@/components/modals/VoucherDetailsModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, Currency } from "@/lib/currency";

const Vouchers = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      const { data, error } = await supabase
        .from("vouchers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVouchers(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل تحميل السندات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setReceiptOpen(false);
    setVoucherOpen(false);
    loadVouchers();
  };

  const handleVoucherClick = (voucher: any) => {
    setSelectedVoucher(voucher);
    setDetailsOpen(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1 w-full">
        <AppSidebar />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">السندات المالية</h1>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setReceiptOpen(true)} className="bg-success hover:bg-success/90">
                  <Plus className="h-5 w-5 ml-2" />
                  سند قبض
                </Button>
                <Button onClick={() => setVoucherOpen(true)} className="bg-warning hover:bg-warning/90">
                  <Plus className="h-5 w-5 ml-2" />
                  سند صرف
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>قائمة السندات المالية</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : vouchers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد سندات مالية
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">رقم السند</TableHead>
                        <TableHead className="text-right">النوع</TableHead>
                        <TableHead className="text-right">المبلغ</TableHead>
                        <TableHead className="text-right">الوصف</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vouchers.map((voucher) => (
                        <TableRow 
                          key={voucher.id} 
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleVoucherClick(voucher)}
                        >
                          <TableCell className="font-medium text-primary">{voucher.voucher_number}</TableCell>
                          <TableCell>
                            <Badge variant={voucher.voucher_type === "income" ? "default" : "destructive"}>
                              {voucher.voucher_type === "income" ? "قبض" : "صرف"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(Number(voucher.amount), (voucher.currency as Currency) || "IQD")}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{voucher.description}</TableCell>
                          <TableCell>
                            {new Date(voucher.created_at).toLocaleDateString("ar-IQ")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ReceiptModal open={receiptOpen} onOpenChange={(open) => !open && handleModalClose()} />
      <VoucherModal open={voucherOpen} onOpenChange={(open) => !open && handleModalClose()} />
      <VoucherDetailsModal open={detailsOpen} onOpenChange={setDetailsOpen} voucher={selectedVoucher} />
    </div>
  );
};

export default Vouchers;
