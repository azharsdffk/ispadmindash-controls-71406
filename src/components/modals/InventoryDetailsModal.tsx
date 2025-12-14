import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Package, 
  Barcode, 
  Layers, 
  Box, 
  DollarSign, 
  Calculator, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Truck,
  FileText,
  Printer,
  Calendar,
  Hash
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface InventoryItem {
  id: string;
  item_name: string;
  item_code: string | null;
  category: string | null;
  quantity: number;
  unit: string;
  unit_price: number | null;
  min_stock_level: number | null;
  supplier: string | null;
  notes: string | null;
  currency: string;
  created_at?: string;
  updated_at?: string;
}

interface InventoryDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
}

export const InventoryDetailsModal = ({ open, onOpenChange, item }: InventoryDetailsModalProps) => {
  if (!item) return null;

  const totalValue = item.quantity * (item.unit_price || 0);
  
  const getStockStatus = () => {
    if (!item.min_stock_level) return null;
    
    if (item.quantity === 0) {
      return { label: 'نفذ من المخزون', variant: 'destructive' as const, icon: AlertTriangle, color: 'text-red-500' };
    } else if (item.quantity <= item.min_stock_level) {
      return { label: 'مخزون منخفض', variant: 'secondary' as const, icon: TrendingDown, color: 'text-amber-500' };
    }
    return { label: 'متوفر', variant: 'default' as const, icon: TrendingUp, color: 'text-green-500' };
  };

  const status = getStockStatus();
  const stockPercentage = item.min_stock_level 
    ? Math.min(100, (item.quantity / (item.min_stock_level * 2)) * 100)
    : 100;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const statusText = status?.label || 'غير محدد';
    const statusColor = item.quantity === 0 ? '#ef4444' : item.quantity <= (item.min_stock_level || 0) ? '#f59e0b' : '#22c55e';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تفاصيل الصنف - ${item.item_name}</title>
        <style>
          @page { size: A5; margin: 10mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Segoe UI', Tahoma, sans-serif;
            background: #f8fafc;
            color: #1e293b;
            padding: 15px;
            font-size: 12px;
          }
          .container {
            max-width: 100%;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 15px 20px;
            text-align: center;
          }
          .header h1 {
            font-size: 18px;
            margin-bottom: 5px;
          }
          .header .code {
            opacity: 0.9;
            font-size: 11px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: bold;
            margin-top: 8px;
            background: ${statusColor};
            color: white;
          }
          .content {
            padding: 15px 20px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 15px;
          }
          .info-card {
            background: #f8fafc;
            border-radius: 8px;
            padding: 12px;
            border: 1px solid #e2e8f0;
          }
          .info-card.highlight {
            background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
            border-color: #3b82f6;
          }
          .info-card .label {
            font-size: 10px;
            color: #64748b;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .info-card .value {
            font-size: 14px;
            font-weight: bold;
            color: #1e293b;
          }
          .info-card .value.success { color: #22c55e; }
          .info-card .value.warning { color: #f59e0b; }
          .info-card .value.danger { color: #ef4444; }
          .progress-section {
            margin-bottom: 15px;
          }
          .progress-label {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            margin-bottom: 5px;
            color: #64748b;
          }
          .progress-bar {
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
          }
          .progress-fill {
            height: 100%;
            background: ${statusColor};
            border-radius: 4px;
            width: ${stockPercentage}%;
          }
          .notes-section {
            background: #fefce8;
            border: 1px solid #fef08a;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 15px;
          }
          .notes-section .title {
            font-size: 10px;
            color: #a16207;
            margin-bottom: 5px;
            font-weight: bold;
          }
          .notes-section .text {
            font-size: 11px;
            color: #78350f;
          }
          .footer {
            text-align: center;
            padding: 10px 20px 15px;
            border-top: 1px solid #e2e8f0;
            font-size: 9px;
            color: #94a3b8;
          }
          @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📦 ${item.item_name}</h1>
            ${item.item_code ? `<div class="code">كود: ${item.item_code}</div>` : ''}
            <div class="status-badge">${statusText}</div>
          </div>
          
          <div class="content">
            <div class="info-grid">
              <div class="info-card highlight">
                <div class="label">📊 الكمية المتوفرة</div>
                <div class="value ${item.quantity === 0 ? 'danger' : item.quantity <= (item.min_stock_level || 0) ? 'warning' : 'success'}">
                  ${item.quantity} ${item.unit}
                </div>
              </div>
              
              <div class="info-card highlight">
                <div class="label">💰 القيمة الإجمالية</div>
                <div class="value success">${formatCurrency(totalValue)}</div>
              </div>
              
              <div class="info-card">
                <div class="label">🏷️ سعر الوحدة</div>
                <div class="value">${item.unit_price ? formatCurrency(item.unit_price) : 'غير محدد'}</div>
              </div>
              
              <div class="info-card">
                <div class="label">📉 الحد الأدنى</div>
                <div class="value">${item.min_stock_level ? `${item.min_stock_level} ${item.unit}` : 'غير محدد'}</div>
              </div>
              
              <div class="info-card">
                <div class="label">📁 الفئة</div>
                <div class="value">${item.category || 'غير مصنف'}</div>
              </div>
              
              <div class="info-card">
                <div class="label">🚚 المورد</div>
                <div class="value">${item.supplier || 'غير محدد'}</div>
              </div>
            </div>
            
            ${item.min_stock_level ? `
            <div class="progress-section">
              <div class="progress-label">
                <span>مستوى المخزون</span>
                <span>${Math.round(stockPercentage)}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill"></div>
              </div>
            </div>
            ` : ''}
            
            ${item.notes ? `
            <div class="notes-section">
              <div class="title">📝 ملاحظات</div>
              <div class="text">${item.notes}</div>
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            تم الطباعة في ${new Date().toLocaleDateString('ar-IQ')} - ${new Date().toLocaleTimeString('ar-IQ')}
            <br>نظام إدارة المخزون
          </div>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
              تفاصيل الصنف
            </DialogTitle>
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              طباعة
            </Button>
          </div>
        </DialogHeader>

        {/* Header Section */}
        <div className="bg-gradient-to-l from-primary/5 via-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">{item.item_name}</h2>
              {item.item_code && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Barcode className="h-4 w-4" />
                  <span className="font-mono">{item.item_code}</span>
                </div>
              )}
            </div>
            {status && (
              <Badge 
                variant={status.variant}
                className={`flex items-center gap-1.5 px-3 py-1.5 ${
                  item.quantity === 0 ? 'bg-red-500/10 text-red-600 border-red-200' :
                  item.quantity <= (item.min_stock_level || 0) ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
                  'bg-green-500/10 text-green-600 border-green-200'
                }`}
              >
                <status.icon className="h-4 w-4" />
                {status.label}
              </Badge>
            )}
          </div>
        </div>

        {/* Stock Level Progress */}
        {item.min_stock_level && (
          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">مستوى المخزون</span>
                <span className={`text-sm font-bold ${
                  item.quantity === 0 ? 'text-red-500' :
                  item.quantity <= item.min_stock_level ? 'text-amber-500' :
                  'text-green-500'
                }`}>
                  {Math.round(stockPercentage)}%
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.quantity === 0 ? 'bg-red-500' :
                    item.quantity <= item.min_stock_level ? 'bg-amber-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${stockPercentage}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>الحد الأدنى: {item.min_stock_level} {item.unit}</span>
                <span>الكمية الحالية: {item.quantity} {item.unit}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Main Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Quantity Card */}
          <Card className="border-2 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Box className="h-4 w-4" />
                <span className="text-sm font-medium">الكمية المتوفرة</span>
              </div>
              <p className={`text-2xl font-bold ${
                item.quantity === 0 ? 'text-red-500' :
                item.quantity <= (item.min_stock_level || 0) ? 'text-amber-500' :
                'text-blue-600'
              }`}>
                {item.quantity} <span className="text-base font-normal text-muted-foreground">{item.unit}</span>
              </p>
            </CardContent>
          </Card>

          {/* Unit Price Card */}
          <Card className="border-2 border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">سعر الوحدة</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {item.unit_price ? formatCurrency(item.unit_price) : 'غير محدد'}
              </p>
            </CardContent>
          </Card>

          {/* Total Value Card */}
          <Card className="border-2 border-green-200 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <Calculator className="h-4 w-4" />
                <span className="text-sm font-medium">القيمة الإجمالية</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalValue)}
              </p>
            </CardContent>
          </Card>

          {/* Min Stock Level Card */}
          <Card className="border-2 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-600 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">الحد الأدنى للمخزون</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">
                {item.min_stock_level ? `${item.min_stock_level} ${item.unit}` : 'غير محدد'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Layers className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">الفئة</p>
                <p className="font-medium">{item.category || 'غير مصنف'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Truck className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">المورد</p>
                <p className="font-medium">{item.supplier || 'غير محدد'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Hash className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">معرف الصنف</p>
                <p className="font-mono text-sm">{item.id.slice(0, 8)}...</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">الوحدة</p>
                <p className="font-medium">{item.unit}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {item.notes && (
          <>
            <Separator />
            <Card className="border-2 border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-yellow-700 mb-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">ملاحظات</span>
                </div>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 whitespace-pre-wrap">
                  {item.notes}
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Stock Warning */}
        {status && item.quantity <= (item.min_stock_level || 0) && item.quantity > 0 && (
          <Card className="border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-300">تحذير: مخزون منخفض</p>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  الكمية الحالية ({item.quantity}) أقل من الحد الأدنى ({item.min_stock_level}). يُنصح بإعادة التموين.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {item.quantity === 0 && (
          <Card className="border-2 border-red-300 bg-red-50 dark:bg-red-950/30">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <div>
                <p className="font-medium text-red-700 dark:text-red-300">تنبيه: نفذ المخزون</p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  هذا الصنف غير متوفر حالياً. يجب إعادة التموين فوراً.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};
