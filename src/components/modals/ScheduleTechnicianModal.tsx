import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

interface ScheduleTechnicianModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  preselectedTicketId?: string;
}

interface Ticket {
  id: string;
  ticket_number: string;
  issue_description: string;
  subscribers: {
    name: string;
    phone: string;
  };
}

interface Technician {
  id: string;
  name: string;
  phone: string;
  available: boolean;
}

export const ScheduleTechnicianModal = ({ 
  open, 
  onOpenChange, 
  onSuccess,
  preselectedTicketId 
}: ScheduleTechnicianModalProps) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [ticketId, setTicketId] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  useEffect(() => {
    if (preselectedTicketId) {
      setTicketId(preselectedTicketId);
    }
  }, [preselectedTicketId]);

  const fetchData = async () => {
    setFetchingData(true);
    try {
      // جلب التذاكر المفتوحة (غير مسندة أو قيد التنفيذ)
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('maintenance_tickets')
        .select(`
          id,
          ticket_number,
          issue_description,
          subscribers (name, phone)
        `)
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;
      setTickets(ticketsData || []);

      // جلب الفنيين المتاحين
      const { data: techData, error: techError } = await supabase
        .from('technicians')
        .select('id, name, phone, available')
        .eq('available', true)
        .order('name');

      if (techError) throw techError;
      setTechnicians(techData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setFetchingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketId || !technicianId) {
      toast.error("الرجاء اختيار التذكرة والفني");
      return;
    }

    setLoading(true);
    
    try {
      // بناء تاريخ الجدولة إذا تم تحديده
      let scheduledDate = null;
      if (date) {
        const dateStr = format(date, 'yyyy-MM-dd');
        scheduledDate = time ? `${dateStr}T${time}:00` : `${dateStr}T09:00:00`;
      }

      // تحديث التذكرة بإسناد الفني
      const { error } = await supabase
        .from('maintenance_tickets')
        .update({
          technician_id: technicianId,
          status: 'in_progress',
          scheduled_date: scheduledDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;

      // جلب بيانات الفني لعرضها في الإشعار
      const selectedTech = technicians.find(t => t.id === technicianId);
      const selectedTicket = tickets.find(t => t.id === ticketId);

      toast.success(
        `تم تعيين ${selectedTech?.name || 'الفني'} للتذكرة ${selectedTicket?.ticket_number || ''} بنجاح`,
        {
          description: scheduledDate 
            ? `موعد الزيارة: ${format(new Date(scheduledDate), 'PPP', { locale: ar })} ${time || '09:00'}`
            : 'سيتم التواصل مع المشترك قريباً'
        }
      );

      // إعادة تعيين النموذج
      onOpenChange(false);
      setTicketId("");
      setTechnicianId("");
      setDate(undefined);
      setTime("");
      onSuccess?.();
    } catch (error) {
      console.error('Error assigning technician:', error);
      toast.error('فشل تعيين الفني');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTicketId("");
    setTechnicianId("");
    setDate(undefined);
    setTime("");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl">جدولة فني للتذكرة</DialogTitle>
          <DialogDescription>تعيين فني لمهمة صيانة وتحديد موعد الزيارة</DialogDescription>
        </DialogHeader>

        {fetchingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="mr-2">جاري تحميل البيانات...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="ticket">التذكرة *</Label>
              <Select value={ticketId} onValueChange={setTicketId}>
                <SelectTrigger id="ticket">
                  <SelectValue placeholder="اختر التذكرة" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50 max-h-60">
                  {tickets.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground">
                      لا توجد تذاكر مفتوحة
                    </div>
                  ) : (
                    tickets.map((ticket) => (
                      <SelectItem key={ticket.id} value={ticket.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">#{ticket.ticket_number}</span>
                          <span className="text-xs text-muted-foreground">
                            {ticket.subscribers?.name} - {ticket.issue_description?.substring(0, 30)}...
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="technician">الفني *</Label>
              <Select value={technicianId} onValueChange={setTechnicianId}>
                <SelectTrigger id="technician">
                  <SelectValue placeholder="اختر الفني" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {technicians.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground">
                      لا يوجد فنيين متاحين
                    </div>
                  ) : (
                    technicians.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                          <span>{tech.name}</span>
                          <span className="text-xs text-muted-foreground">- {tech.phone}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ الزيارة (اختياري)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-right font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: ar }) : "اختر التاريخ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      className="pointer-events-auto"
                      locale={ar}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">وقت الزيارة (اختياري)</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={loading || !ticketId || !technicianId}>
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  "تعيين الفني"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
