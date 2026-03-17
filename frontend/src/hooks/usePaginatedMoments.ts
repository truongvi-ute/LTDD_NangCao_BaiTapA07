import { useState, useCallback } from 'react';
import { Moment, PageResponse } from '@/src/services/momentService';

interface UsePaginatedMomentsOptions {
  fetchFunction: (page: number, size: number) => Promise<PageResponse<Moment>>;
  pageSize?: number;
}

export const usePaginatedMoments = ({ 
  fetchFunction, 
  pageSize = 10 
}: UsePaginatedMomentsOptions) => {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadMoments = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
      }
      
      const response = await fetchFunction(pageNum, pageSize);
      console.log(`Loaded page ${pageNum}: ${response.content.length} moments`);
      
      if (append) {
        setMoments(prev => [...prev, ...response.content]);
      } else {
        setMoments(response.content);
      }
      
      setHasMore(!response.last);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading moments:', error);
      if (!append) {
        setMoments([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [fetchFunction, pageSize]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || loading) return;
    
    console.log('Loading more moments, next page:', page + 1);
    setLoadingMore(true);
    loadMoments(page + 1, true);
  }, [loadingMore, hasMore, loading, page, loadMoments]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    await loadMoments(0, false);
    setRefreshing(false);
  }, [loadMoments]);

  return {
    moments,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    loadMoments,
    loadMore,
    refresh,
  };
};
