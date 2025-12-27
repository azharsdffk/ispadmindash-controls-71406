import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Award, Star, Crown, TrendingUp } from "lucide-react";

interface LoyaltyData {
  points: number;
  lifetime_points: number;
  tier: string | null;
  tier_discount_percentage: number | null;
}

interface LoyaltyPointsDisplayProps {
  subscriberId: string;
}

export const LoyaltyPointsDisplay = ({ subscriberId }: LoyaltyPointsDisplayProps) => {
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoyalty();
  }, [subscriberId]);

  const fetchLoyalty = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('points, lifetime_points, tier, tier_discount_percentage')
        .eq('subscriber_id', subscriberId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setLoyalty(data);
    } catch (error) {
      console.error('Error fetching loyalty:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierInfo = (tier: string | null) => {
    const tiers: Record<string, { label: string; color: string; icon: any; nextTier: string; pointsNeeded: number }> = {
      bronze: { label: 'برونزي', color: 'text-amber-700', icon: Star, nextTier: 'فضي', pointsNeeded: 500 },
      silver: { label: 'فضي', color: 'text-slate-500', icon: Star, nextTier: 'ذهبي', pointsNeeded: 1500 },
      gold: { label: 'ذهبي', color: 'text-yellow-500', icon: Crown, nextTier: 'بلاتيني', pointsNeeded: 5000 },
      platinum: { label: 'بلاتيني', color: 'text-purple-500', icon: Crown, nextTier: '', pointsNeeded: 0 },
    };
    return tiers[tier || 'bronze'] || tiers.bronze;
  };

  const getProgressToNextTier = () => {
    if (!loyalty) return 0;
    const tierInfo = getTierInfo(loyalty.tier);
    if (!tierInfo.pointsNeeded) return 100;
    return Math.min((loyalty.lifetime_points / tierInfo.pointsNeeded) * 100, 100);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-muted rounded w-1/2"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!loyalty) {
    return (
      <Card className="bg-gradient-to-br from-amber-500/10 to-background border-amber-500/20">
        <CardContent className="p-6 text-center">
          <Award className="h-12 w-12 text-amber-500 mx-auto mb-3" />
          <h3 className="font-semibold mb-1">انضم لبرنامج الولاء!</h3>
          <p className="text-sm text-muted-foreground">
            اكسب نقاط مع كل دفعة واستبدلها بخصومات
          </p>
        </CardContent>
      </Card>
    );
  }

  const tierInfo = getTierInfo(loyalty.tier);
  const TierIcon = tierInfo.icon;

  return (
    <Card className="bg-gradient-to-br from-amber-500/10 to-background border-amber-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Award className="h-5 w-5 text-amber-500" />
          نقاط الولاء
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-primary">
              {loyalty.points.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">نقطة متاحة</p>
          </div>
          <Badge className={`${tierInfo.color} gap-1 text-base px-3 py-1`}>
            <TierIcon className="h-4 w-4" />
            {tierInfo.label}
          </Badge>
        </div>

        {loyalty.tier_discount_percentage && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">خصم {loyalty.tier_discount_percentage}% على الفواتير</span>
            </div>
          </div>
        )}

        {tierInfo.nextTier && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">التقدم نحو المستوى التالي</span>
              <span className="font-medium">{tierInfo.nextTier}</span>
            </div>
            <Progress value={getProgressToNextTier()} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {loyalty.lifetime_points.toLocaleString()} / {tierInfo.pointsNeeded.toLocaleString()} نقطة
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};