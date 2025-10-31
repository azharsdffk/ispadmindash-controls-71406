import { 
  Calculator,
  FileText,
  Wallet2,
  Receipt,
  TrendingUp,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  BookOpen,
  Settings,
  Shield,
  Users,
  Package
} from 'lucide-react';

export const accountantMenuItems = [
  {
    id: 'entries',
    title: 'القيود المحاسبية',
    icon: FileText,
    path: '/accountant#entries',
    description: 'إدارة القيود اليومية',
    permission: 'add_transaction'
  },
  {
    id: 'ledger',
    title: 'دفتر الأستاذ',
    icon: BookOpen,
    path: '/accountant#ledger',
    description: 'عرض الحسابات التفصيلية',
    permission: 'view_balance'
  },
  {
    id: 'balance',
    title: 'الميزانية العمومية',
    icon: BarChart3,
    path: '/accountant#balance',
    description: 'قائمة المركز المالي',
    permission: 'view_balance'
  },
  {
    id: 'income',
    title: 'قائمة الدخل',
    icon: TrendingUp,
    path: '/accountant#income',
    description: 'الأرباح والخسائر',
    permission: 'view_reports'
  },
  {
    id: 'cashflow',
    title: 'التدفقات النقدية',
    icon: Wallet2,
    path: '/accountant#cashflow',
    description: 'حركة النقدية',
    permission: 'view_reports'
  },
  {
    id: 'invoices',
    title: 'الفواتير',
    icon: Receipt,
    path: '/invoices',
    description: 'إدارة الفواتير',
    permission: 'view_invoices'
  },
  {
    id: 'vouchers',
    title: 'السندات',
    icon: FileSpreadsheet,
    path: '/vouchers',
    description: 'سندات القبض والصرف',
    permission: 'view_vouchers'
  },
  {
    id: 'reports',
    title: 'التقارير المتقدمة',
    icon: PieChart,
    path: '/accountant#reports',
    description: 'تقارير تفصيلية',
    permission: 'export_reports'
  },
  {
    id: 'inventory',
    title: 'المخزون',
    icon: Package,
    path: '/inventory',
    description: 'إدارة المخزون',
    permission: 'view_inventory'
  },
  {
    id: 'subscribers',
    title: 'المشتركون',
    icon: Users,
    path: '/subscribers',
    description: 'إدارة المشتركين',
    permission: 'view_subscribers'
  },
  {
    id: 'permissions',
    title: 'الصلاحيات',
    icon: Shield,
    path: '/accountant/permissions',
    description: 'إدارة الصلاحيات',
    permission: 'manage_accounts'
  },
  {
    id: 'settings',
    title: 'الإعدادات',
    icon: Settings,
    path: '/settings',
    description: 'إعدادات النظام',
    permission: null
  },
];
