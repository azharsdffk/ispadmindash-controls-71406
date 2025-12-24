import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';
import {
  Book, TrendingUp, TrendingDown, Search, Filter, Calendar, Download, Upload, Printer,
  FileText, BarChart3, PieChart, ArrowUpDown, Eye, Edit, Trash2, Copy, Plus,
  RefreshCw, Settings, ChevronDown, ChevronUp, Building2, Wallet, CreditCard,
  DollarSign, Receipt, Users, Package, Truck, Home, Lightbulb, Wrench,
  AlertCircle, CheckCircle, Clock, MoreHorizontal, FileSpreadsheet, History,
  Scale, ArrowLeftRight, Banknote, Layers, FolderTree, Target, TrendingDown as TrendDown
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from '@/components/ui/checkbox';

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  reference: string;
  referenceType: 'invoice' | 'voucher' | 'journal' | 'payment' | 'receipt' | 'opening' | 'closing' | 'adjustment';
  debit: number;
  credit: number;
  balance: number;
  currency: 'IQD' | 'USD';
  exchangeRate?: number;
  costCenter?: string;
  project?: string;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  approvedBy?: string;
  status: 'posted' | 'pending' | 'reversed' | 'adjusted';
  counterAccount?: string;
  tags?: string[];
}

interface Account {
  id: string;
  name: string;
  nameEn?: string;
  code: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subType?: string;
  parentCode?: string;
  level: number;
  isActive: boolean;
  currency: 'IQD' | 'USD';
  openingBalance: number;
  currentBalance: number;
  budgetAmount?: number;
  entries: LedgerEntry[];
  description?: string;
  createdAt: string;
  lastActivityAt?: string;
}

interface AccountGroup {
  name: string;
  nameEn: string;
  icon: React.ReactNode;
  accounts: string[];
}

// بيانات الحسابات الشاملة
const generateAccounts = (): Record<string, Account> => ({
  // الأصول المتداولة
  cash: {
    id: 'cash',
    name: 'النقدية في الصندوق',
    nameEn: 'Cash on Hand',
    code: '1101',
    type: 'asset',
    subType: 'current',
    level: 2,
    isActive: true,
    currency: 'IQD',
    openingBalance: 10000000,
    currentBalance: 13000000,
    budgetAmount: 20000000,
    description: 'حساب النقدية المتوفرة في الصندوق',
    createdAt: '2024-01-01',
    lastActivityAt: '2024-01-20',
    entries: [
      {
        id: 'e1',
        date: '2024-01-01',
        description: 'الرصيد الافتتاحي للعام المالي 2024',
        reference: 'OPN-2024-001',
        referenceType: 'opening',
        debit: 10000000,
        credit: 0,
        balance: 10000000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'رأس المال',
        createdBy: 'مدير النظام',
        createdAt: '2024-01-01',
        approvedBy: 'المدير المالي'
      },
      {
        id: 'e2',
        date: '2024-01-10',
        description: 'استلام دفعة من عميل - شركة الاتصالات',
        reference: 'RCP-2024-001',
        referenceType: 'receipt',
        debit: 7500000,
        credit: 0,
        balance: 17500000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'حسابات المدينين',
        costCenter: 'المبيعات',
        createdBy: 'محاسب المقبوضات',
        createdAt: '2024-01-10',
        approvedBy: 'المدير المالي',
        notes: 'دفعة جزئية من فاتورة رقم INV-001',
        tags: ['مقبوضات', 'عملاء']
      },
      {
        id: 'e3',
        date: '2024-01-12',
        description: 'صرف رواتب الموظفين - يناير',
        reference: 'VCH-2024-001',
        referenceType: 'voucher',
        debit: 0,
        credit: 3000000,
        balance: 14500000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'مصروفات الرواتب',
        costCenter: 'الموارد البشرية',
        createdBy: 'محاسب الرواتب',
        createdAt: '2024-01-12',
        approvedBy: 'مدير الموارد البشرية',
        tags: ['رواتب', 'مصروفات']
      },
      {
        id: 'e4',
        date: '2024-01-15',
        description: 'شراء مستلزمات مكتبية',
        reference: 'VCH-2024-002',
        referenceType: 'voucher',
        debit: 0,
        credit: 500000,
        balance: 14000000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'مصروفات إدارية',
        costCenter: 'الإدارة',
        createdBy: 'محاسب المشتريات',
        createdAt: '2024-01-15',
        tags: ['مشتريات', 'مصروفات']
      },
      {
        id: 'e5',
        date: '2024-01-18',
        description: 'استلام إيرادات خدمات نقداً',
        reference: 'RCP-2024-002',
        referenceType: 'receipt',
        debit: 2500000,
        credit: 0,
        balance: 16500000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'إيرادات الخدمات',
        costCenter: 'المبيعات',
        createdBy: 'محاسب المقبوضات',
        createdAt: '2024-01-18',
        tags: ['إيرادات', 'نقدي']
      },
      {
        id: 'e6',
        date: '2024-01-20',
        description: 'دفع إيجار المكتب',
        reference: 'VCH-2024-003',
        referenceType: 'voucher',
        debit: 0,
        credit: 1500000,
        balance: 15000000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'مصروفات الإيجار',
        costCenter: 'الإدارة',
        createdBy: 'محاسب المدفوعات',
        createdAt: '2024-01-20',
        tags: ['إيجار', 'مصروفات']
      },
      {
        id: 'e7',
        date: '2024-01-22',
        description: 'تحويل إلى الحساب البنكي',
        reference: 'JV-2024-001',
        referenceType: 'journal',
        debit: 0,
        credit: 5000000,
        balance: 10000000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'البنك - الحساب الجاري',
        createdBy: 'المحاسب الرئيسي',
        createdAt: '2024-01-22',
        notes: 'تحويل لتغطية الشيكات المستحقة',
        tags: ['تحويل', 'بنك']
      },
      {
        id: 'e8',
        date: '2024-01-25',
        description: 'استلام سلفة مردودة من موظف',
        reference: 'RCP-2024-003',
        referenceType: 'receipt',
        debit: 1000000,
        credit: 0,
        balance: 11000000,
        currency: 'IQD',
        status: 'pending',
        counterAccount: 'سلف الموظفين',
        createdBy: 'محاسب المقبوضات',
        createdAt: '2024-01-25',
        tags: ['سلف', 'موظفين']
      }
    ]
  },
  bank: {
    id: 'bank',
    name: 'البنك - الحساب الجاري',
    nameEn: 'Bank - Current Account',
    code: '1102',
    type: 'asset',
    subType: 'current',
    level: 2,
    isActive: true,
    currency: 'IQD',
    openingBalance: 50000000,
    currentBalance: 75000000,
    budgetAmount: 100000000,
    description: 'الحساب الجاري في البنك التجاري',
    createdAt: '2024-01-01',
    lastActivityAt: '2024-01-22',
    entries: [
      {
        id: 'b1',
        date: '2024-01-01',
        description: 'الرصيد الافتتاحي',
        reference: 'OPN-2024-002',
        referenceType: 'opening',
        debit: 50000000,
        credit: 0,
        balance: 50000000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'رأس المال',
        createdBy: 'مدير النظام',
        createdAt: '2024-01-01'
      },
      {
        id: 'b2',
        date: '2024-01-05',
        description: 'تحويل من عميل - مؤسسة النور',
        reference: 'RCP-2024-004',
        referenceType: 'receipt',
        debit: 15000000,
        credit: 0,
        balance: 65000000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'حسابات المدينين',
        createdBy: 'محاسب البنك',
        createdAt: '2024-01-05',
        tags: ['تحويل', 'عملاء']
      },
      {
        id: 'b3',
        date: '2024-01-22',
        description: 'إيداع من الصندوق',
        reference: 'JV-2024-001',
        referenceType: 'journal',
        debit: 5000000,
        credit: 0,
        balance: 70000000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'النقدية في الصندوق',
        createdBy: 'المحاسب الرئيسي',
        createdAt: '2024-01-22'
      },
      {
        id: 'b4',
        date: '2024-01-25',
        description: 'عمولات بنكية',
        reference: 'JV-2024-002',
        referenceType: 'journal',
        debit: 0,
        credit: 50000,
        balance: 69950000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'مصروفات بنكية',
        createdBy: 'النظام',
        createdAt: '2024-01-25',
        tags: ['عمولات', 'بنك']
      }
    ]
  },
  receivables: {
    id: 'receivables',
    name: 'حسابات المدينين',
    nameEn: 'Accounts Receivable',
    code: '1201',
    type: 'asset',
    subType: 'current',
    level: 2,
    isActive: true,
    currency: 'IQD',
    openingBalance: 25000000,
    currentBalance: 35000000,
    description: 'المبالغ المستحقة من العملاء',
    createdAt: '2024-01-01',
    entries: [
      {
        id: 'r1',
        date: '2024-01-01',
        description: 'الرصيد الافتتاحي',
        reference: 'OPN-2024-003',
        referenceType: 'opening',
        debit: 25000000,
        credit: 0,
        balance: 25000000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'رأس المال',
        createdBy: 'مدير النظام',
        createdAt: '2024-01-01'
      },
      {
        id: 'r2',
        date: '2024-01-08',
        description: 'فاتورة مبيعات - شركة الأفق',
        reference: 'INV-2024-001',
        referenceType: 'invoice',
        debit: 12000000,
        credit: 0,
        balance: 37000000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'إيرادات الخدمات',
        costCenter: 'المبيعات',
        project: 'مشروع التوسع',
        createdBy: 'محاسب المبيعات',
        createdAt: '2024-01-08',
        tags: ['فواتير', 'مبيعات']
      },
      {
        id: 'r3',
        date: '2024-01-10',
        description: 'تحصيل من عميل - شركة الاتصالات',
        reference: 'RCP-2024-001',
        referenceType: 'receipt',
        debit: 0,
        credit: 7500000,
        balance: 29500000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'النقدية في الصندوق',
        createdBy: 'محاسب المقبوضات',
        createdAt: '2024-01-10',
        tags: ['تحصيل', 'عملاء']
      }
    ]
  },
  inventory: {
    id: 'inventory',
    name: 'المخزون',
    nameEn: 'Inventory',
    code: '1301',
    type: 'asset',
    subType: 'current',
    level: 2,
    isActive: true,
    currency: 'IQD',
    openingBalance: 15000000,
    currentBalance: 18000000,
    description: 'مخزون البضائع والمواد',
    createdAt: '2024-01-01',
    entries: [
      {
        id: 'i1',
        date: '2024-01-01',
        description: 'الرصيد الافتتاحي للمخزون',
        reference: 'OPN-2024-004',
        referenceType: 'opening',
        debit: 15000000,
        credit: 0,
        balance: 15000000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'رأس المال',
        createdBy: 'مدير النظام',
        createdAt: '2024-01-01'
      },
      {
        id: 'i2',
        date: '2024-01-14',
        description: 'شراء معدات شبكة',
        reference: 'PO-2024-001',
        referenceType: 'voucher',
        debit: 5000000,
        credit: 0,
        balance: 20000000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'حسابات الدائنين',
        costCenter: 'المشتريات',
        createdBy: 'محاسب المشتريات',
        createdAt: '2024-01-14',
        tags: ['مشتريات', 'مخزون']
      },
      {
        id: 'i3',
        date: '2024-01-18',
        description: 'صرف مواد للمشروع',
        reference: 'MR-2024-001',
        referenceType: 'voucher',
        debit: 0,
        credit: 2000000,
        balance: 18000000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'تكلفة البضاعة المباعة',
        project: 'مشروع التوسع',
        createdBy: 'أمين المخزن',
        createdAt: '2024-01-18',
        tags: ['صرف', 'مشاريع']
      }
    ]
  },
  fixedAssets: {
    id: 'fixedAssets',
    name: 'الأصول الثابتة',
    nameEn: 'Fixed Assets',
    code: '1501',
    type: 'asset',
    subType: 'fixed',
    level: 2,
    isActive: true,
    currency: 'IQD',
    openingBalance: 100000000,
    currentBalance: 120000000,
    description: 'المباني والمعدات والآلات',
    createdAt: '2024-01-01',
    entries: [
      {
        id: 'f1',
        date: '2024-01-01',
        description: 'الرصيد الافتتاحي - الأصول الثابتة',
        reference: 'OPN-2024-005',
        referenceType: 'opening',
        debit: 100000000,
        credit: 0,
        balance: 100000000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'رأس المال',
        createdBy: 'مدير النظام',
        createdAt: '2024-01-01'
      },
      {
        id: 'f2',
        date: '2024-01-20',
        description: 'شراء سيارة نقل جديدة',
        reference: 'FA-2024-001',
        referenceType: 'voucher',
        debit: 25000000,
        credit: 0,
        balance: 125000000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'البنك - الحساب الجاري',
        createdBy: 'مدير الأصول',
        createdAt: '2024-01-20',
        notes: 'سيارة تويوتا هايلوكس 2024',
        tags: ['أصول', 'سيارات']
      },
      {
        id: 'f3',
        date: '2024-01-31',
        description: 'استهلاك شهري',
        reference: 'DEP-2024-001',
        referenceType: 'adjustment',
        debit: 0,
        credit: 2000000,
        balance: 123000000,
        currency: 'IQD',
        status: 'pending',
        counterAccount: 'مصروف الاستهلاك',
        createdBy: 'النظام',
        createdAt: '2024-01-31',
        tags: ['استهلاك']
      }
    ]
  },
  // الخصوم
  payables: {
    id: 'payables',
    name: 'حسابات الدائنين',
    nameEn: 'Accounts Payable',
    code: '2101',
    type: 'liability',
    subType: 'current',
    level: 2,
    isActive: true,
    currency: 'IQD',
    openingBalance: 20000000,
    currentBalance: 25000000,
    description: 'المبالغ المستحقة للموردين',
    createdAt: '2024-01-01',
    entries: [
      {
        id: 'p1',
        date: '2024-01-01',
        description: 'الرصيد الافتتاحي',
        reference: 'OPN-2024-006',
        referenceType: 'opening',
        debit: 0,
        credit: 20000000,
        balance: 20000000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'رأس المال',
        createdBy: 'مدير النظام',
        createdAt: '2024-01-01'
      },
      {
        id: 'p2',
        date: '2024-01-14',
        description: 'فاتورة شراء - مورد المعدات',
        reference: 'PO-2024-001',
        referenceType: 'voucher',
        debit: 0,
        credit: 5000000,
        balance: 25000000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'المخزون',
        createdBy: 'محاسب المشتريات',
        createdAt: '2024-01-14',
        tags: ['موردين', 'مشتريات']
      }
    ]
  },
  // الإيرادات
  revenue: {
    id: 'revenue',
    name: 'إيرادات الخدمات',
    nameEn: 'Service Revenue',
    code: '4101',
    type: 'revenue',
    level: 2,
    isActive: true,
    currency: 'IQD',
    openingBalance: 0,
    currentBalance: 45000000,
    budgetAmount: 100000000,
    description: 'إيرادات خدمات الإنترنت والاتصالات',
    createdAt: '2024-01-01',
    entries: [
      {
        id: 'rev1',
        date: '2024-01-08',
        description: 'إيرادات اشتراكات شهرية',
        reference: 'INV-2024-001',
        referenceType: 'invoice',
        debit: 0,
        credit: 12000000,
        balance: 12000000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'حسابات المدينين',
        costCenter: 'المبيعات',
        createdBy: 'محاسب المبيعات',
        createdAt: '2024-01-08',
        tags: ['إيرادات', 'اشتراكات']
      },
      {
        id: 'rev2',
        date: '2024-01-15',
        description: 'إيرادات خدمات التركيب',
        reference: 'INV-2024-002',
        referenceType: 'invoice',
        debit: 0,
        credit: 8000000,
        balance: 20000000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'النقدية في الصندوق',
        costCenter: 'الخدمات الفنية',
        createdBy: 'محاسب المبيعات',
        createdAt: '2024-01-15',
        tags: ['إيرادات', 'تركيب']
      },
      {
        id: 'rev3',
        date: '2024-01-18',
        description: 'إيرادات خدمات نقدية',
        reference: 'RCP-2024-002',
        referenceType: 'receipt',
        debit: 0,
        credit: 2500000,
        balance: 22500000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'النقدية في الصندوق',
        createdBy: 'محاسب المقبوضات',
        createdAt: '2024-01-18',
        tags: ['إيرادات', 'نقدي']
      }
    ]
  },
  // المصروفات
  salaries: {
    id: 'salaries',
    name: 'مصروفات الرواتب',
    nameEn: 'Salaries Expense',
    code: '5101',
    type: 'expense',
    level: 2,
    isActive: true,
    currency: 'IQD',
    openingBalance: 0,
    currentBalance: 8000000,
    budgetAmount: 40000000,
    description: 'رواتب ومكافآت الموظفين',
    createdAt: '2024-01-01',
    entries: [
      {
        id: 'sal1',
        date: '2024-01-12',
        description: 'رواتب الموظفين - يناير',
        reference: 'VCH-2024-001',
        referenceType: 'voucher',
        debit: 3000000,
        credit: 0,
        balance: 3000000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'النقدية في الصندوق',
        costCenter: 'الموارد البشرية',
        createdBy: 'محاسب الرواتب',
        createdAt: '2024-01-12',
        tags: ['رواتب', 'موظفين']
      }
    ]
  },
  rent: {
    id: 'rent',
    name: 'مصروفات الإيجار',
    nameEn: 'Rent Expense',
    code: '5201',
    type: 'expense',
    level: 2,
    isActive: true,
    currency: 'IQD',
    openingBalance: 0,
    currentBalance: 1500000,
    budgetAmount: 18000000,
    description: 'إيجار المكاتب والمخازن',
    createdAt: '2024-01-01',
    entries: [
      {
        id: 'rent1',
        date: '2024-01-20',
        description: 'إيجار المكتب الرئيسي - يناير',
        reference: 'VCH-2024-003',
        referenceType: 'voucher',
        debit: 1500000,
        credit: 0,
        balance: 1500000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'النقدية في الصندوق',
        costCenter: 'الإدارة',
        createdBy: 'محاسب المدفوعات',
        createdAt: '2024-01-20',
        tags: ['إيجار', 'مصروفات']
      }
    ]
  },
  utilities: {
    id: 'utilities',
    name: 'مصروفات المرافق',
    nameEn: 'Utilities Expense',
    code: '5301',
    type: 'expense',
    level: 2,
    isActive: true,
    currency: 'IQD',
    openingBalance: 0,
    currentBalance: 750000,
    budgetAmount: 12000000,
    description: 'كهرباء وماء واتصالات',
    createdAt: '2024-01-01',
    entries: [
      {
        id: 'util1',
        date: '2024-01-25',
        description: 'فاتورة الكهرباء - يناير',
        reference: 'VCH-2024-004',
        referenceType: 'voucher',
        debit: 500000,
        credit: 0,
        balance: 500000,
        currency: 'IQD',
        status: 'posted',
        counterAccount: 'البنك - الحساب الجاري',
        costCenter: 'الإدارة',
        createdBy: 'محاسب المدفوعات',
        createdAt: '2024-01-25',
        tags: ['كهرباء', 'مرافق']
      },
      {
        id: 'util2',
        date: '2024-01-26',
        description: 'فاتورة الإنترنت - يناير',
        reference: 'VCH-2024-005',
        referenceType: 'voucher',
        debit: 250000,
        credit: 0,
        balance: 750000,
        currency: 'IQD',
        status: 'pending',
        counterAccount: 'حسابات الدائنين',
        costCenter: 'الإدارة',
        createdBy: 'محاسب المدفوعات',
        createdAt: '2024-01-26',
        tags: ['إنترنت', 'مرافق']
      }
    ]
  }
});

export const GeneralLedger = () => {
  const [accounts] = useState(generateAccounts);
  const [selectedAccount, setSelectedAccount] = useState('cash');
  const [activeTab, setActiveTab] = useState('entries');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [referenceTypeFilter, setReferenceTypeFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
  const [showEntryDetails, setShowEntryDetails] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<LedgerEntry | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [showImportStatement, setShowImportStatement] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<LedgerEntry[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // مجموعات الحسابات
  const accountGroups: AccountGroup[] = [
    {
      name: 'الأصول المتداولة',
      nameEn: 'Current Assets',
      icon: <Wallet className="h-4 w-4" />,
      accounts: ['cash', 'bank', 'receivables', 'inventory']
    },
    {
      name: 'الأصول الثابتة',
      nameEn: 'Fixed Assets',
      icon: <Building2 className="h-4 w-4" />,
      accounts: ['fixedAssets']
    },
    {
      name: 'الخصوم',
      nameEn: 'Liabilities',
      icon: <CreditCard className="h-4 w-4" />,
      accounts: ['payables']
    },
    {
      name: 'الإيرادات',
      nameEn: 'Revenue',
      icon: <TrendingUp className="h-4 w-4" />,
      accounts: ['revenue']
    },
    {
      name: 'المصروفات',
      nameEn: 'Expenses',
      icon: <TrendDown className="h-4 w-4" />,
      accounts: ['salaries', 'rent', 'utilities']
    }
  ];

  const currentAccount = accounts[selectedAccount];

  // تصفية وترتيب القيود
  const filteredEntries = useMemo(() => {
    let entries = [...currentAccount.entries];

    // البحث
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      entries = entries.filter(e => 
        e.description.toLowerCase().includes(query) ||
        e.reference.toLowerCase().includes(query) ||
        e.counterAccount?.toLowerCase().includes(query) ||
        e.notes?.toLowerCase().includes(query)
      );
    }

    // فلتر التاريخ
    if (dateFrom) {
      entries = entries.filter(e => e.date >= dateFrom);
    }
    if (dateTo) {
      entries = entries.filter(e => e.date <= dateTo);
    }

    // فلتر الحالة
    if (statusFilter !== 'all') {
      entries = entries.filter(e => e.status === statusFilter);
    }

    // فلتر نوع المرجع
    if (referenceTypeFilter !== 'all') {
      entries = entries.filter(e => e.referenceType === referenceTypeFilter);
    }

    // الترتيب
    entries.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return entries;
  }, [currentAccount.entries, searchQuery, dateFrom, dateTo, statusFilter, referenceTypeFilter, sortOrder]);

  // الإحصائيات
  const stats = useMemo(() => {
    const totalDebit = currentAccount.entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = currentAccount.entries.reduce((sum, e) => sum + e.credit, 0);
    const postedEntries = currentAccount.entries.filter(e => e.status === 'posted').length;
    const pendingEntries = currentAccount.entries.filter(e => e.status === 'pending').length;
    const budgetUsage = currentAccount.budgetAmount 
      ? (currentAccount.currentBalance / currentAccount.budgetAmount) * 100 
      : 0;

    return {
      totalDebit,
      totalCredit,
      balance: totalDebit - totalCredit,
      postedEntries,
      pendingEntries,
      totalEntries: currentAccount.entries.length,
      budgetUsage
    };
  }, [currentAccount]);

  // دوال المعالجة
  const handleViewEntry = (entry: LedgerEntry) => {
    setSelectedEntry(entry);
    setShowEntryDetails(true);
  };

  const handleDeleteEntry = (entry: LedgerEntry) => {
    setEntryToDelete(entry);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (entryToDelete) {
      toast.success(`تم حذف القيد ${entryToDelete.reference}`);
      setShowDeleteConfirm(false);
      setEntryToDelete(null);
    }
  };

  const handleExportExcel = () => {
    toast.success('جاري تصدير دفتر الأستاذ إلى Excel...');
  };

  const handleExportPDF = () => {
    toast.success('جاري تصدير دفتر الأستاذ إلى PDF...');
  };

  const handlePrint = () => {
    window.print();
    toast.success('جاري الطباعة...');
  };

  const handleRefresh = () => {
    toast.success('تم تحديث البيانات');
  };

  const handleApproveEntry = (entry: LedgerEntry) => {
    toast.success(`تم ترحيل القيد ${entry.reference}`);
  };

  const handleReverseEntry = (entry: LedgerEntry) => {
    toast.success(`تم عكس القيد ${entry.reference}`);
  };

  const handleCopyEntry = (entry: LedgerEntry) => {
    toast.success(`تم نسخ القيد ${entry.reference}`);
    setShowAddEntry(true);
  };

  // دوال استيراد كشف الحساب
  const handleOpenImportStatement = () => {
    setShowImportStatement(true);
    setImportFile(null);
    setImportPreview([]);
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      // محاكاة معاينة البيانات المستوردة
      const mockPreview: LedgerEntry[] = [
        {
          id: 'imp1',
          date: new Date().toISOString().split('T')[0],
          description: 'قيد مستورد - تحويل بنكي',
          reference: 'IMP-001',
          referenceType: 'journal',
          debit: 5000000,
          credit: 0,
          balance: 0,
          currency: 'IQD',
          status: 'pending',
          counterAccount: 'البنك'
        },
        {
          id: 'imp2',
          date: new Date().toISOString().split('T')[0],
          description: 'قيد مستورد - دفعة عميل',
          reference: 'IMP-002',
          referenceType: 'receipt',
          debit: 3500000,
          credit: 0,
          balance: 0,
          currency: 'IQD',
          status: 'pending',
          counterAccount: 'حسابات المدينين'
        },
        {
          id: 'imp3',
          date: new Date().toISOString().split('T')[0],
          description: 'قيد مستورد - مصروفات',
          reference: 'IMP-003',
          referenceType: 'voucher',
          debit: 0,
          credit: 1500000,
          balance: 0,
          currency: 'IQD',
          status: 'pending',
          counterAccount: 'مصروفات عامة'
        }
      ];
      setImportPreview(mockPreview);
      toast.success(`تم تحميل الملف: ${file.name}`);
    }
  };

  const handleConfirmImport = () => {
    if (importPreview.length === 0) {
      toast.error('لا توجد بيانات للاستيراد');
      return;
    }
    setIsImporting(true);
    // محاكاة عملية الاستيراد
    setTimeout(() => {
      setIsImporting(false);
      toast.success(`تم استيراد ${importPreview.length} قيود بنجاح`);
      setShowImportStatement(false);
      setImportFile(null);
      setImportPreview([]);
    }, 2000);
  };

  const handleReconcileConfirm = () => {
    toast.success('تم تأكيد المطابقة بنجاح');
  };

  const toggleEntrySelection = (entryId: string) => {
    setSelectedEntries(prev => 
      prev.includes(entryId) 
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedEntries.length === filteredEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(filteredEntries.map(e => e.id));
    }
  };

  const handleBulkAction = (action: string) => {
    toast.success(`تم تنفيذ ${action} على ${selectedEntries.length} قيد`);
    setSelectedEntries([]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'posted':
        return <Badge className="bg-green-500/10 text-green-600 border-green-200"><CheckCircle className="h-3 w-3 ml-1" />مرحّل</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200"><Clock className="h-3 w-3 ml-1" />معلق</Badge>;
      case 'reversed':
        return <Badge className="bg-red-500/10 text-red-600 border-red-200"><RefreshCw className="h-3 w-3 ml-1" />معكوس</Badge>;
      case 'adjusted':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200"><Edit className="h-3 w-3 ml-1" />معدّل</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReferenceTypeBadge = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      invoice: { label: 'فاتورة', color: 'bg-blue-500/10 text-blue-600' },
      voucher: { label: 'سند', color: 'bg-purple-500/10 text-purple-600' },
      journal: { label: 'قيد يومية', color: 'bg-indigo-500/10 text-indigo-600' },
      payment: { label: 'دفعة', color: 'bg-red-500/10 text-red-600' },
      receipt: { label: 'إيصال', color: 'bg-green-500/10 text-green-600' },
      opening: { label: 'افتتاحي', color: 'bg-amber-500/10 text-amber-600' },
      closing: { label: 'إقفال', color: 'bg-gray-500/10 text-gray-600' },
      adjustment: { label: 'تسوية', color: 'bg-cyan-500/10 text-cyan-600' }
    };
    const config = types[type] || { label: type, color: 'bg-gray-500/10 text-gray-600' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'asset': return <Wallet className="h-4 w-4 text-green-500" />;
      case 'liability': return <CreditCard className="h-4 w-4 text-red-500" />;
      case 'equity': return <Scale className="h-4 w-4 text-purple-500" />;
      case 'revenue': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'expense': return <TrendDown className="h-4 w-4 text-orange-500" />;
      default: return <Book className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* شريط الأدوات العلوي */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* اختيار الحساب */}
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="اختر الحساب" />
            </SelectTrigger>
            <SelectContent>
              {accountGroups.map(group => (
                <SelectGroup key={group.name}>
                  <SelectLabel className="flex items-center gap-2">
                    {group.icon}
                    {group.name}
                  </SelectLabel>
                  {group.accounts.map(accId => {
                    const acc = accounts[accId];
                    return (
                      <SelectItem key={accId} value={accId}>
                        <div className="flex items-center gap-2">
                          {getAccountTypeIcon(acc.type)}
                          <span>{acc.code} - {acc.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>

          <Badge variant="outline" className="px-3 py-1.5 text-sm">
            {currentAccount.code}
          </Badge>
          
          <Badge 
            className={`px-3 py-1.5 ${
              currentAccount.type === 'asset' ? 'bg-green-500/10 text-green-600' :
              currentAccount.type === 'liability' ? 'bg-red-500/10 text-red-600' :
              currentAccount.type === 'revenue' ? 'bg-blue-500/10 text-blue-600' :
              'bg-orange-500/10 text-orange-600'
            }`}
          >
            {currentAccount.type === 'asset' && 'أصول'}
            {currentAccount.type === 'liability' && 'خصوم'}
            {currentAccount.type === 'equity' && 'حقوق ملكية'}
            {currentAccount.type === 'revenue' && 'إيرادات'}
            {currentAccount.type === 'expense' && 'مصروفات'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAccountSettings(true)}>
            <Settings className="h-4 w-4 ml-2" />
            إعدادات
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 ml-2" />
                تصدير
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="h-4 w-4 ml-2" />
                تصدير Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="h-4 w-4 ml-2" />
                تصدير PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="h-4 w-4 ml-2" />
                طباعة
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={() => setShowAddEntry(true)}>
            <Plus className="h-4 w-4 ml-2" />
            قيد جديد
          </Button>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950 dark:to-green-900/50 border-green-200">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">إجمالي المدين</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(stats.totalDebit, 'IQD')}
                </p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/50 border-blue-200">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">إجمالي الدائن</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(stats.totalCredit, 'IQD')}
                </p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingDown className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950 dark:to-purple-900/50 border-purple-200">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">الرصيد الحالي</p>
                <p className={`text-lg font-bold ${stats.balance >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(stats.balance), 'IQD')}
                </p>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Scale className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950 dark:to-emerald-900/50 border-emerald-200">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">قيود مرحّلة</p>
                <p className="text-lg font-bold text-emerald-600">{stats.postedEntries}</p>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950 dark:to-amber-900/50 border-amber-200">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">قيود معلقة</p>
                <p className="text-lg font-bold text-amber-600">{stats.pendingEntries}</p>
              </div>
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {currentAccount.budgetAmount && (
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950 dark:to-indigo-900/50 border-indigo-200">
            <CardContent className="pt-4 pb-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">استخدام الميزانية</p>
                <div className="flex items-center gap-2">
                  <Progress value={Math.min(stats.budgetUsage, 100)} className="h-2" />
                  <span className="text-xs font-medium">{stats.budgetUsage.toFixed(0)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* التبويبات الرئيسية */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="entries" className="gap-2">
            <FileText className="h-4 w-4" />
            القيود
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            التحليل
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            السجل
          </TabsTrigger>
          <TabsTrigger value="reconciliation" className="gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            المطابقة
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <PieChart className="h-4 w-4" />
            التقارير
          </TabsTrigger>
        </TabsList>

        {/* تبويب القيود */}
        <TabsContent value="entries" className="space-y-4">
          {/* شريط البحث والفلترة */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث في القيود..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 ml-2" />
                  فلترة
                  {showFilters ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                >
                  <ArrowUpDown className="h-4 w-4 ml-2" />
                  {sortOrder === 'desc' ? 'الأحدث أولاً' : 'الأقدم أولاً'}
                </Button>

                {selectedEntries.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="sm">
                        إجراءات ({selectedEntries.length})
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkAction('ترحيل')}>
                        <CheckCircle className="h-4 w-4 ml-2" />
                        ترحيل المحدد
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('تصدير')}>
                        <Download className="h-4 w-4 ml-2" />
                        تصدير المحدد
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleBulkAction('حذف')} className="text-red-600">
                        <Trash2 className="h-4 w-4 ml-2" />
                        حذف المحدد
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* فلاتر متقدمة */}
              {showFilters && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>من تاريخ</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>إلى تاريخ</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الحالة</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        <SelectItem value="posted">مرحّل</SelectItem>
                        <SelectItem value="pending">معلق</SelectItem>
                        <SelectItem value="reversed">معكوس</SelectItem>
                        <SelectItem value="adjusted">معدّل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>نوع المرجع</Label>
                    <Select value={referenceTypeFilter} onValueChange={setReferenceTypeFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        <SelectItem value="invoice">فاتورة</SelectItem>
                        <SelectItem value="voucher">سند</SelectItem>
                        <SelectItem value="journal">قيد يومية</SelectItem>
                        <SelectItem value="receipt">إيصال</SelectItem>
                        <SelectItem value="payment">دفعة</SelectItem>
                        <SelectItem value="opening">افتتاحي</SelectItem>
                        <SelectItem value="adjustment">تسوية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* جدول القيود */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Book className="h-5 w-5" />
                  دفتر الأستاذ - {currentAccount.name}
                </CardTitle>
                <Badge variant="outline">{filteredEntries.length} قيد</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selectedEntries.length === filteredEntries.length && filteredEntries.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-28">التاريخ</TableHead>
                      <TableHead className="min-w-[200px]">البيان</TableHead>
                      <TableHead className="w-32">المرجع</TableHead>
                      <TableHead className="w-24">النوع</TableHead>
                      <TableHead className="w-32 text-center">المدين</TableHead>
                      <TableHead className="w-32 text-center">الدائن</TableHead>
                      <TableHead className="w-32 text-center">الرصيد</TableHead>
                      <TableHead className="w-24">الحالة</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry, index) => (
                      <TableRow 
                        key={entry.id}
                        className={`hover:bg-muted/50 cursor-pointer ${selectedEntries.includes(entry.id) ? 'bg-primary/5' : ''}`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedEntries.includes(entry.id)}
                            onCheckedChange={() => toggleEntrySelection(entry.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {new Date(entry.date).toLocaleDateString('ar-IQ')}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{entry.description}</p>
                            {entry.counterAccount && (
                              <p className="text-xs text-muted-foreground">
                                ← {entry.counterAccount}
                              </p>
                            )}
                            {entry.costCenter && (
                              <Badge variant="outline" className="text-xs">
                                {entry.costCenter}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-mono">{entry.reference}</span>
                        </TableCell>
                        <TableCell>
                          {getReferenceTypeBadge(entry.referenceType)}
                        </TableCell>
                        <TableCell className="text-center">
                          {entry.debit > 0 && (
                            <span className="text-green-600 font-semibold">
                              {formatCurrency(entry.debit, 'IQD')}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {entry.credit > 0 && (
                            <span className="text-blue-600 font-semibold">
                              {formatCurrency(entry.credit, 'IQD')}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {formatCurrency(entry.balance, 'IQD')}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(entry.status)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewEntry(entry)}>
                                <Eye className="h-4 w-4 ml-2" />
                                عرض التفاصيل
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopyEntry(entry)}>
                                <Copy className="h-4 w-4 ml-2" />
                                نسخ
                              </DropdownMenuItem>
                              {entry.status === 'pending' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleApproveEntry(entry)}>
                                    <CheckCircle className="h-4 w-4 ml-2" />
                                    ترحيل
                                  </DropdownMenuItem>
                                </>
                              )}
                              {entry.status === 'posted' && (
                                <DropdownMenuItem onClick={() => handleReverseEntry(entry)}>
                                  <RefreshCw className="h-4 w-4 ml-2" />
                                  عكس القيد
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteEntry(entry)}
                                className="text-red-600"
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
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب التحليل */}
        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  تحليل الحركة الشهرية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>رسم بياني للحركة الشهرية</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  توزيع القيود حسب النوع
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['invoice', 'voucher', 'receipt', 'journal'].map(type => {
                    const count = currentAccount.entries.filter(e => e.referenceType === type).length;
                    const percentage = (count / currentAccount.entries.length) * 100 || 0;
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          {getReferenceTypeBadge(type)}
                          <span className="font-medium">{count} قيد ({percentage.toFixed(0)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  مؤشرات الأداء
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {((stats.postedEntries / stats.totalEntries) * 100).toFixed(0)}%
                    </p>
                    <p className="text-sm text-muted-foreground">نسبة الترحيل</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(stats.totalDebit / stats.totalEntries, 'IQD')}
                    </p>
                    <p className="text-sm text-muted-foreground">متوسط قيمة القيد</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{stats.totalEntries}</p>
                    <p className="text-sm text-muted-foreground">إجمالي القيود</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-amber-600">
                      {currentAccount.lastActivityAt ? new Date(currentAccount.lastActivityAt).toLocaleDateString('ar-IQ') : '-'}
                    </p>
                    <p className="text-sm text-muted-foreground">آخر نشاط</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تبويب السجل */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                سجل تغييرات الحساب
              </CardTitle>
              <CardDescription>
                جميع التعديلات والإجراءات على هذا الحساب
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentAccount.entries.slice(0, 5).map((entry, index) => (
                  <div key={index} className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{entry.description}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.createdAt || entry.date).toLocaleDateString('ar-IQ')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {entry.createdBy || 'النظام'} • {entry.reference}
                      </p>
                      {entry.approvedBy && (
                        <p className="text-xs text-green-600 mt-1">
                          تمت الموافقة بواسطة: {entry.approvedBy}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(entry.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب المطابقة */}
        <TabsContent value="reconciliation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5" />
                مطابقة الحساب
              </CardTitle>
              <CardDescription>
                مقارنة الرصيد الدفتري مع الرصيد الفعلي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950 dark:to-green-900/50 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">الرصيد الدفتري</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(currentAccount.currentBalance, 'IQD')}
                  </p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/50 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">الرصيد الفعلي</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(currentAccount.currentBalance, 'IQD')}
                  </p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950 dark:to-purple-900/50 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">الفرق</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(0, 'IQD')}
                  </p>
                  <Badge className="mt-2 bg-green-500/10 text-green-600">
                    <CheckCircle className="h-3 w-3 ml-1" />
                    متطابق
                  </Badge>
                </div>
              </div>
              <Separator className="my-6" />
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={handleOpenImportStatement}>
                  <Upload className="h-4 w-4 ml-2" />
                  استيراد كشف حساب
                </Button>
                <Button onClick={handleReconcileConfirm}>
                  <CheckCircle className="h-4 w-4 ml-2" />
                  تأكيد المطابقة
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب التقارير */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'كشف حساب تفصيلي', icon: FileText, desc: 'تقرير شامل بجميع القيود' },
              { title: 'ملخص الحركة', icon: BarChart3, desc: 'ملخص المدين والدائن' },
              { title: 'تقرير الأرصدة', icon: Scale, desc: 'أرصدة الافتتاح والإقفال' },
              { title: 'تحليل التكاليف', icon: PieChart, desc: 'توزيع حسب مراكز التكلفة' },
              { title: 'مقارنة الفترات', icon: ArrowLeftRight, desc: 'مقارنة مع الفترات السابقة' },
              { title: 'تقرير التدقيق', icon: Eye, desc: 'سجل كامل للتعديلات' }
            ].map((report, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => toast.success(`جاري إعداد ${report.title}...`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <report.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{report.title}</h3>
                      <p className="text-sm text-muted-foreground">{report.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* نافذة تفاصيل القيد */}
      <Dialog open={showEntryDetails} onOpenChange={setShowEntryDetails}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              تفاصيل القيد
            </DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">المرجع</Label>
                  <p className="font-mono font-medium">{selectedEntry.reference}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">التاريخ</Label>
                  <p className="font-medium">{new Date(selectedEntry.date).toLocaleDateString('ar-IQ')}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">النوع</Label>
                  {getReferenceTypeBadge(selectedEntry.referenceType)}
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">الحالة</Label>
                  {getStatusBadge(selectedEntry.status)}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-1">
                <Label className="text-muted-foreground">البيان</Label>
                <p className="font-medium">{selectedEntry.description}</p>
              </div>

              {selectedEntry.counterAccount && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground">الحساب المقابل</Label>
                  <p className="font-medium">{selectedEntry.counterAccount}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">المدين</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(selectedEntry.debit, 'IQD')}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">الدائن</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(selectedEntry.credit, 'IQD')}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">الرصيد</p>
                  <p className="text-xl font-bold text-purple-600">
                    {formatCurrency(selectedEntry.balance, 'IQD')}
                  </p>
                </div>
              </div>

              {(selectedEntry.costCenter || selectedEntry.project) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedEntry.costCenter && (
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">مركز التكلفة</Label>
                      <Badge variant="outline">{selectedEntry.costCenter}</Badge>
                    </div>
                  )}
                  {selectedEntry.project && (
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">المشروع</Label>
                      <Badge variant="outline">{selectedEntry.project}</Badge>
                    </div>
                  )}
                </div>
              )}

              {selectedEntry.notes && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground">ملاحظات</Label>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedEntry.notes}</p>
                </div>
              )}

              {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground">الوسوم</Label>
                  <div className="flex gap-2 flex-wrap">
                    {selectedEntry.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">أنشأ بواسطة: </span>
                  <span className="font-medium">{selectedEntry.createdBy || 'النظام'}</span>
                </div>
                {selectedEntry.approvedBy && (
                  <div>
                    <span className="text-muted-foreground">تمت الموافقة بواسطة: </span>
                    <span className="font-medium">{selectedEntry.approvedBy}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEntryDetails(false)}>
              إغلاق
            </Button>
            <Button variant="outline" onClick={() => selectedEntry && handleCopyEntry(selectedEntry)}>
              <Copy className="h-4 w-4 ml-2" />
              نسخ
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4 ml-2" />
              طباعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة إضافة قيد جديد */}
      <Dialog open={showAddEntry} onOpenChange={setShowAddEntry}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              إضافة قيد جديد
            </DialogTitle>
            <DialogDescription>
              أضف قيداً جديداً إلى دفتر الأستاذ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>التاريخ</Label>
                <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="space-y-2">
                <Label>نوع القيد</Label>
                <Select defaultValue="journal">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="journal">قيد يومية</SelectItem>
                    <SelectItem value="invoice">فاتورة</SelectItem>
                    <SelectItem value="voucher">سند</SelectItem>
                    <SelectItem value="receipt">إيصال</SelectItem>
                    <SelectItem value="adjustment">تسوية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>البيان</Label>
              <Input placeholder="وصف القيد..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المبلغ المدين</Label>
                <Input type="number" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>المبلغ الدائن</Label>
                <Input type="number" placeholder="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>مركز التكلفة</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مركز التكلفة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">المبيعات</SelectItem>
                    <SelectItem value="admin">الإدارة</SelectItem>
                    <SelectItem value="hr">الموارد البشرية</SelectItem>
                    <SelectItem value="it">تقنية المعلومات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>المشروع</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المشروع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expansion">مشروع التوسع</SelectItem>
                    <SelectItem value="maintenance">مشروع الصيانة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea placeholder="أي ملاحظات إضافية..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEntry(false)}>
              إلغاء
            </Button>
            <Button variant="secondary" onClick={() => {
              toast.success('تم حفظ القيد كمسودة');
              setShowAddEntry(false);
            }}>
              حفظ كمسودة
            </Button>
            <Button onClick={() => {
              toast.success('تم إضافة القيد بنجاح');
              setShowAddEntry(false);
            }}>
              حفظ وترحيل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة إعدادات الحساب */}
      <Dialog open={showAccountSettings} onOpenChange={setShowAccountSettings}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              إعدادات الحساب
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم الحساب</Label>
              <Input defaultValue={currentAccount.name} />
            </div>
            <div className="space-y-2">
              <Label>رقم الحساب</Label>
              <Input defaultValue={currentAccount.code} />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea defaultValue={currentAccount.description} />
            </div>
            <div className="space-y-2">
              <Label>الميزانية السنوية</Label>
              <Input type="number" defaultValue={currentAccount.budgetAmount || 0} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAccountSettings(false)}>
              إلغاء
            </Button>
            <Button onClick={() => {
              toast.success('تم حفظ الإعدادات');
              setShowAccountSettings(false);
            }}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* تأكيد الحذف */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              تأكيد الحذف
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف القيد "{entryToDelete?.reference}"؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* نافذة استيراد كشف الحساب */}
      <Dialog open={showImportStatement} onOpenChange={setShowImportStatement}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              استيراد كشف الحساب
            </DialogTitle>
            <DialogDescription>
              قم برفع ملف كشف الحساب لاستيراد القيود تلقائياً
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* معلومات الحساب */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {getAccountTypeIcon(currentAccount.type)}
                </div>
                <div>
                  <p className="font-medium">{currentAccount.name}</p>
                  <p className="text-sm text-muted-foreground">كود: {currentAccount.code}</p>
                </div>
              </div>
            </div>

            {/* رفع الملف */}
            <div className="space-y-3">
              <Label>رفع ملف كشف الحساب</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.pdf"
                  onChange={handleImportFileChange}
                  className="hidden"
                  id="import-file"
                />
                <label htmlFor="import-file" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">اسحب الملف هنا أو انقر للاختيار</p>
                      <p className="text-sm text-muted-foreground">
                        الصيغ المدعومة: CSV, Excel, PDF
                      </p>
                    </div>
                  </div>
                </label>
              </div>
              {importFile && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{importFile.name}</span>
                  <Badge variant="outline" className="mr-auto">
                    {(importFile.size / 1024).toFixed(1)} KB
                  </Badge>
                </div>
              )}
            </div>

            {/* خيارات الاستيراد */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تنسيق التاريخ</Label>
                <Select defaultValue="dd-mm-yyyy">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd-mm-yyyy">يوم/شهر/سنة</SelectItem>
                    <SelectItem value="mm-dd-yyyy">شهر/يوم/سنة</SelectItem>
                    <SelectItem value="yyyy-mm-dd">سنة/شهر/يوم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>العملة الافتراضية</Label>
                <Select defaultValue="IQD">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IQD">دينار عراقي (IQD)</SelectItem>
                    <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* معاينة البيانات */}
            {importPreview.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    معاينة البيانات ({importPreview.length} قيود)
                  </Label>
                  <Badge className="bg-blue-500/10 text-blue-600">
                    جاهز للاستيراد
                  </Badge>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">البيان</TableHead>
                        <TableHead className="text-right">المرجع</TableHead>
                        <TableHead className="text-right">المدين</TableHead>
                        <TableHead className="text-right">الدائن</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importPreview.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{new Date(entry.date).toLocaleDateString('ar-IQ')}</TableCell>
                          <TableCell>{entry.description}</TableCell>
                          <TableCell className="font-mono text-xs">{entry.reference}</TableCell>
                          <TableCell className="text-green-600">
                            {entry.debit > 0 ? formatCurrency(entry.debit, 'IQD') : '-'}
                          </TableCell>
                          <TableCell className="text-red-600">
                            {entry.credit > 0 ? formatCurrency(entry.credit, 'IQD') : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-amber-500/10 text-amber-600">
                              <Clock className="h-3 w-3 ml-1" />
                              معلق
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex gap-6">
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(importPreview.reduce((sum, e) => sum + e.debit, 0), 'IQD')}
                      </p>
                      <p className="text-xs text-muted-foreground">إجمالي المدين</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-red-600">
                        {formatCurrency(importPreview.reduce((sum, e) => sum + e.credit, 0), 'IQD')}
                      </p>
                      <p className="text-xs text-muted-foreground">إجمالي الدائن</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="auto-approve" />
                    <Label htmlFor="auto-approve" className="text-sm">ترحيل تلقائي بعد الاستيراد</Label>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowImportStatement(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleConfirmImport} 
              disabled={importPreview.length === 0 || isImporting}
            >
              {isImporting ? (
                <>
                  <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                  جاري الاستيراد...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 ml-2" />
                  تأكيد الاستيراد
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
