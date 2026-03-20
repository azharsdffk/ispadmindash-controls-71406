import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Wrench, UserCog, Building2, MapPin, Briefcase, Hash, Key } from 'lucide-react';

const signupRoles = [
  { key: 'client', label: 'العميل', icon: Users, gradient: 'from-blue-500 to-blue-600' },
  { key: 'technician', label: 'الفني', icon: Wrench, gradient: 'from-green-500 to-green-600' },
  { key: 'agent', label: 'الوكيل', icon: UserCog, gradient: 'from-purple-500 to-purple-600' },
  { key: 'admin', label: 'المدير', icon: Building2, gradient: 'from-primary to-amber-600' },
];

const technicianSpecialties = [
  { value: 'networks', label: 'شبكات' },
  { value: 'maintenance', label: 'صيانة' },
  { value: 'installation', label: 'تركيب' },
  { value: 'support', label: 'دعم فني' },
];

const availableRegions = [
  'الملحانية', 'الموصل', 'بغداد', 'البصرة', 'أربيل', 'النجف', 'كربلاء',
];

export interface RoleSpecificData {
  agentRegion: string;
  technicianSpecialty: string;
  technicianRegion: string;
  clientAddress: string;
  subscriptionNumber: string;
  adminSecretCode: string;
}

interface SignupRoleFieldsProps {
  selectedRole: string | null;
  onRoleSelect: (role: string) => void;
  roleData: RoleSpecificData;
  onRoleDataChange: (data: RoleSpecificData) => void;
}

export const SignupRoleFields = ({ selectedRole, onRoleSelect, roleData, onRoleDataChange }: SignupRoleFieldsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label className="text-foreground text-sm font-medium">اختر نوع الحساب</Label>
        <div className="grid grid-cols-2 gap-3">
          {signupRoles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.key;
            return (
              <button
                key={role.key}
                type="button"
                onClick={() => onRoleSelect(role.key)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 active:scale-[0.97] ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-border/50 bg-background/50 hover:border-primary/50 hover:bg-primary/5'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${role.gradient} flex items-center justify-center mb-2 shadow-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={`font-semibold text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {role.label}
                </span>
              </button>
            );
          })}
        </div>
        {!selectedRole && (
          <p className="text-xs text-muted-foreground text-center mt-1">يرجى اختيار نوع الحساب للمتابعة</p>
        )}
      </div>

      {selectedRole === 'admin' && (
        <div className="space-y-2 p-3 bg-destructive/10 border border-destructive/30 rounded-xl">
          <Label className="text-foreground text-sm font-medium flex items-center gap-2">
            <Key className="h-4 w-4 text-destructive" />
            الرمز السري للمدير
          </Label>
          <Input
            type="password"
            required
            value={roleData.adminSecretCode}
            onChange={(e) => onRoleDataChange({ ...roleData, adminSecretCode: e.target.value })}
            placeholder="أدخل الرمز السري"
            className="h-12 bg-background/50 border-border/50 rounded-xl focus:border-destructive focus:ring-destructive/20"
          />
          <p className="text-xs text-muted-foreground">يجب الحصول على الرمز من مدير النظام</p>
        </div>
      )}

      {selectedRole === 'agent' && (
        <div className="space-y-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl">
          <Label className="text-foreground text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-purple-500" />
            المنطقة
          </Label>
          <Select value={roleData.agentRegion} onValueChange={(v) => onRoleDataChange({ ...roleData, agentRegion: v })}>
            <SelectTrigger className="h-12 bg-background/50 border-border/50 rounded-xl">
              <SelectValue placeholder="اختر منطقتك" />
            </SelectTrigger>
            <SelectContent>
              {availableRegions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedRole === 'technician' && (
        <div className="space-y-3 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
          <div className="space-y-2">
            <Label className="text-foreground text-sm font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-green-500" />
              التخصص
            </Label>
            <Select value={roleData.technicianSpecialty} onValueChange={(v) => onRoleDataChange({ ...roleData, technicianSpecialty: v })}>
              <SelectTrigger className="h-12 bg-background/50 border-border/50 rounded-xl">
                <SelectValue placeholder="اختر تخصصك" />
              </SelectTrigger>
              <SelectContent>
                {technicianSpecialties.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-500" />
              منطقة العمل
            </Label>
            <Select value={roleData.technicianRegion} onValueChange={(v) => onRoleDataChange({ ...roleData, technicianRegion: v })}>
              <SelectTrigger className="h-12 bg-background/50 border-border/50 rounded-xl">
                <SelectValue placeholder="اختر منطقة عملك" />
              </SelectTrigger>
              <SelectContent>
                {availableRegions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {selectedRole === 'client' && (
        <div className="space-y-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <div className="space-y-2">
            <Label className="text-foreground text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              العنوان
            </Label>
            <Input
              type="text"
              required
              value={roleData.clientAddress}
              onChange={(e) => onRoleDataChange({ ...roleData, clientAddress: e.target.value })}
              placeholder="أدخل عنوانك الكامل"
              className="h-12 bg-background/50 border-border/50 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground text-sm font-medium flex items-center gap-2">
              <Hash className="h-4 w-4 text-blue-500" />
              رقم الاشتراك (اختياري)
            </Label>
            <Input
              type="text"
              value={roleData.subscriptionNumber}
              onChange={(e) => onRoleDataChange({ ...roleData, subscriptionNumber: e.target.value })}
              placeholder="أدخل رقم اشتراكك إن وجد"
              className="h-12 bg-background/50 border-border/50 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>
        </div>
      )}
    </>
  );
};
