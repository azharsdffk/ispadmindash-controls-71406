import { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, MapPin, Phone, MessageCircle, User, Loader2, Link } from 'lucide-react';
import { agentsApi, Agent } from '@/services/api/agents';
import { DeleteConfirmDialog } from '@/components/modals/DeleteConfirmDialog';
import { Helmet } from 'react-helmet-async';

export default function AgentsManagement() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    telegram: '',
    region: '',
    address: '',
    working_hours: '',
    location_url: '',
    active: true,
    notes: '',
  });

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await agentsApi.getAll();
      setAgents(data);
    } catch (error) {
      console.error('Error loading agents:', error);
      toast.error('حدث خطأ في تحميل الوكلاء');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setSelectedAgent(null);
    setFormData({
      name: '',
      phone: '',
      whatsapp: '',
      telegram: '',
      region: '',
      address: '',
      working_hours: '',
      location_url: '',
      active: true,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (agent: Agent) => {
    setSelectedAgent(agent);
    setFormData({
      name: agent.name,
      phone: agent.phone,
      whatsapp: agent.whatsapp || '',
      telegram: agent.telegram || '',
      region: agent.region,
      address: agent.address || '',
      working_hours: agent.working_hours || '',
      location_url: agent.latitude && agent.longitude 
        ? `https://www.google.com/maps?q=${agent.latitude},${agent.longitude}` 
        : '',
      active: agent.active ?? true,
      notes: agent.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim() || !formData.region.trim()) {
      toast.error('الرجاء ملء الحقول المطلوبة');
      return;
    }

    setSubmitting(true);
    try {
      // Extract lat/lng from Google Maps URL if provided
      let latitude: number | null = null;
      let longitude: number | null = null;
      
      if (formData.location_url) {
        // Try to extract coordinates from various Google Maps URL formats
        const coordsMatch = formData.location_url.match(/[@?](-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (coordsMatch) {
          latitude = parseFloat(coordsMatch[1]);
          longitude = parseFloat(coordsMatch[2]);
        }
      }

      const agentData = {
        name: formData.name,
        phone: formData.phone,
        whatsapp: formData.whatsapp || null,
        telegram: formData.telegram || null,
        region: formData.region,
        address: formData.address || null,
        working_hours: formData.working_hours || null,
        latitude,
        longitude,
        active: formData.active,
        notes: formData.notes || null,
      };

      if (selectedAgent) {
        await agentsApi.update(selectedAgent.id, agentData);
        toast.success('تم تحديث الوكيل بنجاح');
      } else {
        await agentsApi.create(agentData);
        toast.success('تم إضافة الوكيل بنجاح');
      }

      setIsModalOpen(false);
      loadAgents();
    } catch (error) {
      console.error('Error saving agent:', error);
      toast.error('حدث خطأ في حفظ البيانات');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAgent) return;
    
    try {
      await agentsApi.delete(selectedAgent.id);
      toast.success('تم حذف الوكيل بنجاح');
      setIsDeleteOpen(false);
      loadAgents();
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('حدث خطأ في حذف الوكيل');
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.phone.includes(searchQuery)
  );

  return (
    <>
      <Helmet>
        <title>إدارة الوكلاء | لوحة التحكم</title>
      </Helmet>

      <SidebarProvider>
        <div className="min-h-screen flex w-full" dir="rtl">
          <AppSidebar />
          <div className="flex-1">
            <AppHeader />
            <main className="p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">إدارة الوكلاء</h1>
                  <p className="text-muted-foreground">إدارة وكلاء الخدمة ومعلومات التواصل</p>
                </div>
                <Button onClick={openAddModal}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة وكيل
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث بالاسم، المنطقة، أو الهاتف..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الاسم</TableHead>
                          <TableHead>المنطقة</TableHead>
                          <TableHead>الهاتف</TableHead>
                          <TableHead>واتساب</TableHead>
                          <TableHead>أوقات العمل</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAgents.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              لا يوجد وكلاء
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredAgents.map((agent) => (
                            <TableRow key={agent.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  {agent.name}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  {agent.region}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  {agent.phone}
                                </div>
                              </TableCell>
                              <TableCell>
                                {agent.whatsapp ? (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <MessageCircle className="h-4 w-4" />
                                    {agent.whatsapp}
                                  </div>
                                ) : '-'}
                              </TableCell>
                              <TableCell>{agent.working_hours || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={agent.active ? 'default' : 'secondary'}>
                                  {agent.active ? 'نشط' : 'غير نشط'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => openEditModal(agent)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => {
                                      setSelectedAgent(agent);
                                      setIsDeleteOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </main>
          </div>
        </div>
      </SidebarProvider>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{selectedAgent ? 'تعديل الوكيل' : 'إضافة وكيل جديد'}</DialogTitle>
            <DialogDescription>
              {selectedAgent ? 'تحديث بيانات الوكيل' : 'أدخل بيانات الوكيل الجديد'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="اسم الوكيل"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">المنطقة *</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="منطقة العمل"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">الهاتف *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="رقم الهاتف"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">واتساب</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="رقم الواتساب"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telegram">تلغرام</Label>
                <Input
                  id="telegram"
                  value={formData.telegram}
                  onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                  placeholder="@username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="working_hours">أوقات العمل</Label>
                <Input
                  id="working_hours"
                  value={formData.working_hours}
                  onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                  placeholder="مثال: 9 صباحاً - 9 مساءً"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">العنوان التفصيلي</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="العنوان التفصيلي للمكتب"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_url">رابط الموقع (خرائط جوجل)</Label>
              <div className="relative">
                <Link className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location_url"
                  value={formData.location_url}
                  onChange={(e) => setFormData({ ...formData, location_url: e.target.value })}
                  placeholder="https://www.google.com/maps?q=33.3152,44.3661"
                  className="pr-10"
                  dir="ltr"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                الصق رابط الموقع من خرائط جوجل مباشرةً
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active">الوكيل نشط</Label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                {selectedAgent ? 'تحديث' : 'إضافة'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title="حذف الوكيل"
        description={`هل أنت متأكد من حذف الوكيل "${selectedAgent?.name}"؟`}
      />
    </>
  );
}
