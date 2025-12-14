import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Plus, History, Package } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface InventoryItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
}

interface Movement {
  id: string;
  movement_type: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string | null;
  notes: string | null;
  reference_number: string | null;
  created_at: string;
  created_by: string | null;
}

interface InventoryMovementsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onMovementAdded: () => void;
}

export function InventoryMovementsModal({
  open,
  onOpenChange,
  item,
  onMovementAdded,
}: InventoryMovementsModalProps) {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("history");

  // Form state
  const [movementType, setMovementType] = useState<string>("in");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");

  useEffect(() => {
    if (open && item) {
      fetchMovements();
    }
  }, [open, item]);

  const fetchMovements = async () => {
    if (!item) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("inventory_movements")
        .select("*")
        .eq("inventory_id", item.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error("Error fetching movements:", error);
      toast.error("خطأ في جلب سجل الحركات");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!item || !quantity || parseInt(quantity) <= 0) {
      toast.error("يرجى إدخال كمية صحيحة");
      return;
    }

    const qty = parseInt(quantity);
    const previousQuantity = item.quantity;
    let newQuantity: number;

    if (movementType === "in") {
      newQuantity = previousQuantity + qty;
    } else if (movementType === "out") {
      if (qty > previousQuantity) {
        toast.error("الكمية المخرجة أكبر من المتوفر");
        return;
      }
      newQuantity = previousQuantity - qty;
    } else {
      newQuantity = qty; // adjustment sets exact quantity
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Insert movement record
      const { error: movementError } = await supabase
        .from("inventory_movements")
        .insert({
          inventory_id: item.id,
          movement_type: movementType,
          quantity: qty,
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
          reason: reason || null,
          notes: notes || null,
          reference_number: referenceNumber || null,
          created_by: user?.id,
        });

      if (movementError) throw movementError;

      // Update inventory quantity
      const { error: updateError } = await supabase
        .from("inventory")
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq("id", item.id);

      if (updateError) throw updateError;

      toast.success("تم تسجيل الحركة بنجاح");
      resetForm();
      fetchMovements();
      onMovementAdded();
      setActiveTab("history");
    } catch (error) {
      console.error("Error adding movement:", error);
      toast.error("خطأ في تسجيل الحركة");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setMovementType("in");
    setQuantity("");
    setReason("");
    setNotes("");
    setReferenceNumber("");
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "in":
        return <ArrowDownCircle className="h-4 w-4 text-green-500" />;
      case "out":
        return <ArrowUpCircle className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
    }
  };

  const getMovementBadge = (type: string) => {
    switch (type) {
      case "in":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">إدخال</Badge>;
      case "out":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">إخراج</Badge>;
      default:
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">تعديل</Badge>;
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="h-5 w-5 text-primary" />
            سجل حركات: {item.item_name}
          </DialogTitle>
        </DialogHeader>

        <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">الكمية الحالية</p>
              <p className="text-2xl font-bold text-primary">{item.quantity} {item.unit}</p>
            </div>
            <div className="text-left">
              <p className="text-muted-foreground text-sm">إجمالي الحركات</p>
              <p className="text-xl font-semibold">{movements.length}</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              سجل الحركات
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              إضافة حركة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
            ) : movements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد حركات مسجلة لهذا الصنف
              </div>
            ) : (
              <div className="rounded-lg border border-slate-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-800/50 hover:bg-slate-800/50">
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">الكمية</TableHead>
                      <TableHead className="text-right">من</TableHead>
                      <TableHead className="text-right">إلى</TableHead>
                      <TableHead className="text-right">السبب</TableHead>
                      <TableHead className="text-right">المرجع</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement.id} className="border-slate-700">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getMovementIcon(movement.movement_type)}
                            {getMovementBadge(movement.movement_type)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {movement.movement_type === "in" && "+"}
                          {movement.movement_type === "out" && "-"}
                          {movement.quantity}
                        </TableCell>
                        <TableCell>{movement.previous_quantity}</TableCell>
                        <TableCell>{movement.new_quantity}</TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {movement.reason || "-"}
                        </TableCell>
                        <TableCell>{movement.reference_number || "-"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", { locale: ar })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="add" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نوع الحركة</Label>
                <Select value={movementType} onValueChange={setMovementType}>
                  <SelectTrigger className="bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">
                      <div className="flex items-center gap-2">
                        <ArrowDownCircle className="h-4 w-4 text-green-500" />
                        إدخال (إضافة للمخزون)
                      </div>
                    </SelectItem>
                    <SelectItem value="out">
                      <div className="flex items-center gap-2">
                        <ArrowUpCircle className="h-4 w-4 text-red-500" />
                        إخراج (سحب من المخزون)
                      </div>
                    </SelectItem>
                    <SelectItem value="adjustment">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 text-blue-500" />
                        تعديل (ضبط الكمية)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  {movementType === "adjustment" ? "الكمية الجديدة" : "الكمية"}
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={movementType === "adjustment" ? "أدخل الكمية الجديدة" : "أدخل الكمية"}
                  className="bg-slate-800 border-slate-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>السبب</Label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="مثال: شراء جديد، استخدام في صيانة..."
                  className="bg-slate-800 border-slate-600"
                />
              </div>

              <div className="space-y-2">
                <Label>رقم المرجع (اختياري)</Label>
                <Input
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="رقم الفاتورة أو الطلب..."
                  className="bg-slate-800 border-slate-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>ملاحظات إضافية (اختياري)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظات إضافية..."
                className="bg-slate-800 border-slate-600"
                rows={3}
              />
            </div>

            {movementType !== "adjustment" && quantity && (
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">معاينة التغيير:</p>
                <p className="text-lg">
                  الكمية الحالية: <span className="font-bold">{item.quantity}</span>
                  {" → "}
                  الكمية الجديدة:{" "}
                  <span className="font-bold text-primary">
                    {movementType === "in"
                      ? item.quantity + parseInt(quantity || "0")
                      : item.quantity - parseInt(quantity || "0")}
                  </span>
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={submitting || !quantity}
                className="flex-1"
              >
                {submitting ? "جاري الحفظ..." : "تسجيل الحركة"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="border-slate-600"
              >
                إعادة تعيين
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
