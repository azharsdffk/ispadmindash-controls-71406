import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

interface ScheduleTechnicianModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ScheduleTechnicianModal = ({ open, onOpenChange }: ScheduleTechnicianModalProps) => {
  const [ticketId, setTicketId] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketId || !technicianId || !date || !time) {
      toast.error("الرجاء ملء جميع الحقول المطلوبة");
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      toast.success("تم جدولة الفني بنجاح");
      onOpenChange(false);
      setLoading(false);
      setTicketId("");
      setTechnicianId("");
      setDate(undefined);
      setTime("");
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl">جدولة فني</DialogTitle>
          <DialogDescription>تعيين فني لمهمة صيانة</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="ticket">التذكرة *</Label>
            <Select value={ticketId} onValueChange={setTicketId}>
              <SelectTrigger id="ticket">
                <SelectValue placeholder="اختر التذكرة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">#001 - انقطاع إنترنت</SelectItem>
                <SelectItem value="2">#002 - بطء في السرعة</SelectItem>
                <SelectItem value="3">#003 - مشكلة في الراوتر</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="technician">الفني *</Label>
            <Select value={technicianId} onValueChange={setTechnicianId}>
              <SelectTrigger id="technician">
                <SelectValue placeholder="اختر الفني" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">محمد أحمد - متاح</SelectItem>
                <SelectItem value="2">خالد عمر - متاح</SelectItem>
                <SelectItem value="3">سعيد حسن - مشغول</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>التاريخ *</Label>
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
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">الوقت *</Label>
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
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الحفظ..." : "جدولة الفني"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
