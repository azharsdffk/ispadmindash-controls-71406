import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, Plus, Edit, Trash2, AlertTriangle, TrendingDown, TrendingUp, Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUserRole } from "@/hooks/useUserRole";
import { formatCurrency } from "@/lib/currency";

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
}

const Inventory = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editItemOpen, setEditItemOpen] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const { isAdmin, loading: roleLoading } = useUserRole();

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

  useEffect(() => {
    if (searchQuery) {
      const filtered = items.filter(item =>
        item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.item_code?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(items);
    }
  }, [searchQuery, items]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('item_name', { ascending: true });

      if (error) throw error;
      setItems(data || []);
      setFilteredItems(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('فشل تحميل المخزون');
    } finally {
      setLoading(false);
    }
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

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الصنف؟')) return;

    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

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
    if (!minLevel) return null;
    
    if (quantity === 0) {
      return { label: 'نفذ', variant: 'destructive' as const, icon: AlertTriangle };
    } else if (quantity <= minLevel) {
      return { label: 'منخفض', variant: 'secondary' as const, icon: TrendingDown };
    }
    return { label: 'متوفر', variant: 'default' as const, icon: TrendingUp };
  };

  const totalValue = items.reduce((sum, item) => 
    sum + (item.quantity * (item.unit_price || 0)), 0
  );

  const lowStockItems = items.filter(item => 
    item.min_stock_level && item.quantity <= item.min_stock_level
  );

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">إدارة المخزون</h1>
              </div>
              
              <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    إضافة صنف
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>إضافة صنف جديد</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="item_name">اسم الصنف</Label>
                      <Input
                        id="item_name"
                        value={formData.item_name}
                        onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="item_code">كود الصنف</Label>
                        <Input
                          id="item_code"
                          value={formData.item_code}
                          onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="category">الفئة</Label>
                        <Input
                          id="category"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quantity">الكمية</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="unit">الوحدة</Label>
                        <Input
                          id="unit"
                          value={formData.unit}
                          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="unit_price">سعر الوحدة</Label>
                        <Input
                          id="unit_price"
                          type="number"
                          value={formData.unit_price}
                          onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="min_stock_level">الحد الأدنى</Label>
                        <Input
                          id="min_stock_level"
                          type="number"
                          value={formData.min_stock_level}
                          onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="supplier">المورد</Label>
                      <Input
                        id="supplier"
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">ملاحظات</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>

                    <Button type="submit" className="w-full">إضافة الصنف</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">إجمالي الأصناف</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{items.length}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">قيمة المخزون</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-success">
                    {formatCurrency(totalValue)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    مخزون منخفض
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-warning">{lowStockItems.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ابحث عن صنف..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Inventory Table */}
            <Card>
              <CardHeader>
                <CardTitle>قائمة المخزون</CardTitle>
                <CardDescription>
                  {filteredItems.length} صنف
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الصنف</TableHead>
                      <TableHead>الفئة</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>القيمة الإجمالية</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const status = getStockStatus(item.quantity, item.min_stock_level);
                      const totalItemValue = item.quantity * (item.unit_price || 0);
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.item_name}</p>
                              {item.item_code && (
                                <p className="text-xs text-muted-foreground">{item.item_code}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{item.category || '-'}</TableCell>
                          <TableCell>
                            {item.quantity} {item.unit}
                          </TableCell>
                          <TableCell>
                            {item.unit_price ? formatCurrency(item.unit_price) : '-'}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(totalItemValue)}
                          </TableCell>
                          <TableCell>
                            {status && (
                              <Badge variant={status.variant}>
                                <status.icon className="h-3 w-3 ml-1" />
                                {status.label}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editItemOpen} onOpenChange={setEditItemOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الصنف</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="edit_item_name">اسم الصنف</Label>
              <Input
                id="edit_item_name"
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_quantity">الكمية</Label>
                <Input
                  id="edit_quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit_unit_price">سعر الوحدة</Label>
                <Input
                  id="edit_unit_price"
                  type="number"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                />
              </div>
            </div>

            <Button type="submit" className="w-full">تحديث الصنف</Button>
          </form>
        </DialogContent>
      </Dialog>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default Inventory;
