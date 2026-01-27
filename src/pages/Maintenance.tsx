import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { 
  Wrench, Plus, Calendar, Search, Filter, LayoutGrid, List, 
  AlertTriangle, CheckCircle, Clock, XCircle, Phone, MapPin, 
  User, MoreVertical, ExternalLink, Navigation, RefreshCcw,
  ArrowUpDown, TrendingUp, TrendingDown, Activity, Timer,
  FileText, Settings, Eye, UserCheck, CalendarClock
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { MaintenanceTicketModal } from "@/components/modals/MaintenanceTicketModal";
import { ScheduleTechnicianModal } from "@/components/modals/ScheduleTechnicianModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { SubscriberDetailsModal } from "@/components/modals/SubscriberDetailsModal";
import { TicketDetailsModal } from "@/components/modals/TicketDetailsModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isToday, parseISO, differenceInDays, startOfDay, endOfDay } from "date-fns";
import { ar } from "date-fns/locale";

type Ticket = {
  id: string;
  ticket_number: string;
  issue_description: string;
  issue_type?: string;
  status: string;
  priority: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  scheduled_date?: string;
  resolved_at?: string;
  technician_id?: string;
  subscribers?: {
    id: string;
    name: string;
    phone: string;
    phone_secondary?: string;
    username?: string;
    email?: string;
    address?: string;
    plan?: string;
    balance: number;
    status_comment?: string;
    address_notes?: string;
    latitude?: number;
    longitude?: number;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
  };
  technicians?: {
    id: string;
    name: string;
    phone: string;
  };
};

type Technician = {
  id: string;
  name: string;
  phone: string;
  available: boolean;
};

const Maintenance = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [maintenanceTicketOpen, setMaintenanceTicketOpen] = useState(false);
  const [scheduleTechOpen, setScheduleTechOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [ticketDetailsOpen, setTicketDetailsOpen] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState<any>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [technicianFilter, setTechnicianFilter] = useState<string>("all");
  const [issueTypeFilter, setIssueTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [activeTab, setActiveTab] = useState("all");

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_tickets')
        .select(`
          *,
          subscribers (
            id,
            name,
            phone,
            phone_secondary,
            username,
            email,
            address,
            plan,
            balance,
            status_comment,
            address_notes,
            latitude,
            longitude,
            created_at,
            updated_at,
            created_by
          ),
          technicians (
            id,
            name,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      toast.error("فشل تحميل التذاكر: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const { data } = await supabase
        .from('technicians')
        .select('id, name, phone, available')
        .order('name');
      if (data) setTechnicians(data);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchTechnicians();
  }, []);

  // Statistics calculations
  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'open').length;
    const inProgress = tickets.filter(t => t.status === 'in_progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    const closed = tickets.filter(t => t.status === 'closed').length;
    const urgent = tickets.filter(t => t.priority === 'urgent').length;
    const high = tickets.filter(t => t.priority === 'high').length;
    const todayTickets = tickets.filter(t => isToday(parseISO(t.created_at))).length;
    const scheduled = tickets.filter(t => t.scheduled_date).length;
    const unassigned = tickets.filter(t => !t.technician_id && t.status !== 'closed' && t.status !== 'resolved').length;
    
    const resolutionRate = total > 0 ? ((resolved + closed) / total) * 100 : 0;
    
    // Calculate average resolution time
    const resolvedTickets = tickets.filter(t => t.resolved_at && t.created_at);
    const avgResolutionDays = resolvedTickets.length > 0
      ? resolvedTickets.reduce((acc, t) => 
          acc + differenceInDays(parseISO(t.resolved_at!), parseISO(t.created_at)), 0
        ) / resolvedTickets.length
      : 0;

    return { 
      total, open, inProgress, resolved, closed, urgent, high, 
      todayTickets, scheduled, unassigned, resolutionRate, avgResolutionDays 
    };
  }, [tickets]);

  // Get unique issue types
  const issueTypes = useMemo(() => {
    const types = tickets.map(t => t.issue_type).filter(Boolean);
    return [...new Set(types)];
  }, [tickets]);

  // Filter and sort tickets
  const filteredTickets = useMemo(() => {
    let filtered = [...tickets];

    // Tab filter
    if (activeTab === "open") {
      filtered = filtered.filter(t => t.status === 'open');
    } else if (activeTab === "in_progress") {
      filtered = filtered.filter(t => t.status === 'in_progress');
    } else if (activeTab === "urgent") {
      filtered = filtered.filter(t => t.priority === 'urgent' || t.priority === 'high');
    } else if (activeTab === "unassigned") {
      filtered = filtered.filter(t => !t.technician_id && t.status !== 'closed' && t.status !== 'resolved');
    } else if (activeTab === "scheduled") {
      filtered = filtered.filter(t => t.scheduled_date);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.ticket_number?.toLowerCase().includes(query) ||
        t.subscribers?.name?.toLowerCase().includes(query) ||
        t.subscribers?.phone?.includes(query) ||
        t.issue_description?.toLowerCase().includes(query) ||
        t.issue_type?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }

    // Technician filter
    if (technicianFilter !== "all") {
      if (technicianFilter === "unassigned") {
        filtered = filtered.filter(t => !t.technician_id);
      } else {
        filtered = filtered.filter(t => t.technician_id === technicianFilter);
      }
    }

    // Issue type filter
    if (issueTypeFilter !== "all") {
      filtered = filtered.filter(t => t.issue_type === issueTypeFilter);
    }

    // Sort
    switch (sortBy) {
      case "oldest":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "priority_high":
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        filtered.sort((a, b) => (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 4));
        break;
      case "priority_low":
        const priorityOrderReverse = { low: 0, medium: 1, high: 2, urgent: 3 };
        filtered.sort((a, b) => (priorityOrderReverse[a.priority as keyof typeof priorityOrderReverse] || 4) - (priorityOrderReverse[b.priority as keyof typeof priorityOrderReverse] || 4));
        break;
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return filtered;
  }, [tickets, activeTab, searchQuery, statusFilter, priorityFilter, technicianFilter, issueTypeFilter, sortBy]);

  const openSubscriberDetails = (subscriber: any) => {
    setSelectedSubscriber(subscriber);
    setDetailsModalOpen(true);
  };

  const openTicketDetails = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setTicketDetailsOpen(true);
  };

  const handleQuickAssign = async (ticketId: string, technicianId: string) => {
    try {
      const { error } = await supabase
        .from('maintenance_tickets')
        .update({ 
          technician_id: technicianId,
          status: 'in_progress'
        })
        .eq('id', ticketId);

      if (error) throw error;
      toast.success("تم تعيين الفني بنجاح");
      fetchTickets();
    } catch (error: any) {
      toast.error("فشل تعيين الفني: " + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      open: { 
        label: 'مفتوحة', 
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300',
        icon: <AlertTriangle className="h-3 w-3" />
      },
      in_progress: { 
        label: 'قيد المعالجة', 
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300',
        icon: <Clock className="h-3 w-3" />
      },
      resolved: { 
        label: 'محلولة', 
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300',
        icon: <CheckCircle className="h-3 w-3" />
      },
      closed: { 
        label: 'مغلقة', 
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400 border-gray-300',
        icon: <XCircle className="h-3 w-3" />
      },
    };
    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800', icon: null };
    return (
      <Badge variant="outline" className={`${config.className} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { label: string; className: string }> = {
      low: { label: 'منخفضة', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400' },
      medium: { label: 'متوسطة', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      high: { label: 'عالية', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
      urgent: { label: 'عاجلة', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse' },
    };
    const config = priorityConfig[priority] || { label: priority, className: 'bg-gray-100 text-gray-800' };
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  const openInMaps = (lat?: number, lng?: number) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    }
  };

  const callPhone = (phone?: string) => {
    if (phone) {
      window.open(`tel:${phone}`);
    }
  };

  // Stat Card Component
  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color, 
    trend,
    onClick 
  }: { 
    title: string; 
    value: number | string; 
    subtitle?: string;
    icon: any; 
    color: string;
    trend?: { value: number; isUp: boolean };
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
            {trend && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{trend.value}%</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Ticket Grid Card Component
  const TicketGridCard = ({ ticket }: { ticket: Ticket }) => (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-r-4"
      style={{ 
        borderRightColor: ticket.priority === 'urgent' ? 'hsl(var(--destructive))' : 
                          ticket.priority === 'high' ? 'hsl(25, 95%, 53%)' :
                          ticket.priority === 'medium' ? 'hsl(217, 91%, 60%)' : 'hsl(var(--muted))' 
      }}
      onClick={() => openTicketDetails(ticket.id)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium text-primary">{ticket.ticket_number}</span>
              {isToday(parseISO(ticket.created_at)) && (
                <Badge variant="outline" className="bg-green-100 text-green-700 text-[10px] py-0">جديدة</Badge>
              )}
            </div>
            {ticket.issue_type && (
              <Badge variant="secondary" className="text-xs">{ticket.issue_type}</Badge>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {getStatusBadge(ticket.status)}
            {getPriorityBadge(ticket.priority)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{ticket.issue_description}</p>
        
        <Separator />
        
        {/* Subscriber Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">{ticket.subscribers?.name || '-'}</span>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {ticket.subscribers?.phone && (
              <button 
                onClick={(e) => { e.stopPropagation(); callPhone(ticket.subscribers?.phone); }}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Phone className="h-3 w-3" />
                <span dir="ltr">{ticket.subscribers.phone}</span>
              </button>
            )}
            {ticket.subscribers?.latitude && ticket.subscribers?.longitude && (
              <button 
                onClick={(e) => { e.stopPropagation(); openInMaps(ticket.subscribers?.latitude, ticket.subscribers?.longitude); }}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <MapPin className="h-3 w-3" />
                <span>الخريطة</span>
              </button>
            )}
          </div>
        </div>

        {/* Technician Info */}
        {ticket.technicians ? (
          <div className="flex items-center gap-2 text-xs bg-muted/50 rounded-lg p-2">
            <UserCheck className="h-4 w-4 text-green-600" />
            <span>الفني: {ticket.technicians.name}</span>
          </div>
        ) : ticket.status !== 'closed' && ticket.status !== 'resolved' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="outline" size="sm" className="w-full text-xs">
                <UserCheck className="h-3 w-3 ml-1" />
                تعيين فني
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>اختر الفني</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {technicians.filter(t => t.available).map(tech => (
                <DropdownMenuItem 
                  key={tech.id}
                  onClick={(e) => { e.stopPropagation(); handleQuickAssign(ticket.id, tech.id); }}
                >
                  {tech.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Schedule & Date Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{format(parseISO(ticket.created_at), 'dd/MM/yyyy', { locale: ar })}</span>
          </div>
          {ticket.scheduled_date && (
            <div className="flex items-center gap-1 text-primary">
              <CalendarClock className="h-3 w-3" />
              <span>مجدول: {format(parseISO(ticket.scheduled_date), 'dd/MM', { locale: ar })}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
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
                <div className="h-9 w-24 bg-muted rounded" />
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
                      <div className="h-3 w-16 bg-muted/50 rounded" />
                      <div className="h-6 w-10 bg-muted rounded" />
                    </div>
                    <div className="p-3 rounded-xl bg-muted w-11 h-11" />
                  </div>
                </div>
              ))}
            </div>
            {/* Progress Bar Skeleton */}
            <div className="p-4 rounded-xl bg-card border animate-pulse">
              <div className="flex justify-between mb-2">
                <div className="h-4 w-36 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted/50 rounded" />
              </div>
              <div className="h-3 bg-muted rounded-full" />
            </div>
            {/* Tabs Skeleton */}
            <div className="h-10 bg-muted rounded-lg animate-pulse" />
            {/* Table Skeleton */}
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 rounded-xl bg-card border animate-pulse">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex gap-2">
                        <div className="h-5 w-24 bg-muted rounded" />
                        <div className="h-5 w-16 bg-muted rounded-full" />
                        <div className="h-5 w-14 bg-muted rounded-full" />
                      </div>
                      <div className="h-4 w-48 bg-muted/50 rounded" />
                      <div className="flex gap-3">
                        <div className="h-4 w-24 bg-muted/50 rounded" />
                        <div className="h-4 w-20 bg-muted/50 rounded" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-9 w-9 bg-muted rounded" />
                      <div className="h-9 w-9 bg-muted rounded" />
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
                  <Wrench className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">إدارة الصيانة</h1>
                  <p className="text-sm text-muted-foreground">متابعة وإدارة تذاكر الصيانة</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => fetchTickets()} variant="outline" size="sm">
                  <RefreshCcw className="h-4 w-4 ml-1" />
                  تحديث
                </Button>
                <Button onClick={() => setScheduleTechOpen(true)} variant="outline">
                  <Calendar className="h-4 w-4 ml-2" />
                  جدولة فني
                </Button>
                <Button onClick={() => setMaintenanceTicketOpen(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  تذكرة جديدة
                </Button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard
                title="إجمالي التذاكر"
                value={stats.total}
                icon={FileText}
                color="bg-primary"
                onClick={() => setActiveTab("all")}
              />
              <StatCard
                title="مفتوحة"
                value={stats.open}
                subtitle={`${stats.todayTickets} اليوم`}
                icon={AlertTriangle}
                color="bg-yellow-500"
                onClick={() => setActiveTab("open")}
              />
              <StatCard
                title="قيد المعالجة"
                value={stats.inProgress}
                icon={Clock}
                color="bg-blue-500"
                onClick={() => setActiveTab("in_progress")}
              />
              <StatCard
                title="عاجلة / عالية"
                value={stats.urgent + stats.high}
                icon={Activity}
                color="bg-red-500"
                onClick={() => setActiveTab("urgent")}
              />
              <StatCard
                title="غير مُعيّنة"
                value={stats.unassigned}
                icon={UserCheck}
                color="bg-orange-500"
                onClick={() => setActiveTab("unassigned")}
              />
              <StatCard
                title="نسبة الإنجاز"
                value={`${stats.resolutionRate.toFixed(0)}%`}
                subtitle={`متوسط ${stats.avgResolutionDays.toFixed(1)} يوم`}
                icon={CheckCircle}
                color="bg-green-500"
              />
            </div>

            {/* Progress Bar */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">توزيع حالات التذاكر</span>
                  <span className="text-xs text-muted-foreground">{stats.total} تذكرة</span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                  {stats.total > 0 && (
                    <>
                      <div 
                        className="bg-yellow-500 transition-all duration-500" 
                        style={{ width: `${(stats.open / stats.total) * 100}%` }} 
                        title={`مفتوحة: ${stats.open}`}
                      />
                      <div 
                        className="bg-blue-500 transition-all duration-500" 
                        style={{ width: `${(stats.inProgress / stats.total) * 100}%` }} 
                        title={`قيد المعالجة: ${stats.inProgress}`}
                      />
                      <div 
                        className="bg-green-500 transition-all duration-500" 
                        style={{ width: `${(stats.resolved / stats.total) * 100}%` }} 
                        title={`محلولة: ${stats.resolved}`}
                      />
                      <div 
                        className="bg-gray-400 transition-all duration-500" 
                        style={{ width: `${(stats.closed / stats.total) * 100}%` }} 
                        title={`مغلقة: ${stats.closed}`}
                      />
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> مفتوحة ({stats.open})</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> قيد المعالجة ({stats.inProgress})</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> محلولة ({stats.resolved})</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" /> مغلقة ({stats.closed})</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <TabsList className="w-full lg:w-auto">
                  <TabsTrigger value="all">الكل ({stats.total})</TabsTrigger>
                  <TabsTrigger value="open">مفتوحة ({stats.open})</TabsTrigger>
                  <TabsTrigger value="in_progress">قيد المعالجة ({stats.inProgress})</TabsTrigger>
                  <TabsTrigger value="urgent" className="text-red-600">عاجلة ({stats.urgent + stats.high})</TabsTrigger>
                  <TabsTrigger value="unassigned">غير مُعيّنة ({stats.unassigned})</TabsTrigger>
                  <TabsTrigger value="scheduled">مجدولة ({stats.scheduled})</TabsTrigger>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                    <div className="lg:col-span-2">
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="بحث برقم التذكرة، المشترك، الهاتف..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pr-10"
                        />
                      </div>
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الحالات</SelectItem>
                        <SelectItem value="open">مفتوحة</SelectItem>
                        <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                        <SelectItem value="resolved">محلولة</SelectItem>
                        <SelectItem value="closed">مغلقة</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="الأولوية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الأولويات</SelectItem>
                        <SelectItem value="urgent">عاجلة</SelectItem>
                        <SelectItem value="high">عالية</SelectItem>
                        <SelectItem value="medium">متوسطة</SelectItem>
                        <SelectItem value="low">منخفضة</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={technicianFilter} onValueChange={setTechnicianFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="الفني" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الفنيين</SelectItem>
                        <SelectItem value="unassigned">غير مُعيّن</SelectItem>
                        {technicians.map(tech => (
                          <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue placeholder="ترتيب" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">الأحدث أولاً</SelectItem>
                        <SelectItem value="oldest">الأقدم أولاً</SelectItem>
                        <SelectItem value="priority_high">الأولوية (الأعلى)</SelectItem>
                        <SelectItem value="priority_low">الأولوية (الأقل)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Content */}
              <TabsContent value={activeTab} className="mt-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-lg">لا توجد تذاكر مطابقة للبحث</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setMaintenanceTicketOpen(true)}
                      >
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة تذكرة جديدة
                      </Button>
                    </CardContent>
                  </Card>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTickets.map(ticket => (
                      <TicketGridCard key={ticket.id} ticket={ticket} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[120px]">رقم التذكرة</TableHead>
                              <TableHead>المشترك</TableHead>
                              <TableHead>نوع المشكلة</TableHead>
                              <TableHead className="max-w-[200px]">الوصف</TableHead>
                              <TableHead>الأولوية</TableHead>
                              <TableHead>الحالة</TableHead>
                              <TableHead>الفني</TableHead>
                              <TableHead>التاريخ</TableHead>
                              <TableHead className="text-left">إجراءات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredTickets.map((ticket) => (
                              <TableRow 
                                key={ticket.id} 
                                className="cursor-pointer hover:bg-muted/50" 
                                onClick={() => openTicketDetails(ticket.id)}
                              >
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm font-medium">{ticket.ticket_number}</span>
                                    {isToday(parseISO(ticket.created_at)) && (
                                      <Badge variant="outline" className="bg-green-100 text-green-700 text-[10px] py-0">جديدة</Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <span className="font-medium">{ticket.subscribers?.name || '-'}</span>
                                    {ticket.subscribers?.phone && (
                                      <p className="text-xs text-muted-foreground" dir="ltr">{ticket.subscribers.phone}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {ticket.issue_type && (
                                    <Badge variant="secondary" className="text-xs">{ticket.issue_type}</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="max-w-[200px]">
                                  <p className="truncate text-sm">{ticket.issue_description}</p>
                                </TableCell>
                                <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                                <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                <TableCell>
                                  {ticket.technicians ? (
                                    <span className="text-sm">{ticket.technicians.name}</span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">غير مُعيّن</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1 text-xs">
                                    <p>{format(parseISO(ticket.created_at), 'dd/MM/yyyy', { locale: ar })}</p>
                                    {ticket.scheduled_date && (
                                      <p className="text-primary flex items-center gap-1">
                                        <CalendarClock className="h-3 w-3" />
                                        {format(parseISO(ticket.scheduled_date), 'dd/MM', { locale: ar })}
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => openTicketDetails(ticket.id)}>
                                        <Eye className="h-4 w-4 ml-2" />
                                        عرض التفاصيل
                                      </DropdownMenuItem>
                                      {ticket.subscribers?.phone && (
                                        <DropdownMenuItem onClick={() => callPhone(ticket.subscribers?.phone)}>
                                          <Phone className="h-4 w-4 ml-2" />
                                          اتصال بالمشترك
                                        </DropdownMenuItem>
                                      )}
                                      {ticket.subscribers?.latitude && ticket.subscribers?.longitude && (
                                        <DropdownMenuItem onClick={() => openInMaps(ticket.subscribers?.latitude, ticket.subscribers?.longitude)}>
                                          <Navigation className="h-4 w-4 ml-2" />
                                          فتح الموقع
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      {!ticket.technician_id && ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                                        <>
                                          <DropdownMenuLabel>تعيين فني</DropdownMenuLabel>
                                          {technicians.filter(t => t.available).map(tech => (
                                            <DropdownMenuItem 
                                              key={tech.id}
                                              onClick={() => handleQuickAssign(ticket.id, tech.id)}
                                            >
                                              <UserCheck className="h-4 w-4 ml-2" />
                                              {tech.name}
                                            </DropdownMenuItem>
                                          ))}
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {/* Results Count */}
            {!loading && filteredTickets.length > 0 && (
              <p className="text-sm text-muted-foreground text-center">
                عرض {filteredTickets.length} من {stats.total} تذكرة
              </p>
            )}
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <MaintenanceTicketModal 
        open={maintenanceTicketOpen} 
        onOpenChange={setMaintenanceTicketOpen}
        onSuccess={fetchTickets}
      />
      <ScheduleTechnicianModal 
        open={scheduleTechOpen} 
        onOpenChange={setScheduleTechOpen}
        onSuccess={fetchTickets}
      />
      <SubscriberDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        subscriber={selectedSubscriber}
      />
      <TicketDetailsModal
        ticketId={selectedTicketId}
        open={ticketDetailsOpen}
        onOpenChange={setTicketDetailsOpen}
        onTicketUpdated={fetchTickets}
      />
    </div>
  );
};

export default Maintenance;
