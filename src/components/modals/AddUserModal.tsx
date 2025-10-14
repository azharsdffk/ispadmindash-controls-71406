import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: () => void;
}

const ROLES = [
  { value: 'admin', label: 'مدير النظام', description: 'صلاحيات كاملة' },
  { value: 'accountant', label: 'محاسب', description: 'إدارة الفواتير والمدفوعات' },
  { value: 'technician', label: 'فني', description: 'إدارة التذاكر والصيانة' },
  { value: 'client', label: 'عميل', description: 'عرض البيانات الخاصة فقط' },
];

export const AddUserModal = ({ open, onOpenChange, onUserCreated }: AddUserModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    roles: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.fullName || formData.roles.length === 0) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'الرجاء ملء جميع الحقول المطلوبة وتحديد دور واحد على الأقل'
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          phone: formData.phone || undefined,
          roles: formData.roles
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({
        title: 'تم بنجاح',
        description: 'تم إنشاء المستخدم بنجاح'
      });

      setFormData({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        roles: []
      });

      onUserCreated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message || 'فشل إنشاء المستخدم'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إضافة مستخدم جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">الاسم الكامل *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="أدخل الاسم الكامل"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="example@domain.com"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="8 أحرف على الأقل"
              required
              disabled={loading}
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="07XXXXXXXXX"
              disabled={loading}
            />
          </div>

          <div className="space-y-3">
            <Label>الأدوار والصلاحيات *</Label>
            <div className="space-y-2 border rounded-lg p-3">
              {ROLES.map((role) => (
                <div key={role.value} className="flex items-start space-x-3 space-x-reverse">
                  <Checkbox
                    id={role.value}
                    checked={formData.roles.includes(role.value)}
                    onCheckedChange={() => toggleRole(role.value)}
                    disabled={loading}
                  />
                  <div className="flex-1 space-y-0.5">
                    <Label
                      htmlFor={role.value}
                      className="cursor-pointer font-medium"
                    >
                      {role.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {role.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {formData.roles.length === 0 && (
              <p className="text-sm text-destructive">يجب تحديد دور واحد على الأقل</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                'إنشاء المستخدم'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
