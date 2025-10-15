import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/currency';
import { BookOpen, Plus, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
}

export const AccountingEntries = () => {
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccount, setFilterAccount] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      // محاكاة البيانات - في التطبيق الحقيقي ستأتي من قاعدة البيانات
      const mockEntries: AccountingEntry[] = [
        {
          id: '1',
          entry_number: 'JE-2024-001',
          date: '2024-01-15',
          description: 'تسجيل إيرادات الاشتراكات',
          debit_account: 'النقدية',
          credit_account: 'إيرادات الخدمات',
          amount: 5000000,
          currency: 'IQD',
          reference: 'INV-2024-001',
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          entry_number: 'JE-2024-002',
          date: '2024-01-16',
          description: 'شراء معدات شبكة',
          debit_account: 'الأصول الثابتة',
          credit_account: 'النقدية',
          amount: 2000000,
          currency: 'IQD',
          reference: 'VCH-2024-002',
          created_at: '2024-01-16T14:30:00Z'
        }
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
      entry.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterAccount === 'all' || 
      entry.debit_account === filterAccount || 
      entry.credit_account === filterAccount;
    
    return matchesSearch && matchesFilter;
  });

  const totalDebit = filteredEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalCredit = filteredEntries.reduce((sum, entry) => sum + entry.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث في القيود..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 w-64"
            />
          </div>
          
          <Select value={filterAccount} onValueChange={setFilterAccount}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="تصفية حسب الحساب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحسابات</SelectItem>
              <SelectItem value="النقدية">النقدية</SelectItem>
              <SelectItem value="إيرادات الخدمات">إيرادات الخدمات</SelectItem>
              <SelectItem value="الأصول الثابتة">الأصول الثابتة</SelectItem>
              <SelectItem value="المصروفات">المصروفات</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              قيد جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة قيد محاسبي جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>التاريخ</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Input placeholder="وصف القيد المحاسبي" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الحساب المدين</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحساب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">النقدية</SelectItem>
                      <SelectItem value="revenue">إيرادات الخدمات</SelectItem>
                      <SelectItem value="assets">الأصول الثابتة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الحساب الدائن</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحساب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">النقدية</SelectItem>
                      <SelectItem value="revenue">إيرادات الخدمات</SelectItem>
                      <SelectItem value="expenses">المصروفات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>المبلغ</Label>
                <Input type="number" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>المرجع</Label>
                <Input placeholder="رقم الفاتورة أو السند" />
              </div>
              <Button className="w-full">حفظ القيد</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            دفتر القيود اليومية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم القيد</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>البيان</TableHead>
                <TableHead>الحساب المدين</TableHead>
                <TableHead>الحساب الدائن</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>المرجع</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    لا توجد قيود محاسبية
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.entry_number}</TableCell>
                    <TableCell>{new Date(entry.date).toLocaleDateString('ar-IQ')}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.debit_account}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{entry.credit_account}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(entry.amount, entry.currency as any)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{entry.reference}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 max-w-md mr-auto">
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <span className="font-medium">إجمالي المدين:</span>
                <span className="font-bold text-green-600">{formatCurrency(totalDebit, 'IQD')}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <span className="font-medium">إجمالي الدائن:</span>
                <span className="font-bold text-blue-600">{formatCurrency(totalCredit, 'IQD')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};