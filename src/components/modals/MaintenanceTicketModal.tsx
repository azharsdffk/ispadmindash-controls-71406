import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { QuickSubscriberLookup } from "./QuickSubscriberLookup";
import { Search, MapPin, User, Phone, Wifi } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

interface MaintenanceTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const ticketSchema = z.object({
  subscriber_id: z.string().uuid("يجب اختيار مشترك"),
  issue_description: z.string().min(5, "الوصف يجب أن يكون 5 أحرف على الأقل"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

export const MaintenanceTicketModal = ({ open, onOpenChange, onSuccess }: MaintenanceTicketModalProps) => {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [selectedSubscriberData, setSelectedSubscriberData] = useState<any>(null);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [formData, setFormData] = useState({
    subscriber_id: "",
    priority: "medium",
    issue_description: "",
  });

  useEffect(() => {
    if (open) {
      loadSubscribers();
      getCurrentLocation();
    }
  }, [open]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast.success("تم تحديد موقع GPS");
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("لم يتم الحصول على موقع GPS");
        }
      );
    }
  };

  const loadSubscribers = async () => {
    const { data } = await supabase
      .from("subscribers")
      .select("id, name, phone")
      .order("name");
    if (data) setSubscribers(data);
  };

  const handleSubscriberSelected = (subscriber: any) => {
    setSelectedSubscriberData(subscriber);
    setFormData({ ...formData, subscriber_id: subscriber.id });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = ticketSchema.parse(formData);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // Generate ticket number
      const ticketNumber = `TKT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;
      
      const ticketData: any = {
        ticket_number: ticketNumber,
        subscriber_id: validatedData.subscriber_id,
        issue_description: validatedData.issue_description,
        priority: validatedData.priority as any,
        status: "open" as const,
        created_by: user?.id,
        notes: location 
          ? `موقع الفني عند الإنشاء: ${location.lat}, ${location.lng}`
          : undefined,
      };

      const { error } = await supabase.from("maintenance_tickets").insert([ticketData]);

      if (error) throw error;

      toast.success("تم فتح تذكرة الصيانة بنجاح");
      onOpenChange(false);
      setFormData({ subscriber_id: "", priority: "medium", issue_description: "" });
      setSelectedSubscriberData(null);
      setLocation(null);
      onSuccess?.();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
      } else {
        console.error("Error creating ticket:", error);
        toast.error("فشل فتح تذكرة الصيانة");
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent dir="rtl" className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>فتح تذكرة صيانة جديدة</DialogTitle>
            <DialogDescription>أدخل تفاصيل المشكلة</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* بحث سريع عن مشترك */}
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-semibold">بيانات المشترك</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsLookupOpen(true)}
                  >
                    <Search className="ml-2 h-4 w-4" />
                    بحث سريع
                  </Button>
                </div>

                {selectedSubscriberData ? (
                  <Alert>
                    <AlertDescription>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-primary mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">الاسم</p>
                            <p className="font-medium">{selectedSubscriberData.name}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Phone className="h-4 w-4 text-primary mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">الهاتف</p>
                            <p className="font-medium" dir="ltr">{selectedSubscriberData.phone}</p>
                          </div>
                        </div>
                        {selectedSubscriberData.plan && (
                          <div className="flex items-start gap-2">
                            <Wifi className="h-4 w-4 text-primary mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">الباقة</p>
                              <p className="font-medium">{selectedSubscriberData.plan}</p>
                            </div>
                          </div>
                        )}
                        {selectedSubscriberData.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-primary mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">العنوان</p>
                              <p className="font-medium text-sm">{selectedSubscriberData.address}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="subscriber">المشترك *</Label>
                    <select
                      id="subscriber"
                      required
                      className="w-full px-3 py-2 border rounded-md bg-background"
                      value={formData.subscriber_id}
                      onChange={(e) => {
                        setFormData({ ...formData, subscriber_id: e.target.value });
                        const sub = subscribers.find(s => s.id === e.target.value);
                        if (sub) setSelectedSubscriberData(sub);
                      }}
                    >
                      <option value="">اختر المشترك</option>
                      {subscribers.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} - {sub.phone}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="priority">الأولوية</Label>
              <select
                id="priority"
                className="w-full px-3 py-2 border rounded-md bg-background"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
                <option value="urgent">عاجلة</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">وصف المشكلة *</Label>
              <textarea
                id="description"
                required
                className="w-full min-h-[120px] px-3 py-2 border rounded-md bg-background"
                value={formData.issue_description}
                onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
                placeholder="اشرح المشكلة بالتفصيل..."
              />
            </div>

            {location && (
              <Alert>
                <MapPin className="h-4 w-4" />
                <AlertDescription>
                  تم تحديد موقع GPS: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button type="submit">فتح التذكرة</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <QuickSubscriberLookup
        open={isLookupOpen}
        onOpenChange={setIsLookupOpen}
        onSubscriberSelected={handleSubscriberSelected}
      />
    </>
  );
};
