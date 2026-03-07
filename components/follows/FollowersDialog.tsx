'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { followsApi, FollowUser } from '@/lib/api/follows';
import { getAvatarUrl } from '@/lib/api/users';
import { User, Search, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const PAGE_SIZE = 20;

interface FollowersDialogProps {
  userId: string;
  type: 'followers' | 'following';
  isOpen: boolean;
  onClose: () => void;
}

export function FollowersDialog({ userId, type, isOpen, onClose }: FollowersDialogProps) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPage = useCallback(async (q: string, p: number, append: boolean) => {
    const setter = append ? setLoadingMore : setLoading;
    setter(true);
    try {
      const fn = type === 'followers' ? followsApi.getFollowers : followsApi.getFollowing;
      const result = await fn(userId, { q: q || undefined, page: p, limit: PAGE_SIZE });
      setUsers((prev) => (append ? [...prev, ...result.items] : result.items));
      setTotal(result.total);
      setPage(p);
    } catch {
      // ignore
    } finally {
      setter(false);
    }
  }, [userId, type]);

  // Initial load when dialog opens
  useEffect(() => {
    if (!isOpen) return;
    setSearch('');
    setUsers([]);
    setTotal(0);
    setPage(1);
    fetchPage('', 1, false);
  }, [isOpen, userId, type]);

  // Debounced search
  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setUsers([]);
      setTotal(0);
      fetchPage(value, 1, false);
    }, 350);
  };

  const handleLoadMore = () => {
    fetchPage(search, page + 1, true);
  };

  const hasMore = users.length < total;
  const title = type === 'followers' ? 'Подписчики' : 'Подписки';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md flex flex-col max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {title}
            {total > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">({total})</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 -mx-1 px-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              {search
                ? 'Никого не найдено'
                : type === 'followers'
                  ? 'Нет подписчиков'
                  : 'Нет подписок'}
            </div>
          ) : (
            <>
              {users.map((u) => (
                <Link
                  key={u.id}
                  href={`/profile/${u.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 pt-2"
                >
                  <div className="w-9 h-9 rounded-xl overflow-hidden border border-primary/20 bg-primary/10 flex items-center justify-center shrink-0">
                    {u.avatar ? (
                      <Image
                        src={getAvatarUrl(u.avatar)!}
                        alt={u.name}
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <User className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <span className="font-medium text-sm">{u.name}</span>
                </Link>
              ))}

              {hasMore && (
                <div className="pt-2 pb-1 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="w-full"
                  >
                    {loadingMore ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      `Загрузить ещё (${total - users.length})`
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
