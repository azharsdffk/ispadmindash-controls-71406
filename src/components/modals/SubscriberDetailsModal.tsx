import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Phone, Mail, MapPin, CreditCard, Calendar, FileText, Hash, Globe } from "lucide-react";

interface SubscriberDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriber: {
    id: string;
    name: string;
    phone: string;
    phone_secondary?: string;
    username?: string;
    email?: string;
    address?: string;
    plan?: string;
    balance: number;
    status_comment?: string;
    address_notes?: string;
    latitude?: number;
    longitude?: number;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
  } | null;
}

export const SubscriberDetailsModal = ({
  open,
  onOpenChange,
  subscriber,
}: SubscriberDetailsModalProps) => {
  if (!subscriber) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            تفاصيل المشترك
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* ID Reference */}
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Hash className="h-3 w-3" />
              <span>معرف المشترك:</span>
              <code className="bg-background px-2 py-1 rounded">{subscriber.id}</code>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">{subscriber.name}</h3>
                {subscriber.username && (
                  <Badge variant="outline" className="mt-2">
                    <User className="h-3 w-3 ml-1" />
                    {subscriber.username}
                  </Badge>
                )}
              </div>
              <div className="text-left">
                <div className="text-sm text-muted-foreground">الرصيد</div>
                <div className={`text-2xl font-bold ${subscriber.balance < 0 ? 'text-destructive' : 'text-success'}`}>
                  {subscriber.balance.toLocaleString()} ع.د
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              معلومات الاتصال
            </h4>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">الهاتف الأساسي</div>
                  <div className="font-medium">{subscriber.phone}</div>
                </div>
              </div>
              {subscriber.phone_secondary && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-info" />
                  <div>
                    <div className="text-sm text-muted-foreground">الهاتف الثانوي</div>
                    <div className="font-medium">{subscriber.phone_secondary}</div>
                  </div>
                </div>
              )}
              {subscriber.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">البريد الإلكتروني</div>
                    <div className="font-medium">{subscriber.email}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Address Info */}
          {(subscriber.address || subscriber.address_notes) && (
            <>
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  معلومات العنوان
                </h4>
                {subscriber.address && (
                  <div>
                    <div className="text-sm text-muted-foreground">العنوان</div>
                    <div className="font-medium">{subscriber.address}</div>
                  </div>
                )}
                {subscriber.address_notes && (
                  <div>
                    <div className="text-sm text-muted-foreground">ملاحظات العنوان</div>
                    <div className="text-sm">{subscriber.address_notes}</div>
                  </div>
                )}
              </div>
              <Separator />
            </>
          )}

          {/* Plan & Status */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              الخطة والحالة
            </h4>
            <div className="grid gap-3">
              {subscriber.plan && (
                <div>
                  <div className="text-sm text-muted-foreground">الخطة</div>
                  <Badge className="mt-1">{subscriber.plan}</Badge>
                </div>
              )}
              {subscriber.status_comment && (
                <div>
                  <div className="text-sm text-muted-foreground">ملاحظات الحالة</div>
                  <div className="text-sm">{subscriber.status_comment}</div>
                </div>
              )}
              {subscriber.created_at && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">تاريخ التسجيل</div>
                    <div className="text-sm font-medium">
                      {new Date(subscriber.created_at).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              )}
              {subscriber.updated_at && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">آخر تحديث</div>
                    <div className="text-sm font-medium">
                      {new Date(subscriber.updated_at).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location Info */}
          {(subscriber.latitude && subscriber.longitude) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  الموقع الجغرافي
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">خط العرض</div>
                    <div className="font-mono text-sm">{subscriber.latitude}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">خط الطول</div>
                    <div className="font-mono text-sm">{subscriber.longitude}</div>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${subscriber.latitude},${subscriber.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  <MapPin className="h-3 w-3" />
                  عرض على الخريطة
                </a>
              </div>
            </>
          )}

          {/* Created By Info */}
          {subscriber.created_by && (
            <>
              <Separator />
              <div className="bg-muted/30 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>تم الإنشاء بواسطة:</span>
                  <code className="bg-background px-2 py-1 rounded">{subscriber.created_by}</code>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
