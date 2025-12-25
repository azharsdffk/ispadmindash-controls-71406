import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Ticket, Gift, Users, Award, TrendingUp, Percent, Tag, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { DiscountCouponsManager } from "@/components/discounts/DiscountCouponsManager";
import { PromotionalOffersManager } from "@/components/discounts/PromotionalOffersManager";
import { ReferralProgramManager } from "@/components/discounts/ReferralProgramManager";
import { LoyaltyProgramManager } from "@/components/discounts/LoyaltyProgramManager";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface DiscountStats {
  totalCoupons: number;
  activeCoupons: number;
  totalOffers: number;
  activeOffers: number;
  totalReferrals: number;
  completedReferrals: number;
  totalLoyaltyMembers: number;
  totalPointsIssued: number;
}

const Discounts = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [stats, setStats] = useState<DiscountStats>({
    totalCoupons: 0,
    activeCoupons: 0,
    totalOffers: 0,
    activeOffers: 0,
    totalReferrals: 0,
    completedReferrals: 0,
    totalLoyaltyMembers: 0,
    totalPointsIssued: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // جلب إحصائيات الكوبونات
      const { data: couponsData } = await supabase
        .from('discount_coupons')
        .select('id, active');

      // جلب إحصائيات العروض
      const { data: offersData } = await supabase
        .from('promotional_offers')
        .select('id, active');

      // جلب إحصائيات الإحالات
      const { data: referralsData } = await supabase
        .from('referrals')
        .select('id, status');

      // جلب إحصائيات الولاء
      const { data: loyaltyData } = await supabase
        .from('loyalty_points')
        .select('id, points');

      const { data: transactionsData } = await supabase
        .from('loyalty_transactions')
        .select('points, transaction_type')
        .eq('transaction_type', 'earn');

      setStats({
        totalCoupons: couponsData?.length || 0,
        activeCoupons: couponsData?.filter(c => c.active)?.length || 0,
        totalOffers: offersData?.length || 0,
        activeOffers: offersData?.filter(o => o.active)?.length || 0,
        totalReferrals: referralsData?.length || 0,
        completedReferrals: referralsData?.filter(r => r.status === 'completed')?.length || 0,
        totalLoyaltyMembers: loyaltyData?.length || 0,
        totalPointsIssued: transactionsData?.reduce((sum, t) => sum + (t.points || 0), 0) || 0,
      });
    } catch (error) {
      console.error('Error fetching discount stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: "كوبونات الخصم",
      value: stats.activeCoupons,
      subtitle: `من أصل ${stats.totalCoupons} كوبون`,
      icon: Ticket,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "العروض النشطة",
      value: stats.activeOffers,
      subtitle: `من أصل ${stats.totalOffers} عرض`,
      icon: Gift,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "الإحالات المكتملة",
      value: stats.completedReferrals,
      subtitle: `من أصل ${stats.totalReferrals} إحالة`,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "أعضاء الولاء",
      value: stats.totalLoyaltyMembers,
      subtitle: `${stats.totalPointsIssued.toLocaleString()} نقطة ممنوحة`,
      icon: Award,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1">
          <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
          
          <main className="container mx-auto p-6 space-y-6">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background p-8 border border-primary/20">
              <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,white)]" />
              <div className="relative flex items-center gap-4">
                <div className="p-4 rounded-xl bg-primary/20 backdrop-blur-sm">
                  <Tag className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">إدارة الخصومات والعروض</h1>
                  <p className="text-muted-foreground mt-1">
                    إدارة كوبونات الخصم والعروض الترويجية وبرامج الولاء والإحالة
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <Card key={i} className="glass-card">
                    <CardContent className="p-6">
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                statsCards.map((stat, index) => (
                  <Card key={index} className="glass-card hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                          <stat.icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="text-3xl font-bold">{stat.value.toLocaleString()}</div>
                          <div className="text-sm font-medium text-foreground/80">{stat.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">{stat.subtitle}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue="coupons" className="space-y-6">
              <TabsList className="glass-card grid w-full grid-cols-4 h-14 p-1.5">
                <TabsTrigger 
                  value="coupons" 
                  className="text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
                >
                  <Ticket className="h-4 w-4 ml-2" />
                  كوبونات الخصم
                </TabsTrigger>
                <TabsTrigger 
                  value="offers" 
                  className="text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
                >
                  <Gift className="h-4 w-4 ml-2" />
                  العروض الترويجية
                </TabsTrigger>
                <TabsTrigger 
                  value="referral" 
                  className="text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
                >
                  <Users className="h-4 w-4 ml-2" />
                  برنامج الإحالة
                </TabsTrigger>
                <TabsTrigger 
                  value="loyalty" 
                  className="text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
                >
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
