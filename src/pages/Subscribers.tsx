import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserPlus, MapPin, Phone, Mail, Edit, Trash2, Shield, History } from "lucide-react";
import { useState, useEffect } from "react";
import { AddSubscriberModal } from "@/components/modals/AddSubscriberModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { SubscriberAuditModal } from "@/components/modals/SubscriberAuditModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Subscriber = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  plan?: string;
  balance: number;
};

const Subscribers = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addSubscriberOpen, setAddSubscriberOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState<{ id: string; name: string } | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, isAccountant, isTechnician, loading: roleLoading } = useUserRole();

  const openAuditModal = (subscriber: Subscriber) => {
    setSelectedSubscriber({ id: subscriber.id, name: subscriber.name });
    setAuditModalOpen(true);
  };

  const fetchSubscribers = async () => {
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscribers(data || []);

      // Track PII access for compliance
      if (data && data.length > 0) {
        const { trackSubscriberView } = await import('@/utils/piiTracking');
        data.forEach(subscriber => trackSubscriberView(subscriber.id));
      }
    } catch (error: any) {
      toast.error("فشل تحميل المشتركين: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المشترك؟")) return;

    try {
      const { error } = await supabase
        .from('subscribers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("تم حذف المشترك بنجاح");
      fetchSubscribers();
    } catch (error: any) {
      toast.error("فشل حذف المشترك: " + error.message);
    }
  };

  useEffect(() => {
    if (!roleLoading) {
      fetchSubscribers();
    }
  }, [roleLoading]);

  const canManageSubscribers = isAdmin || isAccountant;
  const hasAccess = isAdmin || isAccountant || isTechnician;

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1 w-full">
        <AppSidebar />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">المشتركين</h1>
              </div>
              {canManageSubscribers && (
                <Button onClick={() => setAddSubscriberOpen(true)}>
                  <UserPlus className="h-5 w-5 ml-2" />
                  إضافة مشترك
                </Button>
              )}
            </div>

            {!hasAccess && (
              <Alert variant="destructive">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  ليس لديك صلاحية الوصول إلى بيانات المشتركين. يرجى الاتصال بالمسؤول لتعيين الدور المناسب.
                </AlertDescription>
              </Alert>
            )}

            {hasAccess && (
              <Card>
              <CardHeader>
                <CardTitle>قائمة المشتركين ({subscribers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">جاري التحميل...</div>
                ) : subscribers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا يوجد مشتركين حالياً. أضف مشترك جديد للبدء.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>الهاتف</TableHead>
                        <TableHead>البريد</TableHead>
                        <TableHead>العنوان</TableHead>
                        <TableHead>الخطة</TableHead>
                        <TableHead>الرصيد</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscribers.map((subscriber) => (
                        <TableRow key={subscriber.id}>
                          <TableCell className="font-medium">{subscriber.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              {subscriber.phone}
                            </div>
                          </TableCell>
                          <TableCell>
                            {subscriber.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                {subscriber.email}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {subscriber.address && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                {subscriber.address}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{subscriber.plan || "-"}</TableCell>
                          <TableCell className={subscriber.balance < 0 ? "text-destructive" : "text-success"}>
                            {subscriber.balance.toLocaleString()} ع.د
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => openAuditModal(subscriber)}
                                title="سجل التدقيق"
                              >
                                <History className="h-4 w-4 text-info" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDelete(subscriber.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            )}
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <AddSubscriberModal 
        open={addSubscriberOpen} 
        onOpenChange={setAddSubscriberOpen}
        onSuccess={fetchSubscribers}
      />
      {selectedSubscriber && (
        <SubscriberAuditModal
          open={auditModalOpen}
          onOpenChange={setAuditModalOpen}
          subscriberId={selectedSubscriber.id}
          subscriberName={selectedSubscriber.name}
        />
      )}
    </div>
  );
};

export default Subscribers;
