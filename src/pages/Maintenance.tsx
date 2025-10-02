import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wrench, Plus, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { MaintenanceTicketModal } from "@/components/modals/MaintenanceTicketModal";
import { ScheduleTechnicianModal } from "@/components/modals/ScheduleTechnicianModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Ticket = {
  id: string;
  ticket_number: string;
  issue_description: string;
  status: string;
  priority: string;
  created_at: string;
  subscribers?: {
    name: string;
  };
};

const Maintenance = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [maintenanceTicketOpen, setMaintenanceTicketOpen] = useState(false);
  const [scheduleTechOpen, setScheduleTechOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_tickets')
        .select(`
          *,
          subscribers (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      toast.error("فشل تحميل التذاكر: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      open: { label: 'مفتوحة', variant: 'secondary' },
      in_progress: { label: 'قيد المعالجة', variant: 'default' },
      resolved: { label: 'محلولة', variant: 'outline' },
      closed: { label: 'مغلقة', variant: 'destructive' },
    };
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      low: { label: 'منخفضة', variant: 'secondary' },
      medium: { label: 'متوسطة', variant: 'default' },
      high: { label: 'عالية', variant: 'destructive' },
    };
    const priorityInfo = priorityMap[priority] || { label: priority, variant: 'default' as const };
    return <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1 w-full">
        <AppSidebar />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wrench className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">الصيانة</h1>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setMaintenanceTicketOpen(true)}>
                  <Plus className="h-5 w-5 ml-2" />
                  تذكرة جديدة
                </Button>
                <Button onClick={() => setScheduleTechOpen(true)} variant="secondary">
                  <Calendar className="h-5 w-5 ml-2" />
                  جدولة فني
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>تذاكر الصيانة ({tickets.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">جاري التحميل...</div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا يوجد تذاكر صيانة حالياً. أضف تذكرة جديدة للبدء.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم التذكرة</TableHead>
                        <TableHead>المشترك</TableHead>
                        <TableHead>المشكلة</TableHead>
                        <TableHead>الأولوية</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium">{ticket.ticket_number}</TableCell>
                          <TableCell>{ticket.subscribers?.name}</TableCell>
                          <TableCell className="max-w-xs truncate">{ticket.issue_description}</TableCell>
                          <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                          <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                          <TableCell>{new Date(ticket.created_at).toLocaleDateString('ar-IQ')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <MaintenanceTicketModal 
        open={maintenanceTicketOpen} 
        onOpenChange={setMaintenanceTicketOpen}
        onSuccess={fetchTickets}
      />
      <ScheduleTechnicianModal open={scheduleTechOpen} onOpenChange={setScheduleTechOpen} />
    </div>
  );
};

export default Maintenance;
