'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQueryClient, InfiniteData } from '@tanstack/react-query';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { FeedItem, FeedFilters, FeedResponse } from '@/lib/api/feed';
import { bookmarksApi } from '@/lib/api/bookmarks';
import { genusApi, Genus } from '@/lib/api/genus';
import { varietyApi, Variety } from '@/lib/api/variety';
import { FeedCard } from '@/components/feed/FeedCard';
import { useAuthStore } from '@/lib/store/authStore';
import { useFeed, feedKeys, FeedMode } from '@/lib/hooks/useFeed';
import { useNewItemsProbe } from '@/lib/hooks/useNewItemsProbe';
import { Globe, Users, Rss, RefreshCw, Bookmark, ArrowUp, SlidersHorizontal, X } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { ComboBox } from '@/components/ui/combobox';

const STORAGE_KEY = (mode: FeedMode) => `feedLastSeen_${mode}`;

export default function FeedPage() {
  const t = useTranslations('FeedPage');
  const user = useAuthStore((state) => state.user);
  const language = user?.preferredLanguage || 'ru';
  const locale = useLocale();
  const queryClient = useQueryClient();

  // Mode state
  const [mode, setMode] = useState<FeedMode>('global');
  const [lastSeenDate, setLastSeenDate] = useState<Date | null>(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [genusFilter, setGenusFilter] = useState('');
  const [varietyFilter, setVarietyFilter] = useState('');
  const [genusSearch, setGenusSearch] = useState('');
  const [varietySearch, setVarietySearch] = useState('');
  const [genera, setGenera] = useState<Genus[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [generaLoading, setGeneraLoading] = useState(false);

  // Pull-to-refresh state
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartYRef = useRef(0);
  const newItemIdsRef = useRef<Set<string>>(new Set());
  const PULL_THRESHOLD = 70;

  const [showScrollTop, setShowScrollTop] = useState(false);

  // Build active filters
  const activeFilters: FeedFilters = useMemo(
    () => ({
      genusId: genusFilter || undefined,
      varietyId: varietyFilter || undefined,
    }),
    [genusFilter, varietyFilter],
  );

  // Infinite queries for each mode
  const globalQuery = useFeed('global', activeFilters);
  const followingQuery = useFeed('following', activeFilters);
  const savedQuery = useFeed('saved', activeFilters);

  // Select active query based on mode
  const activeQuery = mode === 'global' ? globalQuery : mode === 'following' ? followingQuery : savedQuery;

  // Derive flat items list from pages
  const items = useMemo(
    () => activeQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [activeQuery.data],
  );

  // New items probe (disabled for 'saved' mode)
  const probe = useNewItemsProbe(mode, activeFilters, mode !== 'saved');

  // Scroll top button handler
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const scrollingUp = y < lastY;
      setShowScrollTop(scrollingUp && y > 400);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Save scroll position continuously and on visibility change
  useEffect(() => {
    const saveScroll = () => {
      sessionStorage.setItem(`feedScroll_${mode}`, String(window.scrollY));
    };

    // Save on page visibility change (tab switching, before Back)
    document.addEventListener('visibilitychange', saveScroll);

    // Save before navigation
    window.addEventListener('beforeunload', saveScroll);

    // Save periodically to ensure capture on fast navigation
    const interval = setInterval(saveScroll, 1000);

    return () => {
      document.removeEventListener('visibilitychange', saveScroll);
      window.removeEventListener('beforeunload', saveScroll);
      clearInterval(interval);
    };
  }, [mode]);

  // Restore scroll position on mount or mode switch
  useEffect(() => {
    // Small delay to let DOM render
    const timer = setTimeout(() => {
      const cachedData = queryClient.getQueryData(feedKeys.tab(mode, activeFilters));
      const savedY = sessionStorage.getItem(`feedScroll_${mode}`);

      if (cachedData && savedY) {
        window.scrollTo({ top: parseInt(savedY, 10), behavior: 'instant' });
        sessionStorage.removeItem(`feedScroll_${mode}`);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [mode]); // intentionally omit activeFilters — restore only on mode switch

  // Initialize lastSeenDate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY(mode));
    if (stored) {
      setLastSeenDate(new Date(stored));
    }
  }, []);

  // Reset on mode switch and read last-seen timestamp
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY(mode));
    setLastSeenDate(stored ? new Date(stored) : null);
    // Reset filters on tab switch
    setGenusFilter('');
    setVarietyFilter('');
    setGenusSearch('');
    setVarietySearch('');
    setShowFilters(false);
    probe.reset();
  }, [mode]);

  // Update last-seen timestamp 3 seconds after landing on the page
  useEffect(() => {
    if (mode === 'saved') return;
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY(mode), new Date().toISOString());
    }, 3000);
    return () => clearTimeout(timer);
  }, [mode]);

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartYRef.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling) return;
    const delta = e.touches[0].clientY - touchStartYRef.current;
    if (delta > 0) {
      setPullY(Math.min(delta * 0.5, PULL_THRESHOLD + 20));
    }
  }, [isPulling]);

  const handleTouchEnd = useCallback(() => {
    if (!isPulling) return;
    setIsPulling(false);
    if (pullY >= PULL_THRESHOLD) {
      setPullY(0);
      handleRefresh();
    } else {
      setPullY(0);
    }
  }, [isPulling, pullY]);

  const handleRefresh = useCallback(async () => {
    if (activeQuery.isFetching) return;
    setIsRefreshing(true);
    // Save current item IDs before refresh
    const oldItemIds = new Set(items.map(i => i._id));
    await queryClient.invalidateQueries({ queryKey: ['feed', mode] });
    window.scrollTo({ top: 0, behavior: 'instant' });
    probe.reset();

    // After items load, find new ones
    if (mode !== 'saved') {
      setTimeout(() => {
        const newIds = new Set<string>();
        const newItems = queryClient.getQueryData<InfiniteData<FeedResponse>>(
          feedKeys.tab(mode, activeFilters)
        );
        newItems?.pages[0]?.items.forEach(item => {
          if (!oldItemIds.has(item._id)) {
            newIds.add(item._id);
          }
        });
        newItemIdsRef.current = newIds;

        const now = new Date();
        localStorage.setItem(STORAGE_KEY(mode), now.toISOString());
        setLastSeenDate(now);

        // Clear new items after 3 seconds
        setTimeout(() => {
          newItemIdsRef.current.clear();
        }, 3000);
      }, 100);
    }
    trackEvent('feed_refreshed', { mode });
    setIsRefreshing(false);
  }, [mode, activeQuery.isFetching, queryClient, probe, items, activeFilters]);

  // Handle "New items" button click
  const handleNewItems = useCallback(async () => {
    // Save current item IDs before refresh
    const oldItemIds = new Set(items.map(i => i._id));
    await queryClient.invalidateQueries({ queryKey: ['feed', mode] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    probe.reset();

    // After items load, find new ones
    if (mode !== 'saved') {
      setTimeout(() => {
        const newIds = new Set<string>();
        const newItems = queryClient.getQueryData<InfiniteData<FeedResponse>>(
          feedKeys.tab(mode, activeFilters)
        );
        newItems?.pages[0]?.items.forEach(item => {
          if (!oldItemIds.has(item._id)) {
            newIds.add(item._id);
          }
        });
        newItemIdsRef.current = newIds;

        const now = new Date();
        localStorage.setItem(STORAGE_KEY(mode), now.toISOString());
        setLastSeenDate(now);

        // Clear new items after 3 seconds
        setTimeout(() => {
          newItemIdsRef.current.clear();
        }, 3000);
      }, 100);
    }
  }, [mode, queryClient, probe, items, activeFilters]);

  // Infinite scroll
  const loaderRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = loaderRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) {
          activeQuery.fetchNextPage();
        }
      },
      { rootMargin: '400px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [activeQuery.hasNextPage, activeQuery.isFetchingNextPage, activeQuery.fetchNextPage]);

  // Load genera when filter panel opens
  useEffect(() => {
    if (showFilters && genera.length === 0 && !generaLoading) {
      setGeneraLoading(true);
      genusApi
        .getAll()
        .then((data) => {
          setGenera(data);
          setGeneraLoading(false);
        })
        .catch(() => setGeneraLoading(false));
    }
  }, [showFilters]);

  // Load varieties when genus is selected
  useEffect(() => {
    if (genusFilter) {
      varietyApi.getAll(genusFilter).then(setVarieties).catch(() => {});
    } else {
      setVarieties([]);
      if (varietyFilter) {
        setVarietyFilter('');
      }
    }
  }, [genusFilter]);

  const genusOptions = useMemo(() => {
    const q = genusSearch.toLowerCase();
    const getDisplayName = (nameRu: string, nameEn: string) =>
      locale === 'ru' ? `${nameRu} / ${nameEn}` : nameEn;
    return genera
      .filter((g) => !q || g.nameRu.toLowerCase().includes(q) || g.nameEn.toLowerCase().includes(q))
      .map((g) => ({ value: g._id, label: getDisplayName(g.nameRu, g.nameEn) }));
  }, [genera, genusSearch, locale]);

  const varietyOptions = useMemo(() => {
    const q = varietySearch.toLowerCase();
    const getDisplayName = (nameRu: string, nameEn: string) =>
      locale === 'ru' ? `${nameRu} / ${nameEn}` : nameEn;
    return varieties
      .filter((v) => !q || v.nameRu.toLowerCase().includes(q) || v.nameEn.toLowerCase().includes(q))
      .map((v) => ({ value: v._id, label: getDisplayName(v.nameRu, v.nameEn) }));
  }, [varieties, varietySearch, locale]);

  const handleGenusChange = (value: string) => {
    setGenusFilter(value);
    setGenusSearch('');
    setVarietyFilter('');
    setVarietySearch('');
  };

  const handleVarietyChange = (value: string) => {
    setVarietyFilter(value);
    setVarietySearch('');
  };

  const clearFilters = () => {
    setGenusFilter('');
    setVarietyFilter('');
    setGenusSearch('');
    setVarietySearch('');
  };

  const hasActiveFilters = genusFilter !== '' || varietyFilter !== '';

  const isNew = (item: FeedItem): boolean => {
    // If this item was marked as new during refresh, show it as new
    if (newItemIdsRef.current.has(item._id)) {
      return true;
    }
    // Otherwise check against lastSeenDate
    if (!lastSeenDate) return false;
    return new Date(item.createdAt) > lastSeenDate;
  };

  const handleBookmarkToggle = useCallback(
    async (itemId: string, itemType: 'plant' | 'plant_history') => {
      const queryKey = feedKeys.tab(mode, activeFilters);
      const current = items.find((i) => i._id === itemId && i.type === itemType);

      if (current) {
        trackEvent(current.isBookmarked ? 'feed_item_unbookmarked' : 'feed_item_bookmarked', { type: itemType });
      }

      // Snapshot for rollback
      const previous = queryClient.getQueryData(queryKey);

      // Optimistic update
      queryClient.setQueryData<InfiniteData<FeedResponse>>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item._id === itemId && item.type === itemType
                ? { ...item, isBookmarked: !item.isBookmarked }
                : item,
            ),
          })),
        };
      });

      try {
        await bookmarksApi.toggle(itemType, itemId);

        // If we're in saved mode and unbookmarked, remove from list
        if (mode === 'saved') {
          queryClient.setQueryData<InfiniteData<FeedResponse>>(queryKey, (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.filter((item) => !(item._id === itemId && item.type === itemType)),
              })),
            };
          });
        }
      } catch {
        // Revert optimistic update on error
        queryClient.setQueryData(queryKey, previous);
      }
    },
    [mode, activeFilters, items, queryClient],
  );

  return (
    <>
      {/* "New items" button or "Scroll to top" button */}
      {probe.newCount > 0 ? (
        <button
          onClick={handleNewItems}
          aria-label="Load new items"
          className="fixed bottom-[95px] left-1/2 -translate-x-1/2 sm:left-4 sm:translate-x-0 sm:bottom-8 z-50 group px-4 py-2 sm:pl-3 sm:pr-4 sm:h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center gap-2 transition-all duration-300 hover:bg-primary/90 hover:scale-105 active:scale-95 animate-in slide-in-from-bottom-2"
        >
          <ArrowUp className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
          <span className="text-sm font-medium">Новое ({probe.newCount}+)</span>
        </button>
      ) : (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll to top"
          className={`fixed bottom-[95px] left-1/2 -translate-x-1/2 sm:left-4 sm:translate-x-0 sm:bottom-8 z-50 group w-10 h-10 sm:w-auto sm:h-10 sm:pl-3 sm:pr-4 rounded-full bg-primary/50 backdrop-blur-sm text-primary-foreground shadow-md flex items-center justify-center sm:gap-2 transition-all duration-300 hover:bg-primary/70 hover:scale-105 active:scale-95 ${
            showScrollTop ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <ArrowUp className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
          <span className="hidden sm:inline text-sm font-medium">Поднять</span>
        </button>
      )}

      <div
        className="max-w-lg mx-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull-to-refresh indicator */}
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{
            height: isRefreshing ? 48 : pullY > 0 ? pullY : 0,
            transition: isPulling ? 'none' : 'height 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          <RefreshCw
            className={`w-6 h-6 text-primary ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              transform: !isRefreshing ? `rotate(${(pullY / PULL_THRESHOLD) * 360}deg)` : undefined,
              transition: isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              opacity: isRefreshing ? 1 : Math.min(pullY / PULL_THRESHOLD, 1),
            }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <Rss className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('header.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('header.description')}</p>
          </div>
        </div>

        {/* Mode tabs + filter button */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit animate-in fade-in duration-300">
            <button
              onClick={() => {
                setMode('global');
                trackEvent('feed_tab_switched', { tab: 'global' });
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'global'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Globe className="w-4 h-4 shrink-0" />
              <span
                className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap sm:max-w-none sm:opacity-100 ${mode === 'global' ? 'max-w-24 opacity-100' : 'max-w-0 opacity-0'}`}
              >
                {t('tabs.global')}
              </span>
            </button>
            <button
              onClick={() => {
                setMode('following');
                trackEvent('feed_tab_switched', { tab: 'following' });
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'following'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span
                className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap sm:max-w-none sm:opacity-100 ${mode === 'following' ? 'max-w-24 opacity-100' : 'max-w-0 opacity-0'}`}
              >
                {t('tabs.following')}
              </span>
            </button>
            <button
              onClick={() => {
                setMode('saved');
                trackEvent('feed_tab_switched', { tab: 'saved' });
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'saved'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Bookmark className="w-4 h-4 shrink-0" />
              <span
                className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap sm:max-w-none sm:opacity-100 ${mode === 'saved' ? 'max-w-24 opacity-100' : 'max-w-0 opacity-0'}`}
              >
                {t('tabs.saved')}
              </span>
            </button>
          </div>
          <Button
            variant={hasActiveFilters ? 'default' : 'outline'}
            onClick={() => setShowFilters((v) => !v)}
            className="relative shrink-0 h-11 w-11 p-0 rounded-xl"
            title={t('filters.title')}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
            )}
          </Button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200 mb-2">
            <div className="w-full sm:flex-1">
              <ComboBox
                options={genusOptions}
                value={genusFilter}
                onValueChange={handleGenusChange}
                placeholder={generaLoading ? t('filters.loading') : t('filters.allGenus')}
                searchPlaceholder={t('filters.genusPlaceholder')}
                emptyText={t('filters.emptyText')}
                onSearchChange={setGenusSearch}
                className="h-11 rounded-xl border-2 text-base font-normal"
              />
            </div>
            {genusFilter && varieties.length > 0 && (
              <div className="w-full sm:flex-1">
                <ComboBox
                  options={varietyOptions}
                  value={varietyFilter}
                  onValueChange={handleVarietyChange}
                  placeholder={t('filters.allVariety')}
                  searchPlaceholder={t('filters.varietyPlaceholder')}
                  emptyText={t('filters.emptyText')}
                  onSearchChange={setVarietySearch}
                  className="h-11 rounded-xl border-2 text-base font-normal"
                />
              </div>
            )}
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full h-11 gap-2 rounded-xl"
              >
                <X className="w-4 h-4" />
                {t('filters.clear')}
              </Button>
            )}
          </div>
        )}

        {/* Feed */}
        <div className="space-y-4">
          {items.map((item) => (
            <FeedCard
              key={`${item.type}_${item._id}`}
              item={item}
              isNew={isNew(item)}
              language={language}
              onBookmarkToggle={() => handleBookmarkToggle(item._id, item.type as 'plant' | 'plant_history')}
            />
          ))}
        </div>

        {/* Loader sentinel */}
        <div ref={loaderRef} className="py-10 text-center text-sm text-muted-foreground">
          {activeQuery.isFetchingNextPage && (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span>{t('loading')}</span>
            </div>
          )}
          {!activeQuery.isFetchingNextPage && !activeQuery.hasNextPage && items.length > 0 && (
            <p className="text-muted-foreground/60">{t('endOfFeed')}</p>
          )}
          {activeQuery.isLoading && items.length === 0 && (
            <div className="flex items-center justify-center gap-2 py-8">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span>{t('loading')}</span>
            </div>
          )}
          {!activeQuery.isFetchingNextPage && !activeQuery.hasNextPage && items.length === 0 && mode === 'following' && (
            <div className="text-center space-y-2 py-8">
              <Users className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground">{t('emptyFollowing.title')}</p>
              <p className="text-sm text-muted-foreground/70">
                <Link href="/users" className="text-primary hover:underline">
                  {t('emptyFollowing.linkText')}
                </Link>{' '}
                {t('emptyFollowing.description')}
              </p>
            </div>
          )}
          {!activeQuery.isFetchingNextPage && !activeQuery.hasNextPage && items.length === 0 && mode === 'global' && (
            <div className="text-center py-8">
              <Rss className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground">{t('emptyGlobal.title')}</p>
            </div>
          )}
          {!activeQuery.isFetchingNextPage && !activeQuery.hasNextPage && items.length === 0 && mode === 'saved' && (
            <div className="text-center py-8">
              <Bookmark className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground">{t('emptySaved.title')}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
