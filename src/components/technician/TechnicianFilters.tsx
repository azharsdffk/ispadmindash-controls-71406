import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Bell } from 'lucide-react';

interface TechnicianFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  priorityFilter: string;
  onPriorityChange: (value: string) => void;
}

export const TechnicianFilters = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
}: TechnicianFiltersProps) => {
  return (
    <div className="flex gap-3 flex-wrap">
      <div className="flex-1 min-w-[300px] relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="🔍 ابحث عن تذكرة..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pr-12 h-12 glass-input"
        />
      </div>
      
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[180px] h-12 glass-input">
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue placeholder="حسب الحالة" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">جميع الحالات</SelectItem>
          <SelectItem value="open">مفتوحة</SelectItem>
          <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
          <SelectItem value="resolved">منجزة</SelectItem>
          <SelectItem value="closed">مغلقة</SelectItem>
        </SelectContent>
      </Select>

      <Select value={priorityFilter} onValueChange={onPriorityChange}>
        <SelectTrigger className="w-[180px] h-12 glass-input">
          <Bell className="h-4 w-4 mr-2" />
          <SelectValue placeholder="حسب الأولوية" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">جميع الأولويات</SelectItem>
          <SelectItem value="urgent">عاجلة</SelectItem>
          <SelectItem value="high">عالية</SelectItem>
          <SelectItem value="medium">متوسطة</SelectItem>
          <SelectItem value="low">منخفضة</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
