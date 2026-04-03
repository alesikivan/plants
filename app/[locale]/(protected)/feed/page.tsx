'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { feedApi, FeedItem, FeedFilters } from '@/lib/api/feed';
import { bookmarksApi } from '@/lib/api/bookmarks';
import { genusApi, Genus } from '@/lib/api/genus';
import { varietyApi, Variety } from '@/lib/api/variety';
import { FeedCard } from '@/components/feed/FeedCard';
import { useAuthStore } from '@/lib/store/authStore';
import { Globe, Users, Rss, RefreshCw, Bookmark, ArrowUp, SlidersHorizontal, X } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { ComboBox } from '@/components/ui/combobox';

type FeedMode = 'global' | 'following' | 'saved';

const STORAGE_KEY = (mode: FeedMode) => `feedLastSeen_${mode}`;

export default function FeedPage() {
  const t = useTranslations('FeedPage');
  const user = useAuthStore((state) => state.user);
  const language = user?.preferredLanguage || 'ru';

  const locale = useLocale();
  const [mode, setMode] = useState<FeedMode>('global');
  const [items, setItems] = useState<FeedItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
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
  const [filterTrigger, setFilterTrigger] = useState(0);
  const filtersRef = useRef<FeedFilters>({});

  // Pull-to-refresh state
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartYRef = useRef(0);
  const PULL_THRESHOLD = 70;

  const [showScrollTop, setShowScrollTop] = useState(false);

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

  // Refs to avoid stale closures in IntersectionObserver
  const cursorRef = useRef<string | undefined>(undefined);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Reset on mode switch and read last-seen timestamp
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY(mode));
    setLastSeenDate(stored ? new Date(stored) : null);
    setItems([]);
    cursorRef.current = undefined;
    hasMoreRef.current = true;
    setHasMore(true);
    // Reset filters on tab switch
    setGenusFilter('');
    setVarietyFilter('');
    setGenusSearch('');
    setVarietySearch('');
    filtersRef.current = {};
    setShowFilters(false);
  }, [mode]);

  // Update last-seen timestamp 3 seconds after landing on the page
  useEffect(() => {
    if (mode === 'saved') return;
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY(mode), new Date().toISOString());
    }, 3000);
    return () => clearTimeout(timer);
  }, [mode]);

  const doLoad = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const cursor = cursorRef.current;
      const filters = filtersRef.current;
      const result =
        mode === 'global'
          ? await feedApi.getGlobal(cursor, filters)
          : mode === 'following'
            ? await feedApi.getFollowing(cursor, filters)
            : await bookmarksApi.getFeed(cursor, filters);

      setItems((prev) => (cursor ? [...prev, ...result.items] : result.items));
      cursorRef.current = result.nextCursor ?? undefined;
      hasMoreRef.current = result.hasMore;
      setHasMore(result.hasMore);
    } catch {
      // handled by global error handler
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [mode]);

  // Initial load (runs after items reset)
  useEffect(() => {
    doLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Reload when filters change
  useEffect(() => {
    if (filterTrigger > 0) doLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTrigger]);

  const doRefresh = useCallback(async () => {
    if (loadingRef.current) return;
    setIsRefreshing(true);
    cursorRef.current = undefined;
    hasMoreRef.current = true;
    setHasMore(true);
    loadingRef.current = true;
    try {
      const filters = filtersRef.current;
      const result =
        mode === 'global'
          ? await feedApi.getGlobal(undefined, filters)
          : mode === 'following'
            ? await feedApi.getFollowing(undefined, filters)
            : await bookmarksApi.getFeed(undefined, filters);
      setItems(result.items);
      cursorRef.current = result.nextCursor ?? undefined;
      hasMoreRef.current = result.hasMore;
      setHasMore(result.hasMore);
      trackEvent('feed_refreshed', { mode });
      if (mode !== 'saved') {
        const now = new Date();
        localStorage.setItem(STORAGE_KEY(mode), now.toISOString());
        setLastSeenDate(now);
      }
    } catch {
      // handled by global error handler
    } finally {
      loadingRef.current = false;
      setIsRefreshing(false);
    }
  }, [mode]);

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
      doRefresh();
    } else {
      setPullY(0);
    }
  }, [isPulling, pullY, doRefresh]);

  // Infinite scroll
  useEffect(() => {
    const element = loaderRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current && hasMoreRef.current) {
          doLoad();
        }
      },
      { rootMargin: '400px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [doLoad]);

  // Load genera when filter panel opens
  useEffect(() => {
    if (showFilters && genera.length === 0 && !generaLoading) {
      setGeneraLoading(true);
      genusApi.getAll().then((data) => {
        setGenera(data);
        setGeneraLoading(false);
      }).catch(() => setGeneraLoading(false));
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
        filtersRef.current = { ...filtersRef.current, varietyId: undefined };
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

  const applyFilter = useCallback((newFilters: FeedFilters) => {
    filtersRef.current = newFilters;
    setItems([]);
    cursorRef.current = undefined;
    hasMoreRef.current = true;
    setHasMore(true);
    loadingRef.current = false;
    setFilterTrigger((n) => n + 1);
  }, []);

  const handleGenusChange = (value: string) => {
    setGenusFilter(value);
    setGenusSearch('');
    const newFilters = { genusId: value || undefined, varietyId: undefined };
    setVarietyFilter('');
    setVarietySearch('');
    applyFilter(newFilters);
  };

  const handleVarietyChange = (value: string) => {
    setVarietyFilter(value);
    setVarietySearch('');
    const newFilters = { ...filtersRef.current, varietyId: value || undefined };
    applyFilter(newFilters);
  };

  const clearFilters = () => {
    setGenusFilter('');
    setVarietyFilter('');
    setGenusSearch('');
    setVarietySearch('');
    applyFilter({});
  };

  const hasActiveFilters = genusFilter !== '' || varietyFilter !== '';

  const isNew = (item: FeedItem): boolean => {
    if (!lastSeenDate) return false;
    return new Date(item.createdAt) > lastSeenDate;
  };

  const handleBookmarkToggle = useCallback(
    async (itemId: string, itemType: 'plant' | 'plant_history') => {
      const current = items.find((i) => i._id === itemId && i.type === itemType);
      if (current) {
        trackEvent(current.isBookmarked ? 'feed_item_unbookmarked' : 'feed_item_bookmarked', { type: itemType });
      }
      // Optimistic update
      setItems((prev) =>
        prev.map((item) => {
          if (item._id !== itemId || item.type !== itemType) return item;
          return { ...item, isBookmarked: !item.isBookmarked } as FeedItem;
        }),
      );

      try {
        await bookmarksApi.toggle(itemType, itemId);
        // If we're in saved mode and unbookmarked, remove from list
        if (mode === 'saved') {
          setItems((prev) => prev.filter((item) => !(item._id === itemId && item.type === itemType)));
        }
      } catch {
        // Revert optimistic update on error
        setItems((prev) =>
          prev.map((item) => {
            if (item._id !== itemId || item.type !== itemType) return item;
            return { ...item, isBookmarked: !item.isBookmarked } as FeedItem;
          }),
        );
      }
    },
    [mode],
  );

  return (
    <>
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
            onClick={() => { setMode('global'); trackEvent('feed_tab_switched', { tab: 'global' }); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'global'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap sm:max-w-none sm:opacity-100 ${mode === 'global' ? 'max-w-24 opacity-100' : 'max-w-0 opacity-0'}`}>{t('tabs.global')}</span>
          </button>
          <button
            onClick={() => { setMode('following'); trackEvent('feed_tab_switched', { tab: 'following' }); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'following'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap sm:max-w-none sm:opacity-100 ${mode === 'following' ? 'max-w-24 opacity-100' : 'max-w-0 opacity-0'}`}>{t('tabs.following')}</span>
          </button>
          <button
            onClick={() => { setMode('saved'); trackEvent('feed_tab_switched', { tab: 'saved' }); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'saved'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bookmark className="w-4 h-4 shrink-0" />
            <span className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap sm:max-w-none sm:opacity-100 ${mode === 'saved' ? 'max-w-24 opacity-100' : 'max-w-0 opacity-0'}`}>{t('tabs.saved')}</span>
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 mb-2">
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
            <>
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="shrink-0 h-11 w-11 p-0 rounded-xl hidden sm:flex items-center justify-center"
                title={t('filters.clear')}
              >
                <X className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full h-11 gap-2 rounded-xl sm:hidden"
              >
                <X className="w-4 h-4" />
                {t('filters.clear')}
              </Button>
            </>
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
        {loading && (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span>{t('loading')}</span>
          </div>
        )}
        {!loading && !hasMore && items.length > 0 && (
          <p className="text-muted-foreground/60">{t('endOfFeed')}</p>
        )}
        {!loading && !hasMore && items.length === 0 && mode === 'following' && (
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
        {!loading && !hasMore && items.length === 0 && mode === 'global' && (
          <div className="text-center py-8">
            <Rss className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground">{t('emptyGlobal.title')}</p>
          </div>
        )}
        {!loading && !hasMore && items.length === 0 && mode === 'saved' && (
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
