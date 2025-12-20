import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AccountingEntries } from '@/components/accountant/AccountingEntries';
import { FileText } from 'lucide-react';

interface AccountingEntriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AccountingEntriesModal = ({ open, onOpenChange }: AccountingEntriesModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg gradient-bg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            القيود المحاسبية
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <AccountingEntries />
        </div>
      </DialogContent>
    </Dialog>
  );
};
