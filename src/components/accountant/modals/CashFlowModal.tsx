import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CashFlowStatement } from '@/components/accountant/CashFlowStatement';
import { Wallet2 } from 'lucide-react';

interface CashFlowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CashFlowModal = ({ open, onOpenChange }: CashFlowModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg gradient-bg">
              <Wallet2 className="h-5 w-5 text-white" />
            </div>
            التدفقات النقدية
          </DialogTitle>
          <DialogDescription>
            عرض حركة النقدية الداخلة والخارجة
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <CashFlowStatement />
        </div>
      </DialogContent>
    </Dialog>
  );
};
