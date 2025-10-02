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
  const [formData, setFormData] = useState({
    subscriber_id: "",
    priority: "medium",
    issue_description: "",
  });

  useEffect(() => {
    if (open) {
      loadSubscribers();
    }
  }, [open]);

  const loadSubscribers = async () => {
    const { data } = await supabase
      .from("subscribers")
      .select("id, name, phone")
      .order("name");
    if (data) setSubscribers(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = ticketSchema.parse(formData);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // Generate ticket number
      const ticketNumber = `TKT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;
      
      const { error } = await supabase.from("maintenance_tickets").insert([{
        ticket_number: ticketNumber,
        subscriber_id: validatedData.subscriber_id,
        issue_description: validatedData.issue_description,
        priority: validatedData.priority as any,
        status: "open" as const,
        created_by: user?.id,
      }]);

      if (error) throw error;

      toast.success("تم فتح تذكرة الصيانة بنجاح");
      onOpenChange(false);
      setFormData({ subscriber_id: "", priority: "medium", issue_description: "" });
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>فتح تذكرة صيانة جديدة</DialogTitle>
          <DialogDescription>أدخل تفاصيل المشكلة</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subscriber">المشترك *</Label>
            <select
              id="subscriber"
              required
              className="w-full px-3 py-2 border rounded-md bg-background"
              value={formData.subscriber_id}
              onChange={(e) => setFormData({ ...formData, subscriber_id: e.target.value })}
            >
              <option value="">اختر المشترك</option>
              {subscribers.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} - {sub.phone}
                </option>
              ))}
            </select>
          </div>

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
            <Label htmlFor="description">الوصف *</Label>
            <textarea
              id="description"
              required
              className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-background"
              value={formData.issue_description}
              onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
              placeholder="اشرح المشكلة بالتفصيل..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit">فتح التذكرة</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
