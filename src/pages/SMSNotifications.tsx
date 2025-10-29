import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MessageSquare, Send, FileText, Settings } from "lucide-react";
import { useState } from "react";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SendSMSForm } from "@/components/sms/SendSMSForm";
import { SMSLogs } from "@/components/sms/SMSLogs";
import { SMSTemplates } from "@/components/sms/SMSTemplates";
import { SMSSettings } from "@/components/sms/SMSSettings";
import { usePermissions } from "@/hooks/usePermissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const SMSNotifications = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { hasPermission } = usePermissions();

  const canSendSMS = hasPermission('notifications.send');
  const canViewLogs = hasPermission('notifications.view');

  if (!canSendSMS && !canViewLogs) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
        <div className="flex flex-1 w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ليس لديك صلاحية الوصول إلى الإشعارات
              </AlertDescription>
            </Alert>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1 w-full">
        <AppSidebar />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">إدارة الإشعارات SMS</h1>
            </div>

            <Tabs defaultValue="send" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="send" className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  إرسال رسالة
                </TabsTrigger>
                <TabsTrigger value="logs" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  سجل الرسائل
                </TabsTrigger>
                <TabsTrigger value="templates" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  القوالب
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  الإعدادات
                </TabsTrigger>
              </TabsList>

              <TabsContent value="send">
                <SendSMSForm />
              </TabsContent>

              <TabsContent value="logs">
                <SMSLogs />
              </TabsContent>

              <TabsContent value="templates">
                <SMSTemplates />
              </TabsContent>

              <TabsContent value="settings">
                <SMSSettings />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default SMSNotifications;
