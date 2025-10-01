import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Plus } from "lucide-react";
import { useState } from "react";
import { ReceiptModal } from "@/components/modals/ReceiptModal";
import { VoucherModal } from "@/components/modals/VoucherModal";
import { SettingsModal } from "@/components/modals/SettingsModal";

const Vouchers = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [voucherOpen, setVoucherOpen] = useState(false);

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
                <p className="text-muted-foreground">قريباً: قائمة بجميع السندات المالية</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ReceiptModal open={receiptOpen} onOpenChange={setReceiptOpen} />
      <VoucherModal open={voucherOpen} onOpenChange={setVoucherOpen} />
    </div>
  );
};

export default Vouchers;
