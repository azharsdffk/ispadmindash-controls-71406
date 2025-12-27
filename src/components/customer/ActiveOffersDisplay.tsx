import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Percent, Calendar, Zap, Star } from "lucide-react";

interface Offer {
  id: string;
  name: string;
  description: string | null;
  offer_type: string;
  discount_percentage: number | null;
  free_months: number | null;
  bonus_speed_mbps: number | null;
  valid_until: string;
}

export const ActiveOffersDisplay = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('promotional_offers')
        .select('*')
        .eq('active', true)
        .gt('valid_until', new Date().toISOString())
        .order('valid_until', { ascending: true })
        .limit(5);

      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOfferIcon = (type: string) => {
    switch (type) {
      case 'discount': return Percent;
      case 'free_months': return Calendar;
      case 'speed_boost': return Zap;
      default: return Gift;
    }
  };

  const getOfferBadge = (offer: Offer) => {
    if (offer.discount_percentage) {
      return `خصم ${offer.discount_percentage}%`;
    }
    if (offer.free_months) {
      return `${offer.free_months} شهر مجاناً`;
    }
    if (offer.bonus_speed_mbps) {
      return `+${offer.bonus_speed_mbps} ميجا`;
    }
    return 'عرض خاص';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (offers.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="h-5 w-5 text-yellow-500" />
          العروض الحالية
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {offers.map((offer) => {
            const Icon = getOfferIcon(offer.offer_type);
            return (
              <div 
                key={offer.id}
                className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{offer.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {getOfferBadge(offer)}
                      </Badge>
                    </div>
                    {offer.description && (
                      <p className="text-sm text-muted-foreground">{offer.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      صالح حتى: {new Date(offer.valid_until).toLocaleDateString('ar-IQ')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};