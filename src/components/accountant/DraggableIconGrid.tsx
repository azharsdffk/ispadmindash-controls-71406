import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableIconItem } from './SortableIconItem';
import { Button } from '@/components/ui/button';
import { Grid3x3, List, Save } from 'lucide-react';
import { toast } from 'sonner';

export interface IconItem {
  id: string;
  title: string;
  icon: any;
  path: string;
  description?: string;
}

interface DraggableIconGridProps {
  items: IconItem[];
  onReorder: (newOrder: string[]) => Promise<void>;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}

export const DraggableIconGrid = ({
  items,
  onReorder,
  viewMode = 'grid',
  onViewModeChange,
}: DraggableIconGridProps) => {
  const [activeItems, setActiveItems] = useState(items);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setActiveItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        setHasChanges(true);
        return newOrder;
      });
    }
  };

  const handleSave = async () => {
    try {
      const newOrder = activeItems.map((item) => item.id);
      await onReorder(newOrder);
      setHasChanges(false);
      toast.success('تم حفظ الترتيب الجديد');
    } catch (error) {
      toast.error('فشل حفظ الترتيب');
    }
  };

  const handleReset = () => {
    setActiveItems(items);
    setHasChanges(false);
  };

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange?.('grid')}
          >
            <Grid3x3 className="h-4 w-4 ml-2" />
            شبكة
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange?.('list')}
          >
            <List className="h-4 w-4 ml-2" />
            قائمة
          </Button>
        </div>

        {hasChanges && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              إلغاء
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 ml-2" />
              حفظ الترتيب
            </Button>
          </div>
        )}
      </div>

      {/* Icons Grid/List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={activeItems.map((item) => item.id)}
          strategy={rectSortingStrategy}
        >
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
                : 'flex flex-col gap-2'
            }
          >
            {activeItems.map((item) => (
              <SortableIconItem
                key={item.id}
                id={item.id}
                item={item}
                viewMode={viewMode}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {hasChanges && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            لديك تغييرات غير محفوظة. اضغط "حفظ الترتيب" للاحتفاظ بالترتيب الجديد.
          </p>
        </div>
      )}
    </div>
  );
};
