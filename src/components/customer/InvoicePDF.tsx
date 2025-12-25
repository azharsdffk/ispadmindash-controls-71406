import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  net_amount?: number;
  discount?: number;
  status: string;
  issue_date: string;
  due_date: string;
  currency: string;
}

interface Subscriber {
  name: string;
  phone: string;
  username: string | null;
  address: string | null;
}

interface InvoicePDFProps {
  invoice: Invoice;
  subscriber: Subscriber;
}

export function InvoicePDF({ invoice, subscriber }: InvoicePDFProps) {
  const [generating, setGenerating] = useState(false);

  const generatePDF = async () => {
    setGenerating(true);
    
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('يرجى السماح بالنوافذ المنبثقة لتحميل الفاتورة');
        return;
      }

      const currencySymbol = invoice.currency === 'IQD' ? 'د.ع' : '$';
      const formatAmount = (amount: number) => amount.toLocaleString('ar-IQ');

      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>فاتورة ${invoice.invoice_number}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Cairo', sans-serif;
              background: #f5f5f5;
              padding: 20px;
            }
            
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            
            .header {
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            
            .header h1 {
              font-size: 28px;
              margin-bottom: 10px;
            }
            
            .header p {
              opacity: 0.9;
              font-size: 14px;
            }
            
            .invoice-number {
              background: rgba(255,255,255,0.2);
              display: inline-block;
              padding: 8px 20px;
              border-radius: 20px;
              margin-top: 15px;
              font-weight: 600;
            }
            
            .content {
              padding: 30px;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 30px;
            }
            
            .info-section {
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
            }
            
            .info-section h3 {
              color: #6366f1;
              margin-bottom: 15px;
              font-size: 14px;
              border-bottom: 2px solid #6366f1;
              padding-bottom: 8px;
            }
            
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-size: 14px;
            }
            
            .info-label {
              color: #64748b;
            }
            
            .info-value {
              font-weight: 600;
              color: #1e293b;
            }
            
            .amount-section {
              background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
              padding: 25px;
              border-radius: 12px;
              margin-top: 20px;
            }
            
            .amount-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 12px;
              font-size: 16px;
            }
            
            .amount-row.total {
              border-top: 2px solid #6366f1;
              padding-top: 15px;
              margin-top: 15px;
              font-size: 22px;
              font-weight: 700;
              color: #6366f1;
            }
            
            .status-badge {
              display: inline-block;
              padding: 8px 20px;
              border-radius: 20px;
              font-weight: 600;
              font-size: 14px;
            }
            
            .status-paid {
              background: #dcfce7;
              color: #16a34a;
            }
            
            .status-pending {
              background: #fef9c3;
              color: #ca8a04;
            }
            
            .status-overdue {
              background: #fee2e2;
              color: #dc2626;
            }
            
            .footer {
              text-align: center;
              padding: 20px;
              background: #f8fafc;
              border-top: 1px solid #e2e8f0;
              color: #64748b;
              font-size: 12px;
            }
            
            @media print {
              body {
                background: white;
                padding: 0;
              }
              
              .invoice-container {
                box-shadow: none;
                border-radius: 0;
              }
              
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <h1>🌐 خدمة الإنترنت</h1>
              <p>فاتورة اشتراك الإنترنت</p>
              <div class="invoice-number">${invoice.invoice_number}</div>
            </div>
            
            <div class="content">
              <div class="info-grid">
                <div class="info-section">
                  <h3>بيانات العميل</h3>
                  <div class="info-row">
                    <span class="info-label">الاسم:</span>
                    <span class="info-value">${subscriber.name}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">رقم الهاتف:</span>
                    <span class="info-value">${subscriber.phone}</span>
                  </div>
                  ${subscriber.username ? `
                  <div class="info-row">
                    <span class="info-label">رقم الخدمة:</span>
                    <span class="info-value">${subscriber.username}</span>
                  </div>
                  ` : ''}
                  ${subscriber.address ? `
                  <div class="info-row">
                    <span class="info-label">العنوان:</span>
                    <span class="info-value">${subscriber.address}</span>
                  </div>
                  ` : ''}
                </div>
                
                <div class="info-section">
                  <h3>بيانات الفاتورة</h3>
                  <div class="info-row">
                    <span class="info-label">تاريخ الإصدار:</span>
                    <span class="info-value">${new Date(invoice.issue_date).toLocaleDateString('ar-IQ')}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">تاريخ الاستحقاق:</span>
                    <span class="info-value">${new Date(invoice.due_date).toLocaleDateString('ar-IQ')}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">الحالة:</span>
                    <span class="status-badge status-${invoice.status === 'paid' ? 'paid' : invoice.status === 'overdue' ? 'overdue' : 'pending'}">
                      ${invoice.status === 'paid' ? 'مدفوعة' : invoice.status === 'overdue' ? 'متأخرة' : 'معلقة'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="amount-section">
                <div class="amount-row">
                  <span>المبلغ الأساسي:</span>
                  <span>${formatAmount(invoice.amount)} ${currencySymbol}</span>
                </div>
                ${invoice.discount && invoice.discount > 0 ? `
                <div class="amount-row" style="color: #16a34a;">
                  <span>الخصم:</span>
                  <span>- ${formatAmount(invoice.discount)} ${currencySymbol}</span>
                </div>
                ` : ''}
                <div class="amount-row total">
                  <span>المبلغ المستحق:</span>
                  <span>${formatAmount(invoice.net_amount || invoice.amount)} ${currencySymbol}</span>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p>شكراً لاختياركم خدماتنا</p>
              <p style="margin-top: 5px;">تم إنشاء هذه الفاتورة إلكترونياً</p>
            </div>
          </div>
          
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              color: white;
              border: none;
              padding: 12px 30px;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
              font-family: 'Cairo', sans-serif;
            ">طباعة الفاتورة</button>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      toast.success('تم فتح الفاتورة في نافذة جديدة');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('حدث خطأ في إنشاء الفاتورة');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={generatePDF}
      disabled={generating}
      className="gap-2"
    >
      {generating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      <span className="sr-only md:not-sr-only">PDF</span>
    </Button>
  );
}
