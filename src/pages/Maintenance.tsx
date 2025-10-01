import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Plus, Calendar } from "lucide-react";
import { useState } from "react";
import { MaintenanceTicketModal } from "@/components/modals/MaintenanceTicketModal";
import { ScheduleTechnicianModal } from "@/components/modals/ScheduleTechnicianModal";
import { SettingsModal } from "@/components/modals/SettingsModal";

const Maintenance = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [maintenanceTicketOpen, setMaintenanceTicketOpen] = useState(false);
  const [scheduleTechOpen, setScheduleTechOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1 w-full">
        <AppSidebar />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wrench className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">الصيانة</h1>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setMaintenanceTicketOpen(true)}>
                  <Plus className="h-5 w-5 ml-2" />
                  تذكرة جديدة
                </Button>
                <Button onClick={() => setScheduleTechOpen(true)} variant="secondary">
                  <Calendar className="h-5 w-5 ml-2" />
                  جدولة فني
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>تذاكر الصيانة</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">قريباً: قائمة بجميع تذاكر الصيانة</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <MaintenanceTicketModal open={maintenanceTicketOpen} onOpenChange={setMaintenanceTicketOpen} />
      <ScheduleTechnicianModal open={scheduleTechOpen} onOpenChange={setScheduleTechOpen} />
    </div>
  );
};

export default Maintenance;
