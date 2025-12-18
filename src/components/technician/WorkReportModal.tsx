import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Wrench,
  DollarSign,
  PenTool,
  Trash2,
  Plus,
  CheckCircle2,
  Printer,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PartUsed {
  name: string;
  quantity: number;
  price: number;
}

interface WorkReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workLogId: string;
  ticketId: string;
  technicianId: string;
  subscriberId: string;
  ticketNumber: string;
  issueDescription: string;
  startTime: string;
  onComplete: () => void;
}

const WorkReportModal = ({
  open,
  onOpenChange,
  workLogId,
  ticketId,
  technicianId,
  subscriberId,
  ticketNumber,
  issueDescription,
  startTime,
  onComplete,
}: WorkReportModalProps) => {
  const [diagnosis, setDiagnosis] = useState("");
  const [workPerformed, setWorkPerformed] = useState("");
  const [partsUsed, setPartsUsed] = useState<PartUsed[]>([]);
  const [laborCost, setLaborCost] = useState(0);
  const [newPart, setNewPart] = useState({ name: "", quantity: 1, price: 0 });
  const [signature, setSignature] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const partsCost = partsUsed.reduce((sum, part) => sum + (part.price * part.quantity), 0);
  const totalCost = laborCost + partsCost;

  // Initialize canvas
  useEffect(() => {
    if (open && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
      }
    }
  }, [open]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e 
      ? e.touches[0].clientX - rect.left 
      : e.clientX - rect.left;
    const y = "touches" in e 
      ? e.touches[0].clientY - rect.top 
      : e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e 
      ? e.touches[0].clientX - rect.left 
      : e.clientX - rect.left;
    const y = "touches" in e 
      ? e.touches[0].clientY - rect.top 
      : e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignature(canvasRef.current.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  const addPart = () => {
    if (newPart.name && newPart.quantity > 0) {
      setPartsUsed([...partsUsed, { ...newPart }]);
      setNewPart({ name: "", quantity: 1, price: 0 });
    }
  };

  const removePart = (index: number) => {
    setPartsUsed(partsUsed.filter((_, i) => i !== index));
  };

  const handleSaveReport = async () => {
    if (!diagnosis || !workPerformed) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setSaving(true);
    try {
      // Create work report - using any since table schema was just created
      const reportData = {
        work_log_id: workLogId,
        ticket_id: ticketId,
        technician_id: technicianId,
        subscriber_id: subscriberId,
        diagnosis,
        work_performed: workPerformed,
        parts_used: partsUsed,
        labor_cost: laborCost,
        parts_cost: partsCost,
        total_cost: totalCost,
        customer_signature: signature,
        signed_at: signature ? new Date().toISOString() : null,
        report_status: signature ? "signed" : "pending",
      };
      
      const { error: reportError } = await (supabase.from("work_reports") as any).insert(reportData);

      if (reportError) throw reportError;

      // Update work log
      const { error: logError } = await supabase
        .from("work_logs")
        .update({
          ended_at: new Date().toISOString(),
          status: "completed",
          notes: `التشخيص: ${diagnosis}\nالعمل المنجز: ${workPerformed}`,
        })
        .eq("id", workLogId);

      if (logError) throw logError;

      // Update ticket
      const { error: ticketError } = await supabase
        .from("maintenance_tickets")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
        })
        .eq("id", ticketId);

      if (ticketError) throw ticketError;

      toast.success("تم حفظ التقرير وإنهاء العمل بنجاح");
      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving report:", error);
      toast.error("حدث خطأ في حفظ التقرير");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            تقرير إنهاء العمل - {ticketNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6" dir="rtl">
          {/* Ticket Info */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">رقم التذكرة:</span>
                <Badge variant="outline">{ticketNumber}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">وقت البدء:</span>
                <span className="text-white">{new Date(startTime).toLocaleString("ar")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">وقت الانتهاء:</span>
                <span className="text-white">{new Date().toLocaleString("ar")}</span>
              </div>
              <div>
                <span className="text-slate-400">المشكلة:</span>
                <p className="text-white text-sm mt-1">{issueDescription}</p>
              </div>
            </CardContent>
          </Card>

          {/* Diagnosis */}
          <div className="space-y-2">
            <Label className="text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-400" />
              التشخيص *
            </Label>
            <Textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="اكتب التشخيص النهائي للمشكلة..."
              className="bg-slate-800 border-slate-600 text-white"
              rows={3}
            />
          </div>

          {/* Work Performed */}
          <div className="space-y-2">
            <Label className="text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              العمل المنجز *
            </Label>
            <Textarea
              value={workPerformed}
              onChange={(e) => setWorkPerformed(e.target.value)}
              placeholder="وصف العمل الذي تم إنجازه..."
              className="bg-slate-800 border-slate-600 text-white"
              rows={3}
            />
          </div>

          {/* Parts Used */}
          <div className="space-y-3">
            <Label className="text-white">قطع الغيار المستخدمة</Label>
            
            <div className="flex gap-2">
              <Input
                value={newPart.name}
                onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                placeholder="اسم القطعة"
                className="bg-slate-800 border-slate-600 text-white flex-1"
              />
              <Input
                type="number"
                value={newPart.quantity}
                onChange={(e) => setNewPart({ ...newPart, quantity: Number(e.target.value) })}
                placeholder="الكمية"
                className="bg-slate-800 border-slate-600 text-white w-20"
                min={1}
              />
              <Input
                type="number"
                value={newPart.price}
                onChange={(e) => setNewPart({ ...newPart, price: Number(e.target.value) })}
                placeholder="السعر"
                className="bg-slate-800 border-slate-600 text-white w-24"
                min={0}
              />
              <Button onClick={addPart} size="icon" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {partsUsed.length > 0 && (
              <div className="space-y-2">
                {partsUsed.map((part, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 bg-slate-800 rounded-lg"
                  >
                    <span className="text-white">{part.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400">×{part.quantity}</span>
                      <span className="text-green-400">{part.price.toLocaleString()} د.ع</span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => removePart(index)}
                        className="h-8 w-8 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Costs */}
          <div className="space-y-3">
            <Label className="text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-yellow-400" />
              التكاليف
            </Label>
            
            <div className="flex items-center gap-4">
              <Label className="text-slate-400 w-32">أجور العمل:</Label>
              <Input
                type="number"
                value={laborCost}
                onChange={(e) => setLaborCost(Number(e.target.value))}
                className="bg-slate-800 border-slate-600 text-white"
                min={0}
              />
              <span className="text-slate-400">د.ع</span>
            </div>

            <Separator className="bg-slate-700" />

            <div className="bg-slate-800 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>تكلفة قطع الغيار:</span>
                <span>{partsCost.toLocaleString()} د.ع</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>أجور العمل:</span>
                <span>{laborCost.toLocaleString()} د.ع</span>
              </div>
              <Separator className="bg-slate-600" />
              <div className="flex justify-between text-white font-bold text-lg">
                <span>المجموع:</span>
                <span className="text-green-400">{totalCost.toLocaleString()} د.ع</span>
              </div>
            </div>
          </div>

          {/* Digital Signature */}
          <div className="space-y-3">
            <Label className="text-white flex items-center gap-2">
              <PenTool className="w-4 h-4 text-purple-400" />
              توقيع الزبون
            </Label>
            
            <div className="border-2 border-slate-600 rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                width={400}
                height={150}
                className="w-full touch-none cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearSignature}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 ml-2" />
              مسح التوقيع
            </Button>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={handleSaveReport}
              disabled={saving || !diagnosis || !workPerformed}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 ml-2" />
              {saving ? "جاري الحفظ..." : "حفظ وإنهاء العمل"}
            </Button>
            <Button 
              variant="outline"
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4 ml-2" />
              طباعة
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkReportModal;
