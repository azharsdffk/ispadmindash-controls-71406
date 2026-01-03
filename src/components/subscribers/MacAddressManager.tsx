import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, Lock, Unlock, History, Save, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MacAddressManagerProps {
  subscriberId: string;
  subscriberName: string;
  currentMac?: string | null;
  isLocked?: boolean;
  onUpdate?: () => void;
}

interface MacHistory {
  id: string;
  mac_address: string;
  action: string;
  changed_at: string;
  notes: string | null;
}

export const MacAddressManager = ({
  subscriberId,
  subscriberName,
  currentMac,
  isLocked = false,
  onUpdate
}: MacAddressManagerProps) => {
  const [macAddress, setMacAddress] = useState(currentMac || '');
  const [locked, setLocked] = useState(isLocked);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<MacHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Validate MAC address format
  const isValidMac = (mac: string) => {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(mac) || mac === '';
  };

  // Format MAC address as user types
  const formatMacAddress = (value: string) => {
    // Remove all non-hex characters
    const cleaned = value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
    
    // Add colons every 2 characters
    const formatted = cleaned.match(/.{1,2}/g)?.join(':') || cleaned;
    
    return formatted.substring(0, 17); // Max length: XX:XX:XX:XX:XX:XX
  };

  const handleMacChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMacAddress(formatMacAddress(e.target.value));
  };

  const saveMacAddress = async () => {
    if (macAddress && !isValidMac(macAddress)) {
      toast.error('صيغة MAC Address غير صحيحة');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update subscriber
      const { error: updateError } = await supabase
        .from('subscribers')
        .update({
          mac_address: macAddress || null,
          mac_locked: locked
        })
        .eq('id', subscriberId);

      if (updateError) throw updateError;

      // Log the change
      const action = macAddress 
        ? (locked ? 'locked' : 'added') 
        : 'removed';
      
      await supabase
        .from('mac_address_history')
        .insert({
          subscriber_id: subscriberId,
          mac_address: macAddress || 'N/A',
          action,
          changed_by: user?.id,
          notes: locked ? 'MAC مقفل' : null
        });

      toast.success('تم حفظ MAC Address بنجاح');
      onUpdate?.();
    } catch (error) {
      console.error('Error saving MAC:', error);
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('mac_address_history')
        .select('*')
        .eq('subscriber_id', subscriberId)
        .order('changed_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('خطأ في تحميل السجل');
    } finally {
      setLoadingHistory(false);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'added':
        return <Badge variant="default">إضافة</Badge>;
      case 'removed':
        return <Badge variant="destructive">إزالة</Badge>;
      case 'locked':
        return <Badge className="bg-amber-500">قفل</Badge>;
      case 'unlocked':
        return <Badge variant="secondary">فتح</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wifi className="h-5 w-5 text-primary" />
          إدارة MAC Address
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mac">MAC Address</Label>
          <div className="flex gap-2">
            <Input
              id="mac"
              value={macAddress}
              onChange={handleMacChange}
              placeholder="XX:XX:XX:XX:XX:XX"
              className="font-mono"
              dir="ltr"
            />
            {macAddress && !isValidMac(macAddress) && (
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-2" />
            )}
          </div>
          {macAddress && !isValidMac(macAddress) && (
            <p className="text-xs text-destructive">صيغة غير صحيحة</p>
          )}
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            {locked ? (
              <Lock className="h-4 w-4 text-amber-500" />
            ) : (
              <Unlock className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">
              {locked ? 'MAC مقفل - لا يمكن تغيير الجهاز' : 'MAC غير مقفل'}
            </span>
          </div>
          <Switch
            checked={locked}
            onCheckedChange={setLocked}
            disabled={!macAddress}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={saveMacAddress}
            disabled={saving || (macAddress && !isValidMac(macAddress))}
            className="flex-1"
          >
            <Save className="h-4 w-4 ml-2" />
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </Button>

          <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                onClick={() => {
                  setHistoryOpen(true);
                  loadHistory();
                }}
              >
                <History className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>سجل MAC Address - {subscriberName}</DialogTitle>
              </DialogHeader>
              
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : history.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>MAC Address</TableHead>
                      <TableHead>الإجراء</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs" dir="ltr">
                          {item.mac_address}
                        </TableCell>
                        <TableCell>{getActionBadge(item.action)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(item.changed_at).toLocaleString('ar-IQ')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  لا يوجد سجل
                </p>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};
