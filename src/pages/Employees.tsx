import { useState, useCallback, useEffect, useMemo } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  UserPlus, MapPin, Users, Shield, Search, RefreshCcw, LayoutGrid, List,
  Phone, Mail, Briefcase, CheckCircle, XCircle, MoreVertical, Edit, Trash2,
  UserCog, Clock, Calendar, Hash, Filter, ChevronDown, Eye, Ban,
  TrendingUp, Award, Star, Building2, MapPinned, Activity, UserCheck, UserX
} from "lucide-react";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { AddEmployeeModal } from "@/components/modals/AddEmployeeModal";
import { EmployeeLocationTracker } from "@/components/employees/EmployeeLocationTracker";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { DeleteConfirmDialog } from "@/components/modals/DeleteConfirmDialog";

interface Employee {
  id: string;
  user_id: string;
  employee_code: string;
  full_name: string;
  phone: string;
  position: string | null;
  active: boolean;
  created_at: string;
  profiles?: {
    full_name: string;
    phone: string | null;
    username: string | null;
  };
  user_roles?: {
    role: string;
  };
}

// Stat Card Component
const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = "bg-primary",
  onClick 
}: { 
  title: string; 
  value: number | string; 
  subtitle?: string;
  icon: any; 
  color?: string;
  onClick?: () => void;
}) => (
  <Card 
    className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
    onClick={onClick}
  >
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
          <Icon className={`h-5 w-5 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const Employees = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [showLocationTracker, setShowLocationTracker] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, loading: roleLoading } = useUserRole();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name_asc");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [activeTab, setActiveTab] = useState("all");

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<{ id: string; name: string } | null>(null);

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const employeesWithDetails = await Promise.all(
        (data || []).map(async (employee) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, phone, username")
            .eq("id", employee.user_id)
            .single();

          const { data: role } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", employee.user_id)
            .single();

          return {
            ...employee,
            profiles: profile,
            user_roles: role,
          };
        })
      );

      setEmployees(employeesWithDetails);
    } catch (error: any) {
      console.error("Error loading employees:", error);
      toast.error("فشل تحميل بيانات الموظفين");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!roleLoading && isAdmin) {
      loadEmployees();
    }
  }, [roleLoading, isAdmin, loadEmployees]);

  // Statistics
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.active).length;
    const inactive = employees.filter(e => !e.active).length;
    const admins = employees.filter(e => e.user_roles?.role === 'admin').length;
    const accountants = employees.filter(e => e.user_roles?.role === 'accountant').length;
    const technicians = employees.filter(e => e.user_roles?.role === 'technician').length;

    return { total, active, inactive, admins, accountants, technicians };
  }, [employees]);

  // Filtered and sorted employees
  const filteredEmployees = useMemo(() => {
    let filtered = [...employees];

    // Tab filter
    if (activeTab === "active") {
      filtered = filtered.filter(e => e.active);
    } else if (activeTab === "inactive") {
      filtered = filtered.filter(e => !e.active);
    } else if (activeTab === "admins") {
      filtered = filtered.filter(e => e.user_roles?.role === 'admin');
    } else if (activeTab === "technicians") {
      filtered = filtered.filter(e => e.user_roles?.role === 'technician');
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.full_name.toLowerCase().includes(query) ||
        e.employee_code.toLowerCase().includes(query) ||
        e.phone.includes(query) ||
        e.profiles?.username?.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(e => e.user_roles?.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(e => statusFilter === "active" ? e.active : !e.active);
    }

    // Sorting
    switch (sortBy) {
      case "name_asc":
        filtered.sort((a, b) => a.full_name.localeCompare(b.full_name, 'ar'));
        break;
      case "name_desc":
        filtered.sort((a, b) => b.full_name.localeCompare(a.full_name, 'ar'));
        break;
      case "date_asc":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "date_desc":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return filtered;
  }, [employees, activeTab, searchQuery, roleFilter, statusFilter, sortBy]);

  const toggleEmployeeStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("employees")
        .update({ active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success(`تم ${!currentStatus ? "تفعيل" : "تعطيل"} الموظف بنجاح`);
      loadEmployees();
    } catch (error: any) {
      toast.error("فشل تحديث حالة الموظف");
    }
  };

  const handleDelete = async () => {
    if (!employeeToDelete) return;

    try {
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", employeeToDelete.id);

      if (error) throw error;

      toast.success("تم حذف الموظف بنجاح");
      loadEmployees();
    } catch (error: any) {
      toast.error("فشل حذف الموظف");
    } finally {
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin': return 'مدير';
      case 'accountant': return 'محاسب';
      case 'technician': return 'فني';
      default: return 'موظف';
    }
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'accountant': return 'secondary';
      case 'technician': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'admin': return 'bg-primary text-primary-foreground';
      case 'accountant': return 'bg-blue-500 text-white';
      case 'technician': return 'bg-green-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2);
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background" dir="rtl">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
          
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">إدارة الموظفين</h1>
                    <p className="text-sm text-muted-foreground">إضافة وإدارة حسابات الموظفين والفنيين</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => loadEmployees()} variant="outline" size="sm">
                    <RefreshCcw className="h-4 w-4 ml-1" />
                    تحديث
                  </Button>
                  <Button 
                    onClick={() => setShowLocationTracker(!showLocationTracker)} 
                    variant="outline"
                    size="sm"
                  >
                    <MapPin className="h-4 w-4 ml-1" />
                    {showLocationTracker ? "إخفاء الخريطة" : "عرض المواقع"}
                  </Button>
                  <Button onClick={() => setAddEmployeeOpen(true)}>
                    <UserPlus className="h-4 w-4 ml-2" />
                    إضافة موظف
                  </Button>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatCard
                  title="إجمالي الموظفين"
                  value={stats.total}
                  icon={Users}
                  color="bg-primary"
                  onClick={() => setActiveTab("all")}
                />
                <StatCard
                  title="نشط"
                  value={stats.active}
                  icon={UserCheck}
                  color="bg-green-500"
                  onClick={() => setActiveTab("active")}
                />
                <StatCard
                  title="غير نشط"
                  value={stats.inactive}
                  icon={UserX}
                  color="bg-red-500"
                  onClick={() => setActiveTab("inactive")}
                />
                <StatCard
                  title="المدراء"
                  value={stats.admins}
                  icon={Shield}
                  color="bg-purple-500"
                  onClick={() => setActiveTab("admins")}
                />
                <StatCard
                  title="المحاسبين"
                  value={stats.accountants}
                  icon={Building2}
                  color="bg-blue-500"
                />
                <StatCard
                  title="الفنيين"
                  value={stats.technicians}
                  icon={Briefcase}
                  color="bg-orange-500"
                  onClick={() => setActiveTab("technicians")}
                />
              </div>

              {/* Status Distribution Progress */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">توزيع حالة الموظفين</span>
                    <span className="text-xs text-muted-foreground">{stats.total} موظف</span>
                  </div>
                  <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                    {stats.total > 0 && (
                      <>
                        <div 
                          className="bg-green-500 transition-all duration-500" 
                          style={{ width: `${(stats.active / stats.total) * 100}%` }}
                          title={`نشط: ${stats.active}`}
                        />
                        <div 
                          className="bg-red-500 transition-all duration-500" 
                          style={{ width: `${(stats.inactive / stats.total) * 100}%` }}
                          title={`غير نشط: ${stats.inactive}`}
                        />
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span>نشط ({stats.active})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span>غير نشط ({stats.inactive})</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location Tracker */}
              {showLocationTracker && (
                <Card className="p-6">
                  <EmployeeLocationTracker />
                </Card>
              )}

              {/* Quick Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    الكل ({stats.total})
                  </TabsTrigger>
                  <TabsTrigger value="active" className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    نشط ({stats.active})
                  </TabsTrigger>
                  <TabsTrigger value="inactive" className="flex items-center gap-2">
                    <UserX className="h-4 w-4" />
                    غير نشط ({stats.inactive})
                  </TabsTrigger>
                  <TabsTrigger value="admins" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    المدراء ({stats.admins})
                  </TabsTrigger>
                  <TabsTrigger value="technicians" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    الفنيين ({stats.technicians})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث بالاسم، الكود، الهاتف، اسم المستخدم..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10"
                      />
                    </div>

                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-full md:w-40">
                        <SelectValue placeholder="الصلاحية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الصلاحيات</SelectItem>
                        <SelectItem value="admin">مدير</SelectItem>
                        <SelectItem value="accountant">محاسب</SelectItem>
                        <SelectItem value="technician">فني</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full md:w-36">
                        <SelectValue placeholder="الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الحالات</SelectItem>
                        <SelectItem value="active">نشط</SelectItem>
                        <SelectItem value="inactive">غير نشط</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full md:w-40">
                        <SelectValue placeholder="الترتيب" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name_asc">الاسم (أ-ي)</SelectItem>
                        <SelectItem value="name_desc">الاسم (ي-أ)</SelectItem>
                        <SelectItem value="date_desc">الأحدث أولاً</SelectItem>
                        <SelectItem value="date_asc">الأقدم أولاً</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex border rounded-lg overflow-hidden">
                      <Button
                        variant={viewMode === "table" ? "default" : "ghost"}
                        size="icon"
                        onClick={() => setViewMode("table")}
                        className="rounded-none"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="icon"
                        onClick={() => setViewMode("grid")}
                        className="rounded-none"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Loading State */}
              {loading ? (
                <Card>
                  <CardContent className="flex justify-center items-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </CardContent>
                </Card>
              ) : viewMode === "table" ? (
                /* Table View */
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">الموظف</TableHead>
                          <TableHead className="text-right">رقم الموظف</TableHead>
                          <TableHead className="text-right">الهاتف</TableHead>
                          <TableHead className="text-right">المنصب</TableHead>
                          <TableHead className="text-right">الصلاحية</TableHead>
                          <TableHead className="text-right">الحالة</TableHead>
                          <TableHead className="text-right">تاريخ الإضافة</TableHead>
                          <TableHead className="text-center w-16">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEmployees.map((employee) => (
                          <TableRow key={employee.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className={`h-10 w-10 ${getRoleColor(employee.user_roles?.role)}`}>
                                  <AvatarFallback className="text-xs font-bold">
                                    {getInitials(employee.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{employee.full_name}</p>
                                  {employee.profiles?.username && (
                                    <p className="text-xs text-muted-foreground">@{employee.profiles.username}</p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">
                                {employee.employee_code}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <a href={`tel:${employee.phone}`} className="flex items-center gap-1 text-sm hover:text-primary">
                                <Phone className="h-3 w-3" />
                                {employee.phone}
                              </a>
                            </TableCell>
                            <TableCell>{employee.position || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={getRoleBadgeVariant(employee.user_roles?.role)}>
                                {getRoleLabel(employee.user_roles?.role)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {employee.active ? (
                                <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                                  <CheckCircle className="h-3 w-3 ml-1" />
                                  نشط
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="bg-red-500/10 text-red-600 hover:bg-red-500/20">
                                  <XCircle className="h-3 w-3 ml-1" />
                                  غير نشط
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(employee.created_at), 'dd MMM yyyy', { locale: ar })}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => toggleEmployeeStatus(employee.id, employee.active)}
                                  >
                                    {employee.active ? (
                                      <>
                                        <Ban className="h-4 w-4 ml-2 text-red-500" />
                                        تعطيل
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
                                        تفعيل
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => {
                                      setEmployeeToDelete({ id: employee.id, name: employee.full_name });
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 ml-2" />
                                    حذف
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {filteredEmployees.length === 0 && (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">لا يوجد موظفين مطابقين للبحث</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setAddEmployeeOpen(true)}
                        >
                          <UserPlus className="h-4 w-4 ml-2" />
                          إضافة موظف جديد
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredEmployees.map((employee) => (
                    <Card key={employee.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                      <div className={`h-2 ${employee.active ? 'bg-green-500' : 'bg-red-500'}`} />
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar className={`h-12 w-12 ${getRoleColor(employee.user_roles?.role)}`}>
                              <AvatarFallback className="text-sm font-bold">
                                {getInitials(employee.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">{employee.full_name}</h3>
                              <Badge variant="outline" className="text-xs font-mono mt-1">
                                {employee.employee_code}
                              </Badge>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toggleEmployeeStatus(employee.id, employee.active)}>
                                {employee.active ? "تعطيل" : "تفعيل"}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
                                  setEmployeeToDelete({ id: employee.id, name: employee.full_name });
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <a href={`tel:${employee.phone}`} className="hover:text-primary">
                              {employee.phone}
                            </a>
                          </div>
                          {employee.position && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Briefcase className="h-4 w-4" />
                              <span>{employee.position}</span>
                            </div>
                          )}
                          {employee.profiles?.username && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <UserCog className="h-4 w-4" />
                              <span>@{employee.profiles.username}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(employee.created_at), 'dd MMM yyyy', { locale: ar })}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <Badge variant={getRoleBadgeVariant(employee.user_roles?.role)}>
                            {getRoleLabel(employee.user_roles?.role)}
                          </Badge>
                          {employee.active ? (
                            <Badge className="bg-green-500/10 text-green-600">
                              <CheckCircle className="h-3 w-3 ml-1" />
                              نشط
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/10 text-red-600">
                              <XCircle className="h-3 w-3 ml-1" />
                              غير نشط
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredEmployees.length === 0 && (
                    <Card className="col-span-full">
                      <CardContent className="text-center py-12">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">لا يوجد موظفين مطابقين للبحث</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setAddEmployeeOpen(true)}
                        >
                          <UserPlus className="h-4 w-4 ml-2" />
                          إضافة موظف جديد
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Results Summary */}
              {!loading && filteredEmployees.length > 0 && (
                <div className="text-center text-sm text-muted-foreground">
                  عرض {filteredEmployees.length} من {employees.length} موظف
                </div>
              )}
            </div>
          </main>
        </div>

        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
        <AddEmployeeModal 
          open={addEmployeeOpen} 
          onOpenChange={setAddEmployeeOpen} 
          onSuccess={loadEmployees}
        />
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDelete}
          title="حذف موظف"
          description="هل أنت متأكد من حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء."
          itemName={employeeToDelete?.name}
        />
      </div>
    </SidebarProvider>
  );
};

export default Employees;
