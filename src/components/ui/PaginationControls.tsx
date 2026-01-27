import { Button } from "./button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showPageSize?: boolean;
  showInfo?: boolean;
  className?: string;
}

export const PaginationControls = ({
  page,
  pageSize,
  totalPages,
  totalCount,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSize = true,
  showInfo = true,
  className
}: PaginationControlsProps) => {
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  // Generate visible page numbers
  const getVisiblePages = () => {
    const delta = 2;
    const range: (number | string)[] = [];
    
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= page - delta && i <= page + delta)
      ) {
        range.push(i);
      } else if (range[range.length - 1] !== '...') {
        range.push('...');
      }
    }
    
    return range;
  };

  return (
    <div className={cn(
      "flex flex-col sm:flex-row items-center justify-between gap-4 py-4",
      className
    )}>
      {/* Info */}
      {showInfo && (
        <div className="text-sm text-muted-foreground order-2 sm:order-1">
          عرض <span className="font-semibold text-foreground">{startItem}</span>
          {" - "}
          <span className="font-semibold text-foreground">{endItem}</span>
          {" من "}
          <span className="font-semibold text-foreground">{totalCount.toLocaleString('ar-IQ')}</span>
          {" عنصر"}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2 order-1 sm:order-2">
        {/* Page Size Selector */}
        {showPageSize && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              عرض:
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="w-[70px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          {/* First Page */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => onPageChange(1)}
            disabled={!hasPreviousPage}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>

          {/* Previous Page */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPreviousPage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Page Numbers */}
          <div className="hidden md:flex items-center gap-1">
            {getVisiblePages().map((pageNum, idx) => (
              pageNum === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                  ...
                </span>
              ) : (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "h-9 w-9",
                    page === pageNum && "btn-futuristic"
                  )}
                  onClick={() => onPageChange(pageNum as number)}
                >
                  {pageNum}
                </Button>
              )
            ))}
          </div>

          {/* Page indicator for mobile */}
          <div className="md:hidden px-3 py-2 text-sm font-medium">
            {page} / {totalPages}
          </div>

          {/* Next Page */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNextPage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Last Page */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => onPageChange(totalPages)}
            disabled={!hasNextPage}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaginationControls;
