import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SubscriberAuditTrail } from "@/components/subscribers/SubscriberAuditTrail";

interface SubscriberAuditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriberId: string;
  subscriberName: string;
}

export const SubscriberAuditModal = ({
  open,
  onOpenChange,
  subscriberId,
  subscriberName,
}: SubscriberAuditModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl">سجل التدقيق - {subscriberName}</DialogTitle>
        </DialogHeader>
        <SubscriberAuditTrail subscriberId={subscriberId} />
      </DialogContent>
    </Dialog>
  );
};
