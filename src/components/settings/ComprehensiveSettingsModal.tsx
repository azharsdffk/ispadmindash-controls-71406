import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Settings, User, Shield, Bell, Globe
} from "lucide-react";
import { AccountSettingsTab } from "./tabs/AccountSettingsTab";
import { SecuritySettingsTab } from "./tabs/SecuritySettingsTab";
import { NotificationSettingsTab } from "./tabs/NotificationSettingsTab";
import { LanguageRegionTab } from "./tabs/LanguageRegionTab";

interface ComprehensiveSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ComprehensiveSettingsModal = ({ open, onOpenChange }: ComprehensiveSettingsModalProps) => {
  const [activeTab, setActiveTab] = useState("account");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0" dir="rtl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40 bg-gradient-to-r from-primary/5 to-transparent">
          <DialogTitle className="text-2xl flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            الإعدادات
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid grid-cols-4 w-full rounded-none border-b border-border/40 bg-transparent p-0 h-auto">
            <TabsTrigger 
              value="account" 
              className="gap-2 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5 transition-all"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">الحساب</span>
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="gap-2 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5 transition-all"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">الأمان</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="gap-2 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5 transition-all"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">الإشعارات</span>
            </TabsTrigger>
            <TabsTrigger 
              value="language" 
              className="gap-2 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5 transition-all"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">اللغة</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh]">
            <div className="p-6">
              <TabsContent value="account" className="mt-0">
                <AccountSettingsTab onClose={() => onOpenChange(false)} />
              </TabsContent>

              <TabsContent value="security" className="mt-0">
                <SecuritySettingsTab />
              </TabsContent>

              <TabsContent value="notifications" className="mt-0">
                <NotificationSettingsTab />
              </TabsContent>

              <TabsContent value="language" className="mt-0">
                <LanguageRegionTab />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
