import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Star,
  Trophy,
  TrendingUp,
  Target,
  Award,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TechnicianStats {
  totalJobs: number;
  completedJobs: number;
  averageRating: number;
  totalRatings: number;
  totalPoints: number;
  reputationLevel: string;
}

interface TechnicianStatsCardProps {
  technicianId: string;
}

const TechnicianStatsCard = ({ technicianId }: TechnicianStatsCardProps) => {
  const [stats, setStats] = useState<TechnicianStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [technicianId]);

  const fetchStats = async () => {
    try {
      // Fetch stats from technician_stats table
      const { data: statsData, error: statsError } = await supabase
        .from("technician_stats")
        .select("*")
        .eq("technician_id", technicianId)
        .maybeSingle();

      if (statsError && statsError.code !== "PGRST116") throw statsError;

      // Fetch completed work logs count
      const { count: completedCount, error: logsError } = await supabase
        .from("work_logs")
        .select("*", { count: "exact", head: true })
        .eq("technician_id", technicianId)
        .eq("status", "completed");

      if (logsError) throw logsError;

      // Fetch ratings
      const { data: ratings, error: ratingsError } = await supabase
        .from("technician_ratings")
        .select("rating")
        .eq("technician_id", technicianId);

      if (ratingsError && ratingsError.code !== "PGRST116") throw ratingsError;

      const totalRatings = ratings?.length || 0;
      const averageRating = totalRatings > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
        : 0;

      setStats({
        totalJobs: statsData?.total_jobs || completedCount || 0,
        completedJobs: statsData?.completed_jobs || completedCount || 0,
        averageRating: statsData?.average_rating || averageRating,
        totalRatings: statsData?.total_ratings || totalRatings,
        totalPoints: statsData?.total_points || totalRatings * 10,
        reputationLevel: statsData?.reputation_level || "bronze",
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelInfo = (level: string) => {
    switch (level) {
      case "platinum":
        return { 
          label: "بلاتيني", 
          color: "bg-gradient-to-r from-slate-300 to-slate-100 text-slate-800",
          icon: "🏆",
          nextLevel: null,
          pointsNeeded: 0,
        };
      case "gold":
        return { 
          label: "ذهبي", 
          color: "bg-gradient-to-r from-yellow-500 to-yellow-300 text-yellow-900",
          icon: "🥇",
          nextLevel: "platinum",
          pointsNeeded: 500,
        };
      case "silver":
        return { 
          label: "فضي", 
          color: "bg-gradient-to-r from-slate-400 to-slate-300 text-slate-800",
          icon: "🥈",
          nextLevel: "gold",
          pointsNeeded: 250,
        };
      default:
        return { 
          label: "برونزي", 
          color: "bg-gradient-to-r from-amber-700 to-amber-500 text-amber-100",
          icon: "🥉",
          nextLevel: "silver",
          pointsNeeded: 100,
        };
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-5 h-5 ${
            i <= rating ? "text-yellow-400 fill-yellow-400" : "text-slate-600"
          }`}
        />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 animate-pulse">
        <CardContent className="h-48" />
      </Card>
    );
  }

  const levelInfo = getLevelInfo(stats?.reputationLevel || "bronze");
  const progressToNextLevel = stats && levelInfo.pointsNeeded > 0
    ? Math.min(100, (stats.totalPoints / levelInfo.pointsNeeded) * 100)
    : 100;

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          إحصائياتك المهنية
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reputation Level */}
        <div className="text-center space-y-2">
          <div className="text-4xl">{levelInfo.icon}</div>
          <Badge className={`text-lg px-4 py-1 ${levelInfo.color}`}>
            المستوى {levelInfo.label}
          </Badge>
          <p className="text-slate-400 text-sm">
            {stats?.totalPoints || 0} نقطة
          </p>
          {levelInfo.nextLevel && (
            <div className="space-y-1">
              <Progress value={progressToNextLevel} className="h-2" />
              <p className="text-slate-500 text-xs">
                {Math.round(progressToNextLevel)}% نحو المستوى التالي
              </p>
            </div>
          )}
        </div>

        {/* Rating */}
        <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-2">
              <Star className="w-4 h-4" />
              التقييم
            </span>
            <span className="text-white font-bold">
              {(stats?.averageRating || 0).toFixed(1)}/5
            </span>
          </div>
          <div className="flex items-center justify-center gap-1">
            {renderStars(Math.round(stats?.averageRating || 0))}
          </div>
          <p className="text-slate-500 text-xs text-center">
            بناءً على {stats?.totalRatings || 0} تقييم
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <Briefcase className="w-6 h-6 text-blue-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{stats?.totalJobs || 0}</p>
            <p className="text-slate-400 text-xs">إجمالي الأعمال</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{stats?.completedJobs || 0}</p>
            <p className="text-slate-400 text-xs">أعمال مكتملة</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <Target className="w-6 h-6 text-purple-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">
              {stats?.totalJobs && stats.totalJobs > 0 
                ? Math.round((stats.completedJobs / stats.totalJobs) * 100)
                : 0}%
            </p>
            <p className="text-slate-400 text-xs">نسبة الإنجاز</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <Award className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{stats?.totalPoints || 0}</p>
            <p className="text-slate-400 text-xs">النقاط</p>
          </div>
        </div>

        {/* Achievement Hint */}
        {stats && stats.totalRatings < 10 && (
          <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3">
            <p className="text-blue-300 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              أكمل {10 - stats.totalRatings} تقييمات إضافية للوصول للمستوى الفضي!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TechnicianStatsCard;
