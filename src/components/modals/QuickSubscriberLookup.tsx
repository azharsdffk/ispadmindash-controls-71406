import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, User, Phone, MapPin, Wifi, Lock, Unlock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface QuickSubscriberLookupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscriberSelected?: (subscriber: any) => void;
}

export const QuickSubscriberLookup = ({ 
  open, 
  onOpenChange,
  onSubscriberSelected 
}: QuickSubscriberLookupProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [subscriber, setSubscriber] = useState<any>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال رقم الخدمة أو رقم الهاتف",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("subscribers")
        .select("*")
        .or(`phone.eq.${searchTerm},username.eq.${searchTerm},mac_address.ilike.%${searchTerm}%`)
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        toast({
          title: "لم يتم العثور",
          description: "لم يتم العثور على مشترك بهذه البيانات",
          variant: "destructive",
        });
        setSubscriber(null);
        return;
      }

      setSubscriber(data);
      toast({
        title: "تم العثور",
        description: "تم العثور على المشترك بنجاح",
      });
    } catch (error) {
      console.error("Error searching subscriber:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء البحث",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = () => {
    if (subscriber && onSubscriberSelected) {
      onSubscriberSelected(subscriber);
      onOpenChange(false);
      setSearchTerm("");
      setSubscriber(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>البحث عن مشترك</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="search">رقم الخدمة أو رقم الهاتف أو MAC Address</Label>
              <Input
                id="search"
                placeholder="أدخل رقم الخدمة أو رقم الهاتف أو MAC Address"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={isLoading}
              />
            </div>
            <Button 
              type="button"
              onClick={handleSearch} 
              disabled={isLoading}
              className="mt-auto"
            >
              <Search className="ml-2 h-4 w-4" />
              بحث
            </Button>
          </div>

          {subscriber && (
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      تم العثور على المشترك التالي
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">الاسم</p>
                        <p className="font-medium">{subscriber.name}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">الهاتف</p>
                        <p className="font-medium" dir="ltr">{subscriber.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Wifi className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">الباقة</p>
                        <p className="font-medium">{subscriber.plan || "غير محدد"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">العنوان</p>
                        <p className="font-medium">{subscriber.address || "غير محدد"}</p>
                      </div>
                    </div>

                    {subscriber.mac_address && (
                      <div className="flex items-start gap-3 col-span-2">
                        <Wifi className="h-5 w-5 text-cyan-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">MAC Address</p>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{subscriber.mac_address}</span>
                            {subscriber.mac_locked ? (
                              <Badge variant="secondary" className="gap-1">
                                <Lock className="h-3 w-3" />
                                مقفل
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1">
                                <Unlock className="h-3 w-3" />
                                غير مقفل
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button type="button" onClick={handleSelect} className="w-full">
                    اختيار هذا المشترك
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
