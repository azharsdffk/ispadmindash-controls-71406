import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, User, Phone, MapPin, Wifi } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

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
        .or(`phone.eq.${searchTerm},username.eq.${searchTerm}`)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: "لم يتم العثور",
            description: "لم يتم العثور على مشترك بهذه البيانات",
            variant: "destructive",
          });
        } else {
          throw error;
        }
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
              <Label htmlFor="search">رقم الخدمة أو رقم الهاتف</Label>
              <Input
                id="search"
                placeholder="أدخل رقم الخدمة أو رقم الهاتف"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={isLoading}
              />
            </div>
            <Button 
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
                  </div>

                  <Button onClick={handleSelect} className="w-full">
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
