import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Plus, Loader2, Printer } from "lucide-react";
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

  const handlePrint = () => {
    window.print();
  };

  // حساب الإحصائيات
  const totalIncome = vouchers.filter(v => v.voucher_type === 'income').reduce((sum, v) => sum + Number(v.amount), 0);
  const totalExpense = vouchers.filter(v => v.voucher_type === 'expense').reduce((sum, v) => sum + Number(v.amount), 0);
  const netBalance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      {/* ======= قسم الطباعة الاحترافي ======= */}
      <div className="print-only">
        {/* الترويسة المميزة */}
        <div className="print-professional-header">
          <div className="print-logo-section">
            <div className="print-logo">
              <svg viewBox="0 0 100 100" className="print-logo-icon">
                <circle cx="50" cy="50" r="45" fill="#1e40af" />
                <text x="50" y="60" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold">$</text>
              </svg>
            </div>
            <div className="print-company-info">
              <h1 className="print-company-name">نظام إدارة المشتركين</h1>
              <p className="print-company-subtitle">Financial Management System</p>
            </div>
          </div>
          <div className="print-report-info">
            <div className="print-report-title">تقرير السندات المالية</div>
            <div className="print-report-date">
              <span>تاريخ التقرير:</span>
              <strong>{new Date().toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
            </div>
            <div className="print-report-time">
              <span>وقت الطباعة:</span>
              <strong>{new Date().toLocaleTimeString('ar-IQ')}</strong>
            </div>
          </div>
        </div>

        {/* ملخص الإحصائيات */}
        <div className="print-summary-section">
          <div className="print-summary-card print-income">
            <div className="print-summary-icon">↓</div>
            <div className="print-summary-content">
              <span className="print-summary-label">إجمالي القبض</span>
              <span className="print-summary-value">{formatCurrency(totalIncome, "IQD")}</span>
            </div>
          </div>
          <div className="print-summary-card print-expense">
            <div className="print-summary-icon">↑</div>
            <div className="print-summary-content">
              <span className="print-summary-label">إجمالي الصرف</span>
              <span className="print-summary-value">{formatCurrency(totalExpense, "IQD")}</span>
            </div>
          </div>
          <div className="print-summary-card print-balance">
            <div className="print-summary-icon">=</div>
            <div className="print-summary-content">
              <span className="print-summary-label">صافي الرصيد</span>
              <span className="print-summary-value">{formatCurrency(netBalance, "IQD")}</span>
            </div>
          </div>
          <div className="print-summary-card print-count">
            <div className="print-summary-icon">#</div>
            <div className="print-summary-content">
              <span className="print-summary-label">عدد السندات</span>
              <span className="print-summary-value">{vouchers.length}</span>
            </div>
          </div>
        </div>

        {/* عنوان الجدول */}
        <div className="print-table-header">
          <h2>تفاصيل السندات المالية</h2>
          <div className="print-table-line"></div>
        </div>
      </div>
      
      <div className="flex flex-1 w-full">
        <AppSidebar />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between no-print">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">السندات المالية</h1>
              </div>
              <div className="flex gap-2">
                <Button onClick={handlePrint} variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                  <Printer className="h-5 w-5 ml-2" />
                  طباعة
                </Button>
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

            <Card className="print-main-table">
              <CardHeader className="no-print">
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
                  <Table className="print-table">
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
                      {vouchers.map((voucher, index) => (
                        <TableRow 
                          key={voucher.id} 
                          className={`cursor-pointer hover:bg-muted/50 transition-colors ${index % 2 === 0 ? 'print-row-even' : 'print-row-odd'}`}
                          onClick={() => handleVoucherClick(voucher)}
                        >
                          <TableCell className="font-medium text-primary">{voucher.voucher_number}</TableCell>
                          <TableCell>
                            <Badge variant={voucher.voucher_type === "income" ? "default" : "destructive"} className="print-badge">
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

      {/* تذييل الطباعة الاحترافي */}
      <div className="print-professional-footer print-only">
        <div className="print-footer-line"></div>
        <div className="print-footer-content">
          <div className="print-footer-right">
            <span>نظام إدارة المشتركين</span>
            <span>•</span>
            <span>Financial Management System</span>
          </div>
          <div className="print-footer-center">
            <span>صفحة <span className="print-page-number"></span></span>
          </div>
          <div className="print-footer-left">
            <span>{new Date().toLocaleDateString('ar-IQ')}</span>
            <span>-</span>
            <span>{new Date().toLocaleTimeString('ar-IQ')}</span>
          </div>
        </div>
        <div className="print-footer-watermark">
          تم إنشاء هذا التقرير آلياً - جميع الحقوق محفوظة
        </div>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ReceiptModal open={receiptOpen} onOpenChange={(open) => !open && handleModalClose()} />
      <VoucherModal open={voucherOpen} onOpenChange={(open) => !open && handleModalClose()} />
      <VoucherDetailsModal open={detailsOpen} onOpenChange={setDetailsOpen} voucher={selectedVoucher} />
    </div>
  );
};

export default Vouchers;
