import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { Eye, EyeOff, UserPlus, Shield, Phone, Mail, User, Briefcase, Hash } from "lucide-react";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";

interface AddEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const employeeSchema = z.object({
  fullName: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
  phone: z.string().regex(/^(\+964|0)?7[3-9]\d{8}$/, "رقم الهاتف غير صحيح"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل").optional().or(z.literal("")),
  password: z.string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .regex(/[A-Z]/, "كلمة المرور يجب أن تحتوي على حرف كبير")
    .regex(/[0-9]/, "كلمة المرور يجب أن تحتوي على رقم")
    .regex(/[^A-Za-z0-9]/, "كلمة المرور يجب أن تحتوي على رمز خاص"),
  employeeCode: z.string().optional(),
  position: z.string().optional(),
  role: z.enum(["admin", "accountant", "technician"]),
});

export const AddEmployeeModal = ({ open, onOpenChange, onSuccess }: AddEmployeeModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    username: "",
    employeeCode: "",
    position: "",
    role: "technician" as "admin" | "accountant" | "technician",
  });

  const resetForm = () => {
    setFormData({
      fullName: "",
      phone: "",
      email: "",
      password: "",
      username: "",
      employeeCode: "",
      position: "",
      role: "technician",
    });
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    try {
      employeeSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "خطأ في البيانات",
          description: error.issues[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      // Use edge function to create user (doesn't affect current session)
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          phone: formData.phone,
          roles: [formData.role],
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.user?.id) throw new Error("فشل إنشاء المستخدم");

      const userId = data.user.id;

      // Update profile with username if provided
      if (formData.username) {
        await supabase
          .from("profiles")
          .update({ username: formData.username })
          .eq("id", userId);
      }

      // Create employee record
      const { error: employeeError } = await supabase
        .from("employees")
        .insert({
          user_id: userId,
          employee_code: formData.employeeCode || `EMP-${Date.now()}`,
          phone: formData.phone,
          full_name: formData.fullName,
          position: formData.position || getRoleLabel(formData.role),
        });

      if (employeeError) throw employeeError;

      // If technician, also add to technicians table
      if (formData.role === 'technician') {
        await supabase
          .from("technicians")
          .insert({
            id: userId,
            name: formData.fullName,
            phone: formData.phone,
            specialization: formData.position || 'فني صيانة عام',
            available: true,
          });
      }

      toast({
        title: "تم بنجاح ✓",
        description: `تم إضافة ${formData.fullName} كـ ${getRoleLabel(formData.role)}`,
      });

      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating employee:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إضافة الموظف",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'مدير';
      case 'accountant': return 'محاسب';
      case 'technician': return 'فني';
      default: return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return '👑';
      case 'accountant': return '📊';
      case 'technician': return '🔧';
      default: return '👤';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="h-6 w-6 text-primary" />
            إضافة موظف جديد
          </DialogTitle>
          <DialogDescription>
            أدخل بيانات الموظف الجديد. سيتم إنشاء حساب له تلقائياً.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Personal Info Section */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              المعلومات الشخصية
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="fullName">الاسم الكامل *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="أدخل الاسم الكامل"
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  رقم الهاتف *
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="07xxxxxxxx"
                  className="bg-background"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeCode" className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  رقم الموظف
                </Label>
                <Input
                  id="employeeCode"
                  value={formData.employeeCode}
                  onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                  placeholder="تلقائي"
                  className="bg-background"
                />
              </div>
            </div>
          </div>

          {/* Account Info Section */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              معلومات الحساب
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@email.com"
                  className="bg-background"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم (اختياري)</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="اسم مستخدم فريد"
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="أدخل كلمة مرور قوية"
                    className="bg-background pl-10"
                    dir="ltr"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {formData.password && <PasswordStrengthIndicator password={formData.password} />}
              </div>
            </div>
          </div>

          {/* Role Section */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />
              الصلاحيات والمنصب
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">الصلاحية *</Label>
                <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="اختر الصلاحية" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[9999]">
                    <SelectItem value="admin">
                      <span className="flex items-center gap-2">👑 مدير</span>
                    </SelectItem>
                    <SelectItem value="accountant">
                      <span className="flex items-center gap-2">📊 محاسب</span>
                    </SelectItem>
                    <SelectItem value="technician">
                      <span className="flex items-center gap-2">🔧 فني</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position" className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  المنصب
                </Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="مثل: فني صيانة"
                  className="bg-background"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          {formData.fullName && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-center">
                سيتم إضافة <strong>{formData.fullName}</strong> كـ <strong>{getRoleIcon(formData.role)} {getRoleLabel(formData.role)}</strong>
              </p>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  جاري الإضافة...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  إضافة موظف
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
