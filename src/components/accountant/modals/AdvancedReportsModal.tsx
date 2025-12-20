import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AdvancedReports } from '@/components/accountant/AdvancedReports';
import { PieChart } from 'lucide-react';

interface AdvancedReportsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AdvancedReportsModal = ({ open, onOpenChange }: AdvancedReportsModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg gradient-bg">
              <PieChart className="h-5 w-5 text-white" />
            </div>
            التقارير المتقدمة
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <AdvancedReports />
        </div>
      </DialogContent>
    </Dialog>
  );
};
