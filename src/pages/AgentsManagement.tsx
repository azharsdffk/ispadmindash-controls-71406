import { useState, useEffect, useMemo } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Plus, Search, Edit, Trash2, MapPin, Phone, MessageCircle, User, Loader2, Link,
  Users, UserCheck, UserX, Building2, Clock, Activity, Eye, ExternalLink,
  Send, Copy, RefreshCw, Filter, LayoutGrid, List, CheckCircle, XCircle,
  Globe, Briefcase, Star, TrendingUp, Calendar, Mail
} from 'lucide-react';
import { agentsApi, Agent } from '@/services/api/agents';
import { supabase } from '@/integrations/supabase/client';
import { DeleteConfirmDialog } from '@/components/modals/DeleteConfirmDialog';
import { AgentDetailsModal } from '@/components/agents/AgentDetailsModal';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AgentStats {
  totalAgents: number;
  activeAgents: number;
  inactiveAgents: number;
  totalRegions: number;
  totalSubscribers: number;
  totalTickets: number;
}

interface AgentWithStats extends Agent {
  subscribersCount?: number;
  ticketsCount?: number;
}

export default function AgentsManagement() {
  const [agents, setAgents] = useState<AgentWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentWithStats | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  const [stats, setStats] = useState<AgentStats>({
    totalAgents: 0,
    activeAgents: 0,
    inactiveAgents: 0,
    totalRegions: 0,
    totalSubscribers: 0,
    totalTickets: 0,
  });

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
      
      // Load additional stats for each agent
      const agentsWithStats = await Promise.all(data.map(async (agent) => {
        const [subscribersResult, ticketsResult] = await Promise.all([
          supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('agent_id', agent.id),
          supabase.from('maintenance_tickets').select('id', { count: 'exact', head: true }).eq('agent_id', agent.id),
        ]);
        
        return {
          ...agent,
          subscribersCount: subscribersResult.count || 0,
          ticketsCount: ticketsResult.count || 0,
        };
      }));
      
      setAgents(agentsWithStats);
      
      // Calculate stats
      const uniqueRegions = new Set(data.map(a => a.region));
      const activeCount = data.filter(a => a.active).length;
      
      const totalSubscribers = agentsWithStats.reduce((sum, a) => sum + (a.subscribersCount || 0), 0);
      const totalTickets = agentsWithStats.reduce((sum, a) => sum + (a.ticketsCount || 0), 0);
      
      setStats({
        totalAgents: data.length,
        activeAgents: activeCount,
        inactiveAgents: data.length - activeCount,
        totalRegions: uniqueRegions.size,
        totalSubscribers,
        totalTickets,
      });
    } catch (error) {
      console.error('Error loading agents:', error);
      toast.error('حدث خطأ في تحميل الوكلاء');
    } finally {
      setLoading(false);
    }
  };

  const regions = useMemo(() => {
    const uniqueRegions = new Set(agents.map(a => a.region));
    return Array.from(uniqueRegions).sort();
  }, [agents]);

  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.phone.includes(searchQuery);
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && agent.active) ||
        (statusFilter === 'inactive' && !agent.active);
      
      const matchesRegion = regionFilter === 'all' || agent.region === regionFilter;
      
      const matchesTab = activeTab === 'all' ||
        (activeTab === 'active' && agent.active) ||
        (activeTab === 'inactive' && !agent.active);
      
      return matchesSearch && matchesStatus && matchesRegion && matchesTab;
    });
  }, [agents, searchQuery, statusFilter, regionFilter, activeTab]);

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

  const openEditModal = (agent: AgentWithStats) => {
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

  const openViewModal = (agent: AgentWithStats) => {
    setSelectedAgent(agent);
    setIsViewOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim() || !formData.region.trim()) {
      toast.error('الرجاء ملء الحقول المطلوبة');
      return;
    }

    setSubmitting(true);
    try {
      let latitude: number | null = null;
      let longitude: number | null = null;
      
      if (formData.location_url) {
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${label}`);
  };

  const statCards = [
    { 
      label: 'إجمالي الوكلاء', 
      value: stats.totalAgents, 
      icon: Users, 
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20'
    },
    { 
      label: 'الوكلاء النشطين', 
      value: stats.activeAgents, 
      icon: UserCheck, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    { 
      label: 'الوكلاء غير النشطين', 
      value: stats.inactiveAgents, 
      icon: UserX, 
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    },
    { 
      label: 'المناطق', 
      value: stats.totalRegions, 
      icon: MapPin, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    { 
      label: 'إجمالي المشتركين', 
      value: stats.totalSubscribers, 
      icon: Building2, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    { 
      label: 'إجمالي التذاكر', 
      value: stats.totalTickets, 
      icon: Activity, 
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20'
    },
  ];

  const activePercentage = stats.totalAgents > 0 ? (stats.activeAgents / stats.totalAgents) * 100 : 0;

  return (
    <>
      <Helmet>
        <title>إدارة الوكلاء | لوحة التحكم</title>
        <meta name="description" content="إدارة وكلاء الخدمة ومعلومات التواصل والمناطق" />
      </Helmet>

      <SidebarProvider>
        <div className="min-h-screen flex w-full" dir="rtl">
          <AppSidebar />
          <div className="flex-1">
            <AppHeader />
            <main className="p-6 space-y-6">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold tracking-tight">إدارة الوكلاء</h1>
                  <p className="text-muted-foreground">إدارة وكلاء الخدمة ومعلومات التواصل والمناطق</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={loadAgents} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
                    تحديث
                  </Button>
                  <Button onClick={openAddModal}>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة وكيل
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {statCards.map((stat, index) => (
                  <Card key={index} className={`border ${stat.borderColor} transition-all hover:shadow-md`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                          <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Progress Bar */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">نسبة الوكلاء النشطين</span>
                    <span className="text-sm font-bold text-primary">{activePercentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={activePercentage} className="h-2" />
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{stats.activeAgents} وكيل نشط</span>
                    <span>من أصل {stats.totalAgents} وكيل</span>
                  </div>
                </CardContent>
              </Card>

              {/* Main Content */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <TabsList className="grid w-full md:w-auto grid-cols-3">
                    <TabsTrigger value="all" className="gap-2">
                      <Users className="h-4 w-4" />
                      الكل ({stats.totalAgents})
                    </TabsTrigger>
                    <TabsTrigger value="active" className="gap-2">
                      <CheckCircle className="h-4 w-4" />
                      نشط ({stats.activeAgents})
                    </TabsTrigger>
                    <TabsTrigger value="inactive" className="gap-2">
                      <XCircle className="h-4 w-4" />
                      غير نشط ({stats.inactiveAgents})
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setViewMode('table')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setViewMode('grid')}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Filters */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="بحث بالاسم، المنطقة، أو الهاتف..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pr-10"
                        />
                      </div>
                      <Select value={regionFilter} onValueChange={setRegionFilter}>
                        <SelectTrigger className="w-full md:w-48">
                          <MapPin className="h-4 w-4 ml-2" />
                          <SelectValue placeholder="جميع المناطق" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">جميع المناطق</SelectItem>
                          {regions.map((region) => (
                            <SelectItem key={region} value={region}>{region}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Content */}
                <TabsContent value={activeTab} className="space-y-4 mt-0">
                  {loading ? (
                    <Card>
                      <CardContent className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </CardContent>
                    </Card>
                  ) : viewMode === 'table' ? (
                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>الوكيل</TableHead>
                              <TableHead>المنطقة</TableHead>
                              <TableHead>التواصل</TableHead>
                              <TableHead>أوقات العمل</TableHead>
                              <TableHead>المشتركين</TableHead>
                              <TableHead>التذاكر</TableHead>
                              <TableHead>الحالة</TableHead>
                              <TableHead>إجراءات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAgents.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center py-12">
                                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                  <p className="text-muted-foreground">لا يوجد وكلاء</p>
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredAgents.map((agent) => (
                                <TableRow 
                                  key={agent.id} 
                                  className="cursor-pointer hover:bg-muted/50"
                                  onClick={() => openViewModal(agent)}
                                >
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-5 w-5 text-primary" />
                                      </div>
                                      <div>
                                        <p className="font-medium">{agent.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {agent.created_at ? format(new Date(agent.created_at), 'dd MMM yyyy', { locale: ar }) : '-'}
                                        </p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4 text-muted-foreground" />
                                      <span>{agent.region}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col gap-1">
                                      <span className="flex items-center gap-1 text-sm">
                                        <Phone className="h-3 w-3" />
                                        {agent.phone}
                                      </span>
                                      {agent.whatsapp && (
                                        <span className="flex items-center gap-1 text-xs text-green-600">
                                          <MessageCircle className="h-3 w-3" />
                                          واتساب
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm">{agent.working_hours || '-'}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="secondary" className="gap-1">
                                      <Building2 className="h-3 w-3" />
                                      {agent.subscribersCount || 0}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="gap-1">
                                      <Activity className="h-3 w-3" />
                                      {agent.ticketsCount || 0}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={agent.active ? 'default' : 'secondary'}>
                                      {agent.active ? 'نشط' : 'غير نشط'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => openViewModal(agent)}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
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
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredAgents.length === 0 ? (
                        <Card className="col-span-full">
                          <CardContent className="flex flex-col items-center justify-center py-12">
                            <Users className="h-12 w-12 mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">لا يوجد وكلاء</p>
                          </CardContent>
                        </Card>
                      ) : (
                        filteredAgents.map((agent) => (
                          <Card 
                            key={agent.id} 
                            className={`cursor-pointer transition-all hover:shadow-lg ${!agent.active ? 'opacity-60' : ''}`}
                            onClick={() => openViewModal(agent)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-6 w-6 text-primary" />
                                  </div>
                                  <div>
                                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                                    <CardDescription className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {agent.region}
                                    </CardDescription>
                                  </div>
                                </div>
                                <Badge variant={agent.active ? 'default' : 'secondary'}>
                                  {agent.active ? 'نشط' : 'غير نشط'}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span dir="ltr">{agent.phone}</span>
                              </div>
                              {agent.whatsapp && (
                                <div className="flex items-center gap-2 text-sm text-green-600">
                                  <MessageCircle className="h-4 w-4" />
                                  <span dir="ltr">{agent.whatsapp}</span>
                                </div>
                              )}
                              {agent.working_hours && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span>{agent.working_hours}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-4 pt-3 border-t">
                                <div className="flex items-center gap-1 text-sm">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{agent.subscribersCount || 0}</span>
                                  <span className="text-muted-foreground">مشترك</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm">
                                  <Activity className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{agent.ticketsCount || 0}</span>
                                  <span className="text-muted-foreground">تذكرة</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => openEditModal(agent)}
                                >
                                  <Edit className="h-4 w-4 ml-1" />
                                  تعديل
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAgent(agent);
                                    setIsDeleteOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </main>
          </div>
        </div>
      </SidebarProvider>


      {/* View Details Modal */}
      <AgentDetailsModal 
        open={isViewOpen} 
        onOpenChange={setIsViewOpen} 
        agent={selectedAgent} 
      />
      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAgent ? (
                <>
                  <Edit className="h-5 w-5" />
                  تعديل الوكيل
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  إضافة وكيل جديد
                </>
              )}
            </DialogTitle>
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
        description={`هل أنت متأكد من حذف الوكيل "${selectedAgent?.name}"؟ سيتم إلغاء ربط جميع المشتركين والتذاكر المرتبطة به.`}
      />
    </>
  );
}
