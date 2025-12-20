import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { IncomeStatement } from '@/components/accountant/IncomeStatement';
import { TrendingUp } from 'lucide-react';

interface IncomeStatementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const IncomeStatementModal = ({ open, onOpenChange }: IncomeStatementModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg gradient-bg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            قائمة الدخل
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <IncomeStatement />
        </div>
      </DialogContent>
    </Dialog>
  );
};
