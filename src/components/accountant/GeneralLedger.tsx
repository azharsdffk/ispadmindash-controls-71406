import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { Book, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LedgerEntry {
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
}

interface Account {
  name: string;
  code: string;
  type: 'asset' | 'liability' | 'revenue' | 'expense';
  entries: LedgerEntry[];
}

export const GeneralLedger = () => {
  const [selectedAccount, setSelectedAccount] = useState('cash');
  const [loading, setLoading] = useState(false);

  // حسابات مع بيانات وهمية
  const accounts: Record<string, Account> = {
    cash: {
      name: 'النقدية',
      code: '1010',
      type: 'asset',
      entries: [
        {
          date: '2024-01-01',
          description: 'الرصيد الافتتاحي',
          reference: 'Opening',
          debit: 10000000,
          credit: 0,
          balance: 10000000
        },
        {
          date: '2024-01-15',
          description: 'إيرادات اشتراكات',
          reference: 'INV-001',
          debit: 5000000,
          credit: 0,
          balance: 15000000
        },
        {
          date: '2024-01-16',
          description: 'شراء معدات',
          reference: 'VCH-002',
          debit: 0,
          credit: 2000000,
          balance: 13000000
        }
      ]
    },
    revenue: {
      name: 'إيرادات الخدمات',
      code: '4010',
      type: 'revenue',
      entries: [
        {
          date: '2024-01-15',
          description: 'إيرادات اشتراكات',
          reference: 'INV-001',
          debit: 0,
          credit: 5000000,
          balance: 5000000
        },
        {
          date: '2024-01-20',
          description: 'إيرادات اشتراكات',
          reference: 'INV-002',
          debit: 0,
          credit: 3000000,
          balance: 8000000
        }
      ]
    },
    assets: {
      name: 'الأصول الثابتة',
      code: '1500',
      type: 'asset',
      entries: [
        {
          date: '2024-01-16',
          description: 'شراء معدات شبكة',
          reference: 'VCH-002',
          debit: 2000000,
          credit: 0,
          balance: 2000000
        }
      ]
    },
    expenses: {
      name: 'المصروفات العمومية',
      code: '5010',
      type: 'expense',
      entries: [
        {
          date: '2024-01-10',
          description: 'رواتب موظفين',
          reference: 'VCH-001',
          debit: 1500000,
          credit: 0,
          balance: 1500000
        },
        {
          date: '2024-01-18',
          description: 'مصاريف إدارية',
          reference: 'VCH-003',
          debit: 500000,
          credit: 0,
          balance: 2000000
        }
      ]
    }
  };

  const currentAccount = accounts[selectedAccount];
  const totalDebit = currentAccount.entries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = currentAccount.entries.reduce((sum, e) => sum + e.credit, 0);
  const finalBalance = totalDebit - totalCredit;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="اختر الحساب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">النقدية (1010)</SelectItem>
            <SelectItem value="revenue">إيرادات الخدمات (4010)</SelectItem>
            <SelectItem value="assets">الأصول الثابتة (1500)</SelectItem>
            <SelectItem value="expenses">المصروفات العمومية (5010)</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Badge variant="outline" className="px-4 py-2">
            {currentAccount.code}
          </Badge>
          <Badge 
            variant={currentAccount.type === 'asset' || currentAccount.type === 'revenue' ? 'default' : 'secondary'}
            className="px-4 py-2"
          >
            {currentAccount.type === 'asset' && 'أصول'}
            {currentAccount.type === 'liability' && 'خصوم'}
            {currentAccount.type === 'revenue' && 'إيرادات'}
            {currentAccount.type === 'expense' && 'مصروفات'}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            دفتر الأستاذ - {currentAccount.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>البيان</TableHead>
                <TableHead>المرجع</TableHead>
                <TableHead className="text-center">المدين</TableHead>
                <TableHead className="text-center">الدائن</TableHead>
                <TableHead className="text-center">الرصيد</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentAccount.entries.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {new Date(entry.date).toLocaleDateString('ar-IQ')}
                  </TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell className="text-muted-foreground">{entry.reference}</TableCell>
                  <TableCell className="text-center">
                    {entry.debit > 0 && (
                      <span className="text-green-600 font-medium">
                        {formatCurrency(entry.debit, 'IQD')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {entry.credit > 0 && (
                      <span className="text-blue-600 font-medium">
                        {formatCurrency(entry.credit, 'IQD')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-bold">
                    {formatCurrency(entry.balance, 'IQD')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-green-50 dark:bg-green-950">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي المدين</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(totalDebit, 'IQD')}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 dark:bg-blue-950">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي الدائن</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(totalCredit, 'IQD')}
                      </p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 dark:bg-purple-950">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">الرصيد النهائي</p>
                      <p className={`text-2xl font-bold ${finalBalance >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                        {formatCurrency(Math.abs(finalBalance), 'IQD')}
                      </p>
                    </div>
                    <Book className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};