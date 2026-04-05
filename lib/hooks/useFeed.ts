'use client';

import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import { feedApi, FeedResponse, FeedFilters } from '@/lib/api/feed';
import { bookmarksApi } from '@/lib/api/bookmarks';

export type FeedMode = 'global' | 'following' | 'saved';

export const feedKeys = {
  all: ['feed'] as const,
  tab: (tab: FeedMode, filters: FeedFilters) => ['feed', tab, filters] as const,
};

async function fetchFeedPage(
  tab: FeedMode,
  filters: FeedFilters,
  cursor: string | undefined
): Promise<FeedResponse> {
  if (tab === 'global') return feedApi.getGlobal(cursor, filters);
  if (tab === 'following') return feedApi.getFollowing(cursor, filters);
  return bookmarksApi.getFeed(cursor, filters);
}

export function useFeed(tab: FeedMode, filters: FeedFilters = {}) {
  return useInfiniteQuery({
    queryKey: feedKeys.tab(tab, filters),
    queryFn: ({ pageParam }) => fetchFeedPage(tab, filters, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 5 * 60 * 1000, // 5 min — warm cache after navigation
    gcTime: 30 * 60 * 1000, // 30 min — keep in memory
  });
}
