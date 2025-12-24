import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Package,
  Barcode,
  FolderOpen,
  Boxes,
  Scale,
  DollarSign,
  TrendingDown,
  Truck,
  FileText,
  Sparkles,
  Save,
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
  Calculator,
  Tag,
  Warehouse,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface AddInventoryItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  categories: string[];
  suppliers: string[];
}

const DEFAULT_UNITS = [
  "قطعة",
  "متر",
  "كيلوغرام",
  "لتر",
  "علبة",
  "كرتون",
  "رزمة",
  "حزمة",
  "دزينة",
  "طن",
];

const DEFAULT_CATEGORIES = [
  "معدات شبكات",
  "كابلات",
  "أجهزة راوتر",
  "قطع غيار",
  "أدوات",
  "مستلزمات تركيب",
  "أخرى",
];

export function AddInventoryItemModal({
  open,
  onOpenChange,
  onSuccess,
  categories,
  suppliers,
}: AddInventoryItemModalProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [autoGenerateCode, setAutoGenerateCode] = useState(true);
  
  const [formData, setFormData] = useState({
    item_name: "",
    item_code: "",
    category: "",
    quantity: "",
    unit: "قطعة",
    unit_price: "",
    min_stock_level: "5",
    supplier: "",
    notes: "",
    currency: "IQD" as "IQD" | "USD",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generate item code automatically
  useEffect(() => {
    if (autoGenerateCode && formData.category) {
      const prefix = formData.category.slice(0, 3).toUpperCase();
      const timestamp = Date.now().toString().slice(-6);
      setFormData((prev) => ({
        ...prev,
        item_code: `${prefix}-${timestamp}`,
      }));
    }
  }, [formData.category, autoGenerateCode]);

  const resetForm = () => {
    setFormData({
      item_name: "",
      item_code: "",
      category: "",
      quantity: "",
      unit: "قطعة",
      unit_price: "",
      min_stock_level: "5",
      supplier: "",
      notes: "",
      currency: "IQD",
    });
    setErrors({});
    setActiveTab("basic");
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.item_name.trim()) {
      newErrors.item_name = "اسم الصنف مطلوب";
    } else if (formData.item_name.length < 2) {
      newErrors.item_name = "اسم الصنف يجب أن يكون حرفين على الأقل";
    }

    if (!formData.quantity || parseInt(formData.quantity) < 0) {
      newErrors.quantity = "الكمية مطلوبة ويجب أن تكون رقم موجب";
    }

    if (formData.unit_price && parseFloat(formData.unit_price) < 0) {
      newErrors.unit_price = "السعر يجب أن يكون رقم موجب";
    }

    if (formData.min_stock_level && parseInt(formData.min_stock_level) < 0) {
      newErrors.min_stock_level = "الحد الأدنى يجب أن يكون رقم موجب";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("يرجى تصحيح الأخطاء في النموذج");
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase.from("inventory").insert({
        item_name: formData.item_name.trim(),
        item_code: formData.item_code.trim() || null,
        category: formData.category.trim() || null,
        quantity: parseInt(formData.quantity),
        unit: formData.unit || "قطعة",
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
        min_stock_level: formData.min_stock_level
          ? parseInt(formData.min_stock_level)
          : 5,
        supplier: formData.supplier.trim() || null,
        notes: formData.notes.trim() || null,
        currency: formData.currency,
        created_by: userData.user?.id,
      });

      if (error) throw error;

      toast.success("تم إضافة الصنف بنجاح", {
        description: `تمت إضافة "${formData.item_name}" إلى المخزون`,
      });

      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error adding item:", error);
      toast.error(error.message || "فشل إضافة الصنف");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalValue = () => {
    const qty = parseInt(formData.quantity) || 0;
    const price = parseFloat(formData.unit_price) || 0;
    return qty * price;
  };

  const getStockStatus = () => {
    const qty = parseInt(formData.quantity) || 0;
    const minStock = parseInt(formData.min_stock_level) || 0;

    if (qty === 0) return { label: "نفذ من المخزون", color: "destructive", icon: AlertTriangle };
    if (qty <= minStock) return { label: "مخزون منخفض", color: "warning", icon: TrendingDown };
    return { label: "متوفر", color: "success", icon: CheckCircle2 };
  };

  const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...categories])];
  const stockStatus = getStockStatus();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden p-0" dir="rtl">
        {/* Header */}
        <div className="bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border-b p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">إضافة صنف جديد</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  أضف صنف جديد إلى المخزون مع كافة التفاصيل
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Preview Card */}
        {(formData.item_name || formData.quantity) && (
          <div className="px-6 pt-4">
            <Card className="bg-gradient-to-l from-muted/50 to-transparent border-dashed">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Warehouse className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {formData.item_name || "اسم الصنف"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {formData.item_code && (
                          <span className="flex items-center gap-1">
                            <Barcode className="h-3 w-3" />
                            {formData.item_code}
                          </span>
                        )}
                        {formData.category && (
                          <Badge variant="outline" className="text-xs">
                            {formData.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">الكمية</p>
                      <p className="font-semibold">
                        {formData.quantity || 0} {formData.unit}
                      </p>
                    </div>
                    {formData.unit_price && (
                      <div className="text-left">
                        <p className="text-xs text-muted-foreground">القيمة الإجمالية</p>
                        <p className="font-semibold text-primary">
                          {formatCurrency(calculateTotalValue(), formData.currency)}
                        </p>
                      </div>
                    )}
                    <Badge 
                      variant={stockStatus.color === "success" ? "default" : stockStatus.color === "warning" ? "secondary" : "destructive"}
                      className="flex items-center gap-1"
                    >
                      <stockStatus.icon className="h-3 w-3" />
                      {stockStatus.label}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  البيانات الأساسية
                </TabsTrigger>
                <TabsTrigger value="stock" className="flex items-center gap-2">
                  <Boxes className="h-4 w-4" />
                  المخزون والأسعار
                </TabsTrigger>
                <TabsTrigger value="additional" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  معلومات إضافية
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Basic Info Tab */}
              <TabsContent value="basic" className="m-0 space-y-4">
                {/* Item Name */}
                <div className="space-y-2">
                  <Label htmlFor="item_name" className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    اسم الصنف <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="item_name"
                    value={formData.item_name}
                    onChange={(e) =>
                      setFormData({ ...formData, item_name: e.target.value })
                    }
                    placeholder="أدخل اسم الصنف"
                    className={errors.item_name ? "border-destructive" : ""}
                  />
                  {errors.item_name && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.item_name}
                    </p>
                  )}
                </div>

                {/* Item Code */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="item_code" className="flex items-center gap-2">
                      <Barcode className="h-4 w-4 text-primary" />
                      كود الصنف
                    </Label>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="auto-code" className="text-xs text-muted-foreground">
                        توليد تلقائي
                      </Label>
                      <Switch
                        id="auto-code"
                        checked={autoGenerateCode}
                        onCheckedChange={setAutoGenerateCode}
                      />
                    </div>
                  </div>
                  <Input
                    id="item_code"
                    value={formData.item_code}
                    onChange={(e) =>
                      setFormData({ ...formData, item_code: e.target.value })
                    }
                    placeholder="أدخل كود الصنف أو اتركه للتوليد التلقائي"
                    disabled={autoGenerateCode}
                    className={autoGenerateCode ? "bg-muted" : ""}
                  />
                  {autoGenerateCode && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      سيتم توليد الكود تلقائياً بناءً على الفئة
                    </p>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-primary" />
                    الفئة
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="أو أدخل فئة جديدة"
                    value={!allCategories.includes(formData.category) ? formData.category : ""}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="text-sm"
                  />
                </div>

                {/* Unit */}
                <div className="space-y-2">
                  <Label htmlFor="unit" className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-primary" />
                    وحدة القياس
                  </Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) =>
                      setFormData({ ...formData, unit: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الوحدة" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              {/* Stock & Pricing Tab */}
              <TabsContent value="stock" className="m-0 space-y-4">
                {/* Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-primary" />
                    الكمية <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: e.target.value })
                      }
                      placeholder="0"
                      className={`pl-16 ${errors.quantity ? "border-destructive" : ""}`}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {formData.unit}
                    </span>
                  </div>
                  {errors.quantity && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.quantity}
                    </p>
                  )}
                </div>

                {/* Unit Price */}
                <div className="space-y-2">
                  <Label htmlFor="unit_price" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    سعر الوحدة
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="unit_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.unit_price}
                        onChange={(e) =>
                          setFormData({ ...formData, unit_price: e.target.value })
                        }
                        placeholder="0.00"
                        className={errors.unit_price ? "border-destructive" : ""}
                      />
                    </div>
                    <Select
                      value={formData.currency}
                      onValueChange={(value: "IQD" | "USD") =>
                        setFormData({ ...formData, currency: value })
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IQD">IQD</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.unit_price && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.unit_price}
                    </p>
                  )}
                </div>

                {/* Total Value Preview */}
                {formData.quantity && formData.unit_price && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calculator className="h-5 w-5 text-primary" />
                          <span className="font-medium">القيمة الإجمالية</span>
                        </div>
                        <span className="text-xl font-bold text-primary">
                          {formatCurrency(calculateTotalValue(), formData.currency)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formData.quantity} {formData.unit} × {formatCurrency(parseFloat(formData.unit_price), formData.currency)}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Min Stock Level */}
                <div className="space-y-2">
                  <Label htmlFor="min_stock_level" className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-primary" />
                    الحد الأدنى للمخزون
                  </Label>
                  <div className="relative">
                    <Input
                      id="min_stock_level"
                      type="number"
                      min="0"
                      value={formData.min_stock_level}
                      onChange={(e) =>
                        setFormData({ ...formData, min_stock_level: e.target.value })
                      }
                      placeholder="5"
                      className={`pl-16 ${errors.min_stock_level ? "border-destructive" : ""}`}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {formData.unit}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    سيتم تنبيهك عندما تنخفض الكمية عن هذا الحد
                  </p>
                  {errors.min_stock_level && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.min_stock_level}
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Additional Info Tab */}
              <TabsContent value="additional" className="m-0 space-y-4">
                {/* Supplier */}
                <div className="space-y-2">
                  <Label htmlFor="supplier" className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    المورد
                  </Label>
                  <Select
                    value={suppliers.includes(formData.supplier) ? formData.supplier : ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, supplier: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المورد" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((sup) => (
                        <SelectItem key={sup} value={sup}>
                          {sup}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="أو أدخل اسم مورد جديد"
                    value={!suppliers.includes(formData.supplier) ? formData.supplier : ""}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier: e.target.value })
                    }
                    className="text-sm"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    ملاحظات
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="أضف أي ملاحظات إضافية عن الصنف..."
                    rows={4}
                  />
                </div>

                {/* Quick Tips */}
                <Card className="bg-muted/50 border-dashed">
                  <CardContent className="p-4">
                    <h4 className="font-medium flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4 text-primary" />
                      نصائح سريعة
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Tag className="h-4 w-4 mt-0.5 text-primary" />
                        استخدم أسماء واضحة ومحددة للأصناف لسهولة البحث
                      </li>
                      <li className="flex items-start gap-2">
                        <Barcode className="h-4 w-4 mt-0.5 text-primary" />
                        كود الصنف الفريد يساعد في تتبع المخزون بدقة
                      </li>
                      <li className="flex items-start gap-2">
                        <TrendingDown className="h-4 w-4 mt-0.5 text-primary" />
                        حدد الحد الأدنى بناءً على معدل الاستهلاك الشهري
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>

            {/* Footer */}
            <div className="border-t p-4 bg-muted/30">
              <div className="flex items-center justify-between gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    onOpenChange(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  إلغاء
                </Button>

                <div className="flex items-center gap-2">
                  {activeTab !== "basic" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const tabs = ["basic", "stock", "additional"];
                        const currentIndex = tabs.indexOf(activeTab);
                        if (currentIndex > 0) {
                          setActiveTab(tabs[currentIndex - 1]);
                        }
                      }}
                    >
                      السابق
                    </Button>
                  )}

                  {activeTab !== "additional" ? (
                    <Button
                      type="button"
                      onClick={() => {
                        const tabs = ["basic", "stock", "additional"];
                        const currentIndex = tabs.indexOf(activeTab);
                        if (currentIndex < tabs.length - 1) {
                          setActiveTab(tabs[currentIndex + 1]);
                        }
                      }}
                    >
                      التالي
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          حفظ الصنف
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {["basic", "stock", "additional"].map((tab, index) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      activeTab === tab
                        ? "w-6 bg-primary"
                        : index < ["basic", "stock", "additional"].indexOf(activeTab)
                        ? "bg-primary/60"
                        : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
}
