import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, MapPin } from "lucide-react";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { AddEmployeeModal } from "@/components/modals/AddEmployeeModal";
import { EmployeeLocationTracker } from "@/components/employees/EmployeeLocationTracker";
import { EmployeeList } from "@/components/employees/EmployeeList";

const Employees = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [showLocationTracker, setShowLocationTracker] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-foreground">إدارة الموظفين</h1>
              <div className="flex gap-2">
                <Button onClick={() => setShowLocationTracker(!showLocationTracker)} variant="outline">
                  <MapPin className="ml-2 h-4 w-4" />
                  {showLocationTracker ? "إخفاء الخريطة" : "عرض المواقع"}
                </Button>
                <Button onClick={() => setAddEmployeeOpen(true)}>
                  <UserPlus className="ml-2 h-4 w-4" />
                  إضافة موظف
                </Button>
              </div>
            </div>

            {showLocationTracker && (
              <Card className="p-6">
                <EmployeeLocationTracker />
              </Card>
            )}

            <Card className="p-6">
              <EmployeeList />
            </Card>
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <AddEmployeeModal open={addEmployeeOpen} onOpenChange={setAddEmployeeOpen} />
    </div>
  );
};

export default Employees;
