import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Package, Plus, Edit, Trash2, AlertTriangle, TrendingDown, TrendingUp, 
  Search, Eye, History, RefreshCcw, LayoutGrid, List, Filter, 
  Warehouse, DollarSign, PackageX, PackageCheck, MoreVertical, Boxes,
  ArrowUpDown, BarChart3, PieChart, Box, Tag, Building2, FileText, Download
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useUserRole } from "@/hooks/useUserRole";
import { formatCurrency } from "@/lib/currency";
import { DeleteConfirmDialog } from "@/components/modals/DeleteConfirmDialog";
import { InventoryDetailsModal } from "@/components/modals/InventoryDetailsModal";
import { InventoryMovementsModal } from "@/components/inventory/InventoryMovementsModal";
import { AddInventoryItemModal } from "@/components/inventory/AddInventoryItemModal";

interface InventoryItem {
  id: string;
  item_name: string;
  item_code: string | null;
  category: string | null;
  quantity: number;
  unit: string;
  unit_price: number | null;
  min_stock_level: number | null;
  supplier: string | null;
  notes: string | null;
  currency: string;
  created_at?: string;
}

const Inventory = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editItemOpen, setEditItemOpen] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [viewItem, setViewItem] = useState<InventoryItem | null>(null);
  const [movementsOpen, setMovementsOpen] = useState(false);
  const [movementsItem, setMovementsItem] = useState<InventoryItem | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name_asc");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [activeTab, setActiveTab] = useState("all");

  const [formData, setFormData] = useState({
    item_name: '',
    item_code: '',
    category: '',
    quantity: '',
    unit: 'قطعة',
    unit_price: '',
    min_stock_level: '',
    supplier: '',
    notes: '',
  });

  useEffect(() => {
    if (!roleLoading && isAdmin) {
      fetchInventory();
    }
  }, [roleLoading, isAdmin]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('item_name', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('فشل تحميل المخزون');
    } finally {
      setLoading(false);
    }
  };

  // Statistics
  const stats = useMemo(() => {
    const total = items.length;
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * (item.unit_price || 0)), 0);
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    
    const lowStock = items.filter(item => 
      item.min_stock_level && item.quantity > 0 && item.quantity <= item.min_stock_level
    ).length;
    
    const outOfStock = items.filter(item => item.quantity === 0).length;
    const inStock = items.filter(item => 
      !item.min_stock_level || item.quantity > item.min_stock_level
    ).length;

    const categories = [...new Set(items.map(i => i.category).filter(Boolean))].length;
    const suppliers = [...new Set(items.map(i => i.supplier).filter(Boolean))].length;

    const avgUnitPrice = items.filter(i => i.unit_price).length > 0
      ? items.reduce((sum, i) => sum + (i.unit_price || 0), 0) / items.filter(i => i.unit_price).length
      : 0;

    return { total, totalValue, totalQuantity, lowStock, outOfStock, inStock, categories, suppliers, avgUnitPrice };
  }, [items]);

  // Get unique categories and suppliers
  const categories = useMemo(() => {
    return [...new Set(items.map(i => i.category).filter(Boolean))] as string[];
  }, [items]);

  const suppliers = useMemo(() => {
    return [...new Set(items.map(i => i.supplier).filter(Boolean))] as string[];
  }, [items]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let filtered = [...items];

    // Tab filter
    if (activeTab === "low_stock") {
      filtered = filtered.filter(item => 
        item.min_stock_level && item.quantity > 0 && item.quantity <= item.min_stock_level
      );
    } else if (activeTab === "out_of_stock") {
      filtered = filtered.filter(item => item.quantity === 0);
    } else if (activeTab === "in_stock") {
      filtered = filtered.filter(item => 
        !item.min_stock_level || item.quantity > item.min_stock_level
      );
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.item_name.toLowerCase().includes(query) ||
        item.item_code?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.supplier?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(item => {
        if (statusFilter === "in_stock") return !item.min_stock_level || item.quantity > item.min_stock_level;
        if (statusFilter === "low_stock") return item.min_stock_level && item.quantity > 0 && item.quantity <= item.min_stock_level;
        if (statusFilter === "out_of_stock") return item.quantity === 0;
        return true;
      });
    }

    // Supplier filter
    if (supplierFilter !== "all") {
      filtered = filtered.filter(item => item.supplier === supplierFilter);
    }

    // Sort
    switch (sortBy) {
      case "name_desc":
        filtered.sort((a, b) => b.item_name.localeCompare(a.item_name));
        break;
      case "quantity_high":
        filtered.sort((a, b) => b.quantity - a.quantity);
        break;
      case "quantity_low":
        filtered.sort((a, b) => a.quantity - b.quantity);
        break;
      case "value_high":
        filtered.sort((a, b) => (b.quantity * (b.unit_price || 0)) - (a.quantity * (a.unit_price || 0)));
        break;
      case "value_low":
        filtered.sort((a, b) => (a.quantity * (a.unit_price || 0)) - (b.quantity * (b.unit_price || 0)));
        break;
      default:
        filtered.sort((a, b) => a.item_name.localeCompare(b.item_name));
    }

    return filtered;
  }, [items, activeTab, searchQuery, categoryFilter, statusFilter, supplierFilter, sortBy]);

  const openDetailsModal = (item: InventoryItem) => {
    setViewItem(item);
    setDetailsOpen(true);
  };

  const openMovementsModal = (item: InventoryItem) => {
    setMovementsItem(item);
    setMovementsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('inventory')
        .insert({
          item_name: formData.item_name,
          item_code: formData.item_code || null,
          category: formData.category || null,
          quantity: Number(formData.quantity),
          unit: formData.unit,
          unit_price: formData.unit_price ? Number(formData.unit_price) : null,
          min_stock_level: formData.min_stock_level ? Number(formData.min_stock_level) : null,
          supplier: formData.supplier || null,
          notes: formData.notes || null,
          currency: 'IQD',
        });

      if (error) throw error;

      toast.success('تم إضافة الصنف بنجاح');
      setAddItemOpen(false);
      resetForm();
      fetchInventory();
    } catch (error: any) {
      console.error('Error adding item:', error);
      toast.error(error.message || 'فشل إضافة الصنف');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const { error } = await supabase
        .from('inventory')
        .update({
          item_name: formData.item_name,
          item_code: formData.item_code || null,
          category: formData.category || null,
          quantity: Number(formData.quantity),
          unit: formData.unit,
          unit_price: formData.unit_price ? Number(formData.unit_price) : null,
          min_stock_level: formData.min_stock_level ? Number(formData.min_stock_level) : null,
          supplier: formData.supplier || null,
          notes: formData.notes || null,
        })
        .eq('id', selectedItem.id);

      if (error) throw error;

      toast.success('تم تحديث الصنف بنجاح');
      setEditItemOpen(false);
      setSelectedItem(null);
      resetForm();
      fetchInventory();
    } catch (error: any) {
      console.error('Error updating item:', error);
      toast.error(error.message || 'فشل تحديث الصنف');
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setItemToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;

      toast.success('تم حذف الصنف بنجاح');
      fetchInventory();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('فشل حذف الصنف');
    }
  };

  const openEditDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      item_name: item.item_name,
      item_code: item.item_code || '',
      category: item.category || '',
      quantity: item.quantity.toString(),
      unit: item.unit,
      unit_price: item.unit_price?.toString() || '',
      min_stock_level: item.min_stock_level?.toString() || '',
      supplier: item.supplier || '',
      notes: item.notes || '',
    });
    setEditItemOpen(true);
  };

  const resetForm = () => {
    setFormData({
      item_name: '',
      item_code: '',
      category: '',
      quantity: '',
      unit: 'قطعة',
      unit_price: '',
      min_stock_level: '',
      supplier: '',
      notes: '',
    });
  };

  const getStockStatus = (quantity: number, minLevel: number | null) => {
    if (quantity === 0) {
      return { 
        label: 'نفذ', 
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', 
        icon: PackageX,
        color: '#ef4444'
      };
    } else if (minLevel && quantity <= minLevel) {
      return { 
        label: 'منخفض', 
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', 
        icon: TrendingDown,
        color: '#eab308'
      };
    }
    return { 
      label: 'متوفر', 
      className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', 
      icon: TrendingUp,
      color: '#22c55e'
    };
  };

  const getStockPercentage = (quantity: number, minLevel: number | null) => {
    if (!minLevel || minLevel === 0) return 100;
    const percentage = (quantity / (minLevel * 2)) * 100;
    return Math.min(100, Math.max(0, percentage));
  };

  // Stat Card Component
  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color,
    onClick 
  }: { 
    title: string; 
    value: number | string; 
    subtitle?: string;
    icon: any; 
    color: string;
    onClick?: () => void;
  }) => (
    <Card 
      className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
      onClick={onClick}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full opacity-10 ${color}`} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Inventory Grid Card Component
  const InventoryGridCard = ({ item }: { item: InventoryItem }) => {
    const status = getStockStatus(item.quantity, item.min_stock_level);
    const StatusIcon = status.icon;
    const stockPercentage = getStockPercentage(item.quantity, item.min_stock_level);
    const totalValue = item.quantity * (item.unit_price || 0);

    return (
      <Card 
        className="group hover:shadow-lg transition-all duration-300 border-r-4"
        style={{ borderRightColor: status.color }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate">{item.item_name}</h3>
              </div>
              {item.item_code && (
                <p className="text-xs text-muted-foreground font-mono">{item.item_code}</p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openDetailsModal(item)}>
                  <Eye className="h-4 w-4 ml-2" />
                  عرض التفاصيل
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openMovementsModal(item)}>
                  <History className="h-4 w-4 ml-2" />
                  سجل الحركات
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openEditDialog(item)}>
                  <Edit className="h-4 w-4 ml-2" />
                  تعديل
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDeleteClick(item.id, item.item_name)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className={status.className}>
              <StatusIcon className="h-3 w-3 ml-1" />
              {status.label}
            </Badge>
            {item.category && (
              <Badge variant="secondary" className="text-xs">{item.category}</Badge>
            )}
          </div>

          <Separator className="my-3" />

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">الكمية</span>
              <span className="font-bold">{item.quantity} {item.unit}</span>
            </div>
            
            {item.min_stock_level && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">مستوى المخزون</span>
                  <span>{stockPercentage.toFixed(0)}%</span>
                </div>
                <Progress value={stockPercentage} className="h-2" />
              </div>
            )}

            {item.unit_price && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">سعر الوحدة</span>
                <span>{formatCurrency(item.unit_price)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground">القيمة الإجمالية</span>
              <span className="font-bold text-primary">{formatCurrency(totalValue)}</span>
            </div>
          </div>

          {item.supplier && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span>{item.supplier}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
        <div className="flex flex-1 w-full">
          <AppSidebar />
          <main className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center animate-pulse">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-muted w-12 h-12" />
                <div className="space-y-2">
                  <div className="h-8 w-40 bg-muted rounded" />
                  <div className="h-4 w-48 bg-muted/50 rounded" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-9 w-20 bg-muted rounded" />
                <div className="h-9 w-28 bg-muted rounded" />
              </div>
            </div>
            {/* Stats Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-4 rounded-xl bg-card border animate-pulse relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full bg-muted/10" />
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="h-3 w-20 bg-muted/50 rounded" />
                      <div className="h-6 w-16 bg-muted rounded" />
                    </div>
                    <div className="p-3 rounded-xl bg-muted w-11 h-11" />
                  </div>
                </div>
              ))}
            </div>
            {/* Tabs Skeleton */}
            <div className="h-12 bg-muted rounded-xl animate-pulse" />
            {/* Grid/Table Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-4 rounded-xl bg-card border animate-pulse">
                  <div className="flex justify-between mb-3">
                    <div className="space-y-1">
                      <div className="h-5 w-32 bg-muted rounded" />
                      <div className="h-3 w-20 bg-muted/50 rounded" />
                    </div>
                    <div className="h-8 w-8 bg-muted rounded" />
                  </div>
                  <div className="flex gap-2 mb-3">
                    <div className="h-5 w-14 bg-muted rounded-full" />
                    <div className="h-5 w-16 bg-muted rounded-full" />
                  </div>
                  <div className="h-px bg-muted my-3" />
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-16 bg-muted/50 rounded" />
                      <div className="h-4 w-20 bg-muted rounded" />
                    </div>
                    <div className="h-2 bg-muted rounded-full" />
                    <div className="flex justify-between">
                      <div className="h-4 w-20 bg-muted/50 rounded" />
                      <div className="h-4 w-24 bg-muted rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
        <div className="flex flex-1 w-full">
          <AppSidebar />
          <main className="flex-1 p-6 overflow-y-auto">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                ليس لديك صلاحية الوصول إلى هذه الصفحة
              </AlertDescription>
            </Alert>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1 w-full">
        <AppSidebar />
        
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Warehouse className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">إدارة المخزون</h1>
                  <p className="text-sm text-muted-foreground">متابعة وإدارة أصناف المخزون</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => fetchInventory()} variant="outline" size="sm">
                  <RefreshCcw className="h-4 w-4 ml-1" />
                  تحديث
                </Button>
                <Button onClick={() => setAddItemOpen(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة صنف
                </Button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard
                title="إجمالي الأصناف"
                value={stats.total}
                icon={Package}
                color="bg-primary"
                onClick={() => setActiveTab("all")}
              />
              <StatCard
                title="قيمة المخزون"
                value={formatCurrency(stats.totalValue)}
                icon={DollarSign}
                color="bg-green-500"
              />
              <StatCard
                title="إجمالي الكمية"
                value={stats.totalQuantity.toLocaleString()}
                subtitle="وحدة"
                icon={Boxes}
                color="bg-blue-500"
              />
              <StatCard
                title="متوفر"
                value={stats.inStock}
                icon={PackageCheck}
                color="bg-emerald-500"
                onClick={() => setActiveTab("in_stock")}
              />
              <StatCard
                title="مخزون منخفض"
                value={stats.lowStock}
                icon={TrendingDown}
                color="bg-yellow-500"
                onClick={() => setActiveTab("low_stock")}
              />
              <StatCard
                title="نفذ من المخزون"
                value={stats.outOfStock}
                icon={PackageX}
                color="bg-red-500"
                onClick={() => setActiveTab("out_of_stock")}
              />
            </div>

            {/* Stock Distribution Progress */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">توزيع حالة المخزون</span>
                  <span className="text-xs text-muted-foreground">{stats.total} صنف</span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                  {stats.total > 0 && (
                    <>
                      <div 
                        className="bg-green-500 transition-all duration-500" 
                        style={{ width: `${(stats.inStock / stats.total) * 100}%` }} 
                        title={`متوفر: ${stats.inStock}`}
                      />
                      <div 
                        className="bg-yellow-500 transition-all duration-500" 
                        style={{ width: `${(stats.lowStock / stats.total) * 100}%` }} 
                        title={`منخفض: ${stats.lowStock}`}
                      />
                      <div 
                        className="bg-red-500 transition-all duration-500" 
                        style={{ width: `${(stats.outOfStock / stats.total) * 100}%` }} 
                        title={`نفذ: ${stats.outOfStock}`}
                      />
                    </>
                  )}
                </div>
                <div className="flex items-center gap-6 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> متوفر ({stats.inStock})</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> منخفض ({stats.lowStock})</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> نفذ ({stats.outOfStock})</span>
                </div>
              </CardContent>
            </Card>

            {/* Tabs and Filters */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <TabsList>
                  <TabsTrigger value="all">الكل ({stats.total})</TabsTrigger>
                  <TabsTrigger value="in_stock" className="text-green-600">متوفر ({stats.inStock})</TabsTrigger>
                  <TabsTrigger value="low_stock" className="text-yellow-600">منخفض ({stats.lowStock})</TabsTrigger>
                  <TabsTrigger value="out_of_stock" className="text-red-600">نفذ ({stats.outOfStock})</TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "table" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("table")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <Card className="mt-4">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="lg:col-span-2">
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="بحث بالاسم، الكود، الفئة، المورد..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pr-10"
                        />
                      </div>
                    </div>

                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="الفئة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الفئات</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="المورد" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الموردين</SelectItem>
                        {suppliers.map(sup => (
                          <SelectItem key={sup} value={sup}>{sup}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue placeholder="ترتيب" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name_asc">الاسم (أ-ي)</SelectItem>
                        <SelectItem value="name_desc">الاسم (ي-أ)</SelectItem>
                        <SelectItem value="quantity_high">الكمية (الأعلى)</SelectItem>
                        <SelectItem value="quantity_low">الكمية (الأقل)</SelectItem>
                        <SelectItem value="value_high">القيمة (الأعلى)</SelectItem>
                        <SelectItem value="value_low">القيمة (الأقل)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Content */}
              <TabsContent value={activeTab} className="mt-4">
                {filteredItems.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Package className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-lg">لا توجد أصناف مطابقة للبحث</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setAddItemOpen(true)}
                      >
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة صنف جديد
                      </Button>
                    </CardContent>
                  </Card>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredItems.map(item => (
                      <InventoryGridCard key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>الصنف</TableHead>
                              <TableHead>الفئة</TableHead>
                              <TableHead>الكمية</TableHead>
                              <TableHead>سعر الوحدة</TableHead>
                              <TableHead>القيمة الإجمالية</TableHead>
                              <TableHead>المورد</TableHead>
                              <TableHead>الحالة</TableHead>
                              <TableHead className="text-left">إجراءات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredItems.map((item) => {
                              const status = getStockStatus(item.quantity, item.min_stock_level);
                              const StatusIcon = status.icon;
                              const totalValue = item.quantity * (item.unit_price || 0);
                              
                              return (
                                <TableRow key={item.id}>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{item.item_name}</p>
                                      {item.item_code && (
                                        <p className="text-xs text-muted-foreground font-mono">{item.item_code}</p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {item.category ? (
                                      <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                                    ) : '-'}
                                  </TableCell>
                                  <TableCell className="font-semibold">
                                    {item.quantity} {item.unit}
                                  </TableCell>
                                  <TableCell>
                                    {item.unit_price ? formatCurrency(item.unit_price) : '-'}
                                  </TableCell>
                                  <TableCell className="font-semibold text-primary">
                                    {formatCurrency(totalValue)}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {item.supplier || '-'}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={status.className}>
                                      <StatusIcon className="h-3 w-3 ml-1" />
                                      {status.label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => openDetailsModal(item)}>
                                          <Eye className="h-4 w-4 ml-2" />
                                          عرض التفاصيل
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => openMovementsModal(item)}>
                                          <History className="h-4 w-4 ml-2" />
                                          سجل الحركات
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => openEditDialog(item)}>
                                          <Edit className="h-4 w-4 ml-2" />
                                          تعديل
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => handleDeleteClick(item.id, item.item_name)}
                                          className="text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4 ml-2" />
                                          حذف
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {/* Results Count */}
            {filteredItems.length > 0 && (
              <p className="text-sm text-muted-foreground text-center">
                عرض {filteredItems.length} من {stats.total} صنف
              </p>
            )}
          </div>
        </main>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editItemOpen} onOpenChange={setEditItemOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الصنف</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="edit_item_name">اسم الصنف *</Label>
              <Input
                id="edit_item_name"
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_item_code">كود الصنف</Label>
                <Input
                  id="edit_item_code"
                  value={formData.item_code}
                  onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit_category">الفئة</Label>
                <Input
                  id="edit_category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_quantity">الكمية *</Label>
                <Input
                  id="edit_quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit_unit">الوحدة</Label>
                <Input
                  id="edit_unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_unit_price">سعر الوحدة</Label>
                <Input
                  id="edit_unit_price"
                  type="number"
                  min="0"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit_min_stock_level">الحد الأدنى</Label>
                <Input
                  id="edit_min_stock_level"
                  type="number"
                  min="0"
                  value={formData.min_stock_level}
                  onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_supplier">المورد</Label>
              <Input
                id="edit_supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit_notes">ملاحظات</Label>
              <Textarea
                id="edit_notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <Button type="submit" className="w-full">تحديث الصنف</Button>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="حذف صنف من المخزون"
        description="هل أنت متأكد من حذف هذا الصنف؟ لا يمكن التراجع عن هذا الإجراء."
        itemName={itemToDelete?.name}
      />

      <InventoryDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        item={viewItem}
      />

      <InventoryMovementsModal
        open={movementsOpen}
        onOpenChange={setMovementsOpen}
        item={movementsItem}
        onMovementAdded={fetchInventory}
      />

      <AddInventoryItemModal
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        onSuccess={fetchInventory}
        categories={categories}
        suppliers={suppliers}
      />

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default Inventory;
