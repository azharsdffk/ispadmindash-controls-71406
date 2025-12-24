import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/currency';
import { 
  BookOpen, Plus, Search, Filter, FileText, Download, Upload, 
  Calendar, DollarSign, TrendingUp, TrendingDown, RefreshCw,
  Eye, Edit, Trash2, Copy, Printer, CheckCircle, XCircle,
  ArrowUpRight, ArrowDownRight, BarChart3, PieChart, Clock,
  AlertCircle, FileSpreadsheet, Hash, User, Building, Wallet,
  CreditCard, Receipt, Scale, Calculator, Briefcase, Target,
  History, Tag, Link2, ChevronDown, ChevronUp, MoreVertical, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

interface AccountingEntry {
  id: string;
  entry_number: string;
  date: string;
  description: string;
  debit_account: string;
  credit_account: string;
  amount: number;
  currency: string;
  reference: string;
  created_at: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'posted';
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  attachments?: string[];
  cost_center?: string;
  project?: string;
  tax_amount?: number;
  fiscal_year?: string;
  period?: string;
  line_items?: EntryLineItem[];
}

interface EntryLineItem {
  id: string;
  account_code: string;
  account_name: string;
  description: string;
  debit: number;
  credit: number;
  cost_center?: string;
}

interface AccountBalance {
  account_name: string;
  account_code: string;
  debit_balance: number;
  credit_balance: number;
  net_balance: number;
}

const ACCOUNT_TYPES = [
  { code: '1000', name: 'النقدية', type: 'assets', icon: Wallet },
  { code: '1100', name: 'البنك', type: 'assets', icon: Building },
  { code: '1200', name: 'الذمم المدينة', type: 'assets', icon: CreditCard },
  { code: '1300', name: 'المخزون', type: 'assets', icon: Briefcase },
  { code: '1400', name: 'الأصول الثابتة', type: 'assets', icon: Target },
  { code: '2000', name: 'الذمم الدائنة', type: 'liabilities', icon: Receipt },
  { code: '2100', name: 'القروض', type: 'liabilities', icon: DollarSign },
  { code: '3000', name: 'رأس المال', type: 'equity', icon: Scale },
  { code: '4000', name: 'إيرادات الخدمات', type: 'revenue', icon: TrendingUp },
  { code: '4100', name: 'إيرادات أخرى', type: 'revenue', icon: ArrowUpRight },
  { code: '5000', name: 'المصروفات التشغيلية', type: 'expenses', icon: TrendingDown },
  { code: '5100', name: 'مصروفات الرواتب', type: 'expenses', icon: User },
  { code: '5200', name: 'مصروفات الإيجار', type: 'expenses', icon: Building },
  { code: '5300', name: 'مصروفات الصيانة', type: 'expenses', icon: RefreshCw },
];

const COST_CENTERS = [
  { code: 'CC001', name: 'الإدارة العامة' },
  { code: 'CC002', name: 'المبيعات' },
  { code: 'CC003', name: 'الدعم الفني' },
  { code: 'CC004', name: 'التسويق' },
  { code: 'CC005', name: 'العمليات' },
];

const generateEntryNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `JE-${year}${month}-${random}`;
};

export const AccountingEntries = () => {
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<AccountingEntry | null>(null);
  const [showNewEntryDialog, setShowNewEntryDialog] = useState(false);
  const [showEntryDetails, setShowEntryDetails] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<AccountingEntry | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AccountingEntry | null>(null);
  const [activeTab, setActiveTab] = useState('entries');
  const [savingEntry, setSavingEntry] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const { toast } = useToast();

  // Form state for new entry
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    notes: '',
    cost_center: '',
    project: '',
    line_items: [
      { id: '1', account_code: '', account_name: '', description: '', debit: 0, credit: 0 },
      { id: '2', account_code: '', account_name: '', description: '', debit: 0, credit: 0 },
    ] as EntryLineItem[]
  });

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      // محاكاة البيانات المتقدمة
      const mockEntries: AccountingEntry[] = [
        {
          id: '1',
          entry_number: 'JE-2024-001',
          date: '2024-01-15',
          description: 'تسجيل إيرادات الاشتراكات الشهرية',
          debit_account: 'النقدية',
          credit_account: 'إيرادات الخدمات',
          amount: 15000000,
          currency: 'IQD',
          reference: 'INV-2024-001',
          created_at: '2024-01-15T10:00:00Z',
          status: 'posted',
          created_by: 'أحمد محمد',
          approved_by: 'محمد علي',
          approved_at: '2024-01-15T12:00:00Z',
          notes: 'إيرادات شهر يناير من اشتراكات الإنترنت',
          cost_center: 'المبيعات',
          fiscal_year: '2024',
          period: 'يناير',
          tax_amount: 750000,
          line_items: [
            { id: '1', account_code: '1000', account_name: 'النقدية', description: 'استلام نقدي', debit: 15000000, credit: 0 },
            { id: '2', account_code: '4000', account_name: 'إيرادات الخدمات', description: 'إيرادات اشتراكات', debit: 0, credit: 15000000 },
          ]
        },
        {
          id: '2',
          entry_number: 'JE-2024-002',
          date: '2024-01-16',
          description: 'شراء معدات شبكة - راوترات وسويتشات',
          debit_account: 'الأصول الثابتة',
          credit_account: 'النقدية',
          amount: 8500000,
          currency: 'IQD',
          reference: 'VCH-2024-002',
          created_at: '2024-01-16T14:30:00Z',
          status: 'approved',
          created_by: 'سارة أحمد',
          approved_by: 'محمد علي',
          approved_at: '2024-01-16T16:00:00Z',
          notes: 'شراء 10 راوترات و 5 سويتشات للتوسعة',
          cost_center: 'العمليات',
          fiscal_year: '2024',
          period: 'يناير',
          line_items: [
            { id: '1', account_code: '1400', account_name: 'الأصول الثابتة', description: 'معدات شبكة', debit: 8500000, credit: 0 },
            { id: '2', account_code: '1000', account_name: 'النقدية', description: 'دفع نقدي', debit: 0, credit: 8500000 },
          ]
        },
        {
          id: '3',
          entry_number: 'JE-2024-003',
          date: '2024-01-17',
          description: 'دفع رواتب الموظفين - يناير',
          debit_account: 'مصروفات الرواتب',
          credit_account: 'البنك',
          amount: 25000000,
          currency: 'IQD',
          reference: 'SAL-2024-001',
          created_at: '2024-01-17T09:00:00Z',
          status: 'posted',
          created_by: 'فاطمة حسن',
          approved_by: 'محمد علي',
          approved_at: '2024-01-17T10:00:00Z',
          notes: 'رواتب 15 موظف لشهر يناير',
          cost_center: 'الإدارة العامة',
          fiscal_year: '2024',
          period: 'يناير',
          line_items: [
            { id: '1', account_code: '5100', account_name: 'مصروفات الرواتب', description: 'رواتب يناير', debit: 25000000, credit: 0 },
            { id: '2', account_code: '1100', account_name: 'البنك', description: 'تحويل بنكي', debit: 0, credit: 25000000 },
          ]
        },
        {
          id: '4',
          entry_number: 'JE-2024-004',
          date: '2024-01-18',
          description: 'إيجار المكتب - يناير',
          debit_account: 'مصروفات الإيجار',
          credit_account: 'النقدية',
          amount: 3000000,
          currency: 'IQD',
          reference: 'RENT-2024-001',
          created_at: '2024-01-18T11:00:00Z',
          status: 'pending',
          created_by: 'علي حسين',
          notes: 'إيجار مكتب الفرع الرئيسي',
          cost_center: 'الإدارة العامة',
          fiscal_year: '2024',
          period: 'يناير',
          line_items: [
            { id: '1', account_code: '5200', account_name: 'مصروفات الإيجار', description: 'إيجار شهري', debit: 3000000, credit: 0 },
            { id: '2', account_code: '1000', account_name: 'النقدية', description: 'دفع نقدي', debit: 0, credit: 3000000 },
          ]
        },
        {
          id: '5',
          entry_number: 'JE-2024-005',
          date: '2024-01-19',
          description: 'مصروفات صيانة الشبكة',
          debit_account: 'مصروفات الصيانة',
          credit_account: 'النقدية',
          amount: 1500000,
          currency: 'IQD',
          reference: 'MAINT-2024-001',
          created_at: '2024-01-19T15:00:00Z',
          status: 'draft',
          created_by: 'أحمد محمد',
          notes: 'صيانة كابلات الفايبر في منطقة الكرادة',
          cost_center: 'الدعم الفني',
          fiscal_year: '2024',
          period: 'يناير',
          line_items: [
            { id: '1', account_code: '5300', account_name: 'مصروفات الصيانة', description: 'صيانة شبكة', debit: 1500000, credit: 0 },
            { id: '2', account_code: '1000', account_name: 'النقدية', description: 'دفع نقدي', debit: 0, credit: 1500000 },
          ]
        },
      ];
      setEntries(mockEntries);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء جلب القيود المحاسبية',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      entry.entry_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reference.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAccount = filterAccount === 'all' || 
      entry.debit_account === filterAccount || 
      entry.credit_account === filterAccount;
    
    const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
    
    const matchesDateFrom = !filterDateFrom || entry.date >= filterDateFrom;
    const matchesDateTo = !filterDateTo || entry.date <= filterDateTo;
    
    return matchesSearch && matchesAccount && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const totalDebit = filteredEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalCredit = filteredEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const postedCount = entries.filter(e => e.status === 'posted').length;
  const pendingCount = entries.filter(e => e.status === 'pending').length;
  const draftCount = entries.filter(e => e.status === 'draft').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'posted':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="h-3 w-3 ml-1" />مرحّل</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"><CheckCircle className="h-3 w-3 ml-1" />معتمد</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="h-3 w-3 ml-1" />قيد المراجعة</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><XCircle className="h-3 w-3 ml-1" />مرفوض</Badge>;
      case 'draft':
        return <Badge variant="outline"><FileText className="h-3 w-3 ml-1" />مسودة</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const addLineItem = () => {
    setNewEntry({
      ...newEntry,
      line_items: [
        ...newEntry.line_items,
        { id: Date.now().toString(), account_code: '', account_name: '', description: '', debit: 0, credit: 0 }
      ]
    });
  };

  const removeLineItem = (id: string) => {
    if (newEntry.line_items.length > 2) {
      setNewEntry({
        ...newEntry,
        line_items: newEntry.line_items.filter(item => item.id !== id)
      });
    }
  };

  const updateLineItem = (id: string, field: keyof EntryLineItem, value: any) => {
    setNewEntry({
      ...newEntry,
      line_items: newEntry.line_items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    });
  };

  const calculateTotals = () => {
    const totalDebit = newEntry.line_items.reduce((sum, item) => sum + (item.debit || 0), 0);
    const totalCredit = newEntry.line_items.reduce((sum, item) => sum + (item.credit || 0), 0);
    return { totalDebit, totalCredit, isBalanced: totalDebit === totalCredit && totalDebit > 0 };
  };

  const resetNewEntryForm = () => {
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      description: '',
      reference: '',
      notes: '',
      cost_center: '',
      project: '',
      line_items: [
        { id: '1', account_code: '', account_name: '', description: '', debit: 0, credit: 0 },
        { id: '2', account_code: '', account_name: '', description: '', debit: 0, credit: 0 },
      ]
    });
  };

  const handleSaveEntry = (status: 'draft' | 'pending') => {
    const { isBalanced, totalDebit } = calculateTotals();
    
    if (!newEntry.description.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال وصف للقيد',
        variant: 'destructive'
      });
      return;
    }

    if (!isBalanced) {
      toast({
        title: 'خطأ في التوازن',
        description: 'يجب أن يكون إجمالي المدين مساوياً لإجمالي الدائن',
        variant: 'destructive'
      });
      return;
    }
    
    setSavingEntry(true);
    
    // Simulate saving
    setTimeout(() => {
      const debitItem = newEntry.line_items.find(i => i.debit > 0);
      const creditItem = newEntry.line_items.find(i => i.credit > 0);
      
      const newEntryData: AccountingEntry = {
        id: Date.now().toString(),
        entry_number: generateEntryNumber(),
        date: newEntry.date,
        description: newEntry.description,
        debit_account: debitItem?.account_name || '',
        credit_account: creditItem?.account_name || '',
        amount: totalDebit,
        currency: 'IQD',
        reference: newEntry.reference,
        created_at: new Date().toISOString(),
        status: status,
        created_by: 'المستخدم الحالي',
        notes: newEntry.notes,
        cost_center: COST_CENTERS.find(c => c.code === newEntry.cost_center)?.name,
        fiscal_year: new Date().getFullYear().toString(),
        period: new Date().toLocaleDateString('ar-IQ', { month: 'long' }),
        line_items: newEntry.line_items.filter(i => i.debit > 0 || i.credit > 0)
      };
      
      setEntries([newEntryData, ...entries]);
      setSavingEntry(false);
      setShowNewEntryDialog(false);
      resetNewEntryForm();
      
      toast({
        title: status === 'draft' ? 'تم الحفظ كمسودة' : 'تم الإرسال للمراجعة',
        description: `تم حفظ القيد ${newEntryData.entry_number} بنجاح`,
      });
    }, 1000);
  };

  const handleApproveEntry = (entry: AccountingEntry) => {
    setEntries(entries.map(e => 
      e.id === entry.id 
        ? { ...e, status: 'approved' as const, approved_by: 'المستخدم الحالي', approved_at: new Date().toISOString() }
        : e
    ));
    toast({
      title: 'تم الاعتماد',
      description: `تم اعتماد القيد ${entry.entry_number}`,
    });
    setShowEntryDetails(false);
  };

  const handleRejectEntry = (entry: AccountingEntry) => {
    setEntries(entries.map(e => 
      e.id === entry.id 
        ? { ...e, status: 'rejected' as const }
        : e
    ));
    toast({
      title: 'تم الرفض',
      description: `تم رفض القيد ${entry.entry_number}`,
      variant: 'destructive'
    });
    setShowEntryDetails(false);
  };

  const handlePostEntry = (entry: AccountingEntry) => {
    setEntries(entries.map(e => 
      e.id === entry.id 
        ? { ...e, status: 'posted' as const }
        : e
    ));
    toast({
      title: 'تم الترحيل',
      description: `تم ترحيل القيد ${entry.entry_number} إلى دفتر الأستاذ`,
    });
    setShowEntryDetails(false);
  };

  const handleSendForReview = (entry: AccountingEntry) => {
    setEntries(entries.map(e => 
      e.id === entry.id 
        ? { ...e, status: 'pending' as const }
        : e
    ));
    toast({
      title: 'تم الإرسال',
      description: `تم إرسال القيد ${entry.entry_number} للمراجعة`,
    });
  };

  const handleDeleteEntry = () => {
    if (entryToDelete) {
      setEntries(entries.filter(e => e.id !== entryToDelete.id));
      toast({
        title: 'تم الحذف',
        description: `تم حذف القيد ${entryToDelete.entry_number}`,
      });
      setShowDeleteDialog(false);
      setEntryToDelete(null);
      setShowEntryDetails(false);
    }
  };

  const handleCopyEntry = (entry: AccountingEntry) => {
    const copiedEntry: AccountingEntry = {
      ...entry,
      id: Date.now().toString(),
      entry_number: generateEntryNumber(),
      date: new Date().toISOString().split('T')[0],
      status: 'draft',
      created_at: new Date().toISOString(),
      created_by: 'المستخدم الحالي',
      approved_by: undefined,
      approved_at: undefined,
    };
    setEntries([copiedEntry, ...entries]);
    toast({
      title: 'تم النسخ',
      description: `تم نسخ القيد إلى ${copiedEntry.entry_number}`,
    });
  };

  const handlePrintEntry = (entry: AccountingEntry) => {
    const printContent = `
      <html dir="rtl">
        <head>
          <title>قيد محاسبي - ${entry.entry_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #333; padding: 8px; text-align: right; }
            th { background-color: #f0f0f0; }
            .total-row { font-weight: bold; background-color: #e0e0e0; }
            .header-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>قيد محاسبي</h1>
          <div class="header-info">
            <div>رقم القيد: ${entry.entry_number}</div>
            <div>التاريخ: ${new Date(entry.date).toLocaleDateString('ar-IQ')}</div>
          </div>
          <p><strong>البيان:</strong> ${entry.description}</p>
          <p><strong>المرجع:</strong> ${entry.reference || '-'}</p>
          <p><strong>مركز التكلفة:</strong> ${entry.cost_center || '-'}</p>
          <table>
            <thead>
              <tr>
                <th>الحساب</th>
                <th>البيان</th>
                <th>مدين</th>
                <th>دائن</th>
              </tr>
            </thead>
            <tbody>
              ${entry.line_items?.map(item => `
                <tr>
                  <td>${item.account_name}</td>
                  <td>${item.description}</td>
                  <td>${item.debit > 0 ? item.debit.toLocaleString() : '-'}</td>
                  <td>${item.credit > 0 ? item.credit.toLocaleString() : '-'}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="2">الإجمالي</td>
                <td>${entry.amount.toLocaleString()}</td>
                <td>${entry.amount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          <p style="margin-top: 30px;"><strong>ملاحظات:</strong> ${entry.notes || '-'}</p>
          <div style="margin-top: 50px; display: flex; justify-content: space-between;">
            <div>المُعد: ${entry.created_by}</div>
            <div>المُعتمد: ${entry.approved_by || '____________'}</div>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExportExcel = () => {
    const headers = ['رقم القيد', 'التاريخ', 'البيان', 'الحساب المدين', 'الحساب الدائن', 'المبلغ', 'الحالة', 'مركز التكلفة', 'المرجع'];
    const rows = filteredEntries.map(entry => [
      entry.entry_number,
      new Date(entry.date).toLocaleDateString('ar-IQ'),
      entry.description,
      entry.debit_account,
      entry.credit_account,
      entry.amount,
      entry.status === 'posted' ? 'مرحّل' : entry.status === 'approved' ? 'معتمد' : entry.status === 'pending' ? 'قيد المراجعة' : entry.status === 'draft' ? 'مسودة' : 'مرفوض',
      entry.cost_center || '',
      entry.reference
    ]);
    
    let csv = '\uFEFF'; // BOM for UTF-8
    csv += headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `accounting_entries_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: 'تم التصدير',
      description: 'تم تصدير القيود المحاسبية بنجاح',
    });
  };

  const handlePrintAll = () => {
    const printContent = `
      <html dir="rtl">
        <head>
          <title>دفتر القيود اليومية</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #333; padding: 6px; text-align: right; }
            th { background-color: #f0f0f0; }
            .total-row { font-weight: bold; background-color: #e0e0e0; }
          </style>
        </head>
        <body>
          <h1>دفتر القيود اليومية</h1>
          <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-IQ')}</p>
          <table>
            <thead>
              <tr>
                <th>رقم القيد</th>
                <th>التاريخ</th>
                <th>البيان</th>
                <th>الحساب المدين</th>
                <th>الحساب الدائن</th>
                <th>المبلغ</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEntries.map(entry => `
                <tr>
                  <td>${entry.entry_number}</td>
                  <td>${new Date(entry.date).toLocaleDateString('ar-IQ')}</td>
                  <td>${entry.description}</td>
                  <td>${entry.debit_account}</td>
                  <td>${entry.credit_account}</td>
                  <td>${entry.amount.toLocaleString()}</td>
                  <td>${entry.status === 'posted' ? 'مرحّل' : entry.status === 'approved' ? 'معتمد' : entry.status === 'pending' ? 'قيد المراجعة' : entry.status === 'draft' ? 'مسودة' : 'مرفوض'}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="5">الإجمالي</td>
                <td>${totalDebit.toLocaleString()}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleImport = () => {
    toast({
      title: 'استيراد القيود',
      description: 'يرجى تحميل ملف Excel أو CSV يحتوي على القيود المحاسبية',
    });
    setShowImportDialog(false);
  };

  const handleOpenReport = (reportType: string) => {
    setSelectedReport(reportType);
    setShowReportDialog(true);
  };

  // Account balances calculation
  const accountBalances: AccountBalance[] = ACCOUNT_TYPES.map(account => {
    const debits = entries
      .filter(e => e.debit_account === account.name && e.status === 'posted')
      .reduce((sum, e) => sum + e.amount, 0);
    const credits = entries
      .filter(e => e.credit_account === account.name && e.status === 'posted')
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      account_name: account.name,
      account_code: account.code,
      debit_balance: debits,
      credit_balance: credits,
      net_balance: debits - credits
    };
  }).filter(b => b.debit_balance > 0 || b.credit_balance > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي القيود</p>
                <p className="text-2xl font-bold">{entries.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مرحّلة</p>
                <p className="text-2xl font-bold text-green-600">{postedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">قيد المراجعة</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-500/10 to-slate-600/5 border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مسودات</p>
                <p className="text-2xl font-bold">{draftCount}</p>
              </div>
              <FileText className="h-8 w-8 text-slate-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المدين</p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalDebit, 'IQD')}</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الدائن</p>
                <p className="text-lg font-bold text-purple-600">{formatCurrency(totalCredit, 'IQD')}</p>
              </div>
              <ArrowDownRight className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList className="grid grid-cols-4 w-auto">
            <TabsTrigger value="entries" className="gap-2">
              <BookOpen className="h-4 w-4" />
              القيود
            </TabsTrigger>
            <TabsTrigger value="balances" className="gap-2">
              <Scale className="h-4 w-4" />
              أرصدة الحسابات
            </TabsTrigger>
            <TabsTrigger value="trial-balance" className="gap-2">
              <Calculator className="h-4 w-4" />
              ميزان المراجعة
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              التقارير
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
              <Upload className="h-4 w-4 ml-2" />
              استيراد
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <Download className="h-4 w-4 ml-2" />
              تصدير Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrintAll}>
              <Printer className="h-4 w-4 ml-2" />
              طباعة
            </Button>
            <Button onClick={() => setShowNewEntryDialog(true)}>
              <Plus className="h-4 w-4 ml-2" />
              قيد جديد
            </Button>
          </div>
        </div>

        {/* Entries Tab */}
        <TabsContent value="entries" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث برقم القيد أو الوصف..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
                
                <Select value={filterAccount} onValueChange={setFilterAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="الحساب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحسابات</SelectItem>
                    {ACCOUNT_TYPES.map(account => (
                      <SelectItem key={account.code} value={account.name}>{account.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="pending">قيد المراجعة</SelectItem>
                    <SelectItem value="approved">معتمد</SelectItem>
                    <SelectItem value="posted">مرحّل</SelectItem>
                    <SelectItem value="rejected">مرفوض</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  placeholder="من تاريخ"
                />

                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  placeholder="إلى تاريخ"
                />
              </div>
            </CardContent>
          </Card>

          {/* Entries Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  دفتر القيود اليومية
                  <Badge variant="secondary">{filteredEntries.length} قيد</Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">رقم القيد</TableHead>
                      <TableHead className="w-[100px]">التاريخ</TableHead>
                      <TableHead>البيان</TableHead>
                      <TableHead>الحساب المدين</TableHead>
                      <TableHead>الحساب الدائن</TableHead>
                      <TableHead className="text-left">المبلغ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>مركز التكلفة</TableHead>
                      <TableHead className="w-[100px]">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>لا توجد قيود محاسبية</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEntries.map((entry) => (
                        <TableRow 
                          key={entry.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            setSelectedEntry(entry);
                            setShowEntryDetails(true);
                          }}
                        >
                          <TableCell className="font-mono font-medium">{entry.entry_number}</TableCell>
                          <TableCell>{new Date(entry.date).toLocaleDateString('ar-IQ')}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{entry.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
                              {entry.debit_account}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-950">
                              {entry.credit_account}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-left" dir="ltr">
                            {formatCurrency(entry.amount, entry.currency as any)}
                          </TableCell>
                          <TableCell>{getStatusBadge(entry.status)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {entry.cost_center || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEntry(entry);
                                  setShowEntryDetails(true);
                                }}>
                                  <Eye className="h-4 w-4 ml-2" />
                                  عرض التفاصيل
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyEntry(entry);
                                }}>
                                  <Copy className="h-4 w-4 ml-2" />
                                  نسخ القيد
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrintEntry(entry);
                                }}>
                                  <Printer className="h-4 w-4 ml-2" />
                                  طباعة
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {entry.status === 'draft' && (
                                  <DropdownMenuItem 
                                    className="text-blue-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSendForReview(entry);
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4 ml-2" />
                                    إرسال للمراجعة
                                  </DropdownMenuItem>
                                )}
                                {entry.status === 'pending' && (
                                  <>
                                    <DropdownMenuItem 
                                      className="text-green-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleApproveEntry(entry);
                                      }}
                                    >
                                      <CheckCircle className="h-4 w-4 ml-2" />
                                      اعتماد
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="text-red-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRejectEntry(entry);
                                      }}
                                    >
                                      <XCircle className="h-4 w-4 ml-2" />
                                      رفض
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {entry.status === 'approved' && (
                                  <DropdownMenuItem 
                                    className="text-green-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePostEntry(entry);
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4 ml-2" />
                                    ترحيل للأستاذ
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEntryToDelete(entry);
                                    setShowDeleteDialog(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 ml-2" />
                                  حذف
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>

              {/* Totals Footer */}
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                    <span className="font-medium text-sm">إجمالي المدين:</span>
                    <span className="font-bold text-green-600">{formatCurrency(totalDebit, 'IQD')}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                    <span className="font-medium text-sm">إجمالي الدائن:</span>
                    <span className="font-bold text-blue-600">{formatCurrency(totalCredit, 'IQD')}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-950/50 rounded-lg border border-purple-200 dark:border-purple-800">
                    <span className="font-medium text-sm">الفرق:</span>
                    <span className={`font-bold ${totalDebit - totalCredit === 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(totalDebit - totalCredit), 'IQD')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950/50 rounded-lg border">
                    <span className="font-medium text-sm">الحالة:</span>
                    {totalDebit === totalCredit ? (
                      <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 ml-1" />متوازن</Badge>
                    ) : (
                      <Badge variant="destructive"><AlertCircle className="h-3 w-3 ml-1" />غير متوازن</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Balances Tab */}
        <TabsContent value="balances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                أرصدة الحسابات
              </CardTitle>
              <CardDescription>عرض أرصدة جميع الحسابات المستخدمة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accountBalances.length === 0 ? (
                  <div className="col-span-full text-center py-10 text-muted-foreground">
                    <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد أرصدة حسابات مسجلة</p>
                  </div>
                ) : (
                  accountBalances.map((balance, index) => {
                    const account = ACCOUNT_TYPES.find(a => a.name === balance.account_name);
                    const Icon = account?.icon || Wallet;
                    return (
                      <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{balance.account_name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{balance.account_code}</p>
                              </div>
                            </div>
                          </div>
                          <Separator className="my-3" />
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">المدين:</span>
                              <span className="text-green-600 font-medium">{formatCurrency(balance.debit_balance, 'IQD')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">الدائن:</span>
                              <span className="text-blue-600 font-medium">{formatCurrency(balance.credit_balance, 'IQD')}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold">
                              <span>الرصيد:</span>
                              <span className={balance.net_balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatCurrency(Math.abs(balance.net_balance), 'IQD')}
                                <span className="text-xs mr-1">({balance.net_balance >= 0 ? 'مدين' : 'دائن'})</span>
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trial Balance Tab */}
        <TabsContent value="trial-balance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    ميزان المراجعة
                  </CardTitle>
                  <CardDescription>للفترة المنتهية في {new Date().toLocaleDateString('ar-IQ')}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportExcel}>
                  <Download className="h-4 w-4 ml-2" />
                  تصدير
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>رمز الحساب</TableHead>
                    <TableHead>اسم الحساب</TableHead>
                    <TableHead className="text-left">المدين</TableHead>
                    <TableHead className="text-left">الدائن</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountBalances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                        لا توجد بيانات لعرضها
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {accountBalances.map((balance, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{balance.account_code}</TableCell>
                          <TableCell className="font-medium">{balance.account_name}</TableCell>
                          <TableCell className="text-left text-green-600" dir="ltr">
                            {balance.debit_balance > 0 ? formatCurrency(balance.debit_balance, 'IQD') : '-'}
                          </TableCell>
                          <TableCell className="text-left text-blue-600" dir="ltr">
                            {balance.credit_balance > 0 ? formatCurrency(balance.credit_balance, 'IQD') : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold border-t-2">
                        <TableCell colSpan={2}>الإجمالي</TableCell>
                        <TableCell className="text-left text-green-600" dir="ltr">
                          {formatCurrency(accountBalances.reduce((sum, b) => sum + b.debit_balance, 0), 'IQD')}
                        </TableCell>
                        <TableCell className="text-left text-blue-600" dir="ltr">
                          {formatCurrency(accountBalances.reduce((sum, b) => sum + b.credit_balance, 0), 'IQD')}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card 
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleOpenReport('daily')}
            >
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                <h3 className="font-semibold mb-2">تقرير القيود اليومية</h3>
                <p className="text-sm text-muted-foreground">عرض جميع القيود لفترة محددة</p>
              </CardContent>
            </Card>
            <Card 
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleOpenReport('account-movement')}
            >
              <CardContent className="p-6 text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="font-semibold mb-2">تقرير حركة الحسابات</h3>
                <p className="text-sm text-muted-foreground">تفاصيل حركة كل حساب</p>
              </CardContent>
            </Card>
            <Card 
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleOpenReport('cost-center')}
            >
              <CardContent className="p-6 text-center">
                <PieChart className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                <h3 className="font-semibold mb-2">تحليل مراكز التكلفة</h3>
                <p className="text-sm text-muted-foreground">توزيع المصروفات حسب المركز</p>
              </CardContent>
            </Card>
            <Card 
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleOpenReport('audit')}
            >
              <CardContent className="p-6 text-center">
                <History className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                <h3 className="font-semibold mb-2">سجل التعديلات</h3>
                <p className="text-sm text-muted-foreground">تتبع جميع التغييرات</p>
              </CardContent>
            </Card>
            <Card 
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleOpenReport('comparison')}
            >
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-red-500" />
                <h3 className="font-semibold mb-2">تقرير المقارنة</h3>
                <p className="text-sm text-muted-foreground">مقارنة بين فترات مختلفة</p>
              </CardContent>
            </Card>
            <Card 
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleOpenReport('pending')}
            >
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                <h3 className="font-semibold mb-2">القيود المعلقة</h3>
                <p className="text-sm text-muted-foreground">القيود التي تحتاج مراجعة</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Entry Dialog */}
      <Dialog open={showNewEntryDialog} onOpenChange={setShowNewEntryDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              إضافة قيد محاسبي جديد
            </DialogTitle>
            <DialogDescription>
              أدخل بيانات القيد المحاسبي. يجب أن يكون إجمالي المدين مساوياً لإجمالي الدائن.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Entry Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>التاريخ <span className="text-red-500">*</span></Label>
                <Input 
                  type="date" 
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>المرجع</Label>
                <Input 
                  placeholder="رقم الفاتورة أو السند"
                  value={newEntry.reference}
                  onChange={(e) => setNewEntry({...newEntry, reference: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>مركز التكلفة</Label>
                <Select value={newEntry.cost_center} onValueChange={(v) => setNewEntry({...newEntry, cost_center: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المركز" />
                  </SelectTrigger>
                  <SelectContent>
                    {COST_CENTERS.map(cc => (
                      <SelectItem key={cc.code} value={cc.code}>{cc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>الوصف <span className="text-red-500">*</span></Label>
              <Input 
                placeholder="وصف القيد المحاسبي"
                value={newEntry.description}
                onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
              />
            </div>

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">بنود القيد</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="h-4 w-4 ml-1" />
                  إضافة بند
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[200px]">الحساب</TableHead>
                      <TableHead>البيان</TableHead>
                      <TableHead className="w-[150px]">المدين</TableHead>
                      <TableHead className="w-[150px]">الدائن</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {newEntry.line_items.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Select 
                            value={item.account_code}
                            onValueChange={(v) => {
                              const account = ACCOUNT_TYPES.find(a => a.code === v);
                              updateLineItem(item.id, 'account_code', v);
                              updateLineItem(item.id, 'account_name', account?.name || '');
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الحساب" />
                            </SelectTrigger>
                            <SelectContent>
                              {ACCOUNT_TYPES.map(account => (
                                <SelectItem key={account.code} value={account.code}>
                                  {account.code} - {account.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input 
                            placeholder="وصف البند"
                            value={item.description}
                            onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number"
                            placeholder="0"
                            value={item.debit || ''}
                            onChange={(e) => updateLineItem(item.id, 'debit', parseFloat(e.target.value) || 0)}
                            className="text-left"
                            dir="ltr"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number"
                            placeholder="0"
                            value={item.credit || ''}
                            onChange={(e) => updateLineItem(item.id, 'credit', parseFloat(e.target.value) || 0)}
                            className="text-left"
                            dir="ltr"
                          />
                        </TableCell>
                        <TableCell>
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeLineItem(item.id)}
                            disabled={newEntry.line_items.length <= 2}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              {(() => {
                const { totalDebit, totalCredit, isBalanced } = calculateTotals();
                return (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="p-3 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="text-sm text-muted-foreground">إجمالي المدين</div>
                      <div className="text-xl font-bold text-green-600" dir="ltr">{formatCurrency(totalDebit, 'IQD')}</div>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-sm text-muted-foreground">إجمالي الدائن</div>
                      <div className="text-xl font-bold text-blue-600" dir="ltr">{formatCurrency(totalCredit, 'IQD')}</div>
                    </div>
                    <div className={`p-3 rounded-lg border ${isBalanced ? 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800'}`}>
                      <div className="text-sm text-muted-foreground">الفرق</div>
                      <div className={`text-xl font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                        {formatCurrency(Math.abs(totalDebit - totalCredit), 'IQD')}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea 
                placeholder="ملاحظات إضافية..."
                value={newEntry.notes}
                onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowNewEntryDialog(false);
              resetNewEntryForm();
            }}>
              إلغاء
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => handleSaveEntry('draft')}
              disabled={savingEntry}
            >
              {savingEntry ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <FileText className="h-4 w-4 ml-2" />}
              حفظ كمسودة
            </Button>
            <Button 
              onClick={() => handleSaveEntry('pending')}
              disabled={savingEntry}
            >
              {savingEntry ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <CheckCircle className="h-4 w-4 ml-2" />}
              حفظ وإرسال للمراجعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Entry Details Dialog */}
      <Dialog open={showEntryDetails} onOpenChange={setShowEntryDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedEntry && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    تفاصيل القيد {selectedEntry.entry_number}
                  </DialogTitle>
                  {getStatusBadge(selectedEntry.status)}
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Entry Info */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">رقم القيد</p>
                    <p className="font-mono font-medium">{selectedEntry.entry_number}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">التاريخ</p>
                    <p className="font-medium">{new Date(selectedEntry.date).toLocaleDateString('ar-IQ')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">المرجع</p>
                    <p className="font-medium">{selectedEntry.reference || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">مركز التكلفة</p>
                    <p className="font-medium">{selectedEntry.cost_center || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">السنة المالية</p>
                    <p className="font-medium">{selectedEntry.fiscal_year || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">الفترة</p>
                    <p className="font-medium">{selectedEntry.period || '-'}</p>
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">البيان</p>
                  <p className="font-medium bg-muted/50 p-3 rounded-lg">{selectedEntry.description}</p>
                </div>

                {/* Line Items */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-semibold">بنود القيد</p>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>رمز الحساب</TableHead>
                          <TableHead>اسم الحساب</TableHead>
                          <TableHead>البيان</TableHead>
                          <TableHead className="text-left">المدين</TableHead>
                          <TableHead className="text-left">الدائن</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedEntry.line_items?.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono">{item.account_code}</TableCell>
                            <TableCell className="font-medium">{item.account_name}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-left text-green-600" dir="ltr">
                              {item.debit > 0 ? formatCurrency(item.debit, 'IQD') : '-'}
                            </TableCell>
                            <TableCell className="text-left text-blue-600" dir="ltr">
                              {item.credit > 0 ? formatCurrency(item.credit, 'IQD') : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50 font-bold border-t-2">
                          <TableCell colSpan={3}>الإجمالي</TableCell>
                          <TableCell className="text-left text-green-600" dir="ltr">
                            {formatCurrency(selectedEntry.amount, 'IQD')}
                          </TableCell>
                          <TableCell className="text-left text-blue-600" dir="ltr">
                            {formatCurrency(selectedEntry.amount, 'IQD')}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Notes */}
                {selectedEntry.notes && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">ملاحظات</p>
                    <p className="bg-muted/50 p-3 rounded-lg text-sm">{selectedEntry.notes}</p>
                  </div>
                )}

                <Separator />

                {/* Audit Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p className="text-muted-foreground">أنشئ بواسطة</p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedEntry.created_by}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selectedEntry.created_at).toLocaleString('ar-IQ')}
                    </p>
                  </div>
                  {selectedEntry.approved_by && (
                    <div className="space-y-2">
                      <p className="text-muted-foreground">اعتمد بواسطة</p>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{selectedEntry.approved_by}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedEntry.approved_at && new Date(selectedEntry.approved_at).toLocaleString('ar-IQ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2 flex-wrap">
                <Button variant="outline" onClick={() => setShowEntryDetails(false)}>
                  إغلاق
                </Button>
                <Button variant="outline" onClick={() => handlePrintEntry(selectedEntry)}>
                  <Printer className="h-4 w-4 ml-2" />
                  طباعة
                </Button>
                <Button variant="outline" onClick={() => handleCopyEntry(selectedEntry)}>
                  <Copy className="h-4 w-4 ml-2" />
                  نسخ
                </Button>
                {selectedEntry.status === 'draft' && (
                  <Button variant="default" onClick={() => handleSendForReview(selectedEntry)}>
                    <CheckCircle className="h-4 w-4 ml-2" />
                    إرسال للمراجعة
                  </Button>
                )}
                {selectedEntry.status === 'pending' && (
                  <>
                    <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleApproveEntry(selectedEntry)}>
                      <CheckCircle className="h-4 w-4 ml-2" />
                      اعتماد
                    </Button>
                    <Button variant="destructive" onClick={() => handleRejectEntry(selectedEntry)}>
                      <XCircle className="h-4 w-4 ml-2" />
                      رفض
                    </Button>
                  </>
                )}
                {selectedEntry.status === 'approved' && (
                  <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handlePostEntry(selectedEntry)}>
                    <CheckCircle className="h-4 w-4 ml-2" />
                    ترحيل للأستاذ
                  </Button>
                )}
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setEntryToDelete(selectedEntry);
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف القيد {entryToDelete?.entry_number}؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEntry} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              استيراد القيود المحاسبية
            </DialogTitle>
            <DialogDescription>
              قم بتحميل ملف Excel أو CSV يحتوي على القيود المحاسبية
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">اسحب الملف هنا أو</p>
              <Button variant="outline">
                اختر ملف
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                الصيغ المدعومة: Excel (.xlsx, .xls) أو CSV
              </p>
            </div>
            <div className="flex justify-between items-center text-sm">
              <a href="#" className="text-primary hover:underline flex items-center gap-1">
                <Download className="h-4 w-4" />
                تحميل نموذج الاستيراد
              </a>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleImport}>
              استيراد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {selectedReport === 'daily' && 'تقرير القيود اليومية'}
              {selectedReport === 'account-movement' && 'تقرير حركة الحسابات'}
              {selectedReport === 'cost-center' && 'تحليل مراكز التكلفة'}
              {selectedReport === 'audit' && 'سجل التعديلات'}
              {selectedReport === 'comparison' && 'تقرير المقارنة'}
              {selectedReport === 'pending' && 'القيود المعلقة'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>من تاريخ</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>إلى تاريخ</Label>
                <Input type="date" />
              </div>
            </div>
            
            {(selectedReport === 'account-movement' || selectedReport === 'cost-center') && (
              <div className="space-y-2">
                <Label>{selectedReport === 'account-movement' ? 'الحساب' : 'مركز التكلفة'}</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر..." />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedReport === 'account-movement' 
                      ? ACCOUNT_TYPES.map(a => <SelectItem key={a.code} value={a.code}>{a.name}</SelectItem>)
                      : COST_CENTERS.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)
                    }
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>صيغة التصدير</Label>
              <Select defaultValue="pdf">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="print">طباعة مباشرة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={() => {
              toast({
                title: 'جاري إنشاء التقرير',
                description: 'سيتم تحميل التقرير خلال لحظات',
              });
              setShowReportDialog(false);
            }}>
              <Download className="h-4 w-4 ml-2" />
              إنشاء التقرير
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
