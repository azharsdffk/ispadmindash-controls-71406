import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Receipt, Package, TrendingUp, Download, Upload, Calculator } from 'lucide-react';

interface QuickAction {
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: () => void;
  variant: 'primary' | 'success' | 'warning' | 'info';
}

const variantStyles = {
  primary: 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/30',
  success: 'bg-success/10 hover:bg-success/20 text-success border-success/30',
  warning: 'bg-warning/10 hover:bg-warning/20 text-warning border-warning/30',
  info: 'bg-info/10 hover:bg-info/20 text-info border-info/30',
};

export const QuickActionsPanel = () => {
  const quickActions: QuickAction[] = [
    {
      icon: FileText,
      label: 'إصدار فاتورة',
      description: 'إنشاء فاتورة جديدة',
      onClick: () => console.log('إصدار فاتورة'),
      variant: 'primary',
    },
    {
      icon: Receipt,
      label: 'إضافة سند',
      description: 'سند قبض أو صرف',
      onClick: () => console.log('إضافة سند'),
      variant: 'success',
    },
    {
      icon: Package,
      label: 'إدارة المخزون',
      description: 'تحديث المخزون',
      onClick: () => console.log('إدارة المخزون'),
      variant: 'warning',
    },
    {
      icon: Calculator,
      label: 'قيد محاسبي',
      description: 'إضافة قيد يدوي',
      onClick: () => console.log('قيد محاسبي'),
      variant: 'info',
    },
    {
      icon: Download,
      label: 'تصدير التقارير',
      description: 'تنزيل التقارير المالية',
      onClick: () => console.log('تصدير'),
      variant: 'primary',
    },
    {
      icon: TrendingUp,
      label: 'تحليل الأداء',
      description: 'مؤشرات الأداء المالي',
      onClick: () => console.log('تحليل'),
      variant: 'success',
    },
  ];

  return (
    <Card className="border-2 animate-fade-in">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          الإجراءات السريعة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className={`h-auto flex-col gap-2 py-4 transition-all duration-300 border-2 ${variantStyles[action.variant]}`}
              onClick={action.onClick}
            >
              <action.icon className="h-6 w-6" />
              <div className="text-center">
                <div className="font-semibold text-xs">{action.label}</div>
                <div className="text-[10px] opacity-70 mt-1">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
