import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus } from "lucide-react";
import { useState } from "react";
import { AddSubscriberModal } from "@/components/modals/AddSubscriberModal";
import { SettingsModal } from "@/components/modals/SettingsModal";

const Subscribers = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addSubscriberOpen, setAddSubscriberOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1 w-full">
        <AppSidebar />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">المشتركين</h1>
              </div>
              <Button onClick={() => setAddSubscriberOpen(true)}>
                <UserPlus className="h-5 w-5 ml-2" />
                إضافة مشترك
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>قائمة المشتركين</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">قريباً: قائمة بجميع المشتركين</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <AddSubscriberModal open={addSubscriberOpen} onOpenChange={setAddSubscriberOpen} />
    </div>
  );
};

export default Subscribers;
