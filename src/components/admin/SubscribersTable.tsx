import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Search, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { SubscriberDetailsModal } from '@/components/modals/SubscriberDetailsModal';

export const SubscribersTable = () => {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState<any>(null);

  useEffect(() => {
    fetchSubscribers();

    const channel = supabase
      .channel('admin-subscribers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscribers' }, fetchSubscribers)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSubscribers = async () => {
    try {
      const { data } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      setSubscribers(data || []);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscribers = subscribers.filter(sub =>
    sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openSubscriberDetails = (subscriber: any) => {
    setSelectedSubscriber(subscriber);
    setDetailsModalOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">إدارة المشتركين</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 w-64"
              />
            </div>
            <Button variant="default" className="bg-primary text-white hover:bg-primary/90">
              <Download className="h-4 w-4 ml-2" />
              تصدير
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم الكامل</TableHead>
                <TableHead>رقم الهاتف</TableHead>
                <TableHead>اسم المستخدم</TableHead>
                <TableHead>الخطة</TableHead>
                <TableHead>الرصيد</TableHead>
                <TableHead>العنوان</TableHead>
                <TableHead>تاريخ التسجيل</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscribers.map((subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell 
                    className="font-medium cursor-pointer hover:text-primary transition-colors"
                    onClick={() => openSubscriberDetails(subscriber)}
                  >
                    {subscriber.name}
                  </TableCell>
                  <TableCell>{subscriber.phone}</TableCell>
                  <TableCell>{subscriber.username || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{subscriber.plan || '-'}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className={Number(subscriber.balance) < 0 ? 'text-red-500 font-semibold' : 'text-green-500 font-semibold'}>
                      {formatCurrency(subscriber.balance, 'IQD')}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{subscriber.address || '-'}</TableCell>
                  <TableCell>{new Date(subscriber.created_at).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant="default" 
                      className="bg-primary text-white hover:bg-primary/90"
                      onClick={() => openSubscriberDetails(subscriber)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <SubscriberDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        subscriber={selectedSubscriber}
      />
    </Card>
  );
};
