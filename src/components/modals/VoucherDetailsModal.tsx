import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, Currency } from "@/lib/currency";
import { FileText, Calendar, DollarSign, User, Building, StickyNote, UserCircle, Phone, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VoucherDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voucher: {
    id: string;
    voucher_number: string;
    voucher_type: "income" | "expense";
    amount: number;
    currency?: Currency;
    account?: string;
    expense_type?: string;
    description?: string;
    created_at: string;
    created_by?: string;
  } | null;
}

export const VoucherDetailsModal = ({ open, onOpenChange, voucher }: VoucherDetailsModalProps) => {
  const [creatorInfo, setCreatorInfo] = useState<{ full_name: string; phone: string | null } | null>(null);

  useEffect(() => {
    const fetchCreator = async () => {
      if (voucher?.created_by) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", voucher.created_by)
          .single();
        setCreatorInfo(data);
      } else {
        setCreatorInfo(null);
      }
    };
    if (open && voucher) {
      fetchCreator();
    }
  }, [open, voucher]);

  const handlePrint = () => {
    if (!voucher) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const isIncome = voucher.voucher_type === 'income';
      const primaryColor = isIncome ? '#059669' : '#dc2626';
      const primaryLight = isIncome ? '#d1fae5' : '#fee2e2';
      const gradientStart = isIncome ? '#065f46' : '#991b1b';
      const gradientEnd = isIncome ? '#10b981' : '#ef4444';
      
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>سند ${isIncome ? 'قبض' : 'صرف'} - ${voucher.voucher_number}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
              
              * { margin: 0; padding: 0; box-sizing: border-box; }
              
              body { 
                font-family: 'Tajawal', 'Segoe UI', sans-serif; 
                padding: 20px; 
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                min-height: 100vh;
              }
              
              .voucher-wrapper {
                max-width: 700px;
                margin: 0 auto;
                perspective: 1000px;
              }
              
              .voucher-container { 
                background: white;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 
                  0 25px 50px -12px rgba(0, 0, 0, 0.25),
                  0 0 0 1px rgba(0, 0, 0, 0.05);
                position: relative;
              }
              
              .voucher-container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 8px;
                background: linear-gradient(90deg, ${gradientStart}, ${gradientEnd}, ${gradientStart});
              }
              
              .watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-30deg);
                font-size: 120px;
                font-weight: 800;
                color: ${primaryLight};
                opacity: 0.3;
                pointer-events: none;
                white-space: nowrap;
                z-index: 0;
              }
              
              .voucher-header { 
                background: linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%);
                color: white; 
                padding: 30px 40px;
                text-align: center;
                position: relative;
                overflow: hidden;
              }
              
              .voucher-header::before {
                content: '';
                position: absolute;
                top: -50%;
                right: -50%;
                width: 100%;
                height: 200%;
                background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
              }
              
              .voucher-header::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 6px;
                background: repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 10px,
                  rgba(255,255,255,0.3) 10px,
                  rgba(255,255,255,0.3) 20px
                );
              }
              
              .header-icon {
                width: 70px;
                height: 70px;
                background: rgba(255,255,255,0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 15px;
                backdrop-filter: blur(10px);
                border: 3px solid rgba(255,255,255,0.3);
              }
              
              .header-icon svg {
                width: 35px;
                height: 35px;
                fill: white;
              }
              
              .voucher-header h1 { 
                font-size: 32px; 
                font-weight: 800;
                margin-bottom: 8px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                letter-spacing: 1px;
              }
              
              .voucher-number { 
                font-size: 18px; 
                opacity: 0.95;
                background: rgba(255,255,255,0.15);
                padding: 8px 24px;
                border-radius: 30px;
                display: inline-block;
                backdrop-filter: blur(5px);
                border: 1px solid rgba(255,255,255,0.2);
              }
              
              .voucher-body { 
                padding: 35px 40px;
                position: relative;
                z-index: 1;
              }
              
              .amount-section { 
                background: linear-gradient(135deg, ${primaryLight} 0%, white 100%);
                padding: 30px;
                border-radius: 16px;
                margin: 0 0 30px;
                text-align: center;
                border: 2px solid ${primaryColor}20;
                position: relative;
                overflow: hidden;
              }
              
              .amount-section::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, ${gradientStart}, ${gradientEnd});
              }
              
              .amount-label { 
                color: #6b7280; 
                font-size: 16px;
                font-weight: 500;
                margin-bottom: 10px;
              }
              
              .amount-value { 
                font-size: 42px; 
                font-weight: 800;
                color: ${primaryColor};
                letter-spacing: 1px;
              }
              
              .amount-currency {
                font-size: 18px;
                color: #6b7280;
                margin-top: 5px;
              }
              
              .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
                margin-bottom: 30px;
              }
              
              .info-card {
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                padding: 18px 20px;
                border-radius: 12px;
                border: 1px solid #e2e8f0;
                transition: all 0.3s ease;
              }
              
              .info-card.full-width {
                grid-column: span 2;
              }
              
              .info-card-label {
                color: #64748b;
                font-size: 13px;
                font-weight: 500;
                margin-bottom: 6px;
                display: flex;
                align-items: center;
                gap: 8px;
              }
              
              .info-card-label svg {
                width: 16px;
                height: 16px;
                fill: ${primaryColor};
              }
              
              .info-card-value {
                color: #1e293b;
                font-size: 16px;
                font-weight: 600;
              }
              
              .divider {
                height: 2px;
                background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
                margin: 25px 0;
              }
              
              .signature-section { 
                display: flex; 
                justify-content: space-between;
                margin-top: 40px;
                padding-top: 30px;
                border-top: 2px dashed #e2e8f0;
              }
              
              .signature-box { 
                text-align: center; 
                width: 42%;
              }
              
              .signature-line { 
                border-top: 2px solid ${primaryColor};
                margin-top: 60px;
                padding-top: 12px;
                color: #64748b;
                font-weight: 600;
                font-size: 14px;
              }
              
              .voucher-footer { 
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                color: white;
                padding: 20px 40px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 13px;
              }
              
              .footer-brand {
                display: flex;
                align-items: center;
                gap: 10px;
              }
              
              .footer-brand-icon {
                width: 30px;
                height: 30px;
                background: linear-gradient(135deg, #3b82f6, #2563eb);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              
              .footer-brand-icon svg {
                width: 18px;
                height: 18px;
                fill: white;
              }
              
              .footer-date {
                opacity: 0.8;
              }
              
              .qr-placeholder {
                width: 60px;
                height: 60px;
                background: white;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #64748b;
                font-size: 10px;
              }
              
              @media print {
                body { 
                  background: white;
                  padding: 0;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .voucher-container {
                  box-shadow: none;
                  border: 2px solid ${primaryColor};
                }
              }
            </style>
          </head>
          <body>
            <div class="voucher-wrapper">
              <div class="voucher-container">
                <div class="watermark">${isIncome ? 'قبض' : 'صرف'}</div>
                
                <div class="voucher-header">
                  <div class="header-icon">
                    ${isIncome 
                      ? '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
                      : '<svg viewBox="0 0 24 24"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/></svg>'
                    }
                  </div>
                  <h1>سند ${isIncome ? 'قبض' : 'صرف'}</h1>
                  <div class="voucher-number">رقم السند: ${voucher.voucher_number}</div>
                </div>
                
                <div class="voucher-body">
                  <div class="amount-section">
                    <div class="amount-label">المبلغ الإجمالي</div>
                    <div class="amount-value">${formatCurrency(Number(voucher.amount), voucher.currency || "IQD")}</div>
                  </div>
                  
                  <div class="info-grid">
                    ${voucher.account ? `
                      <div class="info-card">
                        <div class="info-card-label">
                          <svg viewBox="0 0 24 24"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
                          الحساب
                        </div>
                        <div class="info-card-value">${voucher.account}</div>
                      </div>
                    ` : ''}
                    
                    ${voucher.expense_type ? `
                      <div class="info-card">
                        <div class="info-card-label">
                          <svg viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"/></svg>
                          نوع المصروف
                        </div>
                        <div class="info-card-value">${voucher.expense_type}</div>
                      </div>
                    ` : ''}
                    
                    <div class="info-card">
                      <div class="info-card-label">
                        <svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg>
                        تاريخ الإنشاء
                      </div>
                      <div class="info-card-value">${new Date(voucher.created_at).toLocaleDateString("ar-IQ", { year: "numeric", month: "long", day: "numeric" })}</div>
                    </div>
                    
                    <div class="info-card">
                      <div class="info-card-label">
                        <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                        وقت الإنشاء
                      </div>
                      <div class="info-card-value">${new Date(voucher.created_at).toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                    
                    ${creatorInfo ? `
                      <div class="info-card full-width">
                        <div class="info-card-label">
                          <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                          منشئ السند
                        </div>
                        <div class="info-card-value">${creatorInfo.full_name}${creatorInfo.phone ? ' • ' + creatorInfo.phone : ''}</div>
                      </div>
                    ` : ''}
                    
                    ${voucher.description ? `
                      <div class="info-card full-width">
                        <div class="info-card-label">
                          <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                          الوصف / الملاحظات
                        </div>
                        <div class="info-card-value">${voucher.description}</div>
                      </div>
                    ` : ''}
                  </div>
                  
                  <div class="signature-section">
                    <div class="signature-box">
                      <div class="signature-line">توقيع المستلم</div>
                    </div>
                    <div class="signature-box">
                      <div class="signature-line">توقيع المسلم</div>
                    </div>
                  </div>
                </div>
                
                <div class="voucher-footer">
                  <div class="footer-brand">
                    <div class="footer-brand-icon">
                      <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                    </div>
                    <span>نظام إدارة السندات المالية</span>
                  </div>
                  <div class="footer-date">
                    تم الطباعة: ${new Date().toLocaleDateString("ar-IQ")} - ${new Date().toLocaleTimeString("ar-IQ")}
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!voucher) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              تفاصيل السند
            </div>
            <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              طباعة
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Voucher Number & Type */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">رقم السند</p>
              <p className="font-semibold">{voucher.voucher_number}</p>
            </div>
            <Badge variant={voucher.voucher_type === "income" ? "default" : "destructive"} className="text-sm">
              {voucher.voucher_type === "income" ? "سند قبض" : "سند صرف"}
            </Badge>
          </div>

          {/* Amount */}
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <DollarSign className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">المبلغ</p>
              <p className="font-bold text-lg">
                {formatCurrency(Number(voucher.amount), voucher.currency || "IQD")}
              </p>
            </div>
          </div>

          {/* Account */}
          {voucher.account && (
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Building className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">الحساب</p>
                <p className="font-medium">{voucher.account}</p>
              </div>
            </div>
          )}

          {/* Expense Type */}
          {voucher.expense_type && (
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <User className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">نوع المصروف</p>
                <p className="font-medium">{voucher.expense_type}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {voucher.description && (
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <StickyNote className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">الوصف</p>
                <p className="font-medium">{voucher.description}</p>
              </div>
            </div>
          )}

          {/* Creator Info */}
          {creatorInfo && (
            <div className="p-3 border rounded-lg bg-muted/30 space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">منشئ السند</p>
              <div className="flex items-center gap-3">
                <UserCircle className="h-5 w-5 text-primary" />
                <span className="font-medium">{creatorInfo.full_name}</span>
              </div>
              {creatorInfo.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <span className="font-medium" dir="ltr">{creatorInfo.phone}</span>
                </div>
              )}
            </div>
          )}

          {/* Date */}
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
              <p className="font-medium">
                {new Date(voucher.created_at).toLocaleDateString("ar-IQ", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};