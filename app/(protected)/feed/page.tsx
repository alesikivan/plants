'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { feedApi, FeedItem } from '@/lib/api/feed';
import { FeedCard } from '@/components/feed/FeedCard';
import { useAuthStore } from '@/lib/store/authStore';
import { Globe, Users, Rss } from 'lucide-react';

type FeedMode = 'global' | 'following';

const STORAGE_KEY = (mode: FeedMode) => `feedLastSeen_${mode}`;

export default function FeedPage() {
  const user = useAuthStore((state) => state.user);
  const language = user?.preferredLanguage || 'ru';

  const [mode, setMode] = useState<FeedMode>('global');
  const [items, setItems] = useState<FeedItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastSeenDate, setLastSeenDate] = useState<Date | null>(null);

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
  }, [mode]);

  // Update last-seen timestamp 3 seconds after landing on the page
  useEffect(() => {
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
      const result =
        mode === 'global'
          ? await feedApi.getGlobal(cursor)
          : await feedApi.getFollowing(cursor);

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

  const isNew = (item: FeedItem): boolean => {
    if (!lastSeenDate) return false;
    return new Date(item.createdAt) > lastSeenDate;
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
          <Rss className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Лента</h1>
          <p className="text-sm text-muted-foreground">Новые растения и записи</p>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit animate-in fade-in duration-300 mb-2">
        <button
          onClick={() => setMode('global')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'global'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Globe className="w-4 h-4" />
          Глобальная
        </button>
        <button
          onClick={() => setMode('following')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'following'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          Подписки
        </button>
      </div>

      

      {/* Feed */}
      <div className="space-y-4">
        {items.map((item) => (
          <FeedCard
            key={`${item.type}_${item._id}`}
            item={item}
            isNew={isNew(item)}
            language={language}
          />
        ))}
      </div>

      {/* Loader sentinel */}
      <div ref={loaderRef} className="py-10 text-center text-sm text-muted-foreground">
        {loading && (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span>Загрузка...</span>
          </div>
        )}
        {!loading && !hasMore && items.length > 0 && (
          <p className="text-muted-foreground/60">Вы дошли до конца ленты</p>
        )}
        {!loading && !hasMore && items.length === 0 && mode === 'following' && (
          <div className="text-center space-y-2 py-8">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">Здесь пока ничего нет.</p>
            <p className="text-sm text-muted-foreground/70">
              <Link href="/users" className="text-primary hover:underline">
                Подпишитесь на пользователей
              </Link>{' '}
              чтобы видеть их обновления
            </p>
          </div>
        )}
        {!loading && !hasMore && items.length === 0 && mode === 'global' && (
          <div className="text-center py-8">
            <Rss className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground">Лента пуста</p>
          </div>
        )}
      </div>
    </div>
  );
}
