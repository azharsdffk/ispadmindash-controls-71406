import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { FileText, Plus } from "lucide-react";
import { useState } from "react";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { ContractsTable } from "@/components/contracts/ContractsTable";
import { AddContractModal } from "@/components/modals/AddContractModal";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";

const Contracts = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addContractOpen, setAddContractOpen] = useState(false);
  const { hasPermission } = usePermissions();

  const canManageContracts = hasPermission('contracts.create') || hasPermission('contracts.update');

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
              
              {canManageContracts && (
                <Button onClick={() => setAddContractOpen(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  عقد جديد
                </Button>
              )}
            </div>

            <ContractsTable />
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <AddContractModal open={addContractOpen} onOpenChange={setAddContractOpen} />
    </div>
  );
};

export default Contracts;
