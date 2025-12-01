import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Search, Phone, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";

interface SubscribersListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Subscriber = {
  id: string;
  name: string;
  phone: string;
  address?: string;
  plan?: string;
  balance: number;
  created_at?: string;
};

export const SubscribersListModal = ({ open, onOpenChange }: SubscribersListModalProps) => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (open) {
      fetchSubscribers();
    }
  }, [open]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = subscribers.filter(
        (sub) =>
          sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.phone.includes(searchTerm) ||
          (sub.address && sub.address.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredSubscribers(filtered);
    } else {
      setFilteredSubscribers(subscribers);
    }
  }, [searchTerm, subscribers]);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("subscribers")
        .select("id, name, phone, address, plan, balance, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setSubscribers(data || []);
      setFilteredSubscribers(data || []);
    } catch (error) {
      console.error("Error fetching subscribers:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="h-6 w-6 text-primary" />
            قائمة المشتركين ({subscribers.length})
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو رقم الهاتف أو العنوان..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : filteredSubscribers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "لا توجد نتائج للبحث" : "لا يوجد مشتركين"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>الباقة</TableHead>
                  <TableHead>الرصيد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscribers.map((subscriber) => (
                  <TableRow key={subscriber.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{subscriber.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {subscriber.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      {subscriber.address ? (
                        <div className="flex items-center gap-1 max-w-[200px] truncate">
                          <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{subscriber.address}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {subscriber.plan ? (
                        <Badge variant="secondary">{subscriber.plan}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={subscriber.balance < 0 ? "text-destructive font-medium" : "text-success font-medium"}>
                        {formatCurrency(subscriber.balance, "IQD")}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <span className="text-sm text-muted-foreground">
            عرض {filteredSubscribers.length} من {subscribers.length} مشترك
          </span>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
