import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Phone, Mail, Briefcase, Calendar, Hash, User, MapPin, 
  CheckCircle, XCircle, Shield, Clock, Building2, UserCog
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Employee {
  id: string;
  user_id: string;
  employee_code: string;
  full_name: string;
  phone: string;
  position: string | null;
  active: boolean;
  created_at: string;
  source: 'employees' | 'technicians';
  profiles?: {
    full_name: string;
    phone: string | null;
    username: string | null;
  };
  user_roles?: {
    role: string;
  };
}

interface EmployeeDetailsModalProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EmployeeDetailsModal = ({ employee, open, onOpenChange }: EmployeeDetailsModalProps) => {
  if (!employee) return null;

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin': return 'مدير النظام';
      case 'accountant': return 'محاسب';
      case 'technician': return 'فني صيانة';
      default: return 'موظف';
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

  const getRoleBadgeVariant = (role?: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (role) {
      case 'admin': return 'default';
      case 'accountant': return 'secondary';
      case 'technician': return 'outline';
      default: return 'outline';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2);
  };

  const getSourceLabel = (source: string) => {
    return source === 'technicians' ? 'فني (من جدول الفنيين)' : 'موظف';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl">تفاصيل الموظف</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-l from-primary/5 to-transparent rounded-xl">
            <Avatar className={`h-20 w-20 ${getRoleColor(employee.user_roles?.role)}`}>
              <AvatarFallback className="text-2xl font-bold">
                {getInitials(employee.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{employee.full_name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant={getRoleBadgeVariant(employee.user_roles?.role)}>
                  <Shield className="h-3 w-3 ml-1" />
                  {getRoleLabel(employee.user_roles?.role)}
                </Badge>
                {employee.active ? (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    <CheckCircle className="h-3 w-3 ml-1" />
                    نشط
                  </Badge>
                ) : (
                  <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
                    <XCircle className="h-3 w-3 ml-1" />
                    غير نشط
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Employee Code */}
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Hash className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">رقم الموظف</p>
                  <p className="font-mono font-semibold">{employee.employee_code}</p>
                </div>
              </CardContent>
            </Card>

            {/* Phone */}
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Phone className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">رقم الهاتف</p>
                  <a href={`tel:${employee.phone}`} className="font-semibold hover:text-primary transition-colors">
                    {employee.phone}
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Position */}
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">المنصب</p>
                  <p className="font-semibold">{employee.position || 'غير محدد'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Username */}
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <UserCog className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">اسم المستخدم</p>
                  <p className="font-semibold">
                    {employee.profiles?.username ? `@${employee.profiles.username}` : 'غير محدد'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Created Date */}
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">تاريخ الإضافة</p>
                  <p className="font-semibold">
                    {format(new Date(employee.created_at), 'dd MMMM yyyy', { locale: ar })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Source */}
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <Building2 className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">المصدر</p>
                  <p className="font-semibold">{getSourceLabel(employee.source)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User ID Section */}
          {employee.user_id && (
            <>
              <Separator />
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">معرف المستخدم (User ID)</p>
                <p className="font-mono text-sm break-all">{employee.user_id}</p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إغلاق
            </Button>
            <Button asChild>
              <a href={`tel:${employee.phone}`}>
                <Phone className="h-4 w-4 ml-2" />
                اتصال
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
