import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { GripVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface IconItem {
  id: string;
  title: string;
  icon: any;
  path: string;
  description?: string;
}

interface SortableIconItemProps {
  id: string;
  item: IconItem;
  viewMode: 'grid' | 'list';
}

export const SortableIconItem = ({ id, item, viewMode }: SortableIconItemProps) => {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = item.icon;

  if (viewMode === 'list') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'group transition-all',
          isDragging && 'opacity-50 z-50'
        )}
      >
        <Card
          className="cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all"
          onClick={() => navigate(item.path)}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{item.title}</h3>
              {item.description && (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group transition-all',
        isDragging && 'opacity-50 z-50'
      )}
    >
      <Card
        className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all relative overflow-hidden"
        onClick={() => navigate(item.path)}
      >
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 cursor-grab active:cursor-grabbing p-1.5 bg-background/80 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[140px]">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base">{item.title}</h3>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
