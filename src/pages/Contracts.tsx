import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useState } from "react";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import { ContractsTable } from "@/components/contracts/ContractsTable";
import { ContractModal } from "@/components/modals/ContractModal";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Contracts = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const { isAdmin, isAccountant, loading } = useUserRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin && !isAccountant) {
    return <Navigate to="/" replace />;
  }

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
                <h1 className="text-3xl font-bold">إدارة العقود</h1>
              </div>
              
              <Button onClick={() => setContractModalOpen(true)}>
                <Plus className="h-4 w-4 ml-2" />
                عقد جديد
              </Button>
            </div>

            <Card className="p-6">
              <ContractsTable />
            </Card>
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ContractModal 
        open={contractModalOpen} 
        onOpenChange={setContractModalOpen}
      />
    </div>
  );
};

export default Contracts;
