import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { SettingsModal } from "@/components/modals/SettingsModal";

const Settings = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1 w-full">
        <AppSidebar />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
              <SettingsIcon className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">الإعدادات</h1>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>إعدادات النظام</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">قريباً: إعدادات مفصلة للنظام</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default Settings;
