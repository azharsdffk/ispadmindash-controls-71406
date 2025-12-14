import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileJson, FileSpreadsheet, FileText, Printer, Download, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportData: any;
  dateRange: { from: string; to: string };
}

export const ExportReportModal = ({ open, onOpenChange, reportData, dateRange }: ExportReportModalProps) => {
  const [exporting, setExporting] = useState<string | null>(null);

  const exportFormats = [
    {
      id: 'pdf',
      name: 'PDF',
      description: 'تقرير قابل للطباعة',
      icon: FileText,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
    },
    {
      id: 'excel',
      name: 'Excel',
      description: 'جداول بيانات Excel',
      icon: FileSpreadsheet,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
    },
    {
      id: 'json',
      name: 'JSON',
      description: 'بيانات خام للتكامل',
      icon: FileJson,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      id: 'print',
      name: 'طباعة',
      description: 'طباعة مباشرة',
      icon: Printer,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
  ];

  const generateCSV = (data: any) => {
    const headers = ['الوصف', 'القيمة'];
    const rows = [
      ['إجمالي المشتركين', data.stats?.totalSubscribers || 0],
      ['إجمالي الفواتير', data.stats?.totalInvoices || 0],
      ['الفواتير المعلقة', data.stats?.pendingInvoices || 0],
      ['إجمالي الإيرادات', data.stats?.totalRevenue || 0],
      ['إجمالي المصروفات', data.stats?.totalExpenses || 0],
      ['صافي الربح', data.netProfit || 0],
      ['هامش الربح %', data.profitMargin || 0],
      ['التذاكر المفتوحة', data.stats?.openTickets || 0],
      ['التذاكر المحلولة', data.stats?.resolvedTickets || 0],
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  };

  const handleExport = async (format: string) => {
    setExporting(format);

    try {
      const fileName = `تقرير-${dateRange.from}-${dateRange.to}`;

      switch (format) {
        case 'json':
          const jsonBlob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
          downloadFile(jsonBlob, `${fileName}.json`);
          break;

        case 'excel':
          const csvContent = generateCSV(reportData);
          const csvBlob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
          downloadFile(csvBlob, `${fileName}.csv`);
          break;

        case 'pdf':
          printReport();
          break;

        case 'print':
          printReport();
          break;
      }

      toast.success(`تم تصدير التقرير بنجاح`);
    } catch (error) {
      toast.error('حدث خطأ أثناء التصدير');
    } finally {
      setTimeout(() => setExporting(null), 1000);
    }
  };

  const downloadFile = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير مالي</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { 
            font-family: 'Segoe UI', Tahoma, sans-serif; 
            padding: 20px;
            color: #1a1a2e;
          }
          .header {
            background: linear-gradient(135deg, #1e40af, #3b82f6);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 { margin: 0; font-size: 28px; }
          .header p { margin: 10px 0 0; opacity: 0.9; }
          .period {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 25px;
            border: 1px solid #e2e8f0;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 25px;
          }
          .card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
          }
          .card.success { border-color: #22c55e; background: #f0fdf4; }
          .card.danger { border-color: #ef4444; background: #fef2f2; }
          .card.primary { border-color: #3b82f6; background: #eff6ff; }
          .card h3 { margin: 0 0 8px; color: #64748b; font-size: 14px; }
          .card .value { font-size: 24px; font-weight: bold; color: #1e293b; }
          .card.success .value { color: #16a34a; }
          .card.danger .value { color: #dc2626; }
          .card.primary .value { color: #2563eb; }
          .section { margin-top: 30px; }
          .section h2 { 
            color: #1e40af; 
            border-bottom: 2px solid #3b82f6; 
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 12px;
            text-align: right;
            border-bottom: 1px solid #e2e8f0;
          }
          th { background: #f1f5f9; font-weight: 600; }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #94a3b8;
            font-size: 12px;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 التقرير المالي الشامل</h1>
          <p>نظام إدارة ISP</p>
        </div>
        
        <div class="period">
          <strong>الفترة:</strong> ${dateRange.from} إلى ${dateRange.to}
        </div>

        <div class="grid">
          <div class="card success">
            <h3>إجمالي الإيرادات</h3>
            <div class="value">${(reportData.stats?.totalRevenue || 0).toLocaleString()} د.ع</div>
          </div>
          <div class="card danger">
            <h3>إجمالي المصروفات</h3>
            <div class="value">${(reportData.stats?.totalExpenses || 0).toLocaleString()} د.ع</div>
          </div>
          <div class="card primary">
            <h3>صافي الربح</h3>
            <div class="value">${(reportData.netProfit || 0).toLocaleString()} د.ع</div>
          </div>
        </div>

        <div class="section">
          <h2>📋 ملخص الأداء</h2>
          <table>
            <tr><th>المؤشر</th><th>القيمة</th></tr>
            <tr><td>إجمالي المشتركين</td><td>${reportData.stats?.totalSubscribers || 0}</td></tr>
            <tr><td>إجمالي الفواتير</td><td>${reportData.stats?.totalInvoices || 0}</td></tr>
            <tr><td>الفواتير المعلقة</td><td>${reportData.stats?.pendingInvoices || 0}</td></tr>
            <tr><td>هامش الربح</td><td>${reportData.profitMargin || 0}%</td></tr>
            <tr><td>التذاكر المفتوحة</td><td>${reportData.stats?.openTickets || 0}</td></tr>
            <tr><td>التذاكر المحلولة</td><td>${reportData.stats?.resolvedTickets || 0}</td></tr>
          </table>
        </div>

        <div class="footer">
          <p>تم إنشاء هذا التقرير بواسطة نظام إدارة ISP</p>
          <p>تاريخ الإنشاء: ${new Date().toLocaleDateString('ar-IQ')} - ${new Date().toLocaleTimeString('ar-IQ')}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Download className="h-5 w-5 text-primary" />
            تصدير التقرير
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-4">
          {exportFormats.map((format) => (
            <Card
              key={format.id}
              className={`cursor-pointer transition-all hover:scale-105 hover:shadow-lg border-2 ${format.borderColor} ${
                exporting === format.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleExport(format.id)}
            >
              <CardContent className="p-4 text-center">
                <div className={`${format.bgColor} w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  {exporting === format.id ? (
                    <CheckCircle2 className={`h-7 w-7 ${format.color} animate-pulse`} />
                  ) : (
                    <format.icon className={`h-7 w-7 ${format.color}`} />
                  )}
                </div>
                <h3 className="font-semibold text-foreground">{format.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{format.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            الفترة: {dateRange.from} إلى {dateRange.to}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
