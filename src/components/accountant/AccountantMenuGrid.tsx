import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Grid3X3, List } from 'lucide-react';
import { accountantMenuItems } from '@/config/accountantMenu';
import { usePermissions } from '@/hooks/usePermissions';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import {
  AccountingEntriesModal,
  GeneralLedgerModal,
  BalanceSheetModal,
  IncomeStatementModal,
  CashFlowModal,
  AdvancedReportsModal,
} from './modals';

type ModalType = 'entries' | 'ledger' | 'balance' | 'income' | 'cashflow' | 'reports' | null;

export const AccountantMenuGrid = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { layout, updateViewMode } = useDashboardLayout();
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // تصفية القائمة حسب الصلاحيات
  const filteredMenuItems = accountantMenuItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  // ترتيب القائمة
  const sortedMenuItems = layout.iconOrder.length > 0
    ? layout.iconOrder
        .map(id => filteredMenuItems.find(item => item.id === id))
        .filter(Boolean)
    : filteredMenuItems;

  const handleItemClick = (item: typeof accountantMenuItems[0]) => {
    // التحقق من الأيقونات التي تفتح نوافذ منبثقة
    const modalItems: ModalType[] = ['entries', 'ledger', 'balance', 'income', 'cashflow', 'reports'];
    
    if (modalItems.includes(item.id as ModalType)) {
      setActiveModal(item.id as ModalType);
    } else {
      // التنقل للصفحات الأخرى
      navigate(item.path);
    }
  };

  const isGridView = layout.viewMode === 'grid';

  return (
    <>
      {/* View Mode Toggle */}
      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant={isGridView ? "default" : "ghost"}
            size="sm"
            onClick={() => updateViewMode('grid')}
            className="h-8 w-8 p-0"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={!isGridView ? "default" : "ghost"}
            size="sm"
            onClick={() => updateViewMode('list')}
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Menu Grid */}
      <div className={`grid gap-4 ${isGridView ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' : 'grid-cols-1'}`}>
        {sortedMenuItems.map((item) => {
          if (!item) return null;
          const Icon = item.icon;
          
          return (
            <Card 
              key={item.id}
              className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary/30 ${
                isGridView ? 'p-0' : ''
              }`}
              onClick={() => handleItemClick(item)}
            >
              <CardContent className={`flex items-center gap-4 ${isGridView ? 'flex-col p-6 text-center' : 'p-4'}`}>
                <div className={`p-3 rounded-xl gradient-bg transition-transform duration-300 group-hover:scale-110 ${
                  isGridView ? 'p-4' : ''
                }`}>
                  <Icon className={`text-white ${isGridView ? 'h-8 w-8' : 'h-6 w-6'}`} />
                </div>
                <div className={isGridView ? '' : 'flex-1'}>
                  <h3 className={`font-bold text-foreground ${isGridView ? 'text-sm' : 'text-base'}`}>
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modals */}
      <AccountingEntriesModal 
        open={activeModal === 'entries'} 
        onOpenChange={(open) => !open && setActiveModal(null)} 
      />
      <GeneralLedgerModal 
        open={activeModal === 'ledger'} 
        onOpenChange={(open) => !open && setActiveModal(null)} 
      />
      <BalanceSheetModal 
        open={activeModal === 'balance'} 
        onOpenChange={(open) => !open && setActiveModal(null)} 
      />
      <IncomeStatementModal 
        open={activeModal === 'income'} 
        onOpenChange={(open) => !open && setActiveModal(null)} 
      />
      <CashFlowModal 
        open={activeModal === 'cashflow'} 
        onOpenChange={(open) => !open && setActiveModal(null)} 
      />
      <AdvancedReportsModal 
        open={activeModal === 'reports'} 
        onOpenChange={(open) => !open && setActiveModal(null)} 
      />
    </>
  );
};
