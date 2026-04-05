'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQueryClient, InfiniteData } from '@tanstack/react-query';
import { FeedFilters, FeedResponse, feedApi } from '@/lib/api/feed';
import { bookmarksApi } from '@/lib/api/bookmarks';
import { feedKeys, FeedMode } from './useFeed';

async function fetchFeedPageForProbe(
  tab: FeedMode,
  filters: FeedFilters
): Promise<FeedResponse> {
  if (tab === 'global') return feedApi.getGlobal(undefined, filters);
  if (tab === 'following') return feedApi.getFollowing(undefined, filters);
  return bookmarksApi.getFeed(undefined, filters);
}

export function useNewItemsProbe(
  tab: FeedMode,
  filters: FeedFilters = {},
  enabled: boolean = true,
  intervalMs: number = 60_000
) {
  const queryClient = useQueryClient();
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setNewCount(0);
      return;
    }

    const probe = async () => {
      try {
        const fresh = await fetchFeedPageForProbe(tab, filters);
        const cached = queryClient.getQueryData<InfiniteData<FeedResponse>>(
          feedKeys.tab(tab, filters)
        );

        const cachedFirstId = cached?.pages[0]?.items[0]?._id;
        const freshFirstId = fresh.items[0]?._id;

        if (cachedFirstId && freshFirstId && cachedFirstId !== freshFirstId) {
          // Count how many items in `fresh.items` are not in first cached page
          const cachedIds = new Set(cached!.pages[0].items.map((i) => i._id));
          const count = fresh.items.filter((i) => !cachedIds.has(i._id)).length;
          setNewCount(count);
        }
      } catch {
        // Silently ignore — this is a background probe
      }
    };

    // Initial probe immediately
    probe();

    const id = setInterval(probe, intervalMs);
    return () => clearInterval(id);
  }, [tab, filters, enabled, intervalMs, queryClient]);

  const reset = useCallback(() => setNewCount(0), []);

  return { newCount, reset };
}
