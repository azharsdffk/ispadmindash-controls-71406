import { useState, useCallback } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, MapPin, Users, Shield } from "lucide-react";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { AddEmployeeModal } from "@/components/modals/AddEmployeeModal";
import { EmployeeLocationTracker } from "@/components/employees/EmployeeLocationTracker";
import { EmployeeList } from "@/components/employees/EmployeeList";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Employees = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [showLocationTracker, setShowLocationTracker] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { isAdmin, loading } = useUserRole();

  const handleEmployeeAdded = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background" dir="rtl">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
          
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <Users className="h-8 w-8 text-primary" />
                    إدارة الموظفين
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    إضافة وإدارة حسابات الموظفين والفنيين
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowLocationTracker(!showLocationTracker)} variant="outline">
                    <MapPin className="ml-2 h-4 w-4" />
                    {showLocationTracker ? "إخفاء الخريطة" : "عرض المواقع"}
                  </Button>
                  <Button onClick={() => setAddEmployeeOpen(true)} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    <span>إضافة موظف</span>
                  </Button>
                </div>
              </div>

              {/* Admin Notice */}
              <Alert className="bg-primary/5 border-primary/20">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  هذه الصفحة متاحة للمدراء فقط. يمكنك إضافة موظفين جدد وتعيين صلاحياتهم.
                </AlertDescription>
              </Alert>

              {showLocationTracker && (
                <Card className="p-6">
                  <EmployeeLocationTracker />
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>قائمة الموظفين</CardTitle>
                  <CardDescription>
                    جميع الموظفين المسجلين في النظام
                  </CardDescription>
                </CardHeader>
                <div className="p-6 pt-0">
                  <EmployeeList key={refreshKey} />
                </div>
              </Card>
            </div>
          </main>
        </div>

        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
        <AddEmployeeModal 
          open={addEmployeeOpen} 
          onOpenChange={setAddEmployeeOpen} 
          onSuccess={handleEmployeeAdded}
        />
      </div>
    </SidebarProvider>
  );
};

export default Employees;
