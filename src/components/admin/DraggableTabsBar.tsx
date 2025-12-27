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
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { GripVertical, Save, RotateCcw, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface SortableTabProps {
  tab: TabItem;
  isEditMode: boolean;
}

const SortableTab = ({ tab, isEditMode }: SortableTabProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const IconComponent = tab.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        isDragging && 'opacity-50'
      )}
    >
      {isEditMode && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -top-1 -right-1 z-10 cursor-grab active:cursor-grabbing bg-blue-600 rounded-full p-0.5"
        >
          <GripVertical className="h-3 w-3 text-white" />
        </div>
      )}
      <TabsTrigger
        value={tab.id}
        className="gap-2 text-blue-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
        disabled={isEditMode}
      >
        <IconComponent className="h-4 w-4" />
        <span className="hidden lg:inline">{tab.label}</span>
      </TabsTrigger>
    </div>
  );
};

interface DraggableTabsBarProps {
  tabs: TabItem[];
  onReorder: (newOrder: string[]) => Promise<void>;
  onReset?: () => Promise<void>;
}

export const DraggableTabsBar = ({ tabs, onReorder, onReset }: DraggableTabsBarProps) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeItems, setActiveItems] = useState(tabs);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
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
      setIsEditMode(false);
      toast.success('تم حفظ الترتيب الجديد');
    } catch (error) {
      toast.error('فشل حفظ الترتيب');
    }
  };

  const handleReset = async () => {
    if (onReset) {
      await onReset();
      setActiveItems(tabs);
      setHasChanges(false);
      setIsEditMode(false);
    }
  };

  const handleCancel = () => {
    setActiveItems(tabs);
    setHasChanges(false);
    setIsEditMode(false);
  };

  // Update activeItems when tabs prop changes
  if (!isEditMode && JSON.stringify(activeItems.map(i => i.id)) !== JSON.stringify(tabs.map(t => t.id))) {
    setActiveItems(tabs);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-2 mb-2">
        {!isEditMode ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditMode(true)}
            className="gap-2 bg-slate-700/50 border-blue-800/30 text-blue-200 hover:bg-slate-600/50"
          >
            <Settings2 className="h-4 w-4" />
            تعديل الترتيب
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="gap-2 bg-slate-700/50 border-red-800/30 text-red-200 hover:bg-red-900/30"
            >
              إلغاء
            </Button>
            {onReset && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="gap-2 bg-slate-700/50 border-amber-800/30 text-amber-200 hover:bg-amber-900/30"
              >
                <RotateCcw className="h-4 w-4" />
                استعادة الافتراضي
              </Button>
            )}
            {hasChanges && (
              <Button
                size="sm"
                onClick={handleSave}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Save className="h-4 w-4" />
                حفظ الترتيب
              </Button>
            )}
          </>
        )}
      </div>

      {isEditMode ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={activeItems.map((item) => item.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="grid grid-cols-5 lg:grid-cols-10 w-full bg-slate-800/50 border border-blue-800/30 p-1 rounded-lg backdrop-blur-sm">
              {activeItems.map((tab) => (
                <SortableTab key={tab.id} tab={tab} isEditMode={isEditMode} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <TabsList className="grid grid-cols-5 lg:grid-cols-10 w-full bg-slate-800/50 border border-blue-800/30 p-1 rounded-lg backdrop-blur-sm">
          {activeItems.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="gap-2 text-blue-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <IconComponent className="h-4 w-4" />
                <span className="hidden lg:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      )}

      {isEditMode && (
        <p className="text-sm text-blue-300/70 text-center">
          اسحب التبويبات لإعادة ترتيبها ثم اضغط حفظ
        </p>
      )}
    </div>
  );
};
