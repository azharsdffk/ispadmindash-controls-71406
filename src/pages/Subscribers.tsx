import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserPlus, MapPin, Phone, Mail, Edit2, Trash2, Shield, History } from "lucide-react";
import { useState, useEffect } from "react";
import { AddSubscriberModal } from "@/components/modals/AddSubscriberModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { SubscriberAuditModal } from "@/components/modals/SubscriberAuditModal";
import { SubscriberDetailsModal } from "@/components/modals/SubscriberDetailsModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteConfirmDialog } from "@/components/modals/DeleteConfirmDialog";

type Subscriber = {
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
};

const Subscribers = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addSubscriberOpen, setAddSubscriberOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState<{ id: string; name: string } | null>(null);
  const [selectedSubscriberDetails, setSelectedSubscriberDetails] = useState<Subscriber | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, isAccountant, isTechnician, loading: roleLoading } = useUserRole();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subscriberToDelete, setSubscriberToDelete] = useState<{ id: string; name: string } | null>(null);

  const openAuditModal = (subscriber: Subscriber) => {
    setSelectedSubscriber({ id: subscriber.id, name: subscriber.name });
    setAuditModalOpen(true);
  };

  const openDetailsModal = (subscriber: Subscriber) => {
    setSelectedSubscriberDetails(subscriber);
    setDetailsModalOpen(true);
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

  const handleDeleteClick = (id: string, name: string) => {
    setSubscriberToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!subscriberToDelete) return;

    try {
      const { error } = await supabase
        .from('subscribers')
        .delete()
        .eq('id', subscriberToDelete.id);

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
                        <TableHead>اسم المستخدم</TableHead>
                        <TableHead>الهاتف الأساسي</TableHead>
                        <TableHead>الهاتف الثاني</TableHead>
                        <TableHead>البريد</TableHead>
                        <TableHead>العنوان</TableHead>
                        <TableHead>الخطة</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الرصيد</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscribers.map((subscriber) => (
                        <TableRow key={subscriber.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell 
                            className="font-medium cursor-pointer hover:text-primary transition-colors"
                            onClick={() => openDetailsModal(subscriber)}
                          >
                            {subscriber.name}
                          </TableCell>
                          <TableCell>
                            {subscriber.username ? (
                              <span className="text-sm px-2 py-1 bg-accent/10 rounded-md">
                                {subscriber.username}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              {subscriber.phone}
                            </div>
                          </TableCell>
                          <TableCell>
                            {subscriber.phone_secondary ? (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-info" />
                                {subscriber.phone_secondary}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
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
                                <span className="max-w-[150px] truncate" title={subscriber.address}>
                                  {subscriber.address}
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {subscriber.plan ? (
                              <span className="px-2 py-1 bg-gradient-primary text-primary-foreground rounded-md text-sm font-medium">
                                {subscriber.plan}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {subscriber.status_comment ? (
                              <span className="text-sm text-muted-foreground max-w-[120px] truncate block" title={subscriber.status_comment}>
                                {subscriber.status_comment}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className={subscriber.balance < 0 ? "text-destructive font-bold" : "text-success font-bold"}>
                            {subscriber.balance.toLocaleString()} ع.د
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => openAuditModal(subscriber)}
                                title="سجل التدقيق"
                                className="hover:bg-info/10"
                              >
                                <History className="h-4 w-4 text-info" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                title="تعديل"
                                className="hover:bg-primary/10"
                              >
                                <Edit2 className="h-4 w-4 text-primary" />
                              </Button>
                              {isAdmin && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDeleteClick(subscriber.id, subscriber.name)}
                                  title="حذف"
                                  className="hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
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

      <SubscriberDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        subscriber={selectedSubscriberDetails}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="حذف مشترك"
        description="هل أنت متأكد من حذف هذا المشترك؟ سيتم حذف جميع البيانات المتعلقة به. لا يمكن التراجع عن هذا الإجراء."
        itemName={subscriberToDelete?.name}
      />
    </div>
  );
};

export default Subscribers;
