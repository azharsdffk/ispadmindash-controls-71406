import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ticket, Gift, Users, Award } from "lucide-react";
import { useState } from "react";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { DiscountCouponsManager } from "@/components/discounts/DiscountCouponsManager";
import { PromotionalOffersManager } from "@/components/discounts/PromotionalOffersManager";
import { ReferralProgramManager } from "@/components/discounts/ReferralProgramManager";
import { LoyaltyProgramManager } from "@/components/discounts/LoyaltyProgramManager";

const Discounts = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1">
          <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
          
          <main className="container mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Gift className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold gradient-text">إدارة الخصومات والعروض</h1>
            </div>

            <Tabs defaultValue="coupons" className="space-y-6">
              <TabsList className="glass-card grid w-full grid-cols-4 h-14">
                <TabsTrigger value="coupons" className="text-sm font-semibold data-[state=active]:gradient-bg data-[state=active]:text-white">
                  <Ticket className="h-4 w-4 ml-2" />
                  كوبونات الخصم
                </TabsTrigger>
                <TabsTrigger value="offers" className="text-sm font-semibold data-[state=active]:gradient-bg data-[state=active]:text-white">
                  <Gift className="h-4 w-4 ml-2" />
                  العروض الترويجية
                </TabsTrigger>
                <TabsTrigger value="referral" className="text-sm font-semibold data-[state=active]:gradient-bg data-[state=active]:text-white">
                  <Users className="h-4 w-4 ml-2" />
                  برنامج الإحالة
                </TabsTrigger>
                <TabsTrigger value="loyalty" className="text-sm font-semibold data-[state=active]:gradient-bg data-[state=active]:text-white">
                  <Award className="h-4 w-4 ml-2" />
                  برنامج الولاء
                </TabsTrigger>
              </TabsList>

              <TabsContent value="coupons" className="animate-fade-in">
                <DiscountCouponsManager />
              </TabsContent>

              <TabsContent value="offers" className="animate-fade-in">
                <PromotionalOffersManager />
              </TabsContent>

              <TabsContent value="referral" className="animate-fade-in">
                <ReferralProgramManager />
              </TabsContent>

              <TabsContent value="loyalty" className="animate-fade-in">
                <LoyaltyProgramManager />
              </TabsContent>
            </Tabs>
          </main>
        </div>

        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    </SidebarProvider>
  );
};

export default Discounts;
