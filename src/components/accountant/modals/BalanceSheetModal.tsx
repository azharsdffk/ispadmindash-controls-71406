import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BalanceSheet } from '@/components/accountant/BalanceSheet';
import { BarChart3 } from 'lucide-react';

interface BalanceSheetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BalanceSheetModal = ({ open, onOpenChange }: BalanceSheetModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg gradient-bg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            الميزانية العمومية
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <BalanceSheet />
        </div>
      </DialogContent>
    </Dialog>
  );
};
