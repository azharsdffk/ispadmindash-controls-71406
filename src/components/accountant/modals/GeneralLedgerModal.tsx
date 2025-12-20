import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GeneralLedger } from '@/components/accountant/GeneralLedger';
import { BookOpen } from 'lucide-react';

interface GeneralLedgerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GeneralLedgerModal = ({ open, onOpenChange }: GeneralLedgerModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg gradient-bg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            دفتر الأستاذ
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <GeneralLedger />
        </div>
      </DialogContent>
    </Dialog>
  );
};
