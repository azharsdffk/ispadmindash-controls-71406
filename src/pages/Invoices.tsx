import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FilePlus } from "lucide-react";
import { useState } from "react";
import { IssueInvoiceModal } from "@/components/modals/IssueInvoiceModal";
import { SettingsModal } from "@/components/modals/SettingsModal";

const Invoices = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [issueInvoiceOpen, setIssueInvoiceOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1 w-full">
        <AppSidebar />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">الفواتير</h1>
              </div>
              <Button onClick={() => setIssueInvoiceOpen(true)}>
                <FilePlus className="h-5 w-5 ml-2" />
                فاتورة جديدة
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>قائمة الفواتير</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">قريباً: قائمة بجميع الفواتير</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <IssueInvoiceModal open={issueInvoiceOpen} onOpenChange={setIssueInvoiceOpen} />
    </div>
  );
};

export default Invoices;
