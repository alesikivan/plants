'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Check, Copy, EyeOff, Heart, Leaf, Search, X } from 'lucide-react';
import { usersApi } from '@/lib/api';
import { Wishlist, getWishlistPhotoUrl } from '@/lib/api/wishlist';
import { getDisplayName } from '@/lib/utils/language';
import { useAuthStore } from '@/lib/store/authStore';
import { WishlistDiscoverBanner } from '@/components/public/WishlistDiscoverBanner';
import Link from 'next/link';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

interface UserWishlistClientProps {
  initialWishlist?: Wishlist[];
  initialHidden?: boolean;
  initialTotal?: number;
  initialTotalPages?: number;
  initialSearch?: string;
  initialPage?: number;
  profileName?: string;
  profileId?: string;
}

export default function UserWishlistClient({
  initialWishlist = [],
  initialHidden = false,
  initialTotal = 0,
  initialTotalPages = 0,
  initialSearch = '',
  initialPage = 1,
  profileName = '',
  profileId = '',
}: UserWishlistClientProps) {
  const t = useTranslations('UserWishlistPage');
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const userId = params.id as string;

  const currentUser = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const isGuest = initialized && !currentUser;

  const [wishlist, setWishlist] = useState<Wishlist[]>(initialWishlist);
  const [isLoading, setIsLoading] = useState(false);
  const [isHidden, setIsHidden] = useState(initialHidden);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);
  const [copied, setCopied] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchWishlist = useCallback(
    async (searchVal: string, pageVal: number) => {
      setIsLoading(true);
      try {
        const result = await usersApi.getUserWishlistPaginated(userId, {
          search: searchVal || undefined,
          page: pageVal,
          limit: PAGE_SIZE,
        });
        setWishlist(result.items);
        setTotal(result.total);
        setTotalPages(result.totalPages);
        setPage(result.page);
      } catch (error: any) {
        if (error?.response?.status === 403) {
          setIsHidden(true);
          return;
        }
        toast.error(t('errors.loadError'));
      } finally {
        setIsLoading(false);
      }
    },
    [userId, t],
  );

  const updateUrl = useCallback(
    (searchVal: string, pageVal: number) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (searchVal) {
        sp.set('search', searchVal);
      } else {
        sp.delete('search');
      }
      if (pageVal > 1) {
        sp.set('page', String(pageVal));
      } else {
        sp.delete('page');
      }
      const query = sp.toString();
      router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateUrl(value, 1);
      fetchWishlist(value, 1);
    }, 400);
  };

  const handlePageChange = (newPage: number) => {
    updateUrl(search, newPage);
    fetchWishlist(search, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (initialHidden) return;
    if (initialWishlist.length === 0 && !initialSearch && initialPage === 1 && !isHidden) {
      fetchWishlist('', 1);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const profileHref = profileId ? `/profile/${profileId}` : '#';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
        {!isGuest && (
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2 transition-all active:scale-95 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('header.backButton')}
          </Button>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Heart className="w-6 h-6 text-pink-500" />
              {t('header.title')}
            </h1>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="ml-1 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title={t('header.copyLink')}
            >
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {isGuest && profileName ? (
            <p className="text-muted-foreground text-sm">
              {t('header.descriptionGuest')}{' '}
              <Link href={profileHref} className="font-medium text-primary hover:underline">
                {profileName}
              </Link>
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">{t('header.description')}</p>
          )}
        </div>
      </div>

      {/* Guest banner */}
      {isGuest && <WishlistDiscoverBanner />}

      {/* Search */}
      {!isHidden && (
        <div className="relative !my-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t('search.placeholder')}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 animate-in fade-in duration-500">
          <div className="text-center space-y-2">
            <Heart className="w-12 h-12 text-primary/50 animate-pulse mx-auto" />
            <p className="text-muted-foreground">{t('loading')}</p>
          </div>
        </div>
      ) : isHidden ? (
        <div className="flex flex-col items-center justify-center h-64 text-center animate-in fade-in zoom-in-95 duration-700">
          <EyeOff className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t('hidden.title')}</h3>
          <p className="text-muted-foreground">{t('hidden.description')}</p>
        </div>
      ) : wishlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center animate-in fade-in zoom-in-95 duration-700">
          {search ? (
            <>
              <Search className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('emptySearch.title')}</h3>
              <p className="text-muted-foreground">{t('emptySearch.description')}</p>
            </>
          ) : (
            <>
              <Heart className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('empty.title')}</h3>
              <p className="text-muted-foreground">{t('empty.description')}</p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 !mt-2">
            {wishlist.map((item) => {
              const genus = typeof item.genusId === 'object' ? item.genusId : null;
              const variety = typeof item.varietyId === 'object' ? item.varietyId : null;
              const genusName = getDisplayName(genus, locale);
              const varietyName = getDisplayName(variety, locale);
              const photoUrl = getWishlistPhotoUrl(item.photo);
              return (
                <div key={item._id}>
                  <div className="aspect-square relative bg-background rounded-lg overflow-hidden mb-2 shadow-sm">
                    {photoUrl ? (
                      <img src={photoUrl} alt={genusName || ''} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted/20">
                        <Leaf className="w-10 h-10 text-muted-foreground/20" />
                      </div>
                    )}
                  </div>
                  <div className="text-center space-y-0.5">
                    <p className="font-medium text-xs text-foreground/90 truncate">{genusName}</p>
                    {varietyName && (
                      <p className="text-xs text-muted-foreground truncate">{varietyName}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1 || isLoading}
              >
                {t('pagination.prev')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('pagination.page', { page, total: totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages || isLoading}
              >
                {t('pagination.next')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
