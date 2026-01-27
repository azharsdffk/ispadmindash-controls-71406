import { useState, useCallback, useMemo } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  totalCount?: number;
}

interface UsePaginationReturn {
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startIndex: number;
  endIndex: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (size: number) => void;
  setTotalCount: (count: number) => void;
  resetPagination: () => void;
  getRangeForSupabase: () => { from: number; to: number };
}

/**
 * Hook لإدارة Pagination
 * يستخدم مع Supabase range queries
 */
export const usePagination = ({
  initialPage = 1,
  initialPageSize = 25,
  totalCount: initialTotalCount = 0
}: UsePaginationOptions = {}): UsePaginationReturn => {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(initialTotalCount);

  const totalPages = useMemo(() => {
    return Math.ceil(totalCount / pageSize) || 1;
  }, [totalCount, pageSize]);

  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize - 1, totalCount - 1);

  const goToPage = useCallback((newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages));
    setPage(validPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage(p => p + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setPage(p => p - 1);
    }
  }, [hasPreviousPage]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPage(1); // Reset to first page when page size changes
  }, []);

  const resetPagination = useCallback(() => {
    setPage(initialPage);
    setPageSizeState(initialPageSize);
  }, [initialPage, initialPageSize]);

  /**
   * الحصول على range للاستخدام مع Supabase
   */
  const getRangeForSupabase = useCallback(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    return { from, to };
  }, [page, pageSize]);

  return {
    page,
    pageSize,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    setTotalCount,
    resetPagination,
    getRangeForSupabase
  };
};

/**
 * Hook لتحميل البيانات مع Pagination
 */
export const usePaginatedQuery = <T>(
  queryFn: (range: { from: number; to: number }) => Promise<{ data: T[]; count: number }>,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const pagination = usePagination();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const range = pagination.getRangeForSupabase();
      const result = await queryFn(range);
      setData(result.data);
      pagination.setTotalCount(result.count);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, ...dependencies]);

  return {
    data,
    loading,
    error,
    pagination,
    refetch: fetchData
  };
};

export default usePagination;
